import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/create', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const estimateName = requireQueryParam(req, 'estimateName');

    const col = Db.getSchedulesCollection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const doc: Db.EntitySchedule = {
        accountId: session.mongoAccountId,
        estimateId,
        estimateName,
        projectStartDate: today,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
