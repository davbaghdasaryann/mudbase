import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';
import * as Db from '@/db';

import {respondJsonData} from '@/tsback/req/req_response';
import {Permissions} from '@src/tsmudbase/permissions_setup';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';

registerApiSession('estimate/duplicate', async (req, res, session) => {
    session.assertPermission(Permissions.EstimateCreate);

    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimatesCol = Db.getEstimatesCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    // Get the original estimate
    const originalEstimate = await estimatesCol.findOne({_id: estimateId});
    assertObject(originalEstimate, `Estimate not found: ${estimateId}`);

    // Create new estimate with copied data
    const newEstimate: Partial<Db.EntityEstimate> = {
        name: `${originalEstimate.name} (Copy)`,
        address: originalEstimate.address,
        constructionType: originalEstimate.constructionType,
        buildingType: originalEstimate.buildingType,
        constructionSurface: originalEstimate.constructionSurface,
        builtUpArea: originalEstimate.builtUpArea,
        createdByUserId: session.mongoUserId,
        accountId: session.mongoAccountId,
        createdAt: new Date(),
        estimateNumber: await Db.generateNewEstimateId(),
        isOriginal: true,
        totalCost: originalEstimate.totalCost,
        totalCostWithOtherExpenses: originalEstimate.totalCostWithOtherExpenses,
        otherExpenses: originalEstimate.otherExpenses ? [...originalEstimate.otherExpenses] : [{typeOfCost: 0}],
    };

    const newEstimateResult = await estimatesCol.insertOne(newEstimate);
    const newEstimateId = newEstimateResult.insertedId;

    // Copy all sections
    const sections = await sectionsCol.find({estimateId: estimateId}).toArray();
    for (const section of sections) {
        const newSection: Partial<Db.EntityEstimateSection> = {
            estimateId: newEstimateId,
            name: section.name,
            displayIndex: section.displayIndex,
            totalCost: section.totalCost,
        };
        const newSectionResult = await sectionsCol.insertOne(newSection);
        const newSectionId = newSectionResult.insertedId;

        // Copy all subsections for this section
        const subsections = await subsectionsCol.find({estimateSectionId: section._id}).toArray();
        for (const subsection of subsections) {
            const newSubsection: Partial<Db.EntityEstimateSubsection> = {
                estimateSectionId: newSectionId,
                estimateId: newEstimateId,
                name: subsection.name,
                displayIndex: subsection.displayIndex,
                totalCost: subsection.totalCost,
            };
            const newSubsectionResult = await subsectionsCol.insertOne(newSubsection);
            const newSubsectionId = newSubsectionResult.insertedId;

            // Copy all labor items for this subsection
            const laborItems = await laborItemsCol.find({estimateSubsectionId: subsection._id}).toArray();
            for (const laborItem of laborItems) {
                const newLaborItem: Partial<Db.EntityEstimateLaborItem> = {
                    estimateSubsectionId: newSubsectionId,
                    estimateId: newEstimateId,
                    laborItemId: laborItem.laborItemId,
                    quantity: laborItem.quantity,
                    changableAveragePrice: laborItem.changableAveragePrice,
                    isHidden: laborItem.isHidden,
                    displayIndex: laborItem.displayIndex,
                    priceSource: laborItem.priceSource,
                };
                const newLaborItemResult = await laborItemsCol.insertOne(newLaborItem);
                const newLaborItemId = newLaborItemResult.insertedId;

                // Copy all material items for this labor item
                const materialItems = await materialItemsCol.find({estimatedLaborId: laborItem._id}).toArray();
                for (const materialItem of materialItems) {
                    const newMaterialItem: Partial<Db.EntityEstimateMaterialItems> = {
                        estimateSubsectionId: newSubsectionId,
                        estimateId: newEstimateId,
                        estimatedLaborId: newLaborItemId,
                        materialItemId: materialItem.materialItemId,
                        quantity: materialItem.quantity,
                        changableAveragePrice: materialItem.changableAveragePrice,
                    };
                    await materialItemsCol.insertOne(newMaterialItem);
                }
            }
        }
    }

    respondJsonData(res, {
        estimateNumber: newEstimate.estimateNumber,
        estimateId: newEstimateId,
    });
});
