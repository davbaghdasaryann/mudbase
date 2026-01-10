import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/get', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimatesColl = Db.getEstimatesCollection();

    const estimate = await estimatesColl.findOne({_id: estimateId});

    // log_.info('currentEstimateData', currentEstimateData)

    respondJson(res, estimate);
});
