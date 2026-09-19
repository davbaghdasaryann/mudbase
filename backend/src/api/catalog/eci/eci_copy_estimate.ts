import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {Permissions} from '@/tsmudbase/permissions_setup';

registerApiSession('eci/copy_estimate_to_eci', async (req, res, session) => {
    session.assertPermission(Permissions.CatalogsEdit);

    const estimateId = requireMongoIdParam(req, 'estimateId');
    const subcategoryId = requireMongoIdParam(req, 'subcategoryId');
    const buildingType = requireQueryParam(req, 'buildingType');

    // Verify the estimate exists
    const estimatesColl = Db.getEstimatesCollection();
    const sourceEstimate = await estimatesColl.findOne({_id: estimateId});
    verify(sourceEstimate, req.t('error.estimate_not_found'));

    // Verify the subcategory exists
    const subcategoriesColl = Db.getEciSubcategoriesCollection();
    const targetSubcategory = await subcategoriesColl.findOne({_id: subcategoryId});
    verify(targetSubcategory, req.t('error.subcategory_not_found'));

    // Get measurement unit (optional - default to square meter if available)
    const measurementUnitCollection = Db.getMeasurementUnitCollection();
    const defaultMeasurementUnit = await measurementUnitCollection.findOne({
        measurementUnitId: 'mSquare',
    });

    // Generate a new code for the ECI estimate
    const eciEstimatesColl = Db.getEciEstimatesCollection();

    // Find the highest code in this subcategory
    const existingEstimates = await eciEstimatesColl
        .find({subcategoryId: subcategoryId})
        .sort({code: -1})
        .limit(1)
        .toArray();

    let newCode = '01';
    if (existingEstimates.length > 0 && existingEstimates[0].code) {
        const lastCode = parseInt(existingEstimates[0].code);
        if (!isNaN(lastCode)) {
            newCode = String(lastCode + 1).padStart(2, '0');
        }
    }

    // Deep-copy the source estimate so the ECI entry is independent
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    const copiedEstimate: any = {
        name: sourceEstimate!.name,
        address: sourceEstimate!.address,
        constructionType: sourceEstimate!.constructionType,
        buildingType: sourceEstimate!.buildingType,
        constructionSurface: sourceEstimate!.constructionSurface,
        builtUpArea: sourceEstimate!.builtUpArea,
        createdByUserId: session.mongoUserId,
        accountId: session.mongoAccountId,
        createdAt: new Date(),
        estimateNumber: await Db.generateNewEstimateId(),
        isOriginal: true,
        totalCost: sourceEstimate!.totalCost,
        totalCostWithOtherExpenses: sourceEstimate!.totalCostWithOtherExpenses,
        laborTotalCost: sourceEstimate!.laborTotalCost,
        materialTotalCost: sourceEstimate!.materialTotalCost,
        laborItemCount: sourceEstimate!.laborItemCount,
        materialItemCount: sourceEstimate!.materialItemCount,
        otherExpenses: sourceEstimate!.otherExpenses ? [...sourceEstimate!.otherExpenses] : [{typeOfCost: 0}],
    };

    const copiedEstimateResult = await estimatesColl.insertOne(copiedEstimate);
    const copiedEstimateId = copiedEstimateResult.insertedId;

    // Copy sections → subsections → labor items → material items (prices frozen at copy time)
    const sections = await sectionsCol.find({estimateId}).toArray();
    for (const section of sections) {
        const newSection: any = {
            estimateId: copiedEstimateId,
            name: section.name,
            displayIndex: section.displayIndex,
            totalCost: section.totalCost,
        };
        const newSectionResult = await sectionsCol.insertOne(newSection);
        const newSectionId = newSectionResult.insertedId;

        const subsections = await subsectionsCol.find({estimateSectionId: section._id}).toArray();
        for (const subsection of subsections) {
            const newSubsection: any = {
                estimateSectionId: newSectionId,
                estimateId: copiedEstimateId,
                name: subsection.name,
                displayIndex: subsection.displayIndex,
                totalCost: subsection.totalCost,
            };
            const newSubsectionResult = await subsectionsCol.insertOne(newSubsection);
            const newSubsectionId = newSubsectionResult.insertedId;

            const laborItems = await laborItemsCol.find({estimateSubsectionId: subsection._id}).toArray();
            for (const laborItem of laborItems) {
                const newLaborItem: any = {
                    estimateSubsectionId: newSubsectionId,
                    estimateId: copiedEstimateId,
                    laborItemId: laborItem.laborItemId,
                    laborOfferId: laborItem.laborOfferId,
                    measurementUnitMongoId: laborItem.measurementUnitMongoId,
                    quantity: laborItem.quantity,
                    averagePrice: laborItem.averagePrice,
                    changableAveragePrice: laborItem.changableAveragePrice,
                    laborOfferItemName: laborItem.laborOfferItemName,
                    laborHours: laborItem.laborHours,
                    isHidden: laborItem.isHidden,
                    displayIndex: laborItem.displayIndex,
                    priceSource: laborItem.priceSource,
                };
                const newLaborItemResult = await laborItemsCol.insertOne(newLaborItem);
                const newLaborItemId = newLaborItemResult.insertedId;

                const materialItems = await materialItemsCol.find({estimatedLaborId: laborItem._id}).toArray();
                for (const materialItem of materialItems) {
                    await materialItemsCol.insertOne({
                        estimateSubsectionId: newSubsectionId,
                        estimateId: copiedEstimateId,
                        estimatedLaborId: newLaborItemId,
                        materialItemId: materialItem.materialItemId,
                        materialOfferId: materialItem.materialOfferId,
                        measurementUnitMongoId: materialItem.measurementUnitMongoId,
                        quantity: materialItem.quantity,
                        averagePrice: materialItem.averagePrice,
                        changableAveragePrice: materialItem.changableAveragePrice,
                        materialOfferItemName: materialItem.materialOfferItemName,
                        materialConsumptionNorm: materialItem.materialConsumptionNorm,
                    });
                }
            }
        }
    }

    // Create the new ECI estimate entry pointing to the independent copy
    const constructionArea = parseFloat(sourceEstimate!.constructionSurface) || 0;

    const newEciEstimate: any = {
        code: newCode,
        name: sourceEstimate!.name,
        subcategoryCode: targetSubcategory!.categoryFullCode,
        fullCode: targetSubcategory!.categoryFullCode + newCode,
        subcategoryId: targetSubcategory!._id,
        estimateId: copiedEstimateId,
        buildingType: buildingType,
        constructionArea: constructionArea,
    };

    // Only add measurement unit if found
    if (defaultMeasurementUnit) {
        newEciEstimate.measurementUnitMongoId = defaultMeasurementUnit._id;
    }

    const result = await eciEstimatesColl.insertOne(newEciEstimate);

    respondJsonData(res, {
        ok: true,
        eciEstimateId: result.insertedId,
        fullCode: newEciEstimate.fullCode,
    });
});
