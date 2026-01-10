import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {getReqParam, requireQueryParam} from '@/tsback/req/req_params';
import {respondJson, respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

export async function updateLaborItemStats(laborItemId: ObjectId) {
    const laborOffersColl = Db.getLaborOffersCollection();

    await laborOffersColl
        .aggregate([
            {
                $match: {
                    itemId: laborItemId,
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
                    into: 'labor_items',
                    on: '_id',
                    whenMatched: 'merge',
                    whenNotMatched: 'discard',
                },
            },
        ])
        .toArray(); // ensures the pipeline executes
}

registerApiSession('labor/fetch_items_with_average_price', async (req, res, session) => {
    const calledFromPage = getReqParam(req, 'calledFromPage');
    const subcategoryMongoIdReq = getReqParam(req, 'subcategoryMongoId');
    const isSorting = getReqParam(req, 'isSorting');
    let searchVal = getReqParam(req, 'searchVal');

    // If an accountId filter is provided in the request body, convert it to ObjectId
    let {accountId} = req.body || {};
    if (accountId) {
        accountId = new ObjectId(String(accountId));
    }

    let accountIdStr = getReqParam(req, 'accountViewId');
    let accountViewId: ObjectId | undefined = undefined;
    if (accountIdStr) {
        accountViewId = new ObjectId(getReqParam(req, 'accountViewId'));
    }

    const laborItems = Db.getLaborItemsCollection();
    const offersColl = Db.getLaborOffersCollection();

    // Build the initial match query for labor items
    let matchQuery: any = {};

    if (accountId) {
        // If accountId is provided, gather all itemIds that this account has offers for
        const offersForAccount = await offersColl.find({accountId}).toArray();
        const itemIdsForAccount = offersForAccount.map((o) => o.itemId);

        if (itemIdsForAccount.length === 0) {
            // No offers for this account → return empty array immediately
            respondJson(res, {ok: 1});
            return;
        }

        if (searchVal && searchVal !== '') {
            matchQuery = {
                $and: [
                    {_id: {$in: itemIdsForAccount}},
                    {subcategoryId: new ObjectId(subcategoryMongoIdReq)},
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
                $and: [
                    {_id: {$in: itemIdsForAccount}},
                    {subcategoryId: new ObjectId(subcategoryMongoIdReq)},
                ],
            };
        }
    } else {
        // No accountId filter → use original logic
        const subcategoryMongoId = subcategoryMongoIdReq
            ? new ObjectId(subcategoryMongoIdReq)
            : undefined;

        if (searchVal && subcategoryMongoId) {
            matchQuery = {
                $and: [
                    {subcategoryId: subcategoryMongoId},
                    {
                        $or: [
                            {fullCode: {$regex: searchVal, $options: 'i'}},
                            {name: {$regex: searchVal, $options: 'i'}},
                        ],
                    },
                ],
            };
        } else if (searchVal) {
            matchQuery.$or = [
                {fullCode: {$regex: searchVal, $options: 'i'}},
                {name: {$regex: searchVal, $options: 'i'}},
            ];
        } else if (subcategoryMongoId) {
            matchQuery.subcategoryId = subcategoryMongoId;
        }
    }

    // log_.info('matchQuery', matchQuery);
    // log_.info('isSorting', isSorting);

    // Define the condition to pick offers inside the array later
    let offerFilterCond: any;
    if (calledFromPage === 'offers') {
        offerFilterCond = {$eq: ['$$offer.accountId', accountViewId ?? session.mongoAccountId]};
    } else {
        offerFilterCond = {$eq: ['$$offer.isArchived', false]};
    }
    // log_.info('offerFilterCond', offerFilterCond);

    // Build the aggregation pipeline for labor items
    const pipeline: any[] = [{$match: matchQuery}];

    // Sorting logic
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

    // 1) Lookup measurement_unit for each labor item
    pipeline.push({
        $lookup: {
            from: 'measurement_unit',
            localField: 'measurementUnitMongoId',
            foreignField: '_id',
            as: 'measurementUnitData',
        },
    });

    // 2) Lookup labor_offers, but join account info and exclude dev‐accounts in production
    const laborOffersLookup: any = {
        $lookup: {
            from: 'labor_offers',
            let: {itemIdVar: '$_id'},
            pipeline: [
                // Match only offers for this labor item
                {
                    $match: {
                        $expr: {$eq: ['$itemId', '$$itemIdVar']},
                    },
                },
                // Join the account document for each offer to inspect its isDev flag
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
                // If in production, exclude offers whose accountInfo.isDev === true
                ...(process.env.NODE_ENV === 'production'
                    ? [
                          {
                              $match: {
                                  'accountInfo.isDev': {$ne: true},
                              },
                          },
                      ]
                    : []),
                // We don’t need that accountInfo array after filtering
                {
                    $project: {
                        accountInfo: 0,
                    },
                },
            ],
            as: 'offers',
        },
    };
    pipeline.push(laborOffersLookup);

    // 3) Stage to ensure offers is never null
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

    // // 5) Compute averagePrice only among filteredOffers
    // pipeline.push({
    //     $addFields: {
    //         averagePrice: {
    //             $cond: {
    //                 if: {$gt: [{$size: '$filteredOffers'}, 0]},
    //                 then: {$avg: '$filteredOffers.price'},
    //                 else: null,
    //             },
    //         },
    //     },
    // });

    // 6) Compute laborHours (rounded to 3 decimals) among filteredOffers
    pipeline.push({
        $addFields: {
            laborHours: {
                $cond: {
                    if: {$gt: [{$size: '$filteredOffers'}, 0]},
                    then: {$round: [{$avg: '$filteredOffers.laborHours'}, 3]},
                    else: null,
                },
            },
        },
    });

    // 7) Count how many filteredOffers there are
    pipeline.push({
        $addFields: {
            childrenQuantity: {$size: '$filteredOffers'},
        },
    });

    // 8) Remove the unneeded arrays from the final document
    pipeline.push({
        $project: {
            offers: 0,
            filteredOffers: 0,
        },
    });

    // Execute the aggregation
    const data = await laborItems.aggregate(pipeline).toArray();

    // if (accountId) log_.info('data (filtered by accountId):', data);

    respondJsonData(res, data);
});

registerApiSession(
    'labor/fetch_current_account_offers_items_with_average_price',
    async (req, res, session) => {
        let calledFromPage = getReqParam(req, 'calledFromPage');
        let subcategoryMongoIdReq = getReqParam(req, 'subcategoryMongoId') as string;
        let isSorting = getReqParam(req, 'isSorting');

        let subcategoryMongoId: ObjectId | undefined;
        if (subcategoryMongoIdReq) {
            subcategoryMongoId = new ObjectId(subcategoryMongoIdReq);
        }

        let searchVal = getReqParam(req, 'searchVal');

        let accountIdStr = getReqParam(req, 'accountViewId');
        let accountViewId: ObjectId | undefined = undefined;
        if (accountIdStr) {
            accountViewId = new ObjectId(getReqParam(req, 'accountViewId'));
        }

        // Always use the session's accountId.
        // const accountId = new ObjectId(String(session.mongoAccountId));
        const accountId = new ObjectId(requireQueryParam(req, 'accountViewId'));

        let laborItems = Db.getLaborItemsCollection();
        let offersCollection = Db.getLaborOffersCollection();

        let matchQuery: any = {};
        // Fetch offers for the current user.
        const offersForAccount = await offersCollection.find({accountId}).toArray();
        const itemIdsForAccount = offersForAccount.map((o) => o.itemId);
        if (itemIdsForAccount.length > 0) {
            if (searchVal && searchVal !== '') {
                // Match items that are in the offers list, belong to the specified subcategory,
                // and whose name or fullCode matches the search value.
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
                // Match items by offers and subcategory.
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

        // Define the offer filter condition based on calledFromPage.
        let offerFilterCond;
        if (calledFromPage === 'offers') {
            offerFilterCond = {$eq: ['$$offer.accountId', accountViewId ?? session.mongoAccountId]};
        } else {
            offerFilterCond = {$eq: ['$$offer.isArchived', false]};
        }
        // log_.info('offerFilterCond', offerFilterCond);

        // Build the aggregation pipeline.
        let pipeline: any[] = [{$match: matchQuery}];

        // Apply sorting.
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
                    from: 'labor_offers',
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
            // {
            //     $addFields: {
            //         averagePrice: {
            //             $cond: {
            //                 if: {$gt: [{$size: '$filteredOffers'}, 0]},
            //                 then: {$avg: '$filteredOffers.price'},
            //                 else: null,
            //             },
            //         },
            //     },
            // },
            {
                $addFields: {
                    laborHours: {
                        $cond: {
                            if: {$gt: [{$size: '$filteredOffers'}, 0]},
                            then: {$round: [{$avg: '$filteredOffers.laborHours'}, 2]},
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

        const data = await laborItems.aggregate(pipeline).toArray();

        // log_.info('data', data);
        respondJsonData(res, data);
    }
);

registerApiSession('labor/fetch_items', async (req, res, session) => {
    let subcategoryMongoIdReq = getReqParam(req, 'subcategoryMongoId');
    let subcategoryMongoId;
    if (subcategoryMongoIdReq) {
        subcategoryMongoId = new ObjectId(subcategoryMongoIdReq);
    }

    let searchVal = getReqParam(req, 'searchVal') as string;
    if (searchVal) {
        searchVal = searchVal.trim();
    }

    let laborItems = Db.getLaborItemsCollection();

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
    const cursor = laborItems.aggregate(pipeline);

    let data: Db.EntityLaborItems[] = [];

    await cursor.forEach((item) => {
        data.push(Db.laborItemToApi(item));
    });

    respondJsonData(res, data);
});

registerApiSession('labor/get_item', async (req, res, session) => {
    let laborItemMongoId = requireMongoIdParam(req, 'laborItemMongoId');

    let pipeline = [
        {
            $match: {
                _id: laborItemMongoId,
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

    let laborItems = Db.getLaborItemsCollection();

    const laborItem = await laborItems.aggregate(pipeline).next();

    respondJsonData(res, laborItem);
});

registerApiSession('labor/add_item', async (req, res, session) => {
    let laborSubcategoryId = requireMongoIdParam(req, 'entityMongoId');
    let laborItemName = requireQueryParam(req, 'entityName');
    let laborItemCode = requireQueryParam(req, 'entityCode');
    let measurementUnitId = requireQueryParam(req, 'measurementUnitId');

    const measurementUnitCollection = Db.getMeasurementUnitCollection();
    const measurementUnit = (await measurementUnitCollection.findOne({
        measurementUnitId: measurementUnitId,
    })) as Db.EntityMeasurementUnit;

    verify(measurementUnit, ' Measurment Unit Not Found');

    let laborSubcategories = Db.getLaborSubcategoriesCollection();
    let parentLaborSubcategory = (await laborSubcategories.findOne({
        _id: laborSubcategoryId,
    })) as Db.EntityLaborSubcategories;

    let newLaborItem: Db.EntityLaborItems = {} as Db.EntityLaborItems;

    if (parentLaborSubcategory) {
        newLaborItem.code = laborItemCode;
        newLaborItem.name = laborItemName;
        newLaborItem.subcategoryCode = parentLaborSubcategory.categoryFullCode;
        newLaborItem.fullCode = parentLaborSubcategory.categoryFullCode + laborItemCode;
        newLaborItem.subcategoryId = parentLaborSubcategory._id;

        newLaborItem.measurementUnitMongoId = measurementUnit!._id;
    }

    let laborItems = Db.getLaborItemsCollection();

    const duplicateItem = await laborItems.findOne({
        subcategoryId: parentLaborSubcategory._id,
        // $or: [
        //   { name: laborItemName },
        //   { code: laborItemCode }
        // ]
        code: laborItemCode,
    });

    verify(!duplicateItem, req.t('error.duplicate_item')); //TODO: translate item_already_exists

    const result = await laborItems.insertOne(newLaborItem);

    respondJsonData(res, result);
});

registerApiSession('labor/update_item', async (req, res, session) => {
    // 1) grab and validate inputs
    const laborItemId = requireMongoIdParam(req, 'entityMongoId');
    const laborItemName = requireQueryParam(req, 'entityName');
    const laborItemCode = requireQueryParam(req, 'entityCode');
    const measurementUnitId = requireQueryParam(req, 'measurementUnitId');

    // 2) verify the unit exists
    const muColl = Db.getMeasurementUnitCollection();
    const measurementUnit = (await muColl.findOne({measurementUnitId})) as Db.EntityMeasurementUnit;
    verify(measurementUnit, req.t('error.measurement_unit_not_found'));

    const laborItems = Db.getLaborItemsCollection();
    const currentItem = (await laborItems.findOne({_id: laborItemId})) as Db.EntityLaborItems;
    verify(currentItem, req.t('error.item_not_found'));

    const subcatColl = Db.getLaborSubcategoriesCollection();
    const parentSubcat = (await subcatColl.findOne({
        _id: currentItem.subcategoryId,
    })) as Db.EntityLaborSubcategories;
    verify(parentSubcat, req.t('error.subcategory_not_found'));

    // 5) make sure no other item in this same subcategory already uses
    //    either the new name or the new code
    const duplicate = await laborItems.findOne({
        subcategoryId: currentItem.subcategoryId,
        _id: {$ne: laborItemId},
        // $or: [
        //   { name: laborItemName },
        //   { code: laborItemCode }
        // ]
        code: laborItemCode,
    });
    verify(!duplicate, req.t('error.duplicate_item'));

    const newFullCode = parentSubcat.categoryFullCode + laborItemCode;

    const result = await laborItems.updateOne(
        {_id: laborItemId},
        {
            $set: {
                name: laborItemName,
                code: laborItemCode,
                fullCode: newFullCode,
                measurementUnitMongoId: measurementUnit._id,
            },
        }
    );

    respondJson(res, result);
});
