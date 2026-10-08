import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import { getEstimatesCollection } from '@/db/entities/estimate/entity_estimates';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('estimate/update_construction_types', async (req, res, session) => {
    const { estimateId, constructionTypes } = req.body as { estimateId: string; constructionTypes: string[] };
    if (!estimateId) { res.status(400).json({ error: 'estimateId required' }); return; }

    const isSuperAdmin = session.checkPermission(Permissions.All) ||
        session.checkPermission(Permissions.UsersFetchAll) ||
        session.checkPermission(Permissions.AccountsFetch);

    const col = getEstimatesCollection();
    const filter = isSuperAdmin
        ? { _id: new ObjectId(estimateId) }
        : { _id: new ObjectId(estimateId), accountId: session.mongoAccountId };

    await col.updateOne(filter, { $set: { constructionTypes: constructionTypes ?? [] } });
    respondJsonData(res, { ok: true });
});
