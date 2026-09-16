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

    // Build laborItemId (catalog ID) lookup for the original estimate rows
    const origLaborItems = await Db.getEstimateLaborItemsCollection()
        .find({ estimateId: estimateObjId }, { projection: { _id: 1, laborItemId: 1 } })
        .toArray();
    const laborItemIdByOrigRowId = new Map(origLaborItems.map(i => [i._id.toString(), i.laborItemId?.toString()]));

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
                const laborTotal = adSpent + salaryTotal;
                return {
                    laborItemId,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    estimatedMaterialUnitCost,
                    actualLaborUnitCost: actualUnitCost,
                    actualMaterialUnitCost: null,
                    actualUnitCost: actualUnitCost > 0 ? actualUnitCost : null,
                    actualLaborTotal: laborTotal,
                    actualMaterialTotal: matActTotal,
                    unitCostSource: 'actual' as const,
                    sectionName: r.sectionName,
                    subsectionName: r.subsectionName,
                };
            }

            // No actual data — fall back to library (catalog) labor rate only, no materials
            if (estimatedUnitCost > 0) {
                return {
                    laborItemId,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    estimatedMaterialUnitCost,
                    actualLaborUnitCost: estimatedUnitCost,
                    actualMaterialUnitCost: null,
                    actualUnitCost: estimatedUnitCost,
                    actualLaborTotal: null,
                    actualMaterialTotal: null,
                    unitCostSource: 'library' as const,
                    sectionName: r.sectionName,
                    subsectionName: r.subsectionName,
                };
            }

            // No library price either — manual entry allowed
            return {
                laborItemId,
                laborOfferItemName: r.laborOfferItemName,
                unitSymbol: r.unitSymbol,
                quantity: r.quantity,
                estimatedUnitCost,
                estimatedMaterialUnitCost,
                actualLaborUnitCost: null,
                actualMaterialUnitCost: null,
                actualUnitCost: null,
                actualLaborTotal: null,
                actualMaterialTotal: null,
                unitCostSource: null,
                sectionName: r.sectionName,
                subsectionName: r.subsectionName,
            };
        });
}
