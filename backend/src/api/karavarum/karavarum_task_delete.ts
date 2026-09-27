import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('karavarum/task_delete', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    await Db.getKaravarumTasksCollection().deleteOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    respondJsonData(res, { ok: true });
});
