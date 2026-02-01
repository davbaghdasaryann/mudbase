import { registerApiSession } from '@/server/register';

import * as Db from '@/db';

import { respondJson, respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/fetch_labor_items', async (req, res, session) => {
    let estimateSubsectionId = requireMongoIdParam(req, 'estimateSubsectionId');

    // log_.info('estimateSubsectionId: fetch_labor_items', estimateSubsectionId);

    let estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();

    let pipeline: any[] = [
        {
            $match: {
                estimateSubsectionId: estimateSubsectionId,
            },
        },
        {
            $lookup: {
                from: 'labor_items',
                let: { itemIdVar: '$laborItemId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$itemIdVar'], // Join on _id === itemId
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'labor_subcategories',
                            localField: 'subcategoryId',
                            foreignField: '_id',
                            as: 'subcat',
                        },
                    },
                    {
                        $unwind: { path: '$subcat', preserveNullAndEmptyArrays: true },
                    },
                    {
                        $lookup: {
                            from: 'labor_categories',
                            localField: 'subcat.categoryId',
                            foreignField: '_id',
                            as: 'cat',
                        },
                    },
                    {
                        $unwind: { path: '$cat', preserveNullAndEmptyArrays: true },
                    },
                    {
                        $project: {
                            fullCode: 1,
                            name: 1,
                            averagePrice: 1,
                            categoryName: '$cat.name',
                            subcategoryName: '$subcat.name',
                            _id: 0,
                        },
                    },
                ],
                as: 'estimateLaborItemData',
            },
        },
        {
            $match: {
                estimateLaborItemData: { $ne: [] }, // Keep only items with valid labor item data
            },
        },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'estimateMeasurementUnitData',
            },
        },
        {
            $lookup: {
                from: 'estimate_material_items',
                let: { estimatedLaborMongoIdVar: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$estimatedLaborId', '$$estimatedLaborMongoIdVar'], // Join on _id === itemId
                            },
                        },
                    },
                    // {
                    //     $project: {
                    //         fullCode: 1,
                    //         name: 1,
                    //         _id: 0 // Optional: Exclude _id if you don't need it
                    //     },
                    // },
                ],
                as: 'estimateMaterialItemData',
            },
        },
        {
            $lookup: {
                from: 'material_offers',
                let: {
                    materialOfferIdVar: {
                        $arrayElemAt: ['$estimateMaterialItemData.materialOfferId', 0], // Access the accountId from the first element in the array
                    },
                },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$materialOfferIdVar'] },
                        },
                    },
                    {
                        $project: { price: 1 },
                    },
                ],
                as: 'estimateMaterialOfferData',
            },
        },
        {
            $lookup: {
                from: 'labor_offers',
                localField: 'laborItemId', // 🔹 Ensure this field exists in your main collection
                foreignField: 'itemId', // 🔹 Ensure this field exists in `labor_offers`
                as: 'laborOfferData',
            },
        },
        {
            $addFields: {
                laborOfferData: { $ifNull: ['$laborOfferData', []] }, // 🔹 Ensure it's always an array
            },
        },
        {
            $addFields: {
                filteredOffers: {
                    $filter: {
                        input: '$laborOfferData', // 🔹 Use correct reference
                        as: 'offer',
                        cond: { $eq: ['$$offer.isArchived', false] }, // ✅ Correct reference inside $filter
                    },
                },
            },
        },
        {
            $addFields: {
                presentLaborOfferAveragePrice: {
                    $cond: {
                        if: { $gt: [{ $size: '$filteredOffers' }, 0] },
                        then: { $avg: '$filteredOffers.price' }, // ✅ Uses only non-archived offers
                        else: null,
                    },
                },
            },
        },
        {
            $project: {
                // laborOfferData: 0, // 🔹 Hide full lookup data
                filteredOffers: 0, // 🔹 Hide filtered offers if not needed
            },
        },
    ];

    const data = await estimateLaborItemsColl.aggregate(pipeline).toArray();



    /*
    // log_.info('data', data);

    let sectionTotalCost: number = 0;
    let laborTotalWithoutMaterial: number = 0;
    let materialTotalCost: number = 0;

    for (let estimatedLaborWithMaterials of data) {
        let labor = estimatedLaborWithMaterials;
        if (labor.quantity && labor.changableAveragePrice) {
            laborTotalWithoutMaterial += labor.quantity * labor.changableAveragePrice;
        }

        if (labor.estimateMaterialItemData?.length > 0) {
            for (const material of labor.estimateMaterialItemData as Db.EntityEstimateMaterialItems[]) {
                materialTotalCost += material.quantity * material.changableAveragePrice;
            }
        }
    }


    // log_.info('laborTotalWithoutMaterial', laborTotalWithoutMaterial);

    if (!isNaN(laborTotalWithoutMaterial)) {
        //Subsection total price calculatiing
        sectionTotalCost = laborTotalWithoutMaterial + materialTotalCost;
        let estimateSubsections = Db.getEstimateSubsectionsCollection();
        await estimateSubsections.updateOne(
            {_id: estimateSubsectionId},
            {$set: {totalCost: sectionTotalCost}}
        );
        //

        // log_.info('sectionTotalCost', sectionTotalCost);

        //Section total price calculatiing
        let currentEstimateSubSection = await estimateSubsections.findOne({
            _id: estimateSubsectionId,
        });
        // log_.info('currentEstimateSubSection', currentEstimateSubSection);

        let estimateSections = Db.getEstimateSectionsCollection();
        let estimateSection = await estimateSections.findOne({
            _id: currentEstimateSubSection?.estimateSectionId,
        });

        const subsectionsData = await estimateSubsections.find({estimateSectionId: estimateSection?._id}).toArray();

        let subsectionsTotalCost: number = 0;

        for (let subsec of subsectionsData) {
            if (subsec.totalCost) subsectionsTotalCost += subsec.totalCost;
        }

        if (subsectionsTotalCost > 0) {
            await estimateSections.updateOne(
                {_id: currentEstimateSubSection?.estimateSectionId},
                {$set: {totalCost: subsectionsTotalCost}}
            );
        }
        //

        //Estimate total price calculatiing
        let estimates = Db.getEstimatesCollection();
        let currentEstimateSection = await estimateSections.findOne({
            _id: currentEstimateSubSection?.estimateSectionId,
        });
        const sectionsData = await estimateSections
            .find({estimateId: currentEstimateSection?.estimateId})
            .toArray();

        let sectionsTotalCost: number = 0;
        for (let sec of sectionsData) {
            if (sec.totalCost) sectionsTotalCost += sec.totalCost;
        }

        if (sectionsTotalCost > 0) {
            // await estimates.updateOne({ _id: currentEstimateSection?.estimateId }, { $set: { totalCost: sectionsTotalCost } })

            // Update the estimate's totalCost using sectionsTotalCost
            await estimates.updateOne(
                {_id: currentEstimateSection?.estimateId},
                {$set: {totalCost: sectionsTotalCost}}
            );

            // Fetch the updated estimate document
            const estimate = await estimates.findOne({_id: currentEstimateSection?.estimateId});
            verify(estimate, 'Estimate not found');

            // Calculate the sum of all otherExpenses values.
            let otherExpensesSum = 0;
            if (Array.isArray(estimate?.otherExpenses)) {
                for (const expense of estimate.otherExpenses) {
                    const keys = Object.keys(expense);
                    if (keys.length > 0) {
                        const expenseValue = Number(expense[keys[0]]) || 0;
                        otherExpensesSum += expenseValue;
                    }
                }
            }

            // Compute totalCostWithOtherExpenses: totalCost multiplied by the sum of otherExpenses divided by 100.
            const totalCost = estimate?.totalCost ?? 0;
            const totalCostWithOtherExpenses = totalCost + totalCost * (otherExpensesSum / 100);

            // Update the estimate document with totalCostWithOtherExpenses.
            await estimates.updateOne(
                {_id: currentEstimateSection?.estimateId},
                {$set: {totalCostWithOtherExpenses}}
            );
        }
        //
    }
        */

    respondJsonData(res, data);
});

/** Single-call endpoint for Works List dialog: all labor items for an estimate with minimal lookups. */
registerApiSession('estimate/fetch_works_list', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimateSectionsColl = Db.getEstimateSectionsCollection();
    const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();

    const sections = await estimateSectionsColl.find({ estimateId }).project({ _id: 1 }).toArray();
    const sectionIds = sections.map((s) => s._id);
    if (sectionIds.length === 0) {
        respondJsonData(res, []);
        return;
    }

    const subsections = await estimateSubsectionsColl
        .find({ estimateSectionId: { $in: sectionIds } })
        .project({ _id: 1 })
        .toArray();
    const subsectionIds = subsections.map((s) => s._id);
    if (subsectionIds.length === 0) {
        respondJsonData(res, []);
        return;
    }

    const pipeline: any[] = [
        { $match: { estimateSubsectionId: { $in: subsectionIds } } },
        {
            $lookup: {
                from: 'labor_items',
                let: { itemIdVar: '$laborItemId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$itemIdVar'] } } },
                    { $lookup: { from: 'labor_subcategories', localField: 'subcategoryId', foreignField: '_id', as: 'subcat' } },
                    { $unwind: { path: '$subcat', preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: 'labor_categories', localField: 'subcat.categoryId', foreignField: '_id', as: 'cat' } },
                    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
                    { $project: { fullCode: 1, name: 1, averagePrice: 1, categoryName: '$cat.name', subcategoryName: '$subcat.name', _id: 0 } },
                ],
                as: 'estimateLaborItemData',
            },
        },
        { $match: { estimateLaborItemData: { $ne: [] } } },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'estimateMeasurementUnitData',
            },
        },
    ];

    const data = await estimateLaborItemsColl.aggregate(pipeline).toArray();
    respondJsonData(res, data);
});

registerApiSession('estimate/get_labor_item', async (req, res, session) => {
    let estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');

    let estimatedLaborColl = Db.getEstimateLaborItemsCollection();

    let estimatedLaborItem = await estimatedLaborColl.findOne({ _id: estimatedLaborId });

    // log_.info('estimatedLaborItem', estimatedLaborItem);

    respondJsonData(res, estimatedLaborItem);
});

registerApiSession('estimate/get_labor_item_for_view', async (req, res, session) => {
    let estimatedLaborId = requireMongoIdParam(req, 'estimatedItemId');

    let estimatedLaborCollection = Db.getEstimateLaborItemsCollection();
    let estimatedLaborItem = await estimatedLaborCollection.findOne({ _id: estimatedLaborId });

    verify(estimatedLaborItem, 'Estimated labor item not found');

    let laborItemId = estimatedLaborItem!.laborItemId;

    verify(laborItemId, 'Labor Item ID not found in estimated labor item');

    let laborItemsColl = Db.getLaborItemsCollection();
    let laborItem = await laborItemsColl.findOne({ _id: laborItemId }, { projection: { name: 1, averagePrice: 1 } });

    respondJson(res, laborItem);

    // let laborItemName = laborItem ? laborItem.name : 'Unknown';

    // let laborOffersColl = Db.getLaborOffersCollection();
    // const offers = await laborOffersColl
    //     .find({
    //         itemId: laborItemId,
    //         isArchived: false,
    //     })
    //     .toArray();

    // let totalPrice = 0;
    // let count = offers.length;

    // for (let offer of offers) {
    //     totalPrice += offer.price;
    // }

    // let averagePrice = count > 0 ? totalPrice / count : null;

    // let result = {
    //     // estimatedLaborItem,
    //     itemName: laborItemName,
    //     averagePrice,
    // };
    // // log_.info(result);

    // respondJson(res, result);
});
