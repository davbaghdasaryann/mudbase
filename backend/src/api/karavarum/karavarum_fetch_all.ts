import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('karavarum/fetch_all', async (req, res, session) => {
    const data = await Db.getKaravarumCollection()
        .find({ accountId: session.mongoAccountId })
        .sort({ createdAt: -1 })
        .toArray();
    respondJsonData(res, data);
});
