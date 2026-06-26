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
    } else if (sourceType === 'consolidated_estimates') {
        // catalogId is an eci_estimates _id — resolve to the linked estimate
        const eciEntry = await Db.getEciEstimatesCollection().findOne({ _id: catalogId }, { projection: { estimateId: 1 } });
        const linkedId = (eciEntry as any)?.estimateId;
        if (linkedId) {
            monthlyData = await computeEstimateMonthly(new ObjectId(linkedId), months);
        }
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
// For each month: compute estimate total using monthly average catalog prices.
// For each catalog item → avg of all offer journal prices in that month.
// Falls back to catalog averagePrice when no journal entries exist for a month.

async function computeEstimateMonthly(
    estimateId: ObjectId,
    months: string[]
): Promise<{ month: string; value: number }[]> {
    const [estimate, laborItems, materialItems] = await Promise.all([
        Db.getEstimatesCollection().findOne({ _id: estimateId }, { projection: { otherExpenses: 1 } }),
        Db.getEstimateLaborItemsCollection().find({ estimateId }, { projection: { laborItemId: 1, quantity: 1, isHidden: 1, _id: 1, estimatedLaborId: 1 } }).toArray(),
        Db.getEstimateMaterialItemsCollection().find({ estimateId }, { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1 } }).toArray(),
    ]);

    const expMultiplier = otherExpensesMultiplier((estimate as any)?.otherExpenses ?? []);
    const hiddenLaborIds = new Set((laborItems as any[]).filter((l) => l.isHidden).map((l) => l._id!.toString()));

    // Build qty maps: catalogItemId → total quantity
    const laborQtyMap = new Map<string, number>();
    for (const l of (laborItems as any[]).filter((l) => !l.isHidden))
        laborQtyMap.set(l.laborItemId.toString(), (laborQtyMap.get(l.laborItemId.toString()) ?? 0) + (l.quantity ?? 0));
    const materialQtyMap = new Map<string, number>();
    for (const m of (materialItems as any[]).filter((m) => !hiddenLaborIds.has(m.estimatedLaborId?.toString())))
        materialQtyMap.set(m.materialItemId.toString(), (materialQtyMap.get(m.materialItemId.toString()) ?? 0) + (m.quantity ?? 0));

    const laborCatalogIds = [...laborQtyMap.keys()].map((id) => new ObjectId(id));
    const materialCatalogIds = [...materialQtyMap.keys()].map((id) => new ObjectId(id));

    // Catalog averagePrice fallbacks
    const [catalogLabor, catalogMaterial] = await Promise.all([
        laborCatalogIds.length > 0 ? Db.getLaborItemsCollection().find({ _id: { $in: laborCatalogIds } }, { projection: { _id: 1, averagePrice: 1 } }).toArray() : [],
        materialCatalogIds.length > 0 ? Db.getMaterialItemsCollection().find({ _id: { $in: materialCatalogIds } }, { projection: { _id: 1, averagePrice: 1 } }).toArray() : [],
    ]);
    const laborFallback = new Map<string, number>((catalogLabor as any[]).map((i) => [i._id.toString(), i.averagePrice ?? 0]));
    const materialFallback = new Map<string, number>((catalogMaterial as any[]).map((i) => [i._id.toString(), i.averagePrice ?? 0]));

    // Get all offer IDs, keyed by catalog item
    const [laborOffers, materialOffers] = await Promise.all([
        laborCatalogIds.length > 0 ? Db.getLaborOffersCollection().find({ itemId: { $in: laborCatalogIds } }, { projection: { _id: 1, itemId: 1 } }).toArray() : [],
        materialCatalogIds.length > 0 ? Db.getMaterialOffersCollection().find({ itemId: { $in: materialCatalogIds } }, { projection: { _id: 1, itemId: 1 } }).toArray() : [],
    ]);

    const allLaborOfferIds = (laborOffers as any[]).map((o) => o._id);
    const allMaterialOfferIds = (materialOffers as any[]).map((o) => o._id);

    const rangeStart = new Date(months[0] + '-01T00:00:00.000Z');
    const rangeEnd = lastDayOf(months);

    // Aggregate journal: avg price per (offerId, year, month)
    // Result map: offerId → Map<'YYYY-MM', avgPrice>
    async function monthlyAvgByOffer(
        journalColl: any,
        offerIds: ObjectId[]
    ): Promise<Map<string, Map<string, number>>> {
        if (offerIds.length === 0) return new Map();
        const rows = await journalColl.aggregate([
            { $match: { itemId: { $in: offerIds }, date: { $gte: rangeStart, $lte: rangeEnd }, isArchived: { $ne: true } } },
            { $group: { _id: { offerId: '$itemId', y: { $year: '$date' }, m: { $month: '$date' } }, avg: { $avg: '$price' } } },
        ]).toArray();
        const byOffer = new Map<string, Map<string, number>>();
        for (const r of rows) {
            const key = r._id.offerId.toString();
            const month = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
            if (!byOffer.has(key)) byOffer.set(key, new Map());
            byOffer.get(key)!.set(month, r.avg);
        }
        return byOffer;
    }

    const [laborAvgByOffer, materialAvgByOffer] = await Promise.all([
        monthlyAvgByOffer(Db.getLaborPricesJournalCollection(), allLaborOfferIds),
        monthlyAvgByOffer(Db.getMaterialPricesJournalCollection(), allMaterialOfferIds),
    ]);

    // offerId → catalogItemId lookup
    const laborOfferCatalog = new Map<string, string>((laborOffers as any[]).map((o) => [o._id.toString(), o.itemId.toString()]));
    const materialOfferCatalog = new Map<string, string>((materialOffers as any[]).map((o) => [o._id.toString(), o.itemId.toString()]));

    // For a catalog item + month: avg of all offer monthly averages; fallback to catalog avg
    function itemMonthlyPrice(
        catalogItemId: string,
        month: string,
        offerCatalogMap: Map<string, string>,
        avgByOffer: Map<string, Map<string, number>>,
        fallbackMap: Map<string, number>
    ): number {
        const prices: number[] = [];
        for (const [offerId, catId] of offerCatalogMap) {
            if (catId !== catalogItemId) continue;
            const p = avgByOffer.get(offerId)?.get(month);
            if (p != null && p > 0) prices.push(p);
        }
        if (prices.length === 0) return fallbackMap.get(catalogItemId) ?? 0;
        return prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    return months.map((monthStr) => {
        let total = 0;
        for (const [id, qty] of laborQtyMap)
            total += qty * itemMonthlyPrice(id, monthStr, laborOfferCatalog, laborAvgByOffer, laborFallback);
        for (const [id, qty] of materialQtyMap)
            total += qty * itemMonthlyPrice(id, monthStr, materialOfferCatalog, materialAvgByOffer, materialFallback);
        return { month: monthStr, value: Math.round(total * expMultiplier) };
    }).filter((d) => d.value > 0);
}

function otherExpensesMultiplier(expenses: any[]): number {
    if (!Array.isArray(expenses)) return 1;
    let sum = 0;
    for (const e of expenses) { const k = Object.keys(e); if (k.length) sum += Number(e[k[0]]) || 0; }
    return 1 + sum / 100;
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

