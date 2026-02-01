import { ObjectId } from 'mongodb';
import { registerApiSession } from '@/server/register';
import * as Db from '@/db';

import { respondJson } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

function parseLaborIds(body: any): ObjectId[] {
    const ids = body?.estimatedLaborIds;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return ids.map((id: string) => new ObjectId(id)).filter(Boolean);
}

registerApiSession('estimate/move_labor_items', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimatedLaborIds = parseLaborIds(req.body);
    const targetEstimateSubsectionId = req.body?.targetEstimateSubsectionId;
    const targetEstimateSectionId = req.body?.targetEstimateSectionId;

    if (estimatedLaborIds.length === 0) {
        respondJson(res, { ok: true, modifiedCount: 0 });
        return;
    }

    const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
    let targetSubsectionOid: ObjectId;

    if (targetEstimateSubsectionId) {
        targetSubsectionOid = new ObjectId(targetEstimateSubsectionId);
        const targetSubsection = await estimateSubsectionsColl.findOne({ _id: targetSubsectionOid });
        assertObject(targetSubsection, 'Target subsection not found');
        if (targetSubsection.estimateId.toString() !== estimateId.toString()) {
            respondJson(res, { ok: false, message: 'Target subsection does not belong to this estimate' });
            return;
        }
    } else if (targetEstimateSectionId) {
        const sectionOid = new ObjectId(targetEstimateSectionId);
        const estimateSectionsColl = Db.getEstimateSectionsCollection();
        const section = await estimateSectionsColl.findOne({ _id: sectionOid });
        assertObject(section, 'Target section not found');
        if (section.estimateId.toString() !== estimateId.toString()) {
            respondJson(res, { ok: false, message: 'Target section does not belong to this estimate' });
            return;
        }
        const existing = await estimateSubsectionsColl.findOne(
            { estimateSectionId: sectionOid },
            { sort: { displayIndex: 1, _id: 1 } }
        );
        if (existing) {
            targetSubsectionOid = existing._id;
        } else {
            const newSub: Omit<Db.EntityEstimateSubsection, '_id'> = {
                estimateSectionId: sectionOid,
                estimateId: section.estimateId,
                name: '',
                displayIndex: 0,
                totalCost: 0,
            };
            const insertResult = await estimateSubsectionsColl.insertOne(newSub as Db.EntityEstimateSubsection);
            targetSubsectionOid = insertResult.insertedId;
        }
    } else {
        respondJson(res, { ok: false, message: 'targetEstimateSubsectionId or targetEstimateSectionId required' });
        return;
    }

    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const result = await estimateLaborItemsColl.updateMany(
        { _id: { $in: estimatedLaborIds }, estimateId },
        { $set: { estimateSubsectionId: targetSubsectionOid } }
    );

    await updateEstimateCostById(estimateId);

    respondJson(res, { ok: true, modifiedCount: result.modifiedCount });
});
