import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

/**
 * Per-item monthly price breakdown for an estimate.
 * Items are ordered by the estimation's own section → subsection → labor hierarchy,
 * matching exactly what is shown in the Estimations modal.
 * Each labor item is followed immediately by its material children.
 * parentId on material rows = the estimate labor item's _id (string).
 * sectionName / subsectionName drive the accordion groups in the UI.
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

    // Fetch estimate structure + items in parallel
    const [sections, subsections, laborItems, materialItems] = await Promise.all([
        Db.getEstimateSectionsCollection()
            .find({ estimateId: estId }, { projection: { _id: 1, name: 1, displayIndex: 1 } })
            .toArray(),
        Db.getEstimateSubsectionsCollection()
            .find({ estimateId: estId }, { projection: { _id: 1, name: 1, estimateSectionId: 1, displayIndex: 1 } })
            .toArray(),
        Db.getEstimateLaborItemsCollection()
            .find({ estimateId: estId }, { projection: { laborItemId: 1, quantity: 1, isHidden: 1, estimateSubsectionId: 1, displayIndex: 1, laborOfferItemName: 1, _id: 1 } })
            .toArray(),
        Db.getEstimateMaterialItemsCollection()
            .find({ estimateId: estId }, { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1, materialOfferItemName: 1, _id: 1 } })
            .toArray(),
    ]);

    // Build section/subsection lookup maps
    const sectionMap = new Map<string, any>((sections as any[]).map(s => [s._id.toString(), s]));
    const subsectionMap = new Map<string, any>((subsections as any[]).map(s => [s._id.toString(), s]));

    // Filter hidden labor
    const hiddenLaborIds = new Set(
        (laborItems as any[]).filter(l => l.isHidden).map(l => l._id!.toString())
    );
    const visibleLabor = (laborItems as any[]).filter(l => !l.isHidden);
    const visibleMaterial = (materialItems as any[]).filter(
        m => !hiddenLaborIds.has(m.estimatedLaborId?.toString())
    );

    // Sort labor items by section.displayIndex → subsection.displayIndex → labor.displayIndex
    visibleLabor.sort((a: any, b: any) => {
        const subA = subsectionMap.get(a.estimateSubsectionId?.toString() ?? '');
        const subB = subsectionMap.get(b.estimateSubsectionId?.toString() ?? '');
        const secA = subA ? sectionMap.get(subA.estimateSectionId?.toString() ?? '') : null;
        const secB = subB ? sectionMap.get(subB.estimateSectionId?.toString() ?? '') : null;
        const secIdxA = secA?.displayIndex ?? 0;
        const secIdxB = secB?.displayIndex ?? 0;
        if (secIdxA !== secIdxB) return secIdxA - secIdxB;
        const subIdxA = subA?.displayIndex ?? 0;
        const subIdxB = subB?.displayIndex ?? 0;
        if (subIdxA !== subIdxB) return subIdxA - subIdxB;
        return (a.displayIndex ?? 0) - (b.displayIndex ?? 0);
    });

    // Group materials by parent labor estimate item ID
    const materialsByParent = new Map<string, any[]>();
    for (const m of visibleMaterial) {
        const key = m.estimatedLaborId?.toString() ?? '__none__';
        if (!materialsByParent.has(key)) materialsByParent.set(key, []);
        materialsByParent.get(key)!.push(m);
    }

    // Unique catalog IDs
    const laborCatalogIds = [...new Set(visibleLabor.map((l: any) => l.laborItemId.toString()))].map(id => new ObjectId(id));
    const materialCatalogIds = [...new Set(visibleMaterial.map((m: any) => m.materialItemId.toString()))].map(id => new ObjectId(id));

    const [catalogLabor, catalogMaterial, measurementUnits] = await Promise.all([
        laborCatalogIds.length > 0
            ? Db.getLaborItemsCollection().find({ _id: { $in: laborCatalogIds } }, { projection: { _id: 1, name: 1, fullCode: 1, averagePrice: 1, measurementUnitMongoId: 1 } }).toArray()
            : [],
        materialCatalogIds.length > 0
            ? Db.getMaterialItemsCollection().find({ _id: { $in: materialCatalogIds } }, { projection: { _id: 1, name: 1, fullCode: 1, averagePrice: 1, measurementUnitMongoId: 1 } }).toArray()
            : [],
        Db.getMeasurementUnitCollection().find({}, { projection: { _id: 1, representationSymbol: 1, name: 1 } }).toArray(),
    ]);

    const unitMap = new Map<string, string>((measurementUnits as any[]).map(u => [u._id.toString(), u.representationSymbol || u.name || '']));
    const laborInfo = new Map<string, any>((catalogLabor as any[]).map(i => [i._id.toString(), i]));
    const materialInfo = new Map<string, any>((catalogMaterial as any[]).map(i => [i._id.toString(), i]));

    // Non-dev offer IDs for price journal queries
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

    const allLaborOfferIds = (laborOffers as any[]).map(o => o._id);
    const allMaterialOfferIds = (materialOffers as any[]).map(o => o._id);

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

    const laborOfferCatalog = new Map<string, string>((laborOffers as any[]).map(o => [o._id.toString(), o.itemId.toString()]));
    const materialOfferCatalog = new Map<string, string>((materialOffers as any[]).map(o => [o._id.toString(), o.itemId.toString()]));

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

    // Build output: ordered by estimation hierarchy, each labor followed by its materials
    const items: any[] = [];

    for (const laborItem of visibleLabor) {
        const laborItemId = laborItem._id.toString();
        const catalogId = laborItem.laborItemId.toString();
        const info = laborInfo.get(catalogId);
        if (!info) continue;

        // Resolve section/subsection names from estimation structure
        const subsection = subsectionMap.get(laborItem.estimateSubsectionId?.toString() ?? '');
        const section = subsection ? sectionMap.get(subsection.estimateSectionId?.toString() ?? '') : null;
        const subsectionName: string = subsection?.name ?? '';
        const sectionName: string = section?.name ?? subsection?.name ?? '';

        const unit = unitMap.get(info.measurementUnitMongoId?.toString() ?? '') ?? '';
        const monthlyPrices = getCatalogMonthlyPrices(catalogId, laborOfferCatalog, laborAvgByOffer, info.averagePrice ?? 0, laborPriceCache);

        items.push({
            id: laborItemId,
            name: laborItem.laborOfferItemName || info.name,
            code: info.fullCode ?? '',
            type: 'labor',
            qty: Math.round((laborItem.quantity ?? 0) * 100) / 100,
            unit,
            sectionName,
            subsectionName,
            parentId: null,
            monthlyPrices,
        });

        for (const matItem of materialsByParent.get(laborItemId) ?? []) {
            const matCatalogId = matItem.materialItemId.toString();
            const matInfo = materialInfo.get(matCatalogId);
            if (!matInfo) continue;
            const matUnit = unitMap.get(matInfo.measurementUnitMongoId?.toString() ?? '') ?? '';
            const matMonthlyPrices = getCatalogMonthlyPrices(matCatalogId, materialOfferCatalog, materialAvgByOffer, matInfo.averagePrice ?? 0, materialPriceCache);
            items.push({
                id: matItem._id.toString(),
                name: matItem.materialOfferItemName || matInfo.name,
                code: matInfo.fullCode ?? '',
                type: 'material',
                qty: Math.round((matItem.quantity ?? 0) * 100) / 100,
                unit: matUnit,
                sectionName,
                subsectionName,
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
