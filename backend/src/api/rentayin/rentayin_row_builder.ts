import { ObjectId } from 'mongodb';
import * as Db from '@/db';
import { buildEstimateSnapshot } from '../costing/costing_snapshot';

export async function buildRentayinRows(estimateId: string, accountId: ObjectId): Promise<Db.RentayinRow[]> {
    const estimateObjId = new ObjectId(estimateId);

    const [snapshot, latestCosting] = await Promise.all([
        buildEstimateSnapshot(estimateId),
        Db.getCostingsCollection().findOne(
            { accountId, estimateId: estimateObjId, deleted: { $ne: true }, isUnforeseen: { $ne: true } },
            { sort: { createdAt: -1 }, projection: { actualData: 1, costHistory: 1, pahestEntries: 1 } }
        ),
    ]);

    const estimateLaborItems = await Db.getEstimateLaborItemsCollection()
        .find({ estimateId: estimateObjId }, { projection: { _id: 1, laborItemId: 1 } })
        .toArray();
    const laborItemIdByRowId = new Map(estimateLaborItems.map(i => [i._id.toString(), i.laborItemId?.toString()]));

    // Material actual cost per row from pahest entries
    const matActualByRowId = new Map<string, number>();
    for (const pe of latestCosting?.pahestEntries ?? []) {
        const rowId = pe.estimatedLaborId;
        if (!rowId) continue;
        matActualByRowId.set(rowId, (matActualByRowId.get(rowId) ?? 0) + (pe.costedQuantity ?? 0) * (pe.costPerUnit ?? 0));
    }

    // Labor actual totals from costHistory
    const laborActualTotalByRowId = new Map<string, number>();
    const laborActualQtyByRowId = new Map<string, number>();
    for (const entry of latestCosting?.costHistory ?? []) {
        const rowId = (entry as any).laborItemId as string | undefined;
        if (!rowId || (entry as any).paymentMethod === 'nyuth_tsakhsagrum') continue;
        laborActualTotalByRowId.set(rowId, (laborActualTotalByRowId.get(rowId) ?? 0) + (entry.total ?? 0));
        laborActualQtyByRowId.set(rowId, (laborActualQtyByRowId.get(rowId) ?? 0) + ((entry as any).quantity ?? 0));
    }

    return snapshot.laborRows
        .filter(r => !r.isGroupRow)
        .map(r => {
            const laborItemId = laborItemIdByRowId.get(r._id) ?? '';
            const estimatedUnitCost = r.changableAveragePrice ?? 0;
            const estimatedMaterialUnitCost = r.quantity > 0 ? (r.materialTotalCost ?? 0) / r.quantity : 0;

            // Actual labor: priority 1 = explicit unit price in actualData
            const ad = latestCosting?.actualData?.[r._id] as any;
            const adQty = ad?.quantity ? parseFloat(String(ad.quantity).replace(',', '.')) : 0;
            const adUnitPrice = ad?.unitPrice ? parseFloat(String(ad.unitPrice).replace(',', '.')) : 0;
            const histTotal = laborActualTotalByRowId.get(r._id) ?? 0;
            const histQty = laborActualQtyByRowId.get(r._id) ?? 0;

            let laborActualUnitCost: number | null = null;
            if (adUnitPrice > 0) {
                laborActualUnitCost = adUnitPrice;
            } else if (histTotal > 0 && (histQty > 0 || adQty > 0)) {
                laborActualUnitCost = histTotal / (histQty > 0 ? histQty : adQty);
            }

            const matActualTotal = matActualByRowId.get(r._id) ?? 0;
            const actualMaterialUnitCost: number | null = matActualTotal > 0 && r.quantity > 0
                ? matActualTotal / r.quantity
                : null;

            const hasActual = laborActualUnitCost !== null || actualMaterialUnitCost !== null;
            if (hasActual) {
                const actualUnitCost = (laborActualUnitCost ?? 0) + (actualMaterialUnitCost ?? 0);
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

            // No actual data — dash in Հashvarkayan, estimation shown in Նakhahashiv
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
