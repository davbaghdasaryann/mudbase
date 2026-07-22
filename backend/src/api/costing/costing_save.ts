import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('costing/save', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const { costHistory, pahestEntries, aylEntries, actualData } = req.body as {
        costHistory: Db.CostingHistoryRecord[];
        pahestEntries: Db.CostingPahestEntry[];
        aylEntries: Db.CostingAylEntry[];
        actualData: Record<string, { quantity: string; unitPrice: string }>;
    };

    const col = Db.getCostingsCollection();
    await col.updateOne(
        { accountId: session.mongoAccountId, estimateId: new ObjectId(estimateId) },
        {
            $set: {
                costHistory: costHistory ?? [],
                pahestEntries: pahestEntries ?? [],
                aylEntries: aylEntries ?? [],
                actualData: actualData ?? {},
                updatedAt: new Date(),
            },
            $setOnInsert: {
                accountId: session.mongoAccountId,
                estimateId: new ObjectId(estimateId),
            },
        },
        { upsert: true }
    );
    respondJsonData(res, { ok: true });
});
