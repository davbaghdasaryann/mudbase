import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/refresh_local_snapshot', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getCostingsCollection();

    const costing = await col.findOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    if (!costing?.localEstimateId) {
        respondJsonData(res, { snapshot: null });
        return;
    }

    const newSnapshot = await buildEstimateSnapshot(costing.localEstimateId);
    await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { estimateSnapshot: newSnapshot, updatedAt: new Date() } }
    );

    respondJsonData(res, { snapshot: newSnapshot });
});
