import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('rentayin/fetch_all', async (req, res, session) => {
    const data = await Db.getRentayinsCollection()
        .find({ accountId: session.mongoAccountId, deleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();
    respondJsonData(res, data);
});
