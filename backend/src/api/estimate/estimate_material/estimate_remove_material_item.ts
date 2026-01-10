import { registerApiSession } from '@/server/register';

import * as Db from '@/db';

import { respondJson } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';



registerApiSession('estimate/remove_material_item', async (req, res, session) => {
    const estimateMaterialItemId = requireMongoIdParam(req, 'estimateMaterialItemId');

    const estimateMaterialsColl = Db.getEstimateMaterialItemsCollection();

    const materialItem = (await estimateMaterialsColl.findOne({_id: estimateMaterialItemId}))!;

    assertObject(materialItem, "Invalid material item");


    const result = await estimateMaterialsColl.deleteOne({ _id: estimateMaterialItemId});

    await updateEstimateCostById(materialItem.estimateId);

    respondJson(res, result);
});
