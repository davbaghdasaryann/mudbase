import { registerApiSession } from '@/server/register';
import * as Db from '@/db';

import { requireQueryParam } from '@/tsback/req/req_params';
import { respondJson } from '@/tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';



registerApiSession('estimate/rename', async (req, res, session) => {
    session.assertPermission(Permissions.EstimateEditInformation);

    // let estimateNumber = Number(requireQueryParam(req, 'estimateNumber'));
    let estimateId = requireMongoIdParam(req, 'estimateId');
    let fieldKey = requireQueryParam(req, 'fieldKey');
    let fieldValue = requireQueryParam(req, 'fieldValue');

    // log_.info('fieldKey: ', fieldKey, "fieldValue: ", fieldValue)

    let estimates = Db.getEstimatesCollection();

    if (fieldKey && fieldValue) {
        let result = await estimates.updateOne(
            { _id: estimateId },
            {
                $set: {
                    [fieldKey]: fieldValue,
                },
            }
        );
    }

    let currentEstimateData = await estimates.findOne({ _id: estimateId });


    // respondJson(res, 'renamed');
    respondJson(res, currentEstimateData);
});
