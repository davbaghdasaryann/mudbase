import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

// Save a unit price override for a labor or material item in a rentayin record.
// key: laborItemId (group) or estimateRowId (individual item)
// type: 'labor' | 'material'
registerApiSession('rentayin/set_price_override', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const type = requireQueryParam(req, 'type') as 'labor' | 'material';
    const key = requireQueryParam(req, 'key');
    const price = parseFloat(req.query.price as string);

    if (isNaN(price) || price < 0) { res.status(400).json({ error: 'Invalid price' }); return; }

    const field = type === 'labor' ? 'laborPriceOverrides' : 'materialPriceOverrides';
    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { [`${field}.${key}`]: price, updatedAt: new Date() } }
    );
    respondJsonData(res, { ok: true });
});
