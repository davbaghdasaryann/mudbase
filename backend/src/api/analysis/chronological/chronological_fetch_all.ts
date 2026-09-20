import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('analysis/chronological/fetch_all', async (req, res, session) => {
    const col = Db.getChronologicalAnalysesCollection();
    const list = await col
        .find({ accountId: session.mongoAccountId, userId: session.mongoUserId })
        .sort({ updatedAt: -1 })
        .toArray();
    respondJsonData(res, list);
});
