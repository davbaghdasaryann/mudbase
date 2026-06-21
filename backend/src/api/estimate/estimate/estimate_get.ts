import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/get', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimatesColl = Db.getEstimatesCollection();
    const estimate = await estimatesColl.findOne({_id: estimateId});

    if (estimate) {
        const laborCol = Db.getEstimateLaborItemsCollection();
        const materialCol = Db.getEstimateMaterialItemsCollection();

        const laborItems = await laborCol.find({estimateId}).toArray();
        const hiddenLaborIds = new Set(laborItems.filter(l => l.isHidden).map(l => l._id.toString()));

        const visibleLabor = laborItems.filter(l => !l.isHidden && l.laborItemId);
        estimate.laborItemCount = new Set(visibleLabor.map(l => l.laborItemId.toString())).size;

        const materialItems = await materialCol.find({estimateId}).toArray();
        const visibleMaterials = materialItems.filter(m => !hiddenLaborIds.has(m.estimatedLaborId.toString()) && m.materialItemId);
        estimate.materialItemCount = new Set(visibleMaterials.map(m => m.materialItemId.toString())).size;
    }

    respondJson(res, estimate);
});
