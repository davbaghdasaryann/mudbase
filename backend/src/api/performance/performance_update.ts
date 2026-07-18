import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('performance/update', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const { acts, actsData, actsDates } = req.body as { acts: number[]; actsData: Db.PerformanceActData[]; actsDates?: Db.ActDateRange[] };

    const col = Db.getPerformanceActsCollection();
    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: { acts, actsData, actsDates: actsDates ?? [], updatedAt: new Date() } }
    );
    respondJsonData(res, { ok: true });
});
