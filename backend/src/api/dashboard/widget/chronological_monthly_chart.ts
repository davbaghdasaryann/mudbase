import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

/**
 * Monthly chart for Chronological Analytics.
 *
 * For work/materials: mirrors Widget30Day logic but grouped by month.
 * Per month — find the latest journal price per offer (carry-forward), then
 * average across all active offers. Falls back to catalog averagePrice when
 * there are no journal entries at all for a month (or no offers exist).
 *
 * For estimates: last widget snapshot per month, or current totalCost for all months.
 */
registerApiSession('analysis/chronological/fetch_monthly_chart', async (req, res, session) => {
    const { sourceType, itemId, fromDate, toDate } = req.body ?? {};

    if (!sourceType || !itemId) {
        return res.json({ error: 'Missing sourceType or itemId' });
    }

    const from = new Date(fromDate ?? '2023-01-01');
    const to = new Date(toDate ?? new Date().toISOString().slice(0, 10));
    to.setHours(23, 59, 59, 999);

    const catalogId = new ObjectId(itemId);
    let monthlyData: { month: string; value: number }[] = [];

    if (sourceType === 'work_repository' || sourceType === 'materials_repository') {
        const isLabor = sourceType === 'work_repository';
        const offersColl = isLabor ? Db.getLaborOffersCollection() : Db.getMaterialOffersCollection();
        const journalColl = isLabor ? Db.getLaborPricesJournalCollection() : Db.getMaterialPricesJournalCollection();
        const catalogColl = isLabor ? Db.getLaborItemsCollection() : Db.getMaterialItemsCollection();

        // Get catalog averagePrice as fallback
        const catalogItem = await catalogColl.findOne(
            { _id: catalogId },
            { projection: { averagePrice: 1 } }
        );
        const fallback = Math.round((catalogItem as any)?.averagePrice ?? 0);

        // Get all offer IDs for this catalog item
        const offers = await offersColl
            .find({ itemId: catalogId }, { projection: { _id: 1 } })
            .toArray();
        const offerIds = offers.map((o: any) => o._id);

        if (offerIds.length === 0) {
            // No offers — fill all months with catalog averagePrice
            if (fallback > 0) {
                monthlyData = enumerateMonths(from, to).map((m) => ({ month: m, value: fallback }));
            }
        } else {
            // Fetch all journal entries up to `to` (not just in range, for carry-forward)
            const entries = await journalColl
                .find(
                    { itemId: { $in: offerIds }, date: { $lte: to } },
                    { sort: { date: 1 } }
                )
                .toArray();

            // Build per-offer price timelines (sorted ascending by date)
            const timelines = new Map<string, Array<{ date: Date; price: number; isArchived: boolean }>>();
            for (const e of entries as any[]) {
                const key = e.itemId.toString();
                if (!timelines.has(key)) timelines.set(key, []);
                timelines.get(key)!.push({ date: e.date, price: e.price ?? 0, isArchived: !!e.isArchived });
            }

            // For each month in range: carry-forward latest price per offer, avg across offers
            const months = enumerateMonths(from, to);
            monthlyData = months.map((monthStr) => {
                const [y, m] = monthStr.split('-').map(Number);
                // End of this month = start of next
                const monthEnd = new Date(Date.UTC(y, m, 1));

                const prices: number[] = [];
                for (const [, timeline] of timelines) {
                    let latest: { price: number; isArchived: boolean } | null = null;
                    for (const entry of timeline) {
                        if (entry.date < monthEnd) {
                            latest = { price: entry.price, isArchived: entry.isArchived };
                        } else {
                            break;
                        }
                    }
                    if (latest && !latest.isArchived && latest.price > 0) {
                        prices.push(latest.price);
                    }
                }

                if (prices.length === 0) {
                    return { month: monthStr, value: fallback };
                }
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                return { month: monthStr, value: Math.round(avg) };
            }).filter((d) => d.value > 0);
        }
    } else {
        // Estimates path: aggregate widget snapshots by month
        const widgetsColl = Db.getDashboardWidgetsCollection();
        const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

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
            const estimate = await Db.getEstimatesCollection().findOne(
                { _id: catalogId },
                { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
            );
            const val = Math.round((estimate as any)?.totalCostWithOtherExpenses ?? (estimate as any)?.totalCost ?? 0);
            if (val > 0) {
                monthlyData = enumerateMonths(from, to).map((m) => ({ month: m, value: val }));
            }
        } else {
            const widgetIds = widgets.map((w: any) => w._id);
            const snapshots = await snapshotsColl
                .find({ widgetId: { $in: widgetIds }, timestamp: { $gte: from, $lte: to } })
                .sort({ timestamp: 1 })
                .toArray();

            const byMonth = new Map<string, number>();
            for (const snap of snapshots as any[]) {
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
