import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

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
        respondJsonData(res, { ok: true });
        return;
    }

    // price > 0: set override and atomically update the matching rentayin row
    // Use positional operator so concurrent writes don't overwrite each other's rows
    if (type === 'labor') {
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId, 'rows.estimateRowId': key },
            { $set: {
                [`${field}.${key}`]: price,
                'rows.$.actualUnitCost': price,
                'rows.$.actualLaborUnitCost': price,
                'rows.$.unitCostSource': 'manual',
                updatedAt: new Date(),
            } }
        );
        // If no row matched (estimateRowId not yet on rows), just store the override
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId },
            { $set: { [`${field}.${key}`]: price, updatedAt: new Date() } }
        );
    } else {
        await col.updateOne(
            { _id: docId, accountId: session.mongoAccountId },
            { $set: { [`${field}.${key}`]: price, updatedAt: new Date() } }
        );
    }

    respondJsonData(res, { ok: true });
});
