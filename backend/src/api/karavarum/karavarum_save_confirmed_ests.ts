import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { ObjectId } from 'mongodb';

registerApiSession('karavarum/save_confirmed_ests', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const confirmedEsts: Db.ConfirmedEst[] = req.body?.confirmedEsts ?? [];
    await Db.getKaravarumCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { confirmedEsts, updatedAt: new Date() } }
    );
    respondJsonData(res, { ok: true });
});
