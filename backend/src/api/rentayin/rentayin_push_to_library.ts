import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

// Push a rentayin price override back to the user's favorites library.
// For labor: updates changableAveragePrice on all favorite_labor_items with the matching laborItemId.
// For material: updates changableAveragePrice on nested materials[] with the matching materialItemId.
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

    const favCol = Db.getFavoriteLaborItemsCollection();

    if (type === 'labor') {
        const laborItem = await Db.getEstimateLaborItemsCollection().findOne({
            _id: new ObjectId(key),
            estimateId: rentayin.estimateId,
        });
        if (!laborItem?.laborItemId) { respondJsonData(res, { ok: true, updated: 0 }); return; }

        const result = await favCol.updateMany(
            { accountId: session.mongoAccountId, laborItemId: laborItem.laborItemId },
            { $set: { changableAveragePrice: price } }
        );
        respondJsonData(res, { ok: true, updated: result.modifiedCount });
    } else {
        const matItem = await Db.getEstimateMaterialItemsCollection().findOne({
            _id: new ObjectId(key),
            estimateId: rentayin.estimateId,
        });
        if (!matItem?.materialItemId) { respondJsonData(res, { ok: true, updated: 0 }); return; }

        const result = await favCol.updateMany(
            { accountId: session.mongoAccountId, 'materials.materialItemId': matItem.materialItemId },
            { $set: { 'materials.$[elem].changableAveragePrice': price } },
            { arrayFilters: [{ 'elem.materialItemId': matItem.materialItemId }] }
        );
        respondJsonData(res, { ok: true, updated: result.modifiedCount });
    }
});
