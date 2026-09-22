import { ObjectId } from 'mongodb';
import * as Db from '@/db';
import { buildEstimateSnapshot } from '../costing/costing_snapshot';

export async function buildRentayinRows(estimateId: string, accountId: ObjectId): Promise<Db.RentayinRow[]> {
    const estimateObjId = new ObjectId(estimateId);

    // Fetch costing to get actualData/costHistory and localEstimateId (fork)
    const latestCosting = await Db.getCostingsCollection().findOne(
        { accountId, estimateId: estimateObjId, deleted: { $ne: true }, isUnforeseen: { $ne: true } },
        { sort: { createdAt: -1 }, projection: { actualData: 1, costHistory: 1, pahestEntries: 1, localEstimateId: 1 } }
    );

    // Always build snapshot from the ORIGINAL estimate — Նախահաշիվ column must reflect
    // the original estimate so edits via the Նախահաշիվ button flow in after Refresh.
    const snapshot = await buildEstimateSnapshot(estimateId);

    const localEstimateId = (latestCosting as any)?.localEstimateId as string | undefined;

    // Build laborItemId (catalog ID) and market price lookups for the original estimate rows.
    // averagePrice is the read-only market average; changableAveragePrice is what was used in the estimate.
    const origLaborItems = await Db.getEstimateLaborItemsCollection()
        .find({ estimateId: estimateObjId }, { projection: { _id: 1, laborItemId: 1, averagePrice: 1 } })
        .toArray();
    const laborItemIdByOrigRowId = new Map(origLaborItems.map(i => [i._id.toString(), i.laborItemId?.toString()]));
    const marketPriceByOrigRowId = new Map(origLaborItems.map(i => [i._id.toString(), (i as any).averagePrice as number | undefined]));

    // Check which catalog labor items this company currently has their own offer for.
    // priceSource on estimate items is stale (copied on duplicate) so we check labor_offers directly.
    const laborItemIds = origLaborItems.map(i => i.laborItemId).filter(Boolean) as ObjectId[];
    const companyLaborOffers = await Db.getLaborOffersCollection()
        .find({ accountId, itemId: { $in: laborItemIds }, isActive: true, isArchived: { $ne: true } }, { projection: { itemId: 1, price: 1 }, sort: { updatedAt: -1 } })
        .toArray();
    const companyLaborOfferItemIds = new Set(companyLaborOffers.map(o => o.itemId.toString()));
    // keep most-recently-updated price per item (query sorted by updatedAt desc, so first wins)
    const companyLaborOfferPriceByItemId = new Map<string, number>();
    for (const o of companyLaborOffers) {
        const id = o.itemId.toString();
        if (!companyLaborOfferPriceByItemId.has(id)) companyLaborOfferPriceByItemId.set(id, (o as any).price as number);
    }

    // Same for materials
    const estimateMaterialItems = await Db.getEstimateMaterialItemsCollection()
        .find({ estimateId: estimateObjId }, { projection: { materialItemId: 1 } })
        .toArray();
    const materialItemIds = estimateMaterialItems.map(m => m.materialItemId).filter(Boolean) as ObjectId[];
    const companyMaterialOffers = await Db.getMaterialOffersCollection()
        .find({ accountId, itemId: { $in: materialItemIds } }, { projection: { itemId: 1 } })
        .toArray();
    const companyMaterialOfferItemIds = new Set(companyMaterialOffers.map(o => o.itemId.toString()));

    // If the costing was forked, build a direct originalLaborItemId → forkedRowId mapping.
    // Costing data (actualData, costHistory) is keyed by forked row IDs.
    let costingKeyFor: (origRowId: string) => string;
    if (localEstimateId) {
        const forkLaborItems = await Db.getEstimateLaborItemsCollection()
            .find({ estimateId: new ObjectId(localEstimateId), originalLaborItemId: { $exists: true } }, { projection: { _id: 1, originalLaborItemId: 1 } })
            .toArray();
        const forkedRowIdByOrigId = new Map(forkLaborItems.map(i => [(i as any).originalLaborItemId?.toString(), i._id.toString()]));
        costingKeyFor = (origRowId) => forkedRowIdByOrigId.get(origRowId) ?? origRowId;
    } else {
        costingKeyFor = (origRowId) => origRowId;
    }

    // Replicate CostingTable's actTotal/actUP formula exactly:
    // salaryTotal   = sum of costHistory entries (not nyuth_tsakhsagrum) per laborItemId
    // matActTotal   = sum of (nyuth_tsakhsagrum with laborItemId) + (pahest_ayl_cost with laborItemId)
    // gorqtyTotal   = sum of salary_gorcarqayin entry quantities (used as denominator if > 0)
    // actTotal      = volumeTotal(actualData.spent) + salaryTotal + matActTotal
    // actUP         = gorqtyTotal > 0 ? actTotal/gorqtyTotal : (adQty > 0 ? actTotal/adQty : 0)
    const salaryTotalByRowId = new Map<string, number>();
    const matActTotalByRowId = new Map<string, number>();
    const gorqtyByRowId = new Map<string, number>();
    for (const entry of latestCosting?.costHistory ?? []) {
        const rowId = (entry as any).laborItemId as string | undefined;
        if (!rowId) continue;
        const pm = (entry as any).paymentMethod as string | undefined;
        const total = (entry as any).total ?? 0;
        const qty = (entry as any).quantity ?? 0;
        if (pm !== 'nyuth_tsakhsagrum') {
            salaryTotalByRowId.set(rowId, (salaryTotalByRowId.get(rowId) ?? 0) + total);
        }
        if (pm === 'nyuth_tsakhsagrum' || pm === 'pahest_ayl_cost') {
            matActTotalByRowId.set(rowId, (matActTotalByRowId.get(rowId) ?? 0) + total);
        }
        if (pm === 'salary_gorcarqayin') {
            gorqtyByRowId.set(rowId, (gorqtyByRowId.get(rowId) ?? 0) + qty);
        }
    }

    return snapshot.laborRows
        .map(r => {
            const laborItemId = laborItemIdByOrigRowId.get(r._id) ?? '';
            const estimatedUnitCost = r.changableAveragePrice ?? 0;
            const estimatedMaterialUnitCost = r.quantity > 0 ? (r.materialTotalCost ?? 0) / r.quantity : 0;

            // Use forked row ID for costing data lookup (actualData/costHistory keyed by forked IDs)
            const ck = costingKeyFor(r._id);

            // Replicate CostingTable's actUP formula
            const ad = latestCosting?.actualData?.[ck] as any;
            const adQty = ad?.quantity ? parseFloat(String(ad.quantity).replace(',', '.')) : 0;
            const adUnitPrice = (ad?.unitPrice != null && ad.unitPrice !== '') ? parseFloat(String(ad.unitPrice).replace(',', '.')) : 0;
            const adSpent = ad?.spent ? parseFloat(String(ad.spent).replace(',', '.')) : 0;
            const salaryTotal = salaryTotalByRowId.get(ck) ?? 0;
            const matActTotal = matActTotalByRowId.get(ck) ?? 0;
            const gorqty = gorqtyByRowId.get(ck) ?? 0;
            const actTotal = adSpent + salaryTotal + matActTotal;
            const actUP = gorqty > 0 ? actTotal / gorqty : (adQty > 0 ? actTotal / adQty : 0);

            // actUP already includes both labor and material costs (same as CostingTable)
            // so actualUnitCost = actUP directly; no separate material add-on
            let actualUnitCostFromHistory: number | null = null;
            if (adUnitPrice > 0) {
                actualUnitCostFromHistory = adUnitPrice;
            } else if (actUP > 0) {
                actualUnitCostFromHistory = actUP;
            }

            const hasActual = actualUnitCostFromHistory !== null;
            if (hasActual) {
                const actualUnitCost = actualUnitCostFromHistory!;
                const laborTotalAmt = adSpent + salaryTotal;
                // Compute per-unit labor and material costs separately for the breakdown popup.
                // If actUP came from adUnitPrice directly (no qty breakdown), we can't split.
                const effectiveQty = gorqty > 0 ? gorqty : adQty;
                const actualLaborUP = adUnitPrice > 0
                    ? adUnitPrice  // can't split — full unit price is labeled as labor
                    : (effectiveQty > 0 ? laborTotalAmt / effectiveQty : 0);
                const actualMaterialUP = adUnitPrice > 0 || effectiveQty === 0
                    ? null
                    : (matActTotal > 0 ? matActTotal / effectiveQty : null);
                return {
                    laborItemId,
                    estimateRowId: r._id,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    estimatedMaterialUnitCost,
                    actualLaborUnitCost: actualLaborUP,
                    actualMaterialUnitCost: actualMaterialUP,
                    actualUnitCost: actualUnitCost > 0 ? actualUnitCost : null,
                    actualLaborTotal: laborTotalAmt,
                    actualMaterialTotal: matActTotal,
                    unitCostSource: 'actual' as const,
                    laborUnitCostSource: 'actual' as const,
                    materialUnitCostSource: matActTotal > 0 ? 'actual' as const : null,
                    sectionName: r.sectionName,
                    subsectionName: r.subsectionName,
                };
            }

            // No actual data — tag as library if the company currently has an offer for this item,
            // otherwise market (system average). priceSource on the item is unreliable (stale on duplicates).
            const laborSrcTag = companyLaborOfferItemIds.has(laborItemId) ? 'library' as const : 'market' as const;
            // For library rows, use the user's own current offer price, not the (possibly copied) snapshot price.
            // For market rows, use averagePrice (the read-only market rate) so the comparison is
            // estimate price (changableAveragePrice) vs current market price (averagePrice).
            const marketPrice = marketPriceByOrigRowId.get(r._id);
            const libraryLaborPrice = laborSrcTag === 'library'
                ? (companyLaborOfferPriceByItemId.get(laborItemId) ?? estimatedUnitCost)
                : (marketPrice ?? estimatedUnitCost);
            if (estimatedUnitCost > 0 || libraryLaborPrice > 0) {
                return {
                    laborItemId,
                    estimateRowId: r._id,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    estimatedMaterialUnitCost,
                    actualLaborUnitCost: libraryLaborPrice,
                    actualMaterialUnitCost: estimatedMaterialUnitCost > 0 ? estimatedMaterialUnitCost : null,
                    actualUnitCost: libraryLaborPrice,
                    actualLaborTotal: null,
                    actualMaterialTotal: null,
                    unitCostSource: laborSrcTag,
                    laborUnitCostSource: laborSrcTag,
                    materialUnitCostSource: estimatedMaterialUnitCost > 0 ? laborSrcTag : null,
                    sectionName: r.sectionName,
                    subsectionName: r.subsectionName,
                };
            }

            // No library price either — manual entry allowed
            return {
                laborItemId,
                estimateRowId: r._id,
                laborOfferItemName: r.laborOfferItemName,
                unitSymbol: r.unitSymbol,
                quantity: r.quantity,
                estimatedUnitCost,
                estimatedMaterialUnitCost,
                actualLaborUnitCost: null,
                actualMaterialUnitCost: estimatedMaterialUnitCost > 0 ? estimatedMaterialUnitCost : null,
                actualUnitCost: null,
                actualLaborTotal: null,
                actualMaterialTotal: null,
                unitCostSource: null,
                laborUnitCostSource: null,
                materialUnitCostSource: estimatedMaterialUnitCost > 0 ? laborSrcTag : null,
                sectionName: r.sectionName,
                subsectionName: r.subsectionName,
            };
        });
}
