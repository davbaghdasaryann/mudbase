import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/fetch', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    // Use localEstimateId for snapshot building if provided (forked estimates have different labor IDs)
    const snapshotEstimateId = (req.query.snapshotEstimateId as string) || estimateId;
    const col = Db.getCostingsCollection();
    const doc = await col.findOne({
        accountId: session.mongoAccountId,
        estimateId: new ObjectId(estimateId),
    });
    if (!doc) { respondJsonData(res, null); return; }
    const freshSnapshot = await buildEstimateSnapshot(snapshotEstimateId);
    respondJsonData(res, { ...doc, estimateSnapshot: freshSnapshot });
});
