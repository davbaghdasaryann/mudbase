import {registerApiSession} from '@/server/register';
import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {Permissions} from '@src/tsmudbase/permissions_setup';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';

registerApiSession('estimate/unarchive', async (req, res, session) => {
    session.assertPermission(Permissions.EstimateEditInformation);

    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimates = Db.getEstimatesCollection();

    const estimate = await estimates.findOne({_id: estimateId});
    assertObject(estimate, `Estimate not found: ${estimateId}`);

    // Update the estimate to unarchived status
    await estimates.updateOne(
        {_id: estimateId},
        {
            $set: {
                archived: false,
            },
            $unset: {
                archivedAt: '',
            },
        }
    );

    const updatedEstimate = await estimates.findOne({_id: estimateId});

    respondJson(res, updatedEstimate);
});
