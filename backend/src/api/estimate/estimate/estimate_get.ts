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
                // Count distinct labor catalog items (by fullCode) across visible rows
                const laborAgg = await Db.getEstimateLaborItemsCollection().aggregate([
                    {$match: {estimateId, estimateSubsectionId: {$in: subsectionIds}, isHidden: {$ne: true}, laborItemId: {$exists: true}}},
                    {$lookup: {
                        from: 'labor_items',
                        localField: 'laborItemId',
                        foreignField: '_id',
                        as: 'catalogItem',
                    }},
                    {$unwind: {path: '$catalogItem', preserveNullAndEmptyArrays: false}},
                    {$group: {_id: '$catalogItem.fullCode'}},
                    {$count: 'total'},
                ]).toArray();
                estimate.laborItemCount = laborAgg[0]?.total ?? 0;

                // Get hidden labor _ids to exclude their materials
                const hiddenLabor = await Db.getEstimateLaborItemsCollection()
                    .find({estimateId, estimateSubsectionId: {$in: subsectionIds}, isHidden: true})
                    .project({_id: 1})
                    .toArray();
                const hiddenLaborIds = hiddenLabor.map(l => l._id as ObjectId);

                // Count distinct material catalog items (by fullCode) across visible rows
                const materialMatch: any = {estimateId, estimateSubsectionId: {$in: subsectionIds}, materialItemId: {$exists: true}};
                if (hiddenLaborIds.length > 0) {
                    materialMatch.estimatedLaborId = {$nin: hiddenLaborIds};
                }
                const materialAgg = await Db.getEstimateMaterialItemsCollection().aggregate([
                    {$match: materialMatch},
                    {$lookup: {
                        from: 'material_items',
                        localField: 'materialItemId',
                        foreignField: '_id',
                        as: 'catalogItem',
                    }},
                    {$unwind: {path: '$catalogItem', preserveNullAndEmptyArrays: false}},
                    {$group: {_id: '$catalogItem.fullCode'}},
                    {$count: 'total'},
                ]).toArray();
                estimate.materialItemCount = materialAgg[0]?.total ?? 0;

                // Compute Unit Time: sum(quantity / laborHours) for visible labor rows with laborHours > 0
                const visibleLaborRows = await Db.getEstimateLaborItemsCollection()
                    .find({estimateId, estimateSubsectionId: {$in: subsectionIds}, isHidden: {$ne: true}, laborItemId: {$exists: true}})
                    .project({quantity: 1, laborHours: 1})
                    .toArray();
                let unitTime = 0;
                for (const row of visibleLaborRows) {
                    const qty = (row as any).quantity ?? 0;
                    const hrs = (row as any).laborHours ?? 0;
                    if (hrs > 0) unitTime += qty / hrs;
                }
                estimate.unitTime = Math.round(unitTime * 100) / 100;
            } else {
                estimate.laborItemCount = 0;
                estimate.materialItemCount = 0;
                estimate.unitTime = 0;
            }
        } else {
            estimate.laborItemCount = 0;
            estimate.materialItemCount = 0;
            estimate.unitTime = 0;
        }
    }

    respondJson(res, estimate);
});
