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
    const sectionsColl = Db.getEstimateSectionsCollection();
    const sections = await sectionsColl.find({estimateId}).project({_id: 1}).toArray();
    const sectionIds = sections.map(s => s._id);
    if (sectionIds.length === 0) { respondJsonData(res, []); return; }
    let estimateSubsectionsCol = Db.getEstimateSubsectionsCollection();
    let data = await estimateSubsectionsCol.find({estimateSectionId: {$in: sectionIds}}).sort({displayIndex: 1}).toArray();
    respondJsonData(res, data);
});