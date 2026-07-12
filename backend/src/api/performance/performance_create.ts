import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('performance/create', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const estimateName = requireQueryParam(req, 'estimateName');

    const col = Db.getPerformanceActsCollection();

    const doc: Db.EntityPerformanceAct = {
        accountId: session.mongoAccountId,
        createdByUserId: session.mongoUserId,
        estimateId: new ObjectId(estimateId),
        estimateName,
        acts: [],
        actsData: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
