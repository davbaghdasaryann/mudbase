import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

/**
 * Monthly chart for Chronological Analytics.
 *
 * Work/Materials: per month, carry-forward latest journal price per offer,
 *   avg across all active offers. Falls back to catalog averagePrice when
 *   no journal history exists.
 *
 * Estimates: reconstructs estimate total per month using catalog market prices
 *   (carry-forward per offer × quantities), matching Widget30Day logic.
 *   Falls back to stored totalCostWithOtherExpenses when no journal data.
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
    const months = enumerateMonths(from, to);
    let monthlyData: { month: string; value: number }[] = [];

    if (sourceType === 'work_repository' || sourceType === 'materials_repository') {
        monthlyData = await computeItemMonthly(catalogId, sourceType === 'work_repository', months);
    } else {
        monthlyData = await computeEstimateMonthly(catalogId, months);
    }

    return res.json({ data: monthlyData });
});

// ─── Work / Materials ────────────────────────────────────────────────────────

async function computeItemMonthly(
    catalogId: ObjectId,
    isLabor: boolean,
    months: string[]
): Promise<{ month: string; value: number }[]> {
    const offersColl = isLabor ? Db.getLaborOffersCollection() : Db.getMaterialOffersCollection();
    const journalColl = isLabor ? Db.getLaborPricesJournalCollection() : Db.getMaterialPricesJournalCollection();
    const catalogColl = isLabor ? Db.getLaborItemsCollection() : Db.getMaterialItemsCollection();

    const catalogItem = await catalogColl.findOne({ _id: catalogId }, { projection: { averagePrice: 1 } });
    const fallback = Math.round((catalogItem as any)?.averagePrice ?? 0);

    const offers = await offersColl.find({ itemId: catalogId }, { projection: { _id: 1 } }).toArray();
    const offerIds = offers.map((o: any) => o._id);

    if (offerIds.length === 0) {
        if (fallback <= 0) return [];
        return months.map((m) => ({ month: m, value: fallback }));
    }

    const entries = await journalColl
        .find({ itemId: { $in: offerIds }, date: { $lte: lastDayOf(months) } }, { sort: { date: 1 } })
        .toArray();

    const timelines = buildTimelines(entries as any[]);

    return months.map((monthStr) => {
        const monthEnd = monthEndDate(monthStr);
        const prices = activePricesAt(timelines, monthEnd);
        if (prices.length === 0) return { month: monthStr, value: fallback };
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return { month: monthStr, value: Math.round(avg) };
    }).filter((d) => d.value > 0);
}

// ─── Estimates ────────────────────────────────────────────────────────────────
// Use the stored totalCostWithOtherExpenses (matches what users see in the Estimates page)
// as a flat value across all months. Historical variation for estimates would require
// storing snapshots over time, which is out of scope here.

async function computeEstimateMonthly(
    estimateId: ObjectId,
    months: string[]
): Promise<{ month: string; value: number }[]> {
    const estimate = await Db.getEstimatesCollection().findOne(
        { _id: estimateId },
        { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
    );
    const val = Math.round((estimate as any)?.totalCostWithOtherExpenses ?? (estimate as any)?.totalCost ?? 0);
    if (val <= 0) return [];
    return months.map((m) => ({ month: m, value: val }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Start of the month AFTER monthStr — used as exclusive upper bound. */
function monthEndDate(monthStr: string): Date {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(Date.UTC(y, m, 1)); // month is 0-indexed, so m = next month
}

/** Date of the last day in the last month (for journal query upper bound). */
function lastDayOf(months: string[]): Date {
    if (months.length === 0) return new Date();
    return monthEndDate(months[months.length - 1]);
}

function buildTimelines(entries: Array<{ itemId: ObjectId; date: Date; price: number; isArchived?: boolean }>): Map<string, Array<{ date: Date; price: number; isArchived: boolean }>> {
    const timelines = new Map<string, Array<{ date: Date; price: number; isArchived: boolean }>>();
    for (const e of entries) {
        const key = e.itemId.toString();
        if (!timelines.has(key)) timelines.set(key, []);
        timelines.get(key)!.push({ date: e.date, price: e.price ?? 0, isArchived: !!(e as any).isArchived });
    }
    return timelines;
}

/** Latest non-archived price for a single offer on or before `before`. */
function latestPriceAt(timeline: Array<{ date: Date; price: number; isArchived: boolean }>, before: Date): number | null {
    let latest: { price: number; isArchived: boolean } | null = null;
    for (const entry of timeline) {
        if (entry.date < before) { latest = entry; } else { break; }
    }
    return latest && !latest.isArchived && latest.price > 0 ? latest.price : null;
}

/** All active prices at `before` across all offers in the timelines map. */
function activePricesAt(timelines: Map<string, Array<{ date: Date; price: number; isArchived: boolean }>>, before: Date): number[] {
    const prices: number[] = [];
    for (const [, tl] of timelines) {
        const p = latestPriceAt(tl, before);
        if (p !== null) prices.push(p);
    }
    return prices;
}

