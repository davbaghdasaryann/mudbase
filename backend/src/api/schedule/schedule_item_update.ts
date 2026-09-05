import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/item_update', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const startDay = parseInt(requireQueryParam(req, 'startDay'));
    const col = Db.getScheduleItemsCollection();
    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { startDay } },
    );
    respondJsonData(res, { ok: true });
});
