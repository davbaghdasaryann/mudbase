import { ObjectId } from 'mongodb';
import * as Db from '@/db';

/**
 * Recomputes actualMaterialUnitCost for rentayin rows affected by materialPriceOverrides.
 *
 * For each active material override key:
 *  - 'mg:<materialItemId>'  → all estimate_material_items with that materialItemId in this estimate
 *  - '<item._id>'           → that specific estimate_material_item
 *
 * For each affected estimate labor row (estimatedLaborId), loads all its material items,
 * applies override prices where set, sums to get adjustedMatTotal, then sets
 * actualMaterialUnitCost = adjustedMatTotal / laborQuantity on the rentayin row.
 *
 * Returns a new rows array (input rows unchanged).
 */
export async function applyMaterialOverridesToRows(
    rows: Db.RentayinRow[],
    estimateId: ObjectId,
    materialPriceOverrides: Record<string, number>,
): Promise<Db.RentayinRow[]> {
    if (!Object.keys(materialPriceOverrides).length) return rows;

    const matCol = Db.getEstimateMaterialItemsCollection();

    // Collect all affected estimatedLaborIds across all override keys
    const affectedLaborIdSet = new Set<string>();

    for (const key of Object.keys(materialPriceOverrides)) {
        if (key.startsWith('mg:')) {
            const materialItemId = new ObjectId(key.slice(3));
            const items = await matCol.find({ estimateId, materialItemId }, { projection: { estimatedLaborId: 1 } }).toArray();
            items.forEach(i => affectedLaborIdSet.add(i.estimatedLaborId.toString()));
        } else {
            try {
                const item = await matCol.findOne({ _id: new ObjectId(key), estimateId }, { projection: { estimatedLaborId: 1 } });
                if (item) affectedLaborIdSet.add(item.estimatedLaborId.toString());
            } catch { /* invalid ObjectId — skip */ }
        }
    }

    if (!affectedLaborIdSet.size) return rows;

    // For each affected labor row, load ALL its material items and recompute adjusted cost
    const adjustedByLaborId = new Map<string, number>(); // laborId → new actualMaterialUnitCost
    for (const laborId of affectedLaborIdSet) {
        const matItems = await matCol.find(
            { estimateId, estimatedLaborId: new ObjectId(laborId) }
        ).toArray();

        // Find the labor row to get its quantity
        const laborRow = rows.find(r => (r as any).estimateRowId === laborId);
        const laborQty = laborRow?.quantity ?? 0;
        if (laborQty <= 0) continue;

        const adjustedMatTotal = matItems.reduce((s, m) => {
            const itemKey = m._id.toString();
            const groupKey = 'mg:' + m.materialItemId.toString();
            const overridePrice = materialPriceOverrides[itemKey] ?? materialPriceOverrides[groupKey];
            const price = (overridePrice != null && overridePrice > 0) ? overridePrice : m.changableAveragePrice;
            return s + price * m.quantity;
        }, 0);

        adjustedByLaborId.set(laborId, adjustedMatTotal / laborQty);
    }

    if (!adjustedByLaborId.size) return rows;

    return rows.map(r => {
        const estimateRowId = (r as any).estimateRowId as string | undefined;
        if (!estimateRowId) return r;
        const newMatUP = adjustedByLaborId.get(estimateRowId);
        if (newMatUP == null) return r;
        return {
            ...r,
            actualMaterialUnitCost: newMatUP,
            materialUnitCostSource: 'manual' as const,
            unitCostSource: 'manual' as const,
            actualUnitCost: ((r as any).actualLaborUnitCost ?? r.actualUnitCost ?? 0) + newMatUP,
        };
    });
}
