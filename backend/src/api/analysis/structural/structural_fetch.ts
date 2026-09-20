import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('analysis/structural/fetch', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getStructuralAnalysesCollection();
    const doc = await col.findOne({ _id: new ObjectId(id), accountId: session.mongoAccountId, userId: session.mongoUserId });
    respondJsonData(res, doc ?? null);
});
