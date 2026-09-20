import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('comparative/load_state', async (req, res, session) => {
    const col = Db.getComparativeStateCollection();
    const doc = await col.findOne({ accountId: session.mongoAccountId, userId: session.mongoUserId });
    respondJsonData(res, doc ?? null);
});
