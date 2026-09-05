import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/item_fetch_all', async (req, res, session) => {
    const scheduleId = requireQueryParam(req, 'scheduleId');
    const col = Db.getScheduleItemsCollection();
    const items = await col
        .find({ scheduleId: new ObjectId(scheduleId), accountId: session.mongoAccountId })
        .sort({ createdAt: 1 })
        .toArray();
    respondJsonData(res, items);
});
