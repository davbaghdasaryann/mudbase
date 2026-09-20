import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('analysis/chronological/create', async (req, res, session) => {
    const { name, sourceType, itemId, fromDate, toDate } = req.body as Partial<Db.EntityChronologicalAnalysis>;
    const col = Db.getChronologicalAnalysesCollection();
    const now = new Date();
    const result = await col.insertOne({
        accountId: session.mongoAccountId,
        userId: session.mongoUserId,
        name: name ?? '',
        sourceType: sourceType ?? 'list_of_estimates',
        itemId: itemId ?? '',
        fromDate: fromDate ?? '',
        toDate: toDate ?? '',
        createdAt: now,
        updatedAt: now,
    });
    respondJsonData(res, { _id: result.insertedId });
});
