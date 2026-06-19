import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

/**
 * Fetch monthly aggregated data for the Chronological Analytics chart.
 * Returns one value per month in the requested date range.
 *
 * For work/materials: average price per month from the offer journal.
 * For estimates: last snapshot value per month from widget snapshots.
 */
registerApiSession('analysis/chronological/fetch_monthly_chart', async (req, res, session) => {
    const { sourceType, itemId, fromDate, toDate } = req.body.json ?? req.body.args ?? {};

    if (!sourceType || !itemId) {
        return res.json({ error: 'Missing sourceType or itemId' });
    }

    const from = new Date(fromDate ?? '2023-01-01');
    const to = new Date(toDate ?? new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z');
    to.setHours(23, 59, 59, 999);

    const id = new ObjectId(itemId);
    let monthlyData: { month: string; value: number }[] = [];

    if (sourceType === 'work_repository' || sourceType === 'materials_repository') {
        const journalColl = sourceType === 'work_repository'
            ? Db.getLaborPricesJournalCollection()
            : Db.getMaterialPricesJournalCollection();

        const pipeline = [
            { $match: { itemId: id, date: { $gte: from, $lte: to }, isArchived: { $ne: true } } },
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
        // Estimates: find widgets tracking this estimate, then group snapshots by month
        const widgetsColl = Db.getDashboardWidgetsCollection();
        const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

        const widgets = await widgetsColl
            .find({ 'dataSourceConfig.estimateId': itemId })
            .toArray();

        if (widgets.length === 0) {
            // Fallback: read current estimate total and return it for the date range
            const estimatesColl = Db.getEstimatesCollection();
            const estimate = await estimatesColl.findOne(
                { _id: id },
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

            // Group by month — use last snapshot per month
            const byMonth = new Map<string, number>();
            for (const snap of snapshots) {
                const d = new Date(snap.timestamp);
                const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
                byMonth.set(key, Math.round(snap.value));
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
