import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('costing/create', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const estimateName = requireQueryParam(req, 'estimateName');

    const col = Db.getCostingsCollection();
    const doc: Db.EntityCosting = {
        accountId: session.mongoAccountId,
        estimateId: new ObjectId(estimateId),
        estimateName,
        costHistory: [],
        pahestEntries: [],
        aylEntries: [],
        actualData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
