import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/group_rename', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const name = requireQueryParam(req, 'name');
    const col = Db.getScheduleGroupsCollection();
    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { name } },
    );
    respondJsonData(res, { ok: true });
});
