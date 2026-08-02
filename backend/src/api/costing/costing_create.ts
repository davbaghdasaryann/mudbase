import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/create', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const estimateName = requireQueryParam(req, 'estimateName');
    const isUnforeseen = req.query.isUnforeseen === 'true';
    const parentCostingId = req.query.parentCostingId as string | undefined;

    const [col, snapshot] = await Promise.all([
        Promise.resolve(Db.getCostingsCollection()),
        buildEstimateSnapshot(estimateId),
    ]);

    const doc: Db.EntityCosting = {
        accountId: session.mongoAccountId,
        estimateId: new ObjectId(estimateId),
        estimateName,
        costHistory: [],
        pahestEntries: [],
        aylEntries: [],
        actualData: {},
        estimateSnapshot: snapshot,
        ...(isUnforeseen ? { isUnforeseen: true } : {}),
        ...(parentCostingId ? { parentCostingId } : {}),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
