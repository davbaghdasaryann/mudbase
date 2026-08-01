import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('costing/save', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const { costHistory, pahestEntries, aylEntries, actualData, salaryData, unforeseenEstimateId } = req.body as {
        costHistory: Db.CostingHistoryRecord[];
        pahestEntries: Db.CostingPahestEntry[];
        aylEntries: Db.CostingAylEntry[];
        actualData: Record<string, { quantity: string; unitPrice: string }>;
        salaryData: Db.CostingSalaryData;
        unforeseenEstimateId?: string;
    };

    const col = Db.getCostingsCollection();
    const updateFields: Partial<Db.EntityCosting> = {
        costHistory: costHistory ?? [],
        pahestEntries: pahestEntries ?? [],
        aylEntries: aylEntries ?? [],
        actualData: actualData ?? {},
        salaryData: salaryData ?? { druqayin: 0, gorcarqayin: 0, miavorZham: 0 },
        updatedAt: new Date(),
    };
    if (unforeseenEstimateId !== undefined) {
        updateFields.unforeseenEstimateId = unforeseenEstimateId || undefined;
    }
    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: updateFields }
    );
    respondJsonData(res, { ok: true });
});
