import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/update_start_date', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const dateStr = requireQueryParam(req, 'projectStartDate');
    const projectStartDate = new Date(dateStr);
    const col = Db.getSchedulesCollection();
    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { projectStartDate, updatedAt: new Date() } },
    );
    respondJsonData(res, { ok: true });
});
