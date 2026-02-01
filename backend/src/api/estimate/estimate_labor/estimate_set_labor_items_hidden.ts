import { ObjectId } from 'mongodb';
import { registerApiSession } from '@/server/register';
import * as Db from '@/db';

import { respondJson } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

function parseLaborIds(body: any): ObjectId[] {
    const ids = body?.estimatedLaborIds;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return ids.map((id: string) => new ObjectId(id)).filter(Boolean);
}

registerApiSession('estimate/set_labor_items_hidden', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimatedLaborIds = parseLaborIds(req.body);
    const hidden = req.body?.hidden === true;

    if (estimatedLaborIds.length === 0) {
        respondJson(res, { ok: true, modifiedCount: 0 });
        return;
    }

    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const result = await estimateLaborItemsColl.updateMany(
        { _id: { $in: estimatedLaborIds }, estimateId },
        { $set: { isHidden: hidden } }
    );

    await updateEstimateCostById(estimateId);

    respondJson(res, { ok: true, modifiedCount: result.modifiedCount });
});
