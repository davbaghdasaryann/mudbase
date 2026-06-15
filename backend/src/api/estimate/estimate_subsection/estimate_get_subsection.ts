import * as Db from '@/db';

import { registerApiSession } from '../../../server/register';
import { respondJsonData } from '../../../tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';



registerApiSession('estimate/fetch_subsections', async (req, res, session) => {
    let estimateSectionId = requireMongoIdParam(req, 'estimateSectionId');

    let estimateSubsectionsCol = Db.getEstimateSubsectionsCollection();
    // log_.info(estimateSectionId)

    let data = await estimateSubsectionsCol.find({estimateSectionId: estimateSectionId}).toArray();

    // log_.info('data', data)

    respondJsonData(res, data);
});

registerApiSession('estimate/fetch_all_subsections', async (req, res, session) => {
    let estimateId = requireMongoIdParam(req, 'estimateId');
    let estimateSubsectionsCol = Db.getEstimateSubsectionsCollection();
    let data = await estimateSubsectionsCol.find({estimateId: estimateId}).sort({displayIndex: 1}).toArray();
    respondJsonData(res, data);
});