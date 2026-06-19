import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

/**
 * Per-item monthly price breakdown for an estimate.
 * Returns every labor/material item with its monthly average catalog price
 * (journal avg for that month, falling back to catalog averagePrice).
 */
registerApiSession('analysis/chronological/fetch_estimate_breakdown', async (req, res, session) => {
    const { estimateId, fromDate, toDate } = req.body ?? {};
    if (!estimateId) return res.json({ error: 'Missing estimateId' });

    const estId = new ObjectId(estimateId);
    const from = new Date(fromDate ?? '2023-01-01');
    const to = new Date(toDate ?? new Date().toISOString().slice(0, 10));
    to.setHours(23, 59, 59, 999);

    const months = enumerateMonths(from, to);
    const rangeStart = new Date(months[0] + '-01T00:00:00.000Z');
    const rangeEnd = monthEndDate(months[months.length - 1]);

    const [laborItems, materialItems] = await Promise.all([
        Db.getEstimateLaborItemsCollection()
            .find({ estimateId: estId }, { projection: { laborItemId: 1, quantity: 1, isHidden: 1, _id: 1, estimatedLaborId: 1 } })
            .toArray(),
        Db.getEstimateMaterialItemsCollection()
            .find({ estimateId: estId }, { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1 } })
            .toArray(),
    ]);

    const hiddenLaborIds = new Set(
        (laborItems as any[]).filter((l) => l.isHidden).map((l) => l._id!.toString())
    );
    const visibleLabor = (laborItems as any[]).filter((l) => !l.isHidden);
    const visibleMaterial = (materialItems as any[]).filter(
        (m) => !hiddenLaborIds.has(m.estimatedLaborId?.toString())
    );

    // Unique catalog IDs
    const laborCatalogIds = [...new Set(visibleLabor.map((l) => l.laborItemId.toString()))].map((id) => new ObjectId(id));
    const materialCatalogIds = [...new Set(visibleMaterial.map((m) => m.materialItemId.toString()))].map((id) => new ObjectId(id));

    // Fetch catalog item info (name, unit)
    const [catalogLabor, catalogMaterial, measurementUnits] = await Promise.all([
        laborCatalogIds.length > 0
            ? Db.getLaborItemsCollection().find({ _id: { $in: laborCatalogIds } }, { projection: { _id: 1, name: 1, fullCode: 1, averagePrice: 1, measurementUnitMongoId: 1 } }).toArray()
            : [],
        materialCatalogIds.length > 0
            ? Db.getMaterialItemsCollection().find({ _id: { $in: materialCatalogIds } }, { projection: { _id: 1, name: 1, fullCode: 1, averagePrice: 1, measurementUnitMongoId: 1 } }).toArray()
            : [],
        Db.getMeasurementUnitCollection().find({}, { projection: { _id: 1, representationSymbol: 1, name: 1 } }).toArray(),
    ]);

    const unitMap = new Map<string, string>((measurementUnits as any[]).map((u) => [u._id.toString(), u.representationSymbol || u.name || '']));
    const laborInfo = new Map<string, any>((catalogLabor as any[]).map((i) => [i._id.toString(), i]));
    const materialInfo = new Map<string, any>((catalogMaterial as any[]).map((i) => [i._id.toString(), i]));

    // Get offer IDs for all catalog items
    const [laborOffers, materialOffers] = await Promise.all([
        laborCatalogIds.length > 0 ? Db.getLaborOffersCollection().find({ itemId: { $in: laborCatalogIds } }, { projection: { _id: 1, itemId: 1 } }).toArray() : [],
        materialCatalogIds.length > 0 ? Db.getMaterialOffersCollection().find({ itemId: { $in: materialCatalogIds } }, { projection: { _id: 1, itemId: 1 } }).toArray() : [],
    ]);

    const allLaborOfferIds = (laborOffers as any[]).map((o) => o._id);
    const allMaterialOfferIds = (materialOffers as any[]).map((o) => o._id);

    // Aggregate journal: avg price per (offerId, year, month)
    async function monthlyAvgByOffer(journalColl: any, offerIds: ObjectId[]): Promise<Map<string, Map<string, number>>> {
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

    const laborOfferCatalog = new Map<string, string>((laborOffers as any[]).map((o) => [o._id.toString(), o.itemId.toString()]));
    const materialOfferCatalog = new Map<string, string>((materialOffers as any[]).map((o) => [o._id.toString(), o.itemId.toString()]));

    function itemMonthPrice(
        catalogItemId: string,
        month: string,
        offerCatalogMap: Map<string, string>,
        avgByOffer: Map<string, Map<string, number>>,
        fallback: number
    ): number {
        const prices: number[] = [];
        for (const [offerId, catId] of offerCatalogMap) {
            if (catId !== catalogItemId) continue;
            const p = avgByOffer.get(offerId)?.get(month);
            if (p != null && p > 0) prices.push(p);
        }
        if (prices.length === 0) return fallback;
        return prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    // Build per-item rows
    const items: any[] = [];

    // Accumulate labor by catalogItemId (sum quantities for same item)
    const laborByItem = new Map<string, { qty: number }>();
    for (const l of visibleLabor) {
        const id = l.laborItemId.toString();
        laborByItem.set(id, { qty: (laborByItem.get(id)?.qty ?? 0) + (l.quantity ?? 0) });
    }
    for (const [id, { qty }] of laborByItem) {
        const info = laborInfo.get(id);
        if (!info) continue;
        const fallback = info.averagePrice ?? 0;
        const unit = unitMap.get(info.measurementUnitMongoId?.toString() ?? '') ?? '';
        const monthlyPrices: Record<string, number> = {};
        for (const m of months) {
            const p = itemMonthPrice(id, m, laborOfferCatalog, laborAvgByOffer, fallback);
            if (p > 0) monthlyPrices[m] = Math.round(p);
        }
        items.push({ id, name: info.name, code: info.fullCode ?? '', type: 'labor', qty: Math.round(qty * 100) / 100, unit, monthlyPrices });
    }

    // Materials
    const materialByItem = new Map<string, { qty: number }>();
    for (const m of visibleMaterial) {
        const id = m.materialItemId.toString();
        materialByItem.set(id, { qty: (materialByItem.get(id)?.qty ?? 0) + (m.quantity ?? 0) });
    }
    for (const [id, { qty }] of materialByItem) {
        const info = materialInfo.get(id);
        if (!info) continue;
        const fallback = info.averagePrice ?? 0;
        const unit = unitMap.get(info.measurementUnitMongoId?.toString() ?? '') ?? '';
        const monthlyPrices: Record<string, number> = {};
        for (const m of months) {
            const p = itemMonthPrice(id, m, materialOfferCatalog, materialAvgByOffer, fallback);
            if (p > 0) monthlyPrices[m] = Math.round(p);
        }
        items.push({ id, name: info.name, code: info.fullCode ?? '', type: 'material', qty: Math.round(qty * 100) / 100, unit, monthlyPrices });
    }

    return res.json({ months, items });
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

function monthEndDate(monthStr: string): Date {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(Date.UTC(y, m, 1));
}
