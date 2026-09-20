import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('analysis/structural/create', async (req, res, session) => {
    const { name, estimateId, activeTab } = req.body as Partial<Db.EntityStructuralAnalysis>;
    const col = Db.getStructuralAnalysesCollection();
    const now = new Date();
    const result = await col.insertOne({
        accountId: session.mongoAccountId,
        userId: session.mongoUserId,
        name: name ?? '',
        estimateId: estimateId ?? '',
        activeTab: activeTab ?? 'general',
        createdAt: now,
        updatedAt: now,
    });
    respondJsonData(res, { _id: result.insertedId });
});
