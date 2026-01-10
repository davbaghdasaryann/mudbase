import * as Db from '../../../db';

import {getReqParam, requireQueryParam} from '../../../tsback/req/req_params';
import {registerApiSession, registerHandlerSession} from '../../../server/register';
import {respondJsonData} from '../../../tsback/req/req_response';
import {ObjectId} from 'mongodb';
import {verify} from '../../../tslib/verify';

registerApiSession('material/fetch_categories', async (req, res, session) => {
    let searchVal = getReqParam(req, 'searchVal');
    let {categoryId, subcategoryId, accountId} = req.body || {};

    // Normalize filters: if equal to 'all', set to null.
    if (categoryId === 'all') {
        categoryId = null;
    }
    if (subcategoryId === 'all') {
        subcategoryId = null;
    }
    if (accountId === 'all') {
        accountId = null;
    }

    // log_.info('Filters:', { categoryId, subcategoryId, accountId, searchVal });

    // Convert provided filter IDs to ObjectId.
    if (categoryId) categoryId = new ObjectId(String(categoryId));
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));
    if (accountId) accountId = new ObjectId(String(accountId));


    

    // Get references to your collections.
    const categoriesColl = Db.getMaterialCategoriesCollection();
    // const subcategoriesCollection = Db.getMaterialSubcategoriesCollection();
    // const itemsCollection = Db.getMaterialItemsCollection();
    const offersCollection = Db.getMaterialOffersCollection();


    // If accountId is provided, fetch matching offers to get item IDs.
    let itemIdsFromOffers: ObjectId[] = [];
    if (accountId) {
        const offers = await offersCollection.find({accountId}).toArray();
        // Assume each offer has a field "itemId" (an ObjectId) that refers to a material item.
        itemIdsFromOffers = offers.map((o) => o.itemId);
        if (itemIdsFromOffers.length === 0) {
            respondJsonData(res, []);
            return;
        }
    }

    // Build the aggregation pipeline.
    const pipeline = [];

    // (A) If a category filter is provided, match that category.
    if (categoryId) {
        pipeline.push({$match: {_id: categoryId}});
    }

    // (B) Lookup subcategories (children) for the category.
    pipeline.push({
        $lookup: {
            from: 'material_subcategories',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'children',
        },
    });

    // (C) Lookup items for all subcategories.
    pipeline.push({
        $lookup: {
            from: 'material_items',
            let: {childrenIds: '$children._id'},
            pipeline: [{$match: {$expr: {$in: ['$subcategoryId', '$$childrenIds']}}}],
            as: 'allItems',
        },
    });

    // (D) Merge items into each subcategory.
    pipeline.push({
        $addFields: {
            children: {
                $map: {
                    input: '$children',
                    as: 'child',
                    in: {
                        $mergeObjects: [
                            '$$child',
                            {
                                items: {
                                    $filter: {
                                        input: '$allItems',
                                        as: 'it',
                                        cond: {
                                            $and: [
                                                {$eq: ['$$it.subcategoryId', '$$child._id']},
                                                // When an account filter exists, limit items to only those matching offers.
                                                accountId
                                                    ? {$in: ['$$it._id', itemIdsFromOffers]}
                                                    : {},
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    });

    // (E) Further match based on subcategory/account filters.
    if (subcategoryId && accountId && itemIdsFromOffers.length > 0) {
        pipeline.push({
            $match: {
                children: {
                    $elemMatch: {
                        _id: subcategoryId,
                        items: {$elemMatch: {_id: {$in: itemIdsFromOffers}}},
                    },
                },
            },
        });
    } else if (subcategoryId) {
        // log_.info('I am subcategoryId');
        pipeline.push({
            $match: {
                children: {$elemMatch: {_id: subcategoryId}},
            },
        });
    } else if (accountId && itemIdsFromOffers.length > 0) {
        pipeline.push({
            $match: {
                children: {
                    $elemMatch: {items: {$elemMatch: {_id: {$in: itemIdsFromOffers}}}},
                },
            },
        });
    }

    // (F) If a search value is provided, add a match stage.
    if (searchVal && searchVal !== '') {
        pipeline.push({
            $match: {
                $or: [
                    {name: {$regex: searchVal, $options: 'i'}},
                    {code: {$regex: searchVal, $options: 'i'}},
                    {'children.name': {$regex: searchVal, $options: 'i'}},
                    {'children.code': {$regex: searchVal, $options: 'i'}},
                    {'children.items.name': {$regex: searchVal, $options: 'i'}},
                    {'children.items.code': {$regex: searchVal, $options: 'i'}},
                    {'children.items.fullCode': {$regex: searchVal, $options: 'i'}},
                ],
            },
        });
    }

    // (G) Compute childrenQuantity:
    // - If an account filter exists, count only children with non-empty items (offers).
    // - Otherwise, count all children.
    if (accountId) {
        pipeline.push({
            $addFields: {
                children: {
                    $filter: {
                        input: '$children',
                        as: 'child',
                        cond: {$gt: [{$size: '$$child.items'}, 0]},
                    },
                },
            },
        });
        pipeline.push({
            $addFields: {
                childrenQuantity: {$size: '$children'},
            },
        });
    } else {
        pipeline.push({
            $addFields: {
                childrenQuantity: {$size: '$children'},
            },
        });
    }

    // (H) Sort and project the final data.
    pipeline.push({$sort: {code: 1}});
    pipeline.push({$project: {children: 0, allItems: 0}});

    // Run the aggregation.
    const finalCategories = await categoriesColl.aggregate(pipeline).toArray();
    // const data = finalCategories.map(item => Db.materialCategoryToApi(item));
    // log_.info('data', data);
    // log_.info('Filters:', { categoryId, subcategoryId, accountId, searchVal });
    // log_.info('Pipeline:', JSON.stringify(pipeline, null, 2));

    respondJsonData(res, finalCategories);
});

registerApiSession(
    'material/fetch_current_account_offers_categories',
    async (req, res, session) => {
        let searchVal = getReqParam(req, 'searchVal');
        let {categoryId, subcategoryId} = req.body || {};

        // Normalize filters: if equal to 'all', set to null.
        if (categoryId === 'all') {
            categoryId = null;
        }
        if (subcategoryId === 'all') {
            subcategoryId = null;
        }
        log_.info('Filters:', {categoryId, subcategoryId, searchVal});

        // Always use the session's accountId for "my offers"
        // const accountId = session.mongoAccountId;
        const accountId = new ObjectId(requireQueryParam(req, 'accountViewId'));

        // Convert provided filter IDs to ObjectId.
        if (categoryId) categoryId = new ObjectId(String(categoryId));
        if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));

        // Get references to your collections.
        const categoriesColl = Db.getMaterialCategoriesCollection();
        const offersColl = Db.getMaterialOffersCollection();

        // Fetch offers for the current user using session.mongoAccountId.
        const offers = await offersColl
            .find({accountId: new ObjectId(String(accountId))})
            .toArray();
        const itemIdsFromOffers = offers.map((o) => o.itemId);

        // If no offers exist, return an empty array.
        if (itemIdsFromOffers.length === 0) {
            respondJsonData(res, []);
            return;
        }

        // Build the aggregation pipeline.
        const pipeline = [];

        // (A) If a category filter is provided, match that category.
        if (categoryId) {
            pipeline.push({$match: {_id: categoryId}});
        }

        // (B) Lookup subcategories (children) for the category.
        pipeline.push({
            $lookup: {
                from: 'material_subcategories',
                localField: '_id',
                foreignField: 'categoryId',
                as: 'children',
            },
        });

        // (C) Lookup items for all subcategories.
        pipeline.push({
            $lookup: {
                from: 'material_items',
                let: {childrenIds: '$children._id'},
                pipeline: [{$match: {$expr: {$in: ['$subcategoryId', '$$childrenIds']}}}],
                as: 'allItems',
            },
        });

        // // (D) Merge items into each subcategory.
        // pipeline.push({
        //     $addFields: {
        //         children: {
        //             $map: {
        //                 input: "$children",
        //                 as: "child",
        //                 in: {
        //                     $mergeObjects: [
        //                         "$$child",
        //                         {
        //                             items: {
        //                                 $filter: {
        //                                     input: "$allItems",
        //                                     as: "it",
        //                                     cond: { $eq: ["$$it.subcategoryId", "$$child._id"] }
        //                                 }
        //                             }
        //                         }
        //                     ]
        //                 }
        //             }
        //         }
        //     }
        // });

        pipeline.push({
            $addFields: {
                children: {
                    $map: {
                        input: '$children',
                        as: 'child',
                        in: {
                            $mergeObjects: [
                                '$$child',
                                {
                                    items: {
                                        $filter: {
                                            input: '$allItems',
                                            as: 'it',
                                            cond: {
                                                $and: [
                                                    {$eq: ['$$it.subcategoryId', '$$child._id']},
                                                    {$in: ['$$it._id', itemIdsFromOffers]},
                                                ],
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        });

        // (E) Filter categories:
        // If a subcategory filter is provided, require that the specific subcategory contains at least one item with an _id in itemIdsFromOffers.
        // Otherwise, require that at least one subcategory contains an item from offers.
        if (subcategoryId) {
            pipeline.push({
                $match: {
                    children: {
                        $elemMatch: {
                            _id: subcategoryId,
                            items: {$elemMatch: {_id: {$in: itemIdsFromOffers}}},
                        },
                    },
                },
            });
        } else {
            pipeline.push({
                $match: {
                    children: {
                        $elemMatch: {
                            items: {$elemMatch: {_id: {$in: itemIdsFromOffers}}},
                        },
                    },
                },
            });
        }

        // (F) If a search value is provided, add a match stage to check category, subcategory, and item fields.
        if (searchVal && searchVal !== '') {
            pipeline.push({
                $match: {
                    $or: [
                        {name: {$regex: searchVal, $options: 'i'}},
                        {code: {$regex: searchVal, $options: 'i'}},
                        {'children.name': {$regex: searchVal, $options: 'i'}},
                        {'children.code': {$regex: searchVal, $options: 'i'}},
                        {'children.items.name': {$regex: searchVal, $options: 'i'}},
                        {'children.items.code': {$regex: searchVal, $options: 'i'}},
                        {'children.items.fullCode': {$regex: searchVal, $options: 'i'}},
                    ],
                },
            });
        }

        // // (G) Append stages to compute childrenQuantity, sort, and project out temporary arrays.
        // pipeline.push({
        //     $addFields: {
        //         childrenQuantity: { $size: "$children" }
        //     }
        // });

        pipeline.push({
            $addFields: {
                children: {
                    $filter: {
                        input: '$children',
                        as: 'child',
                        cond: {$gt: [{$size: '$$child.items'}, 0]},
                    },
                },
            },
        });

        // (E) Now compute childrenQuantity based on the filtered children array.
        pipeline.push({
            $addFields: {
                childrenQuantity: {$size: '$children'},
            },
        });

        pipeline.push({$sort: {code: 1}});
        pipeline.push({$project: {children: 0, filteredChildren: 0, allItems: 0}});

        // Run the aggregation.
        const finalCategories = await categoriesColl.aggregate(pipeline).toArray();

        // log_.info('finalCategories', finalCategories);
        respondJsonData(res, finalCategories);
    }
);

registerApiSession('material/add_category', async (req, res, session) => {
    let materialCategoryName = requireQueryParam(req, 'entityName');
    let materialCartegoryCode = requireQueryParam(req, 'entityCode');

    verify(materialCategoryName && materialCartegoryCode, req.t('requireq.catregory_name_&_code'));

    let newMaterialCategory: Db.EntityMaterialCategories = {} as Db.EntityMaterialCategories;
    newMaterialCategory.code = materialCartegoryCode;
    newMaterialCategory.name = materialCategoryName;

    let materialCategoriesColl = Db.getMaterialCategoriesCollection();

    const duplicateCategory = await materialCategoriesColl.findOne({
        // $or: [
        //     { name: materialCategoryName },
        //     { code: materialCartegoryCode }
        // ]
        code: materialCartegoryCode,
    });

    verify(!duplicateCategory, req.t('error.category_name_already_exists')); //TODO: translate category_name_already_exists

    const result = await materialCategoriesColl.insertOne(newMaterialCategory);

    respondJsonData(res, result);
});

registerApiSession('material/update_category', async (req, res, session) => {
    const materialCategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    const newName = requireQueryParam(req, 'entityName').trim();
    const newCode = requireQueryParam(req, 'entityCode').trim();
    verify(newName !== '' && newCode !== '', req.t('error.category_name_and_code_required'));

    const catColl = Db.getMaterialCategoriesCollection();
    const currentCat = await catColl.findOne({_id: materialCategoryId});
    verify(currentCat, req.t('error.category_not_found'));

    const dupCat = await catColl.findOne({
        _id: {$ne: materialCategoryId},
        // $or: [
        //     { name: newName },
        //     { code: newCode }
        // ]
        code: newCode,
    });
    verify(!dupCat, req.t('error.duplicate_item'));

    await catColl.updateOne({_id: materialCategoryId}, {$set: {name: newName, code: newCode}});

    const subcatColl = Db.getMaterialSubcategoriesCollection();
    const itemColl = Db.getMaterialItemsCollection();

    const subcats = (await subcatColl
        .find({categoryId: materialCategoryId})
        .toArray()) as Db.EntityMaterialSubcategories[];

    for (const subcat of subcats) {
        const newSubcatFullCode = newCode + subcat.code;

        await subcatColl.updateOne(
            {_id: subcat._id},
            {
                $set: {
                    categoryCode: newCode,
                    categoryFullCode: newSubcatFullCode,
                },
            }
        );

        await itemColl.updateMany({subcategoryId: subcat._id}, [
            {
                $set: {
                    subcategoryCode: newSubcatFullCode,
                    fullCode: {
                        $concat: [newSubcatFullCode, '$code'],
                    },
                },
            },
        ]);
    }

    respondJsonData(res, {ok: true});
});
