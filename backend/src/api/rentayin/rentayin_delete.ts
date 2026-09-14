import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('rentayin/delete', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { deleted: true, updatedAt: new Date() } }
    );
    respondJsonData(res, { ok: true });
});
