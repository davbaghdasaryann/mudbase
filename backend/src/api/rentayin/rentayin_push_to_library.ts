import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

// Push a rentayin price override to the company's library offer (labor_offers / material_offers).
// For labor: updates labor_offers.price for the offer that was imported into this estimate row.
// For material: updates material_offers.price for the offer linked to this estimate material item.
registerApiSession('rentayin/push_to_library', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const type = requireQueryParam(req, 'type') as 'labor' | 'material';
    const key = requireQueryParam(req, 'key');
    const price = parseFloat(req.query.price as string);

    if (isNaN(price) || price <= 0) { res.status(400).json({ error: 'Invalid price' }); return; }

    const rentayin = await Db.getRentayinsCollection().findOne({
        _id: new ObjectId(id),
        accountId: session.mongoAccountId,
        deleted: { $ne: true },
    });
    if (!rentayin) { res.status(404).json({ error: 'Not found' }); return; }

    if (type === 'labor') {
        const laborItem = await Db.getEstimateLaborItemsCollection().findOne({
            _id: new ObjectId(key),
            estimateId: rentayin.estimateId,
        });
        if (!laborItem?.laborOfferId) { respondJsonData(res, { ok: true, updated: 0 }); return; }

        const result = await Db.getLaborOffersCollection().updateOne(
            { _id: laborItem.laborOfferId, accountId: session.mongoAccountId },
            { $set: { price, updatedAt: new Date() } }
        );
        respondJsonData(res, { ok: true, updated: result.modifiedCount });
    } else {
        const matItem = await Db.getEstimateMaterialItemsCollection().findOne({
            _id: new ObjectId(key),
            estimateId: rentayin.estimateId,
        });
        if (!matItem?.materialOfferId) { respondJsonData(res, { ok: true, updated: 0 }); return; }

        const result = await Db.getMaterialOffersCollection().updateOne(
            { _id: matItem.materialOfferId, accountId: session.mongoAccountId },
            { $set: { price, updatedAt: new Date() } }
        );
        respondJsonData(res, { ok: true, updated: result.modifiedCount });
    }
});
