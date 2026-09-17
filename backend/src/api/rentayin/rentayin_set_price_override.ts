import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { applyMaterialOverridesToRows } from './rentayin_apply_material_overrides';

// Save a unit price override for a labor or material item in a rentayin record.
// key: estimateRowId (individual item) or laborItemId (group — catalog ID)
// type: 'labor' | 'material'
// price: > 0 to set; -1 to clear (group rows use this to show "—" after setting children)
registerApiSession('rentayin/set_price_override', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const type = requireQueryParam(req, 'type') as 'labor' | 'material';
    const key = requireQueryParam(req, 'key');
    const price = parseFloat(req.query.price as string);

    if (isNaN(price)) { res.status(400).json({ error: 'Invalid price' }); return; }

    const col = Db.getRentayinsCollection();
    const docId = new ObjectId(id);
    const field = type === 'labor' ? 'laborPriceOverrides' : 'materialPriceOverrides';

    if (price <= 0) {
        // -1: clear the override for this key (group-level clear)
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId },
            { $unset: { [`${field}.${key}`]: '' }, $set: { updatedAt: new Date() } }
        );
        // For material clears: recompute affected rows with override removed
        if (type === 'material') {
            const doc = await col.findOne({ _id: docId, accountId: session.mongoAccountId });
            if (doc?.rows && doc.estimateId) {
                const overrides = { ...(doc.materialPriceOverrides ?? {}) };
                delete overrides[key];
                const updatedRows = await applyMaterialOverridesToRows(doc.rows as Db.RentayinRow[], doc.estimateId, overrides);
                await col.updateOne({ _id: docId }, { $set: { rows: updatedRows, updatedAt: new Date() } });
            }
        }
        respondJsonData(res, { ok: true });
        return;
    }

    // price > 0: set override and atomically update the matching rentayin row.
    // For labor: use an aggregation pipeline so we can preserve actualMaterialUnitCost
    // (actualUnitCost = override + existing material cost, not just the labor override alone).
    if (type === 'labor') {
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId, 'rows.estimateRowId': key },
            [{
                $set: {
                    updatedAt: '$$NOW',
                    rows: {
                        $map: {
                            input: '$rows',
                            as: 'row',
                            in: {
                                $cond: [
                                    { $eq: ['$$row.estimateRowId', key] },
                                    { $mergeObjects: ['$$row', {
                                        actualLaborUnitCost: price,
                                        laborUnitCostSource: 'manual',
                                        unitCostSource: 'manual',
                                        actualUnitCost: { $add: [price, { $ifNull: ['$$row.actualMaterialUnitCost', 0] }] },
                                    }] },
                                    '$$row',
                                ]
                            }
                        }
                    }
                }
            }] as any
        );
        // Store the override key (dynamic field — must be a separate regular update)
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId },
            { $set: { [`${field}.${key}`]: price, updatedAt: new Date() } }
        );
    } else {
        // Material override: store the key then recompute affected rows
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId },
            { $set: { [`${field}.${key}`]: price, updatedAt: new Date() } }
        );
        const doc = await col.findOne({ _id: docId, accountId: session.mongoAccountId });
        if (doc?.rows && doc.estimateId) {
            const updatedRows = await applyMaterialOverridesToRows(
                doc.rows as Db.RentayinRow[],
                doc.estimateId,
                doc.materialPriceOverrides ?? {},
            );
            await col.updateOne({ _id: docId }, { $set: { rows: updatedRows, updatedAt: new Date() } });
        }
    }

    respondJsonData(res, { ok: true });
});
