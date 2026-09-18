import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

// Push ALL price overrides from a rentayin doc to the company's library offers.
registerApiSession('rentayin/push_all_to_library', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');

    const rentayin = await Db.getRentayinsCollection().findOne({
        _id: new ObjectId(id),
        accountId: session.mongoAccountId,
        deleted: { $ne: true },
    });
    if (!rentayin) { res.status(404).json({ error: 'Not found' }); return; }

    const laborOverrides = rentayin.laborPriceOverrides ?? {};
    const materialOverrides = rentayin.materialPriceOverrides ?? {};
    let updated = 0;

    // Labor overrides: key = estimateRowId = estimate_labor_items._id
    for (const [key, price] of Object.entries(laborOverrides)) {
        if (!price || price <= 0) continue;
        try {
            const laborItem = await Db.getEstimateLaborItemsCollection().findOne({
                _id: new ObjectId(key),
                estimateId: rentayin.estimateId,
            });
            if (!laborItem?.laborItemId) continue;
            const result = await Db.getLaborOffersCollection().updateOne(
                { itemId: laborItem.laborItemId, accountId: session.mongoAccountId },
                { $set: { price, updatedAt: new Date() } }
            );
            updated += result.modifiedCount;
        } catch { /* invalid ObjectId — skip */ }
    }

    // Material overrides: key = estimate_material_items._id or 'mg:<materialItemId>'
    const seenMaterialItemIds = new Set<string>();
    for (const [key, price] of Object.entries(materialOverrides)) {
        if (!price || price <= 0) continue;
        try {
            let materialItemId: ObjectId;
            if (key.startsWith('mg:')) {
                materialItemId = new ObjectId(key.slice(3));
            } else {
                const matItem = await Db.getEstimateMaterialItemsCollection().findOne({
                    _id: new ObjectId(key),
                    estimateId: rentayin.estimateId,
                });
                if (!matItem?.materialItemId) continue;
                materialItemId = matItem.materialItemId;
            }
            const mid = materialItemId.toString();
            if (seenMaterialItemIds.has(mid)) continue; // already updated via group key
            seenMaterialItemIds.add(mid);
            const result = await Db.getMaterialOffersCollection().updateOne(
                { itemId: materialItemId, accountId: session.mongoAccountId },
                { $set: { price, updatedAt: new Date() } }
            );
            updated += result.modifiedCount;
        } catch { /* invalid ObjectId — skip */ }
    }

    respondJsonData(res, { ok: true, updated });
});
