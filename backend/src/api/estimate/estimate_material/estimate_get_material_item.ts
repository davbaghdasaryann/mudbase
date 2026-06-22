import { registerApiSession } from '@/server/register';
import { ObjectId } from 'mongodb';

import * as Db from '@/db';

import { respondJson, respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { getQueryParam } from '@/tsback/req/req_params';

registerApiSession('estimate/fetch_material_items', async (req, res, session) => {

    let estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');

    let estimatedMaterialsColl = Db.getEstimateMaterialItemsCollection();

    let pipeline: any[] = [
        {
            $match: {
                estimatedLaborId: estimatedLaborId,
            },
        },
        {
            $lookup: {
                from: 'material_items',
                let: { materialItemIdIdVar: '$materialItemId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$materialItemIdIdVar'], // Join on _id === itemId
                            },
                        },
                    },
                    {
                        $project: {
                            fullCode: 1,
                            name: 1,
                            _id: 0, // Optional: Exclude _id if you don't need it
                        },
                    },
                ],
                as: 'estimateMaterialItemData',
            },
        },
        {
            $match: {
                itemData: { $ne: [] }, // Keep only laborOffers with a valid item
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
    ];

    const data = await estimatedMaterialsColl.aggregate(pipeline).toArray();

    // log_.info('estimated material data', data)

    respondJsonData(res, data);
});

/** Single-call endpoint for Materials List dialog: all material items for an estimate with catalog hierarchy. */
registerApiSession('estimate/fetch_materials_list', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimateSectionsColl = Db.getEstimateSectionsCollection();
    const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();

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

    const laborItems = await estimateLaborItemsColl
        .find({ estimateSubsectionId: { $in: subsectionIds } })
        .project({ _id: 1 })
        .toArray();
    const laborIds = laborItems.map((l) => l._id);
    if (laborIds.length === 0) {
        respondJsonData(res, []);
        return;
    }

    const pipeline: any[] = [
        { $match: { estimatedLaborId: { $in: laborIds } } },
        {
            $lookup: {
                from: 'material_items',
                let: { materialItemIdVar: '$materialItemId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$materialItemIdVar'] } } },
                    { $lookup: { from: 'material_subcategories', localField: 'subcategoryId', foreignField: '_id', as: 'subcat' } },
                    { $unwind: { path: '$subcat', preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: 'material_categories', localField: 'subcat.categoryId', foreignField: '_id', as: 'cat' } },
                    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
                    { $project: { fullCode: 1, name: 1, averagePrice: 1, categoryName: '$cat.name', subcategoryName: '$subcat.name', _id: 0 } },
                ],
                as: 'estimateMaterialItemData',
            },
        },
        { $match: { estimateMaterialItemData: { $ne: [] } } },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'estimateMeasurementUnitData',
            },
        },
    ];

    const data = await estimateMaterialItemsColl.aggregate(pipeline).toArray();
    respondJsonData(res, data);
});

registerApiSession('estimate/get_material_item', async (req, res, session) => {
    let estimateMaterialId = requireMongoIdParam(req, 'estimatedMaterialId');

    let estimateMaterialsColl = Db.getEstimateMaterialItemsCollection();

    let estimateMaterialItem = await estimateMaterialsColl.findOne({ _id: estimateMaterialId });

    // log_.info('estimatedLaborItem', materialItem)

    respondJsonData(res, estimateMaterialItem);
});

registerApiSession('estimate/get_material_item_for_view', async (req, res, session) => {
    let estimateItemId = requireMongoIdParam(req, 'estimatedItemId');

    let estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();
    let estimateMaterialItem = (await estimateMaterialItemsColl.findOne({ _id: estimateItemId }))!;

    log_.info(estimateMaterialItem);

    verify(estimateMaterialItem, req.t('validate.material_not_found'));

    let materialItemId = estimateMaterialItem!.materialItemId;

    verify(materialItemId, req.t('validate.material_id'));

    // log_.info('estimatedMaterialItem', estimateMaterialItem)

    let materialItemsColl = Db.getMaterialItemsCollection();
    let materialItem = await materialItemsColl.findOne(
        { _id: materialItemId },
        { projection: { name: 1, averagePrice: 1 } }
    );

    // // log_.info('materialItem', materialItem)

    // let materialItemName = materialItem ? materialItem.name : 'Unknown';
    // // log_.info('materialItemName', materialItemName)

    // let materialOffersColl = Db.getMaterialOffersCollection();
    // let offers = await materialOffersColl
    //     .find({
    //         itemId: materialItemId,
    //         isArchived: false,
    //         price: {$ne: 0},
    //     })
    //     .toArray();

    // // log_.info('offers', offers)

    // let totalPrice = 0;
    // let count = offers.length;

    // for (let offer of offers) {
    //     totalPrice += offer.price;
    // }

    // let averagePrice = count > 0 ? totalPrice / count : null;

    // let result = {
    //     name: estimateMaterialItem.materialOfferItemName,
    //     averagePrice: estimateMaterialItem.averagePrice,
    // };


    // respondJson(res, result);
    respondJson(res, materialItem);
});

registerApiSession('estimate/fetch_material_market_comparison', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

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

    const hiddenLaborIds = (await Db.getEstimateLaborItemsCollection()
        .find({ estimateId, isHidden: true })
        .project({ _id: 1 })
        .toArray()).map(l => l._id);

    const materialItems = await Db.getEstimateMaterialItemsCollection()
        .aggregate([
            {
                $match: {
                    estimateSubsectionId: { $in: subsectionIds },
                    ...(hiddenLaborIds.length > 0 ? { estimatedLaborId: { $nin: hiddenLaborIds } } : {}),
                },
            },
            {
                $lookup: {
                    from: 'material_items',
                    let: { itemIdVar: '$materialItemId' },
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
                                from: 'material_offers',
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
                    materialItemId: 1,
                    estimateSubsectionId: 1,
                    changableAveragePrice: 1,
                    fullCode: '$catalogItem.fullCode',
                    catalogName: '$catalogItem.name',
                    materialOfferItemName: 1,
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

    const result = materialItems.map((item: any) => {
        const sectionInfo = subsectionMap.get(item.estimateSubsectionId?.toString());
        return {
            _id: item._id,
            materialItemId: item.materialItemId,
            fullCode: item.fullCode ?? '',
            catalogName: item.catalogName ?? '',
            materialOfferItemName: item.materialOfferItemName ?? item.catalogName ?? '',
            unitSymbol: item.unitSymbol ?? '',
            unitCost: item.changableAveragePrice ?? 0,
            marketAveragePrice: item.marketAveragePrice ?? null,
            marketMinPrice: item.marketMinPrice ?? null,
            marketMaxPrice: item.marketMaxPrice ?? null,
            sectionName: sectionInfo?.name ?? '',
            sectionDisplayIndex: sectionInfo?.displayIndex ?? 0,
        };
    });

    respondJsonData(res, result);
});

registerApiSession('estimate/fetch_base_proposals_material_prices', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const accountIdsParam = getQueryParam(req, 'accountIds') ?? '';
    const accountIds = accountIdsParam.split(',').filter(Boolean).map(id => new ObjectId(id));
    if (accountIds.length === 0) { respondJsonData(res, []); return; }

    const sections = await Db.getEstimateSectionsCollection()
        .find({ estimateId }).project({ _id: 1 }).toArray();
    const sectionIds = sections.map(s => s._id);
    if (!sectionIds.length) { respondJsonData(res, []); return; }

    const subsections = await Db.getEstimateSubsectionsCollection()
        .find({ estimateSectionId: { $in: sectionIds } }).project({ _id: 1 }).toArray();
    const subsectionIds = subsections.map(s => s._id);
    if (!subsectionIds.length) { respondJsonData(res, []); return; }

    const hiddenLaborIds = (await Db.getEstimateLaborItemsCollection()
        .find({ estimateId, isHidden: true }).project({ _id: 1 }).toArray()).map(l => l._id);

    const materialItems = await Db.getEstimateMaterialItemsCollection()
        .aggregate([
            {
                $match: {
                    estimateSubsectionId: { $in: subsectionIds },
                    ...(hiddenLaborIds.length > 0 ? { estimatedLaborId: { $nin: hiddenLaborIds } } : {}),
                },
            },
            {
                $lookup: {
                    from: 'material_offers',
                    let: { matItemId: '$materialItemId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$itemId', '$$matItemId'] },
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
            { $project: { _id: 1, materialItemId: 1, companyOffers: 1 } },
        ])
        .toArray();

    const result = materialItems.map((item: any) => {
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

registerApiSession('estimate/fetch_materials_for_analysis', async (req, res, session) => {
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

    // Fetch labor items with their catalog info (for parent row grouping)
    const laborItems = await Db.getEstimateLaborItemsCollection()
        .aggregate([
            { $match: { estimateId } },
            {
                $lookup: {
                    from: 'labor_items',
                    let: { laborItemIdVar: '$laborItemId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$laborItemIdVar'] } } },
                        { $project: { fullCode: 1, name: 1, _id: 0 } },
                    ],
                    as: 'catalogLabor',
                },
            },
            { $unwind: { path: '$catalogLabor', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    isHidden: 1,
                    laborOfferItemName: 1,
                    laborCatalogName: '$catalogLabor.name',
                    laborFullCode: '$catalogLabor.fullCode',
                },
            },
        ])
        .toArray();

    const hiddenLaborIds = laborItems.filter((l: any) => l.isHidden).map((l: any) => l._id);
    const laborMap = new Map(laborItems.map((l: any) => [l._id.toString(), {
        laborOfferItemName: l.laborOfferItemName as string ?? '',
        laborCatalogName: l.laborCatalogName as string ?? '',
        laborFullCode: l.laborFullCode as string ?? '',
    }]));

    const materialItems = await Db.getEstimateMaterialItemsCollection()
        .aggregate([
            {
                $match: {
                    estimateSubsectionId: { $in: subsectionIds },
                    ...(hiddenLaborIds.length > 0 ? { estimatedLaborId: { $nin: hiddenLaborIds } } : {}),
                },
            },
            {
                $lookup: {
                    from: 'material_items',
                    let: { itemIdVar: '$materialItemId' },
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
                        { $project: { fullCode: 1, name: 1, _id: 0, unitSymbol: '$measurementUnitData.representationSymbol' } },
                    ],
                    as: 'catalogItem',
                },
            },
            { $unwind: { path: '$catalogItem', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    materialItemId: 1,
                    estimateSubsectionId: 1,
                    estimatedLaborId: 1,
                    quantity: 1,
                    changableAveragePrice: 1,
                    materialCatalogFullCode: '$catalogItem.fullCode',
                    materialCatalogName: '$catalogItem.name',
                    materialOfferItemName: 1,
                    unitSymbol: '$catalogItem.unitSymbol',
                    displayIndex: 1,
                },
            },
            { $sort: { displayIndex: 1, _id: 1 } },
        ])
        .toArray();

    const result = materialItems.map((item: any) => {
        const labor = laborMap.get(item.estimatedLaborId?.toString()) ?? { laborOfferItemName: '', laborCatalogName: '', laborFullCode: '' };
        return {
            _id: item._id,
            estimatedLaborId: item.estimatedLaborId,
            materialItemId: item.materialItemId,
            // Labor info (for parent grouping)
            laborCatalogName: labor.laborCatalogName,
            laborFullCode: labor.laborFullCode,
            laborOfferItemName: labor.laborOfferItemName,
            // Material info (for child rows)
            materialCatalogName: item.materialCatalogName ?? '',
            materialCatalogFullCode: item.materialCatalogFullCode ?? '',
            materialOfferItemName: item.materialOfferItemName ?? item.materialCatalogName ?? '',
            unitSymbol: item.unitSymbol ?? '',
            quantity: item.quantity ?? 0,
            changableAveragePrice: item.changableAveragePrice ?? 0,
            cost: (item.quantity ?? 0) * (item.changableAveragePrice ?? 0),
        };
    });

    respondJsonData(res, result);
});
