import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

// Journal itemId = offer _id (NOT catalog item id).
// Must resolve catalog item → offer ids → journal entries.
registerApiSession('analysis/chronological/fetch_monthly_chart', async (req, res, session) => {
    const { sourceType, itemId, fromDate, toDate } = req.body.json ?? req.body.args ?? {};

    if (!sourceType || !itemId) {
        return res.json({ error: 'Missing sourceType or itemId' });
    }

    const from = new Date(fromDate ?? '2023-01-01');
    const to = new Date(toDate ?? new Date().toISOString().slice(0, 10));
    to.setHours(23, 59, 59, 999);

    const catalogId = new ObjectId(itemId);
    let monthlyData: { month: string; value: number }[] = [];

    if (sourceType === 'work_repository' || sourceType === 'materials_repository') {
        // Step 1: resolve catalog item → offer ids
        const offersColl = sourceType === 'work_repository'
            ? Db.getLaborOffersCollection()
            : Db.getMaterialOffersCollection();
        const journalColl = sourceType === 'work_repository'
            ? Db.getLaborPricesJournalCollection()
            : Db.getMaterialPricesJournalCollection();

        const offers = await offersColl
            .find({ itemId: catalogId }, { projection: { _id: 1 } })
            .toArray();
        const offerIds = offers.map((o: any) => o._id);

        if (offerIds.length === 0) {
            return res.json({ data: [] });
        }

        // Step 2: aggregate journal by month (avg across all offers)
        const pipeline = [
            {
                $match: {
                    itemId: { $in: offerIds },
                    date: { $gte: from, $lte: to },
                    isArchived: { $ne: true },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                    },
                    avgPrice: { $avg: '$price' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ];

        const result = await journalColl.aggregate(pipeline).toArray();
        monthlyData = result.map((r: any) => ({
            month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
            value: Math.round(r.avgPrice),
        }));
    } else {
        // Estimates path: aggregate widget snapshots grouped by month
        const widgetsColl = Db.getDashboardWidgetsCollection();
        const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

        // dataSourceConfig.estimateId may be stored as string or ObjectId — match both
        const widgets = await widgetsColl
            .find({
                $or: [
                    { 'dataSourceConfig.estimateId': itemId },
                    { 'dataSourceConfig.estimateId': catalogId },
                ],
                dataSource: 'estimates',
            })
            .toArray();

        if (widgets.length === 0) {
            // Fallback: use current stored estimate total for every month in range
            const estimate = await Db.getEstimatesCollection().findOne(
                { _id: catalogId },
                { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
            );
            const val = Math.round(estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? 0);
            if (val > 0) {
                const months = enumerateMonths(from, to);
                monthlyData = months.map((m) => ({ month: m, value: val }));
            }
        } else {
            const widgetIds = widgets.map((w: any) => w._id);
            const snapshots = await snapshotsColl
                .find({ widgetId: { $in: widgetIds }, timestamp: { $gte: from, $lte: to } })
                .sort({ timestamp: 1 })
                .toArray();

            // Use last snapshot value per month
            const byMonth = new Map<string, number>();
            for (const snap of snapshots) {
                const d = new Date((snap as any).timestamp);
                const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
                byMonth.set(key, Math.round((snap as any).value));
            }
            monthlyData = Array.from(byMonth.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, value]) => ({ month, value }));
        }
    }

    return res.json({ data: monthlyData });
});

function enumerateMonths(from: Date, to: Date): string[] {
    const months: string[] = [];
    const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
    while (cur <= end) {
        months.push(`${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}`);
        cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return months;
}
