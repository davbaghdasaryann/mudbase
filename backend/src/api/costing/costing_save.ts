import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/save', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const { costHistory, pahestEntries, aylEntries, actualData, salaryData, unforeseenEstimateId, unforeseenCostingId, smallScaleEstimateId, smallScaleCostingId, vatDeduction, climateImpact, temporaryStructures, transportationCosts, commissioningCosts, stateFees } = req.body as {
        costHistory: Db.CostingHistoryRecord[];
        pahestEntries: Db.CostingPahestEntry[];
        aylEntries: Db.CostingAylEntry[];
        actualData: Record<string, { quantity: string; unitPrice: string }>;
        salaryData: Db.CostingSalaryData;
        unforeseenEstimateId?: string;
        unforeseenCostingId?: string;
        smallScaleEstimateId?: string;
        smallScaleCostingId?: string;
        vatDeduction?: number;
        climateImpact?: number;
        temporaryStructures?: number;
        transportationCosts?: number;
        commissioningCosts?: number;
        stateFees?: number;
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
    if (smallScaleEstimateId !== undefined) updateFields.smallScaleEstimateId = smallScaleEstimateId || undefined;
    if (smallScaleCostingId !== undefined) updateFields.smallScaleCostingId = smallScaleCostingId || undefined;
    if (vatDeduction !== undefined) updateFields.vatDeduction = vatDeduction;
    if (climateImpact !== undefined) updateFields.climateImpact = climateImpact;
    if (temporaryStructures !== undefined) updateFields.temporaryStructures = temporaryStructures;
    if (transportationCosts !== undefined) updateFields.transportationCosts = transportationCosts;
    if (commissioningCosts !== undefined) updateFields.commissioningCosts = commissioningCosts;
    if (stateFees !== undefined) updateFields.stateFees = stateFees;

    // Build snapshots when a new estimate is linked
    const existing = (unforeseenEstimateId !== undefined || smallScaleEstimateId !== undefined)
        ? await col.findOne({ _id: new ObjectId(id), accountId: session.mongoAccountId }, { projection: { unforeseenEstimateId: 1, smallScaleEstimateId: 1 } })
        : null;

    if (unforeseenEstimateId) {
        if (!existing?.unforeseenEstimateId || existing.unforeseenEstimateId !== unforeseenEstimateId) {
            updateFields.unforeseenEstimateSnapshot = await buildEstimateSnapshot(unforeseenEstimateId);
        }
    } else if (unforeseenEstimateId === '') {
        updateFields.unforeseenEstimateSnapshot = undefined;
    }

    if (smallScaleEstimateId) {
        if (!existing?.smallScaleEstimateId || existing.smallScaleEstimateId !== smallScaleEstimateId) {
            updateFields.smallScaleEstimateSnapshot = await buildEstimateSnapshot(smallScaleEstimateId);
        }
    } else if (smallScaleEstimateId === '') {
        updateFields.smallScaleEstimateSnapshot = undefined;
    }

    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: updateFields }
    );
    respondJsonData(res, { ok: true });
});
