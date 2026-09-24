import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('karavarum/create', async (req, res, session) => {
    const name = requireQueryParam(req, 'name');
    const doc: Db.EntityKaravarum = {
        accountId: session.mongoAccountId,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await Db.getKaravarumCollection().insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
