import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/add_section', async (req, res, session) => {
    let estimateId = requireMongoIdParam(req, 'estimateId');
    let estimateSectionName = requireQueryParam(req, 'estimateSectionName');

    estimateSectionName = estimateSectionName.trim();
    if (estimateSectionName === '') {
        verify(estimateSectionName, req.t('required.name'));
    }

    let newEstimateSection: Db.EntityEstimateSection = {} as Db.EntityEstimateSection;

    let estimates = Db.getEstimatesCollection();
    let estimateData = await estimates.findOne({_id: estimateId});
    if (estimateData) {
        newEstimateSection.estimateId = estimateData._id;
        newEstimateSection.name = estimateSectionName;
    }

    let estimateSections = Db.getEstimateSectionsCollection();

    let newEstimateSectionData = await estimateSections.insertOne(newEstimateSection);

    respondJsonData(res, newEstimateSectionData);
});
