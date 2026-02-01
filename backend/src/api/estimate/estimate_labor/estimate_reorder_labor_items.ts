import { ObjectId } from 'mongodb';
import { registerApiSession } from '@/server/register';
import * as Db from '@/db';

import { respondJson } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';

function parseLaborIds(body: any): ObjectId[] {
    const ids = body?.estimatedLaborIds;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return ids.map((id: string) => new ObjectId(id)).filter(Boolean);
}

registerApiSession('estimate/reorder_labor_items', async (req, res, session) => {
    const estimateSubsectionId = requireMongoIdParam(req, 'estimateSubsectionId');
    const estimatedLaborIds = parseLaborIds(req.body);
    if (estimatedLaborIds.length === 0) {
        respondJson(res, { ok: true });
        return;
    }

    const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
    const subsection = await estimateSubsectionsColl.findOne({ _id: estimateSubsectionId });
    assertObject(subsection, 'Subsection not found');

    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const bulkOps = estimatedLaborIds.map((id, index) => ({
        updateOne: {
            filter: { _id: id, estimateSubsectionId },
            update: { $set: { displayIndex: index } },
        },
    }));

    await estimateLaborItemsColl.bulkWrite(bulkOps);

    respondJson(res, { ok: true });
});
