import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/refresh_local_snapshot', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getCostingsCollection();

    const costing = await col.findOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    if (!costing?.localEstimateId) {
        respondJsonData(res, { snapshot: null });
        return;
    }

    const newSnapshot = await buildEstimateSnapshot(costing.localEstimateId);

    // Check if costHistory laborItemIds are orphaned (not in the local estimate).
    // This happens for records forked before the ID-remapping fix was deployed.
    const localRowIds = new Set(newSnapshot.laborRows.map(r => r._id.toString()));
    const costHistory: any[] = costing.costHistory ?? [];
    const hasOrphanedIds = costHistory.some(e => e.laborItemId && !localRowIds.has(e.laborItemId.toString()));

    let repaired = false;
    let newCostHistory = costHistory;
    let newPahestEntries: any[] = costing.pahestEntries ?? [];

    if (hasOrphanedIds && costing.estimateId) {
        // Rebuild the old→new labor ID mapping by matching original and local
        // estimate labor items positionally (same insertion order as fork_estimate used).
        const laborItemsCol = Db.getEstimateLaborItemsCollection();
        const sectionsCol = Db.getEstimateSectionsCollection();
        const subsectionsCol = Db.getEstimateSubsectionsCollection();

        const origEstId = new ObjectId(costing.estimateId.toString());
        const localEstId = new ObjectId(costing.localEstimateId.toString());

        const origSections = await sectionsCol.find({ estimateId: origEstId }).sort({ displayIndex: 1, _id: 1 }).toArray();
        const localSections = await sectionsCol.find({ estimateId: localEstId }).sort({ displayIndex: 1, _id: 1 }).toArray();

        const oldToNew = new Map<string, string>();

        for (let si = 0; si < Math.min(origSections.length, localSections.length); si++) {
            const origSubs = await subsectionsCol.find({ estimateSectionId: origSections[si]._id }).sort({ displayIndex: 1, _id: 1 }).toArray();
            const localSubs = await subsectionsCol.find({ estimateSectionId: localSections[si]._id }).sort({ displayIndex: 1, _id: 1 }).toArray();

            for (let sbi = 0; sbi < Math.min(origSubs.length, localSubs.length); sbi++) {
                const origLabor = await laborItemsCol.find({ estimateSubsectionId: origSubs[sbi]._id }).sort({ displayIndex: 1, _id: 1 }).toArray();
                const localLabor = await laborItemsCol.find({ estimateSubsectionId: localSubs[sbi]._id }).sort({ displayIndex: 1, _id: 1 }).toArray();

                for (let li = 0; li < Math.min(origLabor.length, localLabor.length); li++) {
                    oldToNew.set(origLabor[li]._id.toString(), localLabor[li]._id.toString());
                }
            }
        }

        if (oldToNew.size > 0) {
            newCostHistory = costHistory.map((e: any) => {
                if (e.laborItemId) {
                    const newId = oldToNew.get(e.laborItemId.toString());
                    if (newId) return { ...e, laborItemId: newId };
                }
                return e;
            });
            newPahestEntries = (costing.pahestEntries ?? []).map((e: any) => {
                if (e.estimatedLaborId) {
                    const newId = oldToNew.get(e.estimatedLaborId.toString());
                    if (newId) return { ...e, estimatedLaborId: newId };
                }
                return e;
            });
            repaired = true;
        }
    }

    const updateFields: any = { estimateSnapshot: newSnapshot, updatedAt: new Date() };
    if (repaired) {
        updateFields.costHistory = newCostHistory;
        updateFields.pahestEntries = newPahestEntries;
    }

    await col.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    respondJsonData(res, {
        snapshot: newSnapshot,
        ...(repaired ? { costHistory: newCostHistory, pahestEntries: newPahestEntries } : {}),
    });
});
