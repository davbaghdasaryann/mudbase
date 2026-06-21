import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/get', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimatesColl = Db.getEstimatesCollection();
    const estimate = await estimatesColl.findOne({_id: estimateId});

    if (estimate) {
        const sections = await Db.getEstimateSectionsCollection()
            .find({estimateId})
            .project({_id: 1})
            .toArray();
        const sectionIds = sections.map(s => s._id);

        if (sectionIds.length > 0) {
            const subsections = await Db.getEstimateSubsectionsCollection()
                .find({estimateSectionId: {$in: sectionIds}, estimateId})
                .project({_id: 1})
                .toArray();
            const subsectionIds = subsections.map(s => s._id);

            if (subsectionIds.length > 0) {
                const allLaborItems = await Db.getEstimateLaborItemsCollection()
                    .find({estimateId, estimateSubsectionId: {$in: subsectionIds}})
                    .project({_id: 1, laborItemId: 1, isHidden: 1})
                    .toArray();

                const hiddenLaborObjectIds = allLaborItems
                    .filter(l => l.isHidden)
                    .map(l => l._id as ObjectId);

                estimate.laborItemCount = new Set(
                    allLaborItems
                        .filter(l => !l.isHidden && l.laborItemId)
                        .map(l => l.laborItemId.toString())
                ).size;

                const materialQuery: any = {estimateId, estimateSubsectionId: {$in: subsectionIds}};
                if (hiddenLaborObjectIds.length > 0) {
                    materialQuery.estimatedLaborId = {$nin: hiddenLaborObjectIds};
                }

                const materialItems = await Db.getEstimateMaterialItemsCollection()
                    .find(materialQuery)
                    .project({materialItemId: 1})
                    .toArray();

                estimate.materialItemCount = new Set(
                    materialItems
                        .filter(m => m.materialItemId)
                        .map(m => m.materialItemId.toString())
                ).size;
            } else {
                estimate.laborItemCount = 0;
                estimate.materialItemCount = 0;
            }
        } else {
            estimate.laborItemCount = 0;
            estimate.materialItemCount = 0;
        }
    }

    respondJson(res, estimate);
});
