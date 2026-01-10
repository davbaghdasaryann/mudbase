import * as Db from '@/db';

import { requireQueryParam } from '@/tsback/req/req_params';
import { registerApiSession } from '@/server/register';
import { respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';



registerApiSession('estimate/add_subsection', async (req, res, session) => {
    let estimateSubsectionName = requireQueryParam(req, 'estimateSubsectionName');
    let estimateSectionId = requireMongoIdParam(req, 'estimateSectionId');
    
    estimateSubsectionName = estimateSubsectionName.trim();
    if(estimateSubsectionName === ''){
        verify(estimateSubsectionName, req.t('required.name'));
    }

    // log_.info('estimateSubsectionName', estimateSubsectionName)

    let subsection: Db.EntityEstimateSubsection = {} as Db.EntityEstimateSubsection

    let estimateSectionsCol = Db.getEstimateSectionsCollection();
    let section = await estimateSectionsCol.findOne({ _id: estimateSectionId });

    section = assertObject(section, "Invalid section id")!;

    subsection.estimateSectionId = section._id;
    subsection.estimateId = section.estimateId;
    subsection.name = estimateSubsectionName;


   let estimateSubsectionsCol = Db.getEstimateSubsectionsCollection();

    let result = await estimateSubsectionsCol.insertOne(subsection);
    // log_.info('newEstimateSubSection',newEstimateSectionData)

    respondJsonData(res, subsection);
});
