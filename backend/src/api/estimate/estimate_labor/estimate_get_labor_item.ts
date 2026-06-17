import { registerApiSession } from '@/server/register';
import { ObjectId } from 'mongodb';

import * as Db from '@/db';

import { respondJson, respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { getQueryParam } from '@/tsback/req/req_params';

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
        { $addFields: { _sortIndex: { $ifNull: ['$displayIndex', 0] } } },
        { $sort: { _sortIndex: 1, _id: 1 } },
        { $project: { _sortIndex: 0 } },
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
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'estimateMeasurementUnitData',
            },
        },
        { $addFields: { _sortIndex: { $ifNull: ['$displayIndex', 0] } } },
        { $sort: { _sortIndex: 1, _id: 1 } },
        { $project: { _sortIndex: 0 } },
    ];

    const data = await estimateLaborItemsColl.aggregate(pipeline).toArray();
    respondJsonData(res, data);
});

registerApiSession('estimate/fetch_labor_for_analysis', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const sections = await Db.getEstimateSectionsCollection()
        .find({ estimateId })
        .project({ _id: 1, name: 1 })
        .toArray();
    const sectionIds = sections.map(s => s._id);
    if (sectionIds.length === 0) { respondJsonData(res, []); return; }

    const sectionMap = new Map(sections.map(s => [s._id.toString(), s.name as string]));

    const subsections = await Db.getEstimateSubsectionsCollection()
        .find({ estimateSectionId: { $in: sectionIds } })
        .project({ _id: 1, name: 1, estimateSectionId: 1 })
        .toArray();
    const subsectionIds = subsections.map(s => s._id);
    if (subsectionIds.length === 0) { respondJsonData(res, []); return; }

    const subsectionMap = new Map(subsections.map(s => [
        s._id.toString(),
        { name: s.name as string, sectionName: sectionMap.get(s.estimateSectionId.toString()) ?? '' },
    ]));

    const laborItems = await Db.getEstimateLaborItemsCollection()
        .aggregate([
            { $match: { estimateSubsectionId: { $in: subsectionIds }, isHidden: { $ne: true } } },
            {
                $lookup: {
                    from: 'labor_items',
                    let: { itemIdVar: '$laborItemId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$itemIdVar'] } } },
                        { $project: { fullCode: 1, name: 1, _id: 0 } },
                    ],
                    as: 'catalogItem',
                },
            },
            { $unwind: { path: '$catalogItem', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    laborItemId: 1,
                    estimateSubsectionId: 1,
                    quantity: 1,
                    changableAveragePrice: 1,
                    fullCode: '$catalogItem.fullCode',
                    catalogName: '$catalogItem.name',
                    laborOfferItemName: 1,
                    displayIndex: 1,
                },
            },
            { $sort: { displayIndex: 1, _id: 1 } },
        ])
        .toArray();

    const result = laborItems.map((item: any) => ({
        _id: item._id,
        laborItemId: item.laborItemId,
        fullCode: item.fullCode ?? '',
        catalogName: item.catalogName ?? '',
        laborOfferItemName: item.laborOfferItemName ?? item.catalogName ?? '',
        quantity: item.quantity ?? 0,
        changableAveragePrice: item.changableAveragePrice ?? 0,
        cost: (item.quantity ?? 0) * (item.changableAveragePrice ?? 0),
        subsectionName: subsectionMap.get(item.estimateSubsectionId?.toString())?.name ?? '',
        sectionName: subsectionMap.get(item.estimateSubsectionId?.toString())?.sectionName ?? '',
    }));

    respondJsonData(res, result);
});

registerApiSession('estimate/fetch_labor_market_comparison', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    // When true, unitCost folds in each labor item's linked material cost per unit (quantity),
    // matching the combined "unit price" methodology used on the main Estimate page.
    const includeMaterials = getQueryParam(req, 'includeMaterials') === 'true';

    const sections = await Db.getEstimateSectionsCollection()
        .find({ estimateId })
        .project({ _id: 1, name: 1, displayIndex: 1 })
        .sort({ displayIndex: 1 })
        .toArray();
    const sectionIds = sections.map(s => s._id);
    if (sectionIds.length === 0) { respondJsonData(res, []); return; }

    const sectionMap = new Map(sections.map((s, i) => [s._id.toString(), { name: s.name as string, displayIndex: i }]));

    const subsections = await Db.getEstimateSubsectionsCollection()
        .find({ estimateSectionId: { $in: sectionIds } })
        .project({ _id: 1, estimateSectionId: 1 })
        .toArray();
    const subsectionIds = subsections.map(s => s._id);
    if (subsectionIds.length === 0) { respondJsonData(res, []); return; }

    const subsectionMap = new Map(subsections.map(s => [
        s._id.toString(),
        sectionMap.get(s.estimateSectionId.toString()) ?? { name: '', displayIndex: 0 },
    ]));

    const laborItems = await Db.getEstimateLaborItemsCollection()
        .aggregate([
            { $match: { estimateSubsectionId: { $in: subsectionIds }, isHidden: { $ne: true } } },
            {
                $lookup: {
                    from: 'estimate_material_items',
                    let: { laborIdVar: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$estimatedLaborId', '$$laborIdVar'] } } },
                        {
                            $lookup: {
                                from: 'material_items',
                                let: { matItemId: '$materialItemId' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$_id', '$$matItemId'] } } },
                                    {
                                        $lookup: {
                                            from: 'material_offers',
                                            let: { catId: '$_id' },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: { $eq: ['$itemId', '$$catId'] },
                                                        price: { $ne: 0, $exists: true },
                                                        $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
                                                    },
                                                },
                                                {
                                                    $group: {
                                                        _id: null,
                                                        avgPrice: { $avg: '$price' },
                                                        minPrice: { $min: '$price' },
                                                        maxPrice: { $max: '$price' },
                                                    },
                                                },
                                            ],
                                            as: 'marketStats',
                                        },
                                    },
                                    { $unwind: { path: '$marketStats', preserveNullAndEmptyArrays: true } },
                                    {
                                        $project: {
                                            _id: 0,
                                            marketAvg: '$marketStats.avgPrice',
                                            marketMin: '$marketStats.minPrice',
                                            marketMax: '$marketStats.maxPrice',
                                        },
                                    },
                                ],
                                as: 'catalogStats',
                            },
                        },
                        { $unwind: { path: '$catalogStats', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: null,
                                materialTotalCost: { $sum: { $multiply: ['$quantity', '$changableAveragePrice'] } },
                                materialMarketAvgContrib: { $sum: { $multiply: ['$quantity', { $ifNull: ['$catalogStats.marketAvg', 0] }] } },
                                materialMarketMinContrib: { $sum: { $multiply: ['$quantity', { $ifNull: ['$catalogStats.marketMin', 0] }] } },
                                materialMarketMaxContrib: { $sum: { $multiply: ['$quantity', { $ifNull: ['$catalogStats.marketMax', 0] }] } },
                            },
                        },
                    ],
                    as: 'materialAgg',
                },
            },
            { $unwind: { path: '$materialAgg', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'labor_items',
                    let: { itemIdVar: '$laborItemId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$itemIdVar'] } } },
                        {
                            $lookup: {
                                from: 'measurement_unit',
                                localField: 'measurementUnitMongoId',
                                foreignField: '_id',
                                as: 'measurementUnitData',
                            },
                        },
                        { $unwind: { path: '$measurementUnitData', preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: 'labor_offers',
                                let: { catalogIdVar: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ['$itemId', '$$catalogIdVar'] },
                                            price: { $ne: 0, $exists: true },
                                            $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
                                        },
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            avgPrice: { $avg: '$price' },
                                            minPrice: { $min: '$price' },
                                            maxPrice: { $max: '$price' },
                                        },
                                    },
                                ],
                                as: 'marketStats',
                            },
                        },
                        { $unwind: { path: '$marketStats', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 0,
                                fullCode: 1,
                                name: 1,
                                unitSymbol: '$measurementUnitData.representationSymbol',
                                marketAveragePrice: '$marketStats.avgPrice',
                                marketMinPrice: '$marketStats.minPrice',
                                marketMaxPrice: '$marketStats.maxPrice',
                            },
                        },
                    ],
                    as: 'catalogItem',
                },
            },
            { $unwind: { path: '$catalogItem', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    laborItemId: 1,
                    estimateSubsectionId: 1,
                    quantity: 1,
                    changableAveragePrice: 1,
                    materialTotalCost: '$materialAgg.materialTotalCost',
                    materialMarketAvgContrib: '$materialAgg.materialMarketAvgContrib',
                    materialMarketMinContrib: '$materialAgg.materialMarketMinContrib',
                    materialMarketMaxContrib: '$materialAgg.materialMarketMaxContrib',
                    fullCode: '$catalogItem.fullCode',
                    catalogName: '$catalogItem.name',
                    laborOfferItemName: 1,
                    unitSymbol: '$catalogItem.unitSymbol',
                    marketAveragePrice: '$catalogItem.marketAveragePrice',
                    marketMinPrice: '$catalogItem.marketMinPrice',
                    marketMaxPrice: '$catalogItem.marketMaxPrice',
                    displayIndex: 1,
                },
            },
            { $sort: { displayIndex: 1, _id: 1 } },
        ])
        .toArray();

    const result = laborItems.map((item: any) => {
        const sectionInfo = subsectionMap.get(item.estimateSubsectionId?.toString());
        const qty = item.quantity ?? 0;
        const laborUnitCost = item.changableAveragePrice ?? 0;
        // Combined "unit price" (labor + linked materials per unit), same methodology as the main Estimate page.
        const unitCost = includeMaterials && qty
            ? laborUnitCost + (item.materialTotalCost ?? 0) / qty
            : laborUnitCost;

        // Combined market columns: add per-unit material market contribution to labor market price.
        // If labor has no market data, combined is also null (can't represent a partial combined rate).
        let marketAveragePrice = item.marketAveragePrice ?? null;
        let marketMinPrice = item.marketMinPrice ?? null;
        let marketMaxPrice = item.marketMaxPrice ?? null;
        if (includeMaterials && qty) {
            const avgContrib = (item.materialMarketAvgContrib ?? 0) / qty;
            const minContrib = (item.materialMarketMinContrib ?? 0) / qty;
            const maxContrib = (item.materialMarketMaxContrib ?? 0) / qty;
            if (marketAveragePrice !== null) marketAveragePrice = marketAveragePrice + avgContrib;
            if (marketMinPrice !== null) marketMinPrice = marketMinPrice + minContrib;
            if (marketMaxPrice !== null) marketMaxPrice = marketMaxPrice + maxContrib;
        }

        return {
            _id: item._id,
            laborItemId: item.laborItemId,
            fullCode: item.fullCode ?? '',
            catalogName: item.catalogName ?? '',
            laborOfferItemName: item.laborOfferItemName ?? item.catalogName ?? '',
            unitSymbol: item.unitSymbol ?? '',
            unitCost,
            marketAveragePrice,
            marketMinPrice,
            marketMaxPrice,
            sectionName: sectionInfo?.name ?? '',
            sectionDisplayIndex: sectionInfo?.displayIndex ?? 0,
        };
    });

    respondJsonData(res, result);
});

registerApiSession('estimate/fetch_base_proposals_prices', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const accountIdsParam = getQueryParam(req, 'accountIds') ?? '';
    const accountIds = accountIdsParam.split(',').filter(Boolean).map(id => new ObjectId(id));

    if (accountIds.length === 0) { respondJsonData(res, []); return; }

    const sections = await Db.getEstimateSectionsCollection()
        .find({ estimateId })
        .project({ _id: 1 })
        .toArray();
    const sectionIds = sections.map(s => s._id);
    if (sectionIds.length === 0) { respondJsonData(res, []); return; }

    const subsections = await Db.getEstimateSubsectionsCollection()
        .find({ estimateSectionId: { $in: sectionIds } })
        .project({ _id: 1 })
        .toArray();
    const subsectionIds = subsections.map(s => s._id);
    if (subsectionIds.length === 0) { respondJsonData(res, []); return; }

    const laborItems = await Db.getEstimateLaborItemsCollection()
        .aggregate([
            { $match: { estimateSubsectionId: { $in: subsectionIds }, isHidden: { $ne: true } } },
            {
                $lookup: {
                    from: 'labor_offers',
                    let: { laborItemId: '$laborItemId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$itemId', '$$laborItemId'] },
                                accountId: { $in: accountIds },
                                price: { $ne: 0, $exists: true },
                                $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
                            },
                        },
                        { $project: { _id: 0, accountId: 1, price: 1 } },
                    ],
                    as: 'companyOffers',
                },
            },
            { $project: { _id: 1, laborItemId: 1, companyOffers: 1 } },
        ])
        .toArray();

    const result = laborItems.map((item: any) => {
        const companyPrices: Record<string, number | null> = {};
        for (const accountId of accountIds) {
            const key = accountId.toString();
            const offer = (item.companyOffers ?? []).find((o: any) => o.accountId.toString() === key);
            companyPrices[key] = offer?.price ?? null;
        }
        return { _id: item._id, companyPrices };
    });

    respondJsonData(res, result);
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


registerApiSession('estimate/fetch_submitted_estimations_comparison', async (req, res, session) => {
    const originalEstimateId = requireMongoIdParam(req, 'originalEstimateId');
    const accountIdsParam = getQueryParam(req, 'accountIds') ?? '';
    const accountIds = accountIdsParam.split(',').filter(Boolean).map(id => new ObjectId(id));

    const estimatesCol = Db.getEstimatesCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    const originalEstimate = await estimatesCol.findOne({ _id: originalEstimateId });
    if (!originalEstimate) { respondJsonData(res, null); return; }

    // Sections → subsections of original
    const sections = await sectionsCol.find({ estimateId: originalEstimateId }).sort({ displayIndex: 1 }).toArray();
    const sectionIds = sections.map(s => s._id);
    const subsections = await subsectionsCol.find({ estimateSectionId: { $in: sectionIds } }).sort({ displayIndex: 1 }).toArray();
    const subsectionIds = subsections.map(s => s._id);

    const subsectionToSection = new Map(subsections.map(s => [s._id.toString(), s.estimateSectionId?.toString()]));
    const sectionById = new Map(sections.map((s, i) => [s._id.toString(), { name: s.name as string, displayIndex: (s as any).displayIndex ?? i }]));

    // Helper: build section→items map from a flat item list
    const buildSectionMap = (items: any[], idKey: string) => {
        const map = new Map<string, { sectionName: string; displayIndex: number; items: any[] }>();
        for (const item of items) {
            const subsId = item.estimateSubsectionId?.toString();
            const sectId = subsectionToSection.get(subsId ?? '') ?? '';
            const sectInfo = sectionById.get(sectId) ?? { name: '', displayIndex: 0 };
            if (!map.has(sectId)) map.set(sectId, { sectionName: sectInfo.name, displayIndex: sectInfo.displayIndex, items: [] });
            map.get(sectId)!.items.push(item);
        }
        return Array.from(map.values()).sort((a, b) => a.displayIndex - b.displayIndex);
    };

    // --- LABOR items (original) ---
    const rawLaborItems = await laborItemsCol.aggregate([
        { $match: { estimateSubsectionId: { $in: subsectionIds }, isHidden: { $ne: true } } },
        { $lookup: { from: 'labor_items', localField: 'laborItemId', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'measurement_unit', localField: 'measurementUnitMongoId', foreignField: '_id', as: 'unit' } },
        { $unwind: { path: '$unit', preserveNullAndEmptyArrays: true } },
        { $sort: { displayIndex: 1, _id: 1 } },
        { $project: { laborItemId: 1, estimateSubsectionId: 1, quantity: 1, changableAveragePrice: 1, name: { $ifNull: ['$laborOfferItemName', '$cat.name'] }, unitSymbol: '$unit.representationSymbol' } },
    ]).toArray();

    // --- MATERIAL items (original) ---
    const rawMaterialItems = await materialItemsCol.aggregate([
        { $match: { estimateSubsectionId: { $in: subsectionIds } } },
        { $lookup: { from: 'material_items', localField: 'materialItemId', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'measurement_unit', localField: 'measurementUnitMongoId', foreignField: '_id', as: 'unit' } },
        { $unwind: { path: '$unit', preserveNullAndEmptyArrays: true } },
        { $sort: { displayIndex: 1, _id: 1 } },
        { $project: { materialItemId: 1, estimateSubsectionId: 1, quantity: 1, changableAveragePrice: 1, name: { $ifNull: ['$materialOfferItemName', '$cat.name'] }, unitSymbol: '$unit.representationSymbol' } },
    ]).toArray();

    // --- Company copies ---
    const companyLaborPrices: Record<string, Record<string, number>> = {};
    const companyMaterialPrices: Record<string, Record<string, number>> = {};
    const companyTotals: Record<string, { directCost: number; totalCost: number; totalWithOther: number }> = {};

    if (accountIds.length > 0) {
        const copies = await estimatesCol.find({ originalEstimateId, sharedWithAccountId: { $in: accountIds } }).toArray();

        for (const copy of copies) {
            const acctId = copy.sharedWithAccountId?.toString();
            if (!acctId) continue;

            const copySections = await sectionsCol.find({ estimateId: copy._id }).toArray();
            const copySubs = await subsectionsCol.find({ estimateSectionId: { $in: copySections.map(s => s._id) } }).toArray();
            const copySubIds = copySubs.map(s => s._id);

            const copyLabor = await laborItemsCol.find({ estimateSubsectionId: { $in: copySubIds }, isHidden: { $ne: true } }).toArray();
            companyLaborPrices[acctId] = {};
            for (const item of copyLabor) {
                companyLaborPrices[acctId][item.laborItemId?.toString()] = item.changableAveragePrice ?? 0;
            }

            const copyMat = await materialItemsCol.find({ estimateSubsectionId: { $in: copySubIds } }).toArray();
            companyMaterialPrices[acctId] = {};
            for (const item of copyMat) {
                companyMaterialPrices[acctId][item.materialItemId?.toString()] = item.changableAveragePrice ?? 0;
            }

            companyTotals[acctId] = {
                directCost: copy.totalCost ?? 0,
                totalCost: copy.totalCost ?? 0,
                totalWithOther: copy.totalCostWithOtherExpenses ?? 0,
            };
        }
    }

    // Attach company prices to items
    const acctIdStrs = accountIds.map(a => a.toString());

    const laborItemsWithPrices = rawLaborItems.map((item: any) => {
        const key = item.laborItemId?.toString() ?? '';
        const companyPrices: Record<string, number | null> = {};
        for (const a of acctIdStrs) companyPrices[a] = companyLaborPrices[a]?.[key] ?? null;
        return { itemId: key, name: item.name, unitSymbol: item.unitSymbol, quantity: item.quantity ?? 0, baseUnitPrice: item.changableAveragePrice ?? 0, companyPrices, estimateSubsectionId: item.estimateSubsectionId };
    });

    const materialItemsWithPrices = rawMaterialItems.map((item: any) => {
        const key = item.materialItemId?.toString() ?? '';
        const companyPrices: Record<string, number | null> = {};
        for (const a of acctIdStrs) companyPrices[a] = companyMaterialPrices[a]?.[key] ?? null;
        return { itemId: key, name: item.name, unitSymbol: item.unitSymbol, quantity: item.quantity ?? 0, baseUnitPrice: item.changableAveragePrice ?? 0, companyPrices, estimateSubsectionId: item.estimateSubsectionId };
    });

    const baseDirectCost = originalEstimate.totalCost ?? 0;
    const baseTotalWithOther = originalEstimate.totalCostWithOtherExpenses ?? 0;

    respondJsonData(res, {
        laborSections: buildSectionMap(laborItemsWithPrices, 'laborItemId'),
        materialSections: buildSectionMap(materialItemsWithPrices, 'materialItemId'),
        baseSummary: { directCost: baseDirectCost, otherCost: baseTotalWithOther - baseDirectCost, total: baseTotalWithOther },
        companySummaries: companyTotals,
    });
});
