import * as Db from '@/db';

import {registerApiSession} from '@/server/register';
import {respondJson, respondJsonData} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('estimate/remove_section', async (req, res, session) => {
    let estimateSectionId = requireMongoIdParam(req, 'estimateSectionId');

    const sectionsCol = Db.getEstimateSectionsCollection();

    const section = (await sectionsCol.findOne({_id: estimateSectionId}))!;
    assertObject(section, "Invalid Section");

    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    const subsections = await subsectionsCol.find({estimateSectionId: estimateSectionId}).toArray();

    for (let subsection of subsections) {
        const laborItems = await laborItemsCol
            .find({estimateSubsectionId: subsection._id})
            .toArray();

        for (let laborItem of laborItems) {
            await materialItemsCol.deleteMany({estimatedLaborId: laborItem._id});
            await laborItemsCol.deleteOne({_id: laborItem._id});
        }

        await subsectionsCol.deleteOne({_id: subsection._id});
    }

    const result = await sectionsCol.deleteOne({_id: estimateSectionId});

    await updateEstimateCostById(section.estimateId);

    respondJson(res, result);
});
