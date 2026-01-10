import * as Db from '@/db';

import {registerApiSession} from '@/server/register';
import {respondJson} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/fetch_sections', async (req, res, session) => {
    let estimateId = requireMongoIdParam(req, 'estimateId');

    let estimateSections = Db.getEstimateSectionsCollection();

    let data = await estimateSections.find({estimateId: estimateId}).toArray();

    respondJson(res, data);
});
