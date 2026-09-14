import { ObjectId } from 'mongodb';
import * as Db from '@/db';
import { buildEstimateSnapshot } from '../costing/costing_snapshot';

export async function buildRentayinRows(estimateId: string, accountId: ObjectId): Promise<Db.RentayinRow[]> {
    const estimateObjId = new ObjectId(estimateId);

    // Fetch costing first so we can use localEstimateId (fork) for the snapshot
    const latestCosting = await Db.getCostingsCollection().findOne(
        { accountId, estimateId: estimateObjId, deleted: { $ne: true }, isUnforeseen: { $ne: true } },
        { sort: { createdAt: -1 }, projection: { actualData: 1, costHistory: 1, pahestEntries: 1, localEstimateId: 1 } }
    );

    // If the costing was forked, use the local (forked) estimate's snapshot so IDs match actualData/costHistory keys
    const snapshotEstimateId = (latestCosting as any)?.localEstimateId ?? estimateId;
    const snapshot = await buildEstimateSnapshot(snapshotEstimateId);

    const snapshotEstimateObjId = new ObjectId(snapshotEstimateId);
    const estimateLaborItems = await Db.getEstimateLaborItemsCollection()
        .find({ estimateId: snapshotEstimateObjId }, { projection: { _id: 1, laborItemId: 1 } })
        .toArray();
    const laborItemIdByRowId = new Map(estimateLaborItems.map(i => [i._id.toString(), i.laborItemId?.toString()]));

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
        .filter(r => !r.isGroupRow)
        .map(r => {
            const laborItemId = laborItemIdByRowId.get(r._id) ?? '';
            const estimatedUnitCost = r.changableAveragePrice ?? 0;
            const estimatedMaterialUnitCost = r.quantity > 0 ? (r.materialTotalCost ?? 0) / r.quantity : 0;

            // Replicate CostingTable's actUP formula
            const ad = latestCosting?.actualData?.[r._id] as any;
            const adQty = ad?.quantity ? parseFloat(String(ad.quantity).replace(',', '.')) : 0;
            const adUnitPrice = ad?.unitPrice ? parseFloat(String(ad.unitPrice).replace(',', '.')) : 0;
            const adSpent = ad?.spent ? parseFloat(String(ad.spent).replace(',', '.')) : 0;
            const salaryTotal = salaryTotalByRowId.get(r._id) ?? 0;
            const matActTotal = matActTotalByRowId.get(r._id) ?? 0;
            const gorqty = gorqtyByRowId.get(r._id) ?? 0;
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
                const laborActualUnitCost = actualUnitCost;
                const actualMaterialUnitCost = null;
                return {
                    laborItemId,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    estimatedMaterialUnitCost,
                    actualLaborUnitCost: laborActualUnitCost,
                    actualMaterialUnitCost,
                    actualUnitCost: actualUnitCost > 0 ? actualUnitCost : null,
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
                unitCostSource: null,
                sectionName: r.sectionName,
                subsectionName: r.subsectionName,
            };
        });
}
