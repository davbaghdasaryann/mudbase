import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/group_fetch_all', async (req, res, session) => {
    const scheduleId = requireQueryParam(req, 'scheduleId');
    const col = Db.getScheduleGroupsCollection();
    const groups = await col
        .find({ scheduleId: new ObjectId(scheduleId), accountId: session.mongoAccountId })
        .sort({ displayIndex: 1, createdAt: 1 })
        .toArray();
    respondJsonData(res, groups);
});
