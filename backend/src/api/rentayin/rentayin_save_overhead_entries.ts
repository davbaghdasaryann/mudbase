import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('rentayin/save_overhead_entries', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const entries = req.body?.entries ?? [];

    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { overheadEntries: entries, updatedAt: new Date() } }
    );

    respondJsonData(res, { ok: true });
});
