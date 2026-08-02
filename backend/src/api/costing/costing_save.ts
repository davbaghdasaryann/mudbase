import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/save', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const { costHistory, pahestEntries, aylEntries, actualData, salaryData, unforeseenEstimateId, unforeseenCostingId } = req.body as {
        costHistory: Db.CostingHistoryRecord[];
        pahestEntries: Db.CostingPahestEntry[];
        aylEntries: Db.CostingAylEntry[];
        actualData: Record<string, { quantity: string; unitPrice: string }>;
        salaryData: Db.CostingSalaryData;
        unforeseenEstimateId?: string;
        unforeseenCostingId?: string;
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
    if (unforeseenEstimateId !== undefined) updateFields.unforeseenEstimateId = unforeseenEstimateId || undefined;
    if (unforeseenCostingId !== undefined) updateFields.unforeseenCostingId = unforeseenCostingId || undefined;

    // Build and store unforeseen snapshot when a new unforeseen estimate is linked
    if (unforeseenEstimateId) {
        const existing = await col.findOne(
            { _id: new ObjectId(id), accountId: session.mongoAccountId },
            { projection: { unforeseenEstimateId: 1 } }
        );
        if (!existing?.unforeseenEstimateId || existing.unforeseenEstimateId !== unforeseenEstimateId) {
            updateFields.unforeseenEstimateSnapshot = await buildEstimateSnapshot(unforeseenEstimateId);
        }
    } else if (unforeseenEstimateId === '') {
        updateFields.unforeseenEstimateSnapshot = undefined;
    }

    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: updateFields }
    );
    respondJsonData(res, { ok: true });
});
