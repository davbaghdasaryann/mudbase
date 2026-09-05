import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/group_create', async (req, res, session) => {
    const scheduleId = requireQueryParam(req, 'scheduleId');
    const name = requireQueryParam(req, 'name');
    const col = Db.getScheduleGroupsCollection();
    const displayIndex = await col.countDocuments({ scheduleId: new ObjectId(scheduleId), accountId: session.mongoAccountId });
    const doc: Db.EntityScheduleGroup = {
        scheduleId: new ObjectId(scheduleId),
        accountId: session.mongoAccountId,
        name,
        displayIndex,
        createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
