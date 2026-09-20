import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('analysis/structural/update', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const { activeTab } = req.body as Partial<Db.EntityStructuralAnalysis>;
    const col = Db.getStructuralAnalysesCollection();
    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId, userId: session.mongoUserId },
        { $set: { activeTab: activeTab ?? 'general', updatedAt: new Date() } }
    );
    respondJsonData(res, { ok: true });
});
