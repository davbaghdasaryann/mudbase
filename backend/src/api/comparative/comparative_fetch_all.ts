import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('comparative/fetch_all', async (req, res, session) => {
    const col = Db.getComparativeAnalysesCollection();
    const list = await col
        .find({ accountId: session.mongoAccountId, userId: session.mongoUserId })
        .project({ enteredDataCellValues: 0 }) // exclude large field from list
        .sort({ updatedAt: -1 })
        .toArray();
    respondJsonData(res, list);
});
