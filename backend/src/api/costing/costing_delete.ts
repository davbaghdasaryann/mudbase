import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('costing/delete', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getCostingsCollection();
    await col.deleteOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    respondJsonData(res, { ok: true });
});
