import {ObjectId} from 'mongodb';

import * as Db from '@/db';

import {registerApiSession} from '@/server/register';
import {respondJson} from '@/tsback/req/req_response';
import {assertObject} from '@/tslib/assert';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/delete', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimates = Db.getEstimatesCollection();

    const estimate = await estimates.findOne({_id: estimateId});
    assertObject(estimate, `Estimate not found: ${estimateId}`);

    const estimateNumber = estimate!.estimateNumber;

    const relatedEstimates = await estimates.find({estimateNumber}).toArray();


    for (let relEst of relatedEstimates) {
        await deleteEstimateFromDatabase(relEst);
        // const relatedEstimateId = sharesCol.findOne({_id: relEst.sharedEstimateId});
    }



    const sharesCol = Db.getEstimatesSharesCollection();
    await sharesCol.deleteMany({estimateNumber: estimateNumber});


/*
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();



    for (let relEst of relatedEstimates) {
        await sharesCol.updateMany(
            {sharedEstimateId: relEst._id},
            {$set: {deleted: true, deletedAt: new Date()}}
        );

        const sections = await sectionsCol.find({estimateId: relEst._id}).toArray();
        for (let section of sections) {
            const subsections = await subsectionsCol
                .find({estimateSectionId: section._id})
                .toArray();
            for (let subsection of subsections) {
                const laborItems = await laborItemsCol
                    .find({estimateSubsectionId: subsection._id})
                    .toArray();
                for (let laborItem of laborItems) {
                    await materialItemsCol.updateMany(
                        {estimatedLaborId: laborItem._id},
                        {$set: {deleted: true, deletedAt: new Date()}}
                    );
                    await laborItemsCol.updateOne(
                        {_id: laborItem._id},
                        {$set: {deleted: true, deletedAt: new Date()}}
                    );
                }
                await subsectionsCol.updateOne(
                    {_id: subsection._id},
                    {$set: {deleted: true, deletedAt: new Date()}}
                );
            }
            await sectionsCol.updateOne(
                {_id: section._id},
                {$set: {deleted: true, deletedAt: new Date()}}
            );
        }

        await estimates.updateOne(
            {_id: relEst._id},
            {$set: {deleted: true, deletedAt: new Date()}}
        );
    }
*/

    respondJson(res, {ok: true});
});


export async function deleteEstimateFromDatabaseById(estimateId: string) {
    const estimates = Db.getEstimatesCollection();

    const estimate = await estimates.findOne({_id: new ObjectId(estimateId)});

    assertObject(estimate, `Invalid Estimate Id: ${estimateId}`);


    await deleteEstimateFromDatabase(estimate!);
}

export async function deleteEstimateFromDatabase(estimate: Db.EntityEstimate) {
    const estimatesCol = Db.getEstimatesCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    // Sections → Subsections → Labor Items → Material Items
    const sections = await sectionsCol.find({estimateId: estimate._id}).toArray();

    for (const section of sections) {
        const subsections = await subsectionsCol.find({estimateSectionId: section._id}).toArray();
        for (const subsection of subsections) {
            const laborItems = await laborItemsCol
                .find({estimateSubsectionId: subsection._id})
                .toArray();
            for (const laborItem of laborItems) {
                await materialItemsCol.deleteMany({estimatedLaborId: laborItem._id});
                await laborItemsCol.deleteOne({_id: laborItem._id});
            }
            await subsectionsCol.deleteOne({_id: subsection._id});
        }
        await sectionsCol.deleteOne({_id: section._id});
    }

    await estimatesCol.deleteOne({_id: estimate._id});
}
