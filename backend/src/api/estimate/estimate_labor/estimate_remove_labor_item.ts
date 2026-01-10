import { registerApiSession } from '@/server/register';
import * as Db from '@/db';

import { respondJson } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';


registerApiSession('estimate/remove_labor_item', async (req, res, session) => {
    const estimateLaborItemId = requireMongoIdParam(req, 'estimateLaborItemId');


    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();

    const labor = (await estimateLaborItemsColl.findOne({_id: estimateLaborItemId}))!;
    assertObject(labor, "Invalid Labor Item");


    const estimatedMaterialItemsColl = Db.getEstimateMaterialItemsCollection();
    await estimatedMaterialItemsColl.deleteMany({ estimatedLaborId: estimateLaborItemId });


    const result = await estimateLaborItemsColl.deleteOne({ _id: estimateLaborItemId });


    await updateEstimateCostById(labor.estimateId);

    respondJson(res, result);
});
