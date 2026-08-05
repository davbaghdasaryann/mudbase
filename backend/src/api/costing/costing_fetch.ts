import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/fetch', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const col = Db.getCostingsCollection();
    const doc = await col.findOne({
        accountId: session.mongoAccountId,
        estimateId: new ObjectId(estimateId),
    });
    if (!doc) { respondJsonData(res, null); return; }
    // Always rebuild snapshot fresh so it reflects the latest estimate structure
    const freshSnapshot = await buildEstimateSnapshot(estimateId);
    respondJsonData(res, { ...doc, estimateSnapshot: freshSnapshot });
});
