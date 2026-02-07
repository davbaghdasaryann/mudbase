import { ObjectId } from 'mongodb';
import { registerApiSession, registerHandlerSession } from '@/server/register';

import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '@/tsback/req/req_params';
import { respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';


registerApiSession('eci/fetch_estimates', async (req, res, session) => {
    let subcategoryMongoIdReq = getReqParam(req, 'subcategoryMongoId');
    let searchVal = getReqParam(req, 'searchVal');

    const estimatesColl = Db.getEciEstimatesCollection();

    let matchQuery: any = {};

    if (subcategoryMongoIdReq) {
        const subcategoryMongoId = new ObjectId(subcategoryMongoIdReq);

        if (searchVal && searchVal !== '') {
            matchQuery = {
                $and: [
                    { subcategoryId: subcategoryMongoId },
                    {
                        $or: [
                            { fullCode: { $regex: searchVal, $options: 'i' } },
                            { name: { $regex: searchVal, $options: 'i' } },
                        ],
                    },
                ],
            };
        } else {
            matchQuery.subcategoryId = subcategoryMongoId;
        }
    } else if (searchVal && searchVal !== '') {
        matchQuery.$or = [
            { fullCode: { $regex: searchVal, $options: 'i' } },
            { name: { $regex: searchVal, $options: 'i' } },
        ];
    }

    const pipeline: any[] = [{ $match: matchQuery }];

    pipeline.push({ $sort: { code: 1 } });

    // Lookup measurement unit
    pipeline.push({
        $lookup: {
            from: 'measurement_unit',
            localField: 'measurementUnitMongoId',
            foreignField: '_id',
            as: 'measurementUnitData',
        },
    });

    // If each ECI estimate links to a real estimate, lookup the estimate's totalCost
    pipeline.push({
        $lookup: {
            from: 'estimates',
            localField: 'estimateId',
            foreignField: '_id',
            as: 'estimateData',
        },
    });

    // Calculate average price: totalCost / constructionArea, or just totalCost if no constructionArea
    pipeline.push({
        $addFields: {
            averagePrice: {
                $cond: {
                    if: { $gt: [{ $size: '$estimateData' }, 0] },
                    then: {
                        $cond: {
                            if: { $gt: ['$constructionArea', 0] },
                            then: {
                                $round: [{
                                    $divide: [
                                        { $arrayElemAt: ['$estimateData.totalCost', 0] },
                                        '$constructionArea'
                                    ]
                                }]
                            },
                            else: { $arrayElemAt: ['$estimateData.totalCost', 0] }
                        }
                    },
                    else: null
                }
            }
        }
    });

    pipeline.push({
        $project: {
            estimateData: 0,
        },
    });

    const data = await estimatesColl.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});


registerApiSession('eci/add_estimate', async (req, res, session) => {
    let subcategoryId = requireMongoIdParam(req, 'entityMongoId');
    let estimateName = requireQueryParam(req, 'entityName');
    let estimateCode = requireQueryParam(req, 'entityCode');
    let measurementUnitId = requireQueryParam(req, 'measurementUnitId');

    const measurementUnitCollection = Db.getMeasurementUnitCollection();
    const measurementUnit = await measurementUnitCollection.findOne({
        measurementUnitId: measurementUnitId,
    });
    verify(measurementUnit, 'Measurement Unit Not Found');

    let subcategoriesColl = Db.getEciSubcategoriesCollection();
    let parentSubcategory = await subcategoriesColl.findOne({ _id: subcategoryId });
    verify(parentSubcategory, req.t('error.subcategory_not_found'));

    let newEstimate: Db.EntityEciEstimates = {} as Db.EntityEciEstimates;
    newEstimate.code = estimateCode;
    newEstimate.name = estimateName;
    newEstimate.subcategoryCode = parentSubcategory!.categoryFullCode;
    newEstimate.fullCode = parentSubcategory!.categoryFullCode + estimateCode;
    newEstimate.subcategoryId = parentSubcategory!._id;
    newEstimate.measurementUnitMongoId = measurementUnit!._id;

    let estimatesColl = Db.getEciEstimatesCollection();

    const duplicateEstimate = await estimatesColl.findOne({
        subcategoryId: parentSubcategory!._id,
        code: estimateCode,
    });
    verify(!duplicateEstimate, req.t('error.duplicate_item'));

    const result = await estimatesColl.insertOne(newEstimate);

    respondJsonData(res, result);
});


registerApiSession('eci/update_estimate', async (req, res, session) => {
    const estimateItemId = requireMongoIdParam(req, 'entityMongoId');
    const estimateName = requireQueryParam(req, 'entityName');
    const estimateCode = requireQueryParam(req, 'entityCode');
    const measurementUnitId = requireQueryParam(req, 'measurementUnitId');

    const muColl = Db.getMeasurementUnitCollection();
    const measurementUnit = await muColl.findOne({ measurementUnitId });
    verify(measurementUnit, req.t('error.measurement_unit_not_found'));

    const estimatesColl = Db.getEciEstimatesCollection();
    const currentEstimate = await estimatesColl.findOne({ _id: estimateItemId });
    verify(currentEstimate, req.t('error.item_not_found'));

    const subcatColl = Db.getEciSubcategoriesCollection();
    const parentSubcat = await subcatColl.findOne({ _id: currentEstimate!.subcategoryId });
    verify(parentSubcat, req.t('error.subcategory_not_found'));

    const duplicate = await estimatesColl.findOne({
        subcategoryId: currentEstimate!.subcategoryId,
        _id: { $ne: estimateItemId },
        code: estimateCode,
    });
    verify(!duplicate, req.t('error.duplicate_item'));

    const newFullCode = parentSubcat!.categoryFullCode + estimateCode;

    await estimatesColl.updateOne(
        { _id: estimateItemId },
        {
            $set: {
                name: estimateName,
                code: estimateCode,
                fullCode: newFullCode,
                measurementUnitMongoId: measurementUnit!._id,
            },
        }
    );

    respondJsonData(res, { ok: true });
});


registerApiSession('eci/delete_estimate', async (req, res, session) => {
    const estimateItemId = requireMongoIdParam(req, 'entityMongoId');

    const estimatesColl = Db.getEciEstimatesCollection();
    const estimate = await estimatesColl.findOne({ _id: estimateItemId });
    verify(estimate, req.t('error.item_not_found'));

    const result = await estimatesColl.deleteOne({ _id: estimateItemId });

    respondJsonData(res, { ok: true, deletedCount: result.deletedCount });
});


// Superadmin: create a new estimate and link it to the ECI entry
registerApiSession('eci/create_linked_estimate', async (req, res, session) => {
    const eciEstimateId = requireMongoIdParam(req, 'eciEstimateId');

    const eciEstimatesColl = Db.getEciEstimatesCollection();
    const eciEstimate = await eciEstimatesColl.findOne({ _id: eciEstimateId });
    verify(eciEstimate, req.t('error.item_not_found'));

    // If already linked, return the existing estimate ID
    if (eciEstimate!.estimateId) {
        respondJsonData(res, {
            estimateId: eciEstimate!.estimateId,
            alreadyLinked: true,
        });
        return;
    }

    // Create a new blank estimate
    const estimatesCol = Db.getEstimatesCollection();
    const newEstimate: any = {
        name: eciEstimate!.name,
        createdByUserId: session.mongoUserId,
        accountId: session.mongoAccountId,
        createdAt: new Date(),
        estimateNumber: await Db.generateNewEstimateId(),
        isOriginal: true,
        totalCost: 0,
        totalCostWithOtherExpenses: 0,
        otherExpenses: [{ typeOfCost: 0 }],
    };

    const newEstimateResult = await estimatesCol.insertOne(newEstimate);
    const newEstimateId = newEstimateResult.insertedId;

    // Link the estimate to the ECI entry
    await eciEstimatesColl.updateOne(
        { _id: eciEstimateId },
        { $set: { estimateId: newEstimateId } }
    );

    respondJsonData(res, {
        estimateId: newEstimateId,
        estimateNumber: newEstimate.estimateNumber,
        alreadyLinked: false,
    });
});


// Regular user: copy an ECI estimate to their own account
registerApiSession('eci/copy_estimate', async (req, res, session) => {
    const eciEstimateId = requireMongoIdParam(req, 'eciEstimateId');

    const eciEstimatesColl = Db.getEciEstimatesCollection();
    const eciEstimate = await eciEstimatesColl.findOne({ _id: eciEstimateId });
    verify(eciEstimate, req.t('error.item_not_found'));

    const estimatesCol = Db.getEstimatesCollection();

    // If there's a linked estimate, duplicate it; otherwise create a blank estimate
    if (eciEstimate!.estimateId) {
        const sectionsCol = Db.getEstimateSectionsCollection();
        const subsectionsCol = Db.getEstimateSubsectionsCollection();
        const laborItemsCol = Db.getEstimateLaborItemsCollection();
        const materialItemsCol = Db.getEstimateMaterialItemsCollection();

        const originalEstimate = await estimatesCol.findOne({ _id: eciEstimate!.estimateId });
        verify(originalEstimate, req.t('error.estimate_not_found'));

        const newEstimate: any = {
            name: `${eciEstimate!.name} (ECI Copy)`,
            address: originalEstimate!.address,
            constructionType: originalEstimate!.constructionType,
            buildingType: originalEstimate!.buildingType,
            constructionSurface: originalEstimate!.constructionSurface,
            builtUpArea: originalEstimate!.builtUpArea,
            createdByUserId: session.mongoUserId,
            accountId: session.mongoAccountId,
            createdAt: new Date(),
            estimateNumber: await Db.generateNewEstimateId(),
            isOriginal: true,
            totalCost: originalEstimate!.totalCost,
            totalCostWithOtherExpenses: originalEstimate!.totalCostWithOtherExpenses,
            otherExpenses: originalEstimate!.otherExpenses ? [...originalEstimate!.otherExpenses] : [{ typeOfCost: 0 }],
        };

        const newEstimateResult = await estimatesCol.insertOne(newEstimate);
        const newEstimateId = newEstimateResult.insertedId;

        // Copy sections, subsections, labor items, material items
        const sections = await sectionsCol.find({ estimateId: eciEstimate!.estimateId }).toArray();
        for (const section of sections) {
            const newSection: any = {
                estimateId: newEstimateId,
                name: section.name,
                displayIndex: section.displayIndex,
                totalCost: section.totalCost,
            };
            const newSectionResult = await sectionsCol.insertOne(newSection);
            const newSectionId = newSectionResult.insertedId;

            const subsections = await subsectionsCol.find({ estimateSectionId: section._id }).toArray();
            for (const subsection of subsections) {
                const newSubsection: any = {
                    estimateSectionId: newSectionId,
                    estimateId: newEstimateId,
                    name: subsection.name,
                    displayIndex: subsection.displayIndex,
                    totalCost: subsection.totalCost,
                };
                const newSubsectionResult = await subsectionsCol.insertOne(newSubsection);
                const newSubsectionId = newSubsectionResult.insertedId;

                const laborItems = await laborItemsCol.find({ estimateSubsectionId: subsection._id }).toArray();
                for (const laborItem of laborItems) {
                    const newLaborItem: any = {
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

                    const materialItems = await materialItemsCol.find({ estimatedLaborId: laborItem._id }).toArray();
                    for (const materialItem of materialItems) {
                        await materialItemsCol.insertOne({
                            estimateSubsectionId: newSubsectionId,
                            estimateId: newEstimateId,
                            estimatedLaborId: newLaborItemId,
                            materialItemId: materialItem.materialItemId,
                            quantity: materialItem.quantity,
                            changableAveragePrice: materialItem.changableAveragePrice,
                        });
                    }
                }
            }
        }

        respondJsonData(res, {
            estimateNumber: newEstimate.estimateNumber,
            estimateId: newEstimateId,
        });
    } else {
        // No linked estimate - create a new blank estimate
        const newEstimate: any = {
            name: `${eciEstimate!.name} (ECI)`,
            createdByUserId: session.mongoUserId,
            accountId: session.mongoAccountId,
            createdAt: new Date(),
            estimateNumber: await Db.generateNewEstimateId(),
            isOriginal: true,
            totalCost: 0,
            totalCostWithOtherExpenses: 0,
            otherExpenses: [{ typeOfCost: 0 }],
        };

        const newEstimateResult = await estimatesCol.insertOne(newEstimate);

        respondJsonData(res, {
            estimateNumber: newEstimate.estimateNumber,
            estimateId: newEstimateResult.insertedId,
        });
    }
});
