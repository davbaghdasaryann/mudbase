import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

/**
 * Per-item monthly price breakdown for an estimate.
 * Returns items in estimate hierarchy: each labor item followed by its material children.
 * parentId on material rows = the estimate labor item's _id (string).
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
            .find({ estimateId: estId }, { projection: { laborItemId: 1, quantity: 1, isHidden: 1, _id: 1 } })
            .toArray(),
        Db.getEstimateMaterialItemsCollection()
            .find({ estimateId: estId }, { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1, _id: 1 } })
            .toArray(),
    ]);

    const hiddenLaborIds = new Set(
        (laborItems as any[]).filter((l) => l.isHidden).map((l) => l._id!.toString())
    );
    const visibleLabor = (laborItems as any[]).filter((l) => !l.isHidden);
    const visibleMaterial = (materialItems as any[]).filter(
        (m) => !hiddenLaborIds.has(m.estimatedLaborId?.toString())
    );

    // Group materials by their parent labor estimate item ID
    const materialsByParent = new Map<string, any[]>();
    for (const m of visibleMaterial) {
        const key = m.estimatedLaborId?.toString() ?? '__none__';
        if (!materialsByParent.has(key)) materialsByParent.set(key, []);
        materialsByParent.get(key)!.push(m);
    }

    // Unique catalog IDs
    const laborCatalogIds = [...new Set(visibleLabor.map((l: any) => l.laborItemId.toString()))].map((id) => new ObjectId(id));
    const materialCatalogIds = [...new Set(visibleMaterial.map((m: any) => m.materialItemId.toString()))].map((id) => new ObjectId(id));

    const [catalogLabor, catalogMaterial, measurementUnits, laborSubcats, materialSubcats] = await Promise.all([
        laborCatalogIds.length > 0
            ? Db.getLaborItemsCollection().find({ _id: { $in: laborCatalogIds } }, { projection: { _id: 1, name: 1, fullCode: 1, averagePrice: 1, measurementUnitMongoId: 1, subcategoryId: 1 } }).toArray()
            : [],
        materialCatalogIds.length > 0
            ? Db.getMaterialItemsCollection().find({ _id: { $in: materialCatalogIds } }, { projection: { _id: 1, name: 1, fullCode: 1, averagePrice: 1, measurementUnitMongoId: 1, subcategoryId: 1 } }).toArray()
            : [],
        Db.getMeasurementUnitCollection().find({}, { projection: { _id: 1, representationSymbol: 1, name: 1 } }).toArray(),
        Db.getLaborSubcategoriesCollection().find({}, { projection: { _id: 1, name: 1 } }).toArray(),
        Db.getMaterialSubcategoriesCollection().find({}, { projection: { _id: 1, name: 1 } }).toArray(),
    ]);

    const laborSubcatMap = new Map<string, string>((laborSubcats as any[]).map((s) => [s._id.toString(), s.name || '']));
    const unitMap = new Map<string, string>((measurementUnits as any[]).map((u) => [u._id.toString(), u.representationSymbol || u.name || '']));
    const laborInfo = new Map<string, any>((catalogLabor as any[]).map((i) => [i._id.toString(), i]));
    const materialInfo = new Map<string, any>((catalogMaterial as any[]).map((i) => [i._id.toString(), i]));

    // Offer IDs (non-dev accounts only)
    const [laborOffers, materialOffers] = await Promise.all([
        laborCatalogIds.length > 0
            ? Db.getLaborOffersCollection().aggregate([
                { $match: { itemId: { $in: laborCatalogIds } } },
                { $lookup: { from: 'accounts', localField: 'accountId', foreignField: '_id', as: 'acc' } },
                { $match: { 'acc.isDev': { $ne: true } } },
                { $project: { _id: 1, itemId: 1 } },
            ]).toArray()
            : [],
        materialCatalogIds.length > 0
            ? Db.getMaterialOffersCollection().aggregate([
                { $match: { itemId: { $in: materialCatalogIds } } },
                { $lookup: { from: 'accounts', localField: 'accountId', foreignField: '_id', as: 'acc' } },
                { $match: { 'acc.isDev': { $ne: true } } },
                { $project: { _id: 1, itemId: 1 } },
            ]).toArray()
            : [],
    ]);

    const allLaborOfferIds = (laborOffers as any[]).map((o) => o._id);
    const allMaterialOfferIds = (materialOffers as any[]).map((o) => o._id);

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

    // Cache monthly prices per catalog item to avoid recomputing for duplicate catalog IDs
    const laborPriceCache = new Map<string, Record<string, number>>();
    const materialPriceCache = new Map<string, Record<string, number>>();

    function getCatalogMonthlyPrices(
        catalogId: string,
        offerCatalogMap: Map<string, string>,
        avgByOffer: Map<string, Map<string, number>>,
        fallback: number,
        cache: Map<string, Record<string, number>>
    ): Record<string, number> {
        if (cache.has(catalogId)) return cache.get(catalogId)!;
        const result: Record<string, number> = {};
        for (const m of months) {
            const prices: number[] = [];
            for (const [offerId, catId] of offerCatalogMap) {
                if (catId !== catalogId) continue;
                const p = avgByOffer.get(offerId)?.get(m);
                if (p != null && p > 0) prices.push(p);
            }
            const price = prices.length === 0 ? fallback : prices.reduce((a, b) => a + b, 0) / prices.length;
            if (price > 0) result[m] = Math.round(price);
        }
        cache.set(catalogId, result);
        return result;
    }

    // Build output: labor items in order, each followed by their material children
    const items: any[] = [];

    for (const laborItem of visibleLabor) {
        const laborItemId = laborItem._id.toString();
        const catalogId = laborItem.laborItemId.toString();
        const info = laborInfo.get(catalogId);
        if (!info) continue;

        const unit = unitMap.get(info.measurementUnitMongoId?.toString() ?? '') ?? '';
        const subcategoryName = laborSubcatMap.get(info.subcategoryId?.toString() ?? '') ?? '';
        const monthlyPrices = getCatalogMonthlyPrices(catalogId, laborOfferCatalog, laborAvgByOffer, info.averagePrice ?? 0, laborPriceCache);

        items.push({
            id: laborItemId,
            catalogId,
            name: info.name,
            code: info.fullCode ?? '',
            type: 'labor',
            qty: Math.round((laborItem.quantity ?? 0) * 100) / 100,
            unit,
            subcategoryName,
            parentId: null,
            monthlyPrices,
        });

        // Material children for this labor item
        const children = materialsByParent.get(laborItemId) ?? [];
        for (const matItem of children) {
            const matCatalogId = matItem.materialItemId.toString();
            const matInfo = materialInfo.get(matCatalogId);
            if (!matInfo) continue;
            const matUnit = unitMap.get(matInfo.measurementUnitMongoId?.toString() ?? '') ?? '';
            const matMonthlyPrices = getCatalogMonthlyPrices(matCatalogId, materialOfferCatalog, materialAvgByOffer, matInfo.averagePrice ?? 0, materialPriceCache);
            items.push({
                id: matItem._id.toString(),
                catalogId: matCatalogId,
                name: matInfo.name,
                code: matInfo.fullCode ?? '',
                type: 'material',
                qty: Math.round((matItem.quantity ?? 0) * 100) / 100,
                unit: matUnit,
                subcategoryName,
                parentId: laborItemId,
                monthlyPrices: matMonthlyPrices,
            });
        }
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
