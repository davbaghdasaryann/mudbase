import {ObjectId} from 'mongodb';

import * as Db from '@/db';

import {getReqParam, requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJson, respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {getMongoIdParam, requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';

export async function updateMaterialItemStats(materialItemId: ObjectId) {
    const materialOffersColl = Db.getMaterialOffersCollection();

    const result = await materialOffersColl
        .aggregate([
            {
                $match: {
                    itemId: materialItemId,
                    price: {$ne: 0, $exists: true},
                    $or: [{isArchived: false}, {isArchived: {$exists: false}}],
                },
            },
            {
                $group: {
                    _id: '$itemId',
                    avgPrice: {$avg: '$price'},
                },
            },
            {
                $project: {
                    averagePrice: {$round: '$avgPrice'}, // ✅ round after grouping
                },
            },
            {
                $merge: {
                    into: 'material_items',
                    on: '_id',
                    whenMatched: 'merge',
                    whenNotMatched: 'discard',
                },
            },
        ])
        .toArray(); // ensures the pipeline executes

    log_.info(result);
}

registerApiSession('material/fetch_items', async (req, res, session) => {
    const subcategoryMongoId = getMongoIdParam(req, 'subcategoryMongoId');

    let searchVal = getReqParam(req, 'searchVal');
    if (searchVal) searchVal = searchVal.trim();

    let materialItemsColl = Db.getMaterialItemsCollection();

    let pipeline: any[] = [];

    if (subcategoryMongoId) {
        pipeline.push({
            $match: {subcategoryId: subcategoryMongoId},
        });
    } else if (searchVal !== 'empty') {
        pipeline.push({
            $match: {
                $or: [
                    {fullCode: {$regex: searchVal, $options: 'i'}},
                    {name: {$regex: searchVal, $options: 'i'}},
                ],
            },
        });
    }

    // Add the $lookup for measurement_unit
    pipeline.push({
        $lookup: {
            from: 'measurement_unit',
            localField: 'measurementUnitMongoId',
            foreignField: '_id',
            as: 'measurementUnitData',
        },
    });

    // Execute the aggregation pipeline
    const data = await materialItemsColl.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});

registerApiSession('material/get_item', async (req, res, session) => {
    let materialItemMongoId = requireMongoIdParam(req, 'materialItemMongoId');

    let pipeline = [
        {
            $match: {
                _id: materialItemMongoId,
            },
        },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'measurementUnitData',
            },
        },
    ];

    let materialItemsColl = Db.getMaterialItemsCollection();

    const materialItem = await materialItemsColl.aggregate(pipeline).next();

    respondJsonData(res, materialItem);
});

registerApiSession('material/add_item', async (req, res, session) => {
    let materialSubcategoryId = requireMongoIdParam(req, 'entityMongoId');
    let materialItemName = requireQueryParam(req, 'entityName');
    let materialItemCode = requireQueryParam(req, 'entityCode');
    let measurementUnitId = requireQueryParam(req, 'measurementUnitId');

    const measurementUnitColl = Db.getMeasurementUnitCollection();
    let measurementUnit = await measurementUnitColl.findOne({
        measurementUnitId: measurementUnitId,
    });

    measurementUnit = assertObject(measurementUnit, 'Measurment Unit Not Found')!;

    let materialSubcategoriesColl = Db.getMaterialSubcategoriesCollection();
    let parentMaterialSubcategory = await materialSubcategoriesColl.findOne({
        _id: materialSubcategoryId,
    });

    parentMaterialSubcategory = assertObject(
        parentMaterialSubcategory,
        'Measurment Unit Not Found'
    )!;

    let newMaterialItem = {} as Db.EntityMaterialItem;

    if (parentMaterialSubcategory) {
        newMaterialItem.code = materialItemCode;
        newMaterialItem.name = materialItemName;
        newMaterialItem.subcategoryId = parentMaterialSubcategory._id;
        newMaterialItem.subcategoryCode = parentMaterialSubcategory.categoryFullCode;
        newMaterialItem.fullCode = parentMaterialSubcategory.categoryFullCode + materialItemCode;

        newMaterialItem.measurementUnitMongoId = measurementUnit!._id;

        newMaterialItem.averagePrice = 0;
    }

    let materialItems = Db.getMaterialItemsCollection();

    const duplicateItem = await materialItems.findOne({
        subcategoryId: parentMaterialSubcategory._id,
        // $or: [
        //   { name: materialItemName },
        //   { code: materialItemCode }
        // ]
        code: materialItemCode,
    });

    verify(!duplicateItem, req.t('error.duplicate_item')); //TODO: translate item_already_exists

    const result = await materialItems.insertOne(newMaterialItem);

    respondJsonData(res, result);
});

registerApiSession('material/update_item', async (req, res, session) => {
    const materialItemId = requireMongoIdParam(req, 'entityMongoId');
    const materialItemName = requireQueryParam(req, 'entityName');
    const materialItemCode = requireQueryParam(req, 'entityCode');
    const measurementUnitId = requireQueryParam(req, 'measurementUnitId');

    // 2) Verify the measurement unit exists
    const muColl = Db.getMeasurementUnitCollection();
    let measurementUnit = await muColl.findOne({measurementUnitId});
    measurementUnit = assertObject(measurementUnit, req.t('error.measurement_unit_not_found'))!;

    const materialItemsColl = Db.getMaterialItemsCollection();
    let currentItem = await materialItemsColl.findOne({_id: materialItemId});
    currentItem = assertObject(currentItem, req.t('error.item_not_found'))!;

    const subcatColl = Db.getMaterialSubcategoriesCollection();
    let parentSubcat = await subcatColl.findOne({_id: currentItem.subcategoryId});
    parentSubcat = assertObject(parentSubcat, req.t('error.subcategory_not_found'))!;

    // 5) Check for duplicates (name OR code) in the same subcategory, excluding self
    const duplicate = await materialItemsColl.findOne({
        subcategoryId: currentItem.subcategoryId,
        _id: {$ne: materialItemId},
        // $or: [
        //   { name: materialItemName },
        //   { code: materialItemCode }
        // ]
        code: materialItemCode,
    });

    // log_.info('duplicate', duplicate);
    verify(!duplicate, req.t('error.duplicate_item'));

    const newFullCode = parentSubcat.categoryFullCode + materialItemCode;

    const result = await materialItemsColl.updateOne(
        {_id: materialItemId},
        {
            $set: {
                name: materialItemName,
                code: materialItemCode,
                fullCode: newFullCode,
                measurementUnitMongoId: measurementUnit._id,
            },
        }
    );

    respondJsonData(res, result);
});

// Delete item
registerApiSession('material/delete_item', async (req, res, session) => {
    const materialItemId = requireMongoIdParam(req, 'entityMongoId');

    const materialItemsColl = Db.getMaterialItemsCollection();

    // Verify item exists
    const item = await materialItemsColl.findOne({ _id: materialItemId });
    verify(item, req.t('error.item_not_found'));

    // Delete the item
    const result = await materialItemsColl.deleteOne({ _id: materialItemId });

    respondJsonData(res, { ok: true, deletedCount: result.deletedCount });
});

// Move item to a different subcategory
registerApiSession('material/move_item', async (req, res, session) => {
    const materialItemId = requireMongoIdParam(req, 'itemMongoId');
    const newSubcategoryId = requireMongoIdParam(req, 'newSubcategoryMongoId');

    const materialItemsColl = Db.getMaterialItemsCollection();
    const subcatColl = Db.getMaterialSubcategoriesCollection();

    // Verify item exists
    const item = (await materialItemsColl.findOne({ _id: materialItemId })) as Db.EntityMaterialItems;
    verify(item, req.t('error.item_not_found'));

    // Verify new subcategory exists
    const newSubcat = (await subcatColl.findOne({ _id: newSubcategoryId })) as Db.EntityMaterialSubcategories;
    verify(newSubcat, req.t('error.subcategory_not_found'));

    // Check if item with same code already exists in target subcategory
    const duplicate = await materialItemsColl.findOne({
        subcategoryId: newSubcategoryId,
        code: item.code,
        _id: { $ne: materialItemId }
    });

    let newCode = item.code;

    // If duplicate exists, generate a new code by finding the highest code number and adding 1
    if (duplicate) {
        const allItemsInTargetSubcat = await materialItemsColl.find({
            subcategoryId: newSubcategoryId
        }).toArray() as Db.EntityMaterialItems[];

        let maxCodeNum = 0;
        let maxCodeLength = 2; // Default length
        for (const existingItem of allItemsInTargetSubcat) {
            // Try to extract numeric part from code
            const numMatch = existingItem.code.match(/(\d+)$/);
            if (numMatch) {
                const num = parseInt(numMatch[1], 10);
                if (num > maxCodeNum) {
                    maxCodeNum = num;
                    maxCodeLength = numMatch[1].length; // Track the length of the max code
                }
            }
        }

        // Generate new code by incrementing the max
        const newCodeNum = maxCodeNum + 1;
        // Pad with zeros to match the existing code format length
        newCode = String(newCodeNum).padStart(maxCodeLength, '0');
    }

    // Update item's subcategory, code, and fullCode
    const newFullCode = newSubcat.categoryFullCode + newCode;
    const result = await materialItemsColl.updateOne(
        { _id: materialItemId },
        {
            $set: {
                subcategoryId: newSubcategoryId,
                code: newCode,
                fullCode: newFullCode
            }
        }
    );

    respondJsonData(res, { ok: true, modifiedCount: result.modifiedCount, newCode });
});

registerApiSession('material/fetch_items_with_average_price', async (req, res, session) => {
    const calledFromPage = getReqParam(req, 'calledFromPage');
    const isSorting = getReqParam(req, 'isSorting');
    const subcategoryMongoIdReq = getReqParam(req, 'subcategoryMongoId') as string;
    let subcategoryMongoId: ObjectId | undefined;
    if (subcategoryMongoIdReq) {
        subcategoryMongoId = new ObjectId(subcategoryMongoIdReq);
    }
    // const searchValRaw = getReqParam(req, 'searchVal') as string;
    // const searchVal = searchValRaw.trim();
    const searchVal = getReqParam(req, 'searchVal') as string;

    let accountIdStr = getReqParam(req, 'accountViewId');
    let accountViewId: ObjectId | undefined = undefined;
    if (accountIdStr) {
        accountViewId = new ObjectId(getReqParam(req, 'accountViewId'));
    }

    // If an accountId filter is provided in the request body, convert it to ObjectId
    let {accountId, timePeriod} = req.body || {};
    if (accountId) {
        accountId = new ObjectId(String(accountId));
    }

    // Calculate date threshold based on timePeriod
    let dateThreshold: Date | null = null;
    if (timePeriod) {
        const now = new Date();
        if (timePeriod === '6months') {
            dateThreshold = new Date(now.setMonth(now.getMonth() - 6));
        } else if (timePeriod === '1year') {
            dateThreshold = new Date(now.setFullYear(now.getFullYear() - 1));
        } else if (timePeriod === '3years') {
            dateThreshold = new Date(now.setFullYear(now.getFullYear() - 3));
        }
    }

    const materialItemsColl = Db.getMaterialItemsCollection();
    const materialOffersColl = Db.getMaterialOffersCollection();

    // Build the initial match query for material items
    let matchQuery: any = {};
    if (accountId) {
        // Query offers for that account and collect itemIds
        const offersForAccount = await materialOffersColl.find({accountId}).toArray();
        const itemIdsForAccount = offersForAccount.map((o) => o.itemId);
        if (itemIdsForAccount.length === 0) {
            respondJson(res, {});
            return;
        }
        if (searchVal && searchVal !== '') {
            matchQuery = {
                $and: [
                    {_id: {$in: itemIdsForAccount}},
                    {subcategoryId: subcategoryMongoId},
                    {
                        $or: [
                            {fullCode: {$regex: searchVal, $options: 'i'}},
                            {name: {$regex: searchVal, $options: 'i'}},
                        ],
                    },
                ],
            };
        } else {
            matchQuery = {
                $and: [{_id: {$in: itemIdsForAccount}}, {subcategoryId: subcategoryMongoId}],
            };
        }
    } else {
        // No accountId filter → original logic. Treat 'empty' or '' as no search.
        const hasSearch = searchVal && searchVal !== 'empty' && searchVal.trim() !== '';
        if (hasSearch && subcategoryMongoId) {
            matchQuery = {
                $and: [
                    {subcategoryId: subcategoryMongoId},
                    {
                        $or: [
                            {fullCode: {$regex: searchVal!.trim(), $options: 'i'}},
                            {name: {$regex: searchVal!.trim(), $options: 'i'}},
                        ],
                    },
                ],
            };
        } else if (hasSearch) {
            const term = searchVal!.trim();
            matchQuery.$or = [
                {fullCode: {$regex: term, $options: 'i'}},
                {name: {$regex: term, $options: 'i'}},
            ];
        } else if (subcategoryMongoId) {
            matchQuery.subcategoryId = subcategoryMongoId;
        }
    }

    // log_.info('matchQuery', matchQuery);
    // log_.info('isSorting', isSorting);

    // Define the filter condition for offers based on calledFromPage.
    let offerFilterCond;
    if (calledFromPage === 'offers') {
        offerFilterCond = {$eq: ['$$offer.accountId', accountId ?? session.mongoAccountId]};
    } else {
        offerFilterCond = {
            $and: [
                {$eq: ['$$offer.isArchived', false]},
                {$eq: ['$$offer.isActive', true]},
                {$ne: ['$$offer.price', 0]},
                // { $gt: [{ $type: '$$offer.price' }, 'missing'] },
            ],
        };
    }
    // log_.info('offerFilterCond', offerFilterCond);

    // Build the aggregation pipeline.
    const pipeline: any[] = [{$match: matchQuery}];

    // Add sort stage based on isSorting flag.
    if (isSorting) {
        if (calledFromPage === 'estCatAccordion') {
            pipeline.push({$sort: {fullCode: 1}});
        } else {
            pipeline.push({$sort: {name: 1, code: 1}});
        }
    } else {
        if (calledFromPage === 'estCatAccordion') {
            pipeline.push({$sort: {fullCode: 1}});
        } else {
            pipeline.push({$sort: {code: 1}});
        }
    }

    // 1) Lookup measurement_unit for each material item
    pipeline.push({
        $lookup: {
            from: 'measurement_unit',
            localField: 'measurementUnitMongoId',
            foreignField: '_id',
            as: 'measurementUnitData',
        },
    });

    // 2) Lookup material_offers with account join & exclude dev accounts in production
    const offersLookup: any = {
        $lookup: {
            from: 'material_offers',
            let: {
                itemIdVar: '$_id',
                ...(dateThreshold ? {thresholdDate: dateThreshold} : {}),
            },
            pipeline: [
                // Match only offers for this material item
                {
                    $match: {
                        $expr: {
                            $and: [
                                {$eq: ['$itemId', '$$itemIdVar']},
                                ...(dateThreshold
                                    ? [{$gte: ['$updatedAt', '$$thresholdDate']}]
                                    : []),
                            ],
                        },
                    },
                },
                // Join the account document to inspect its isDev flag
                {
                    $lookup: {
                        from: 'accounts',
                        let: {accountIdVar: '$accountId'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {$eq: ['$_id', '$$accountIdVar']},
                                },
                            },
                            {
                                $project: {
                                    isDev: 1,
                                    _id: 0,
                                },
                            },
                        ],
                        as: 'accountInfo',
                    },
                },
                // In production, exclude offers whose accountInfo.isDev === true
                ...(process.env.NODE_ENV === 'production'
                    ? [
                          {
                              $match: {
                                  'accountInfo.isDev': {$ne: true},
                              },
                          },
                      ]
                    : []),
                // Remove accountInfo after filtering
                {
                    $project: {
                        accountInfo: 0,
                    },
                },
            ],
            as: 'offers',
        },
    };
    pipeline.push(offersLookup);

    // 3) Ensure offers is never null
    pipeline.push({
        $addFields: {
            offers: {$ifNull: ['$offers', []]},
        },
    });

    // 4) Filter the offers array based on calledFromPage (accountId or isArchived)
    pipeline.push({
        $addFields: {
            filteredOffers: {
                $filter: {
                    input: '$offers',
                    as: 'offer',
                    cond: offerFilterCond,
                },
            },
        },
    });

    // 5) Compute averagePrice only among filteredOffers
    pipeline.push({
        $addFields: {
            averagePrice: {
                $cond: {
                    if: {$gt: [{$size: '$filteredOffers'}, 0]},
                    then: {$round: [{$avg: '$filteredOffers.price'}]},
                    else: null,
                },
            },
        },
    });

    // 6) Count how many filteredOffers there are
    pipeline.push({
        $addFields: {
            childrenQuantity: {$size: '$filteredOffers'},
        },
    });

    // 7) Remove the unneeded arrays from the final document
    pipeline.push({
        $project: {
            offers: 0,
            filteredOffers: 0,
        },
    });

    // Execute the aggregation
    const data = await materialItemsColl.aggregate(pipeline).toArray();

    // if (accountId) log_.info('data (filtered by accountId):', data);

    respondJsonData(res, data);
});

registerApiSession(
    'material/fetch_current_account_offers_items_with_average_price',
    async (req, res, session) => {
        let calledFromPage = getReqParam(req, 'calledFromPage');
        let isSorting = getReqParam(req, 'isSorting');

        let subcategoryMongoIdReq = getReqParam(req, 'subcategoryMongoId') as string;
        let subcategoryMongoId: ObjectId | undefined;
        if (subcategoryMongoIdReq) {
            subcategoryMongoId = new ObjectId(subcategoryMongoIdReq);
        }

        let searchVal = getReqParam(req, 'searchVal') as string;
        let accountIdStr = getReqParam(req, 'accountViewId');
        let accountViewId: ObjectId | undefined = undefined;
        if (accountIdStr) {
            accountViewId = new ObjectId(getReqParam(req, 'accountViewId'));
        }

        // Always use the session's accountId.
        // const accountId = new ObjectId(String(session.mongoAccountId));
        const accountId = new ObjectId(requireQueryParam(req, 'accountViewId'));

        let materialItems = Db.getMaterialItemsCollection();
        let offersCollection = Db.getMaterialOffersCollection();

        let matchQuery: any = {};

        // Query offers for the current user.
        const offersForAccount = await offersCollection.find({accountId}).toArray();
        const itemIdsForAccount = offersForAccount.map((o) => o.itemId);
        if (itemIdsForAccount.length > 0) {
            if (searchVal && searchVal !== '') {
                // Require that the item's _id is in the offer IDs,
                // that the item's subcategoryId matches the provided subcategory,
                // and that the name or fullCode matches the search value.
                matchQuery = {
                    $and: [
                        {_id: {$in: itemIdsForAccount}},
                        {subcategoryId: subcategoryMongoId},
                        {
                            $or: [
                                {fullCode: {$regex: searchVal, $options: 'i'}},
                                {name: {$regex: searchVal, $options: 'i'}},
                            ],
                        },
                    ],
                };
            } else {
                // Only filter by offers and subcategory.
                matchQuery = {
                    $and: [{_id: {$in: itemIdsForAccount}}, {subcategoryId: subcategoryMongoId}],
                };
            }
        } else {
            // No offers found for the current user: return an empty JSON object.
            respondJsonData(res, []);
            return;
        }

        // log_.info('matchQuery', matchQuery);
        // log_.info('isSorting', isSorting);

        // Define the filter condition for offers based on calledFromPage.
        let offerFilterCond;
        if (calledFromPage === 'offers') {
            offerFilterCond = {$eq: ['$$offer.accountId', accountId ?? session.mongoAccountId]};
        } else {
            offerFilterCond = {$eq: ['$$offer.isArchived', false]};
        }
        // log_.info('offerFilterCond', offerFilterCond);

        // Build the aggregation pipeline.
        let pipeline: any[] = [{$match: matchQuery}];

        // Add a sort stage based on the isSorting flag.
        if (isSorting) {
            pipeline.push({$sort: {name: 1}});
        } else {
            pipeline.push({$sort: {code: 1}});
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'measurement_unit',
                    localField: 'measurementUnitMongoId',
                    foreignField: '_id',
                    as: 'measurementUnitData',
                },
            },
            {
                $lookup: {
                    from: 'material_offers',
                    localField: '_id',
                    foreignField: 'itemId',
                    as: 'offers',
                },
            },
            {
                $addFields: {
                    offers: {$ifNull: ['$offers', []]},
                },
            },
            {
                $addFields: {
                    filteredOffers: {
                        $filter: {
                            input: '$offers',
                            as: 'offer',
                            cond: offerFilterCond,
                        },
                    },
                },
            },
            {
                $addFields: {
                    averagePrice: {
                        $cond: {
                            if: {$gt: [{$size: '$filteredOffers'}, 0]},
                            then: {$avg: '$filteredOffers.price'},
                            else: null,
                        },
                    },
                },
            },
            {
                $addFields: {
                    childrenQuantity: {$size: '$filteredOffers'},
                },
            },
            {
                $project: {
                    offers: 0,
                    filteredOffers: 0,
                },
            }
        );

        const data = await materialItems.aggregate(pipeline).toArray();

        // log_.info('data', data);
        respondJsonData(res, data);
    }
);
