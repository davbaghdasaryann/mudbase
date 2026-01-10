import * as Db from '@/db';

import { requireQueryParam } from '@/tsback/req/req_params';
import { registerHandlerSession } from '@/server/register';
import { respondJson } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';



registerHandlerSession('estimate', 'rename_subsection', async (req, res, session) => {
    let estimateSubsectionNewName = requireQueryParam(req, 'estimateSubsectionNewName');
    let estimateSubsectionId = requireMongoIdParam(req, 'estimateSubsectionId');

    estimateSubsectionNewName = estimateSubsectionNewName.trim();
    if (estimateSubsectionNewName === '') {
        verify(estimateSubsectionNewName, req.t('required.name'));
    }

    let estimateSubsections = Db.getEstimateSubsectionsCollection();


    let result = await estimateSubsections.updateOne(
        { _id: estimateSubsectionId },
        {
            $set: {
                name: estimateSubsectionNewName
            },
        }
    );



    respondJson(res, result);
});
