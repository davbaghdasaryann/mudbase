import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('costing/fetch', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const col = Db.getCostingsCollection();
    const doc = await col.findOne({
        accountId: session.mongoAccountId,
        estimateId: new ObjectId(estimateId),
    });
    respondJsonData(res, doc ?? null);
});
