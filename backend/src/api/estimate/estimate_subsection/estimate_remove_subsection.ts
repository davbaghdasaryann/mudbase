import * as Db from '@/db';

import { registerHandlerSession } from '@/server/register';
import { respondJson, respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';


registerHandlerSession('estimate', 'remove_subsection', async (req, res, session) => {
    const estimateSubsectionId = requireMongoIdParam(req, 'estimateSubsectionId');

    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const subsection = (await subsectionsCol.findOne({ _id: estimateSubsectionId }))!;
    verify(subsection, 'Subsection not found');


    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();



    const laborItems = await laborItemsCol.find({ estimateSubsectionId })
        .project({ _id: 1 })
        .toArray();
    const laborItemIds = laborItems.map(item => item._id);

    if (laborItemIds.length > 0) {
        await materialItemsCol.deleteMany({ estimatedLaborId: { $in: laborItemIds } });
    }
    await laborItemsCol.deleteMany({ estimateSubsectionId });

    const result = await subsectionsCol.deleteOne({ _id: estimateSubsectionId });

    await updateEstimateCostById(subsection.estimateId);


    // const parentSectionId = subsectionDoc!.estimateSectionId;

    // const remainingSubsCursor = subsectionsCol.find({ estimateSectionId: parentSectionId });

    // let newParentTotalCost = 0;

    // for await (const subsec of remainingSubsCursor) {
    //     newParentTotalCost += subsec.totalCost || 0;
    // }

    // await sectionsCol.updateOne({ _id: parentSectionId }, { $set: { totalCost: newParentTotalCost } });

    respondJson(res, result);
});