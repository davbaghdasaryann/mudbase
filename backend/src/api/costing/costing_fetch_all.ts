import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('costing/fetch_all', async (req, res, session) => {
    const col = Db.getCostingsCollection();
    const data = await col
        .find({ accountId: session.mongoAccountId })
        .sort({ createdAt: -1 })
        .toArray();
    respondJsonData(res, data);
});
