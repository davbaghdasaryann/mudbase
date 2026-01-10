import { ObjectId } from 'mongodb';

import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '@/tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '@/server/register';
import { respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';



registerApiSession('labor/fetch_categories', async (req, res, session) => {
    // Get search value and filters from the request.
    let searchVal = getReqParam(req, 'searchVal');
    let { categoryId, subcategoryId, accountId } = req.body || {};

    // Get references to your collections.
    const categoriesColl = Db.getLaborCategoriesCollection();
    // const subcategoriesCollection = Db.getLaborSubcategoriesCollection();
    // const itemsCollection = Db.getLaborItemsCollection();
    const offersColl = Db.getLaborOffersCollection();

    const filters = { categoryId, subcategoryId, accountId };

    Object.keys(filters).forEach(key => {
        const k = key as keyof typeof filters;
        if (filters[k] === 'all' || filters[k] === 'undefined' || filters[k] === undefined) {
            filters[k] = null;
        }
    });

    // log_.info('Filters 1:', { categoryId, subcategoryId, accountId, searchVal });

    // Convert provided filter IDs to ObjectId.
    if (categoryId) categoryId = new ObjectId(String(categoryId));
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));
    if (accountId) accountId = new ObjectId(String(accountId));

    // If accountId is provided, fetch matching offers to get item IDs.
    let itemIdsFromOffers: ObjectId[] = [];
    if (accountId) {
        log_.info('I am accountId');
        const offers = await offersColl.find({ accountId }).toArray();
        // Assume each offer has a field "itemId" (an ObjectId) that refers to a labor item.
        itemIdsFromOffers = offers.map(o => o.itemId);
        if (itemIdsFromOffers.length === 0) {
            respondJsonData(res, []);
            return;
        }
    }

    // Build the aggregation pipeline.
    const pipeline = [];

    // (A) If a category filter is provided, match that category.
    if (categoryId) {
        // log_.info('I am categoryId');
        pipeline.push({ $match: { _id: categoryId } });
    }

    // (B) Lookup subcategories (children) for the category.
    pipeline.push({
        $lookup: {
            from: 'labor_subcategories',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'children'
        }
    });

    // (C) Lookup items for all subcategories.
    pipeline.push({
        $lookup: {
            from: 'labor_items',
            let: { childrenIds: "$children._id" },
            pipeline: [
                { $match: { $expr: { $in: ["$subcategoryId", "$$childrenIds"] } } }
            ],
            as: "allItems"
        }
    });

    // (D) Merge items into each subcategory using $addFields and $map.
    pipeline.push({
        $addFields: {
            children: {
                $map: {
                    input: "$children",
                    as: "child",
                    in: {
                        $mergeObjects: [
                            "$$child",
                            {
                                items: {
                                    $filter: {
                                        input: "$allItems",
                                        as: "it",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$it.subcategoryId", "$$child._id"] },
                                                // When filtering by offers, limit items to only those matching the offer IDs.
                                                accountId ? { $in: ["$$it._id", itemIdsFromOffers] } : {}
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    // (E) Additional matching based on subcategory filter.
    if (subcategoryId && accountId && itemIdsFromOffers.length > 0) {
        pipeline.push({
            $match: {
                children: {
                    $elemMatch: {
                        _id: subcategoryId,
                        items: { $elemMatch: { _id: { $in: itemIdsFromOffers } } }
                    }
                }
            }
        });
    } else if (subcategoryId) {
        log_.info('I am subcategoryId');
        pipeline.push({
            $match: {
                children: { $elemMatch: { _id: subcategoryId } }
            }
        });
    } else if (accountId && itemIdsFromOffers.length > 0) {
        pipeline.push({
            $match: {
                children: {
                    $elemMatch: { items: { $elemMatch: { _id: { $in: itemIdsFromOffers } } } }
                }
            }
        });
    }

    // (F) If a search value is provided, add a match stage to check category, subcategory, and item fields.
    if (searchVal && searchVal !== '') {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: searchVal, $options: "i" } },
                    { code: { $regex: searchVal, $options: "i" } },
                    { "children.name": { $regex: searchVal, $options: "i" } },
                    { "children.code": { $regex: searchVal, $options: "i" } },
                    { "children.items.name": { $regex: searchVal, $options: "i" } },
                    { "children.items.code": { $regex: searchVal, $options: "i" } },
                    { "children.items.fullCode": { $regex: searchVal, $options: "i" } }
                ]
            }
        });
    }

    // (G) Compute childrenQuantity:
    // - If an account filter exists, count only children with at least one offer item.
    // - Otherwise, count all children.
    if (accountId) {
        pipeline.push({
            $addFields: {
                children: {
                    $filter: {
                        input: "$children",
                        as: "child",
                        cond: { $gt: [{ $size: "$$child.items" }, 0] }
                    }
                }
            }
        });
        pipeline.push({
            $addFields: {
                childrenQuantity: { $size: "$children" }
            }
        });
    } else {
        pipeline.push({
            $addFields: {
                childrenQuantity: { $size: "$children" }
            }
        });
    }

    // (H) Sort and project the final data.
    pipeline.push({ $sort: { code: 1 } });
    // Optionally remove the "allItems" array.
    pipeline.push({ $project: { children: 0, allItems: 0 } });

    // Run the aggregation.
    const finalCategories = await categoriesColl.aggregate(pipeline).toArray();
    const data = finalCategories.map(item => Db.laborCategoryToApi(item));
    // log_.info('data', data);
    // log_.info('Filters:', { categoryId, subcategoryId, accountId, searchVal });

    respondJsonData(res, data);
});



// registerApiSession('labor/fetch_categories', async (req, res, session) => {
//     // Get search value and filters from the request.
//     let searchVal = getReqParam(req, 'searchVal');
//     let { categoryId, subcategoryId, accountId } = req.body || {};

//     // Get references to your collections.
//     const categoriesCollection = Db.getLaborCategoriesCollection();
//     const subcategoriesCollection = Db.getLaborSubcategoriesCollection();
//     const itemsCollection = Db.getLaborItemsCollection();
//     const offersCollection = Db.getLaborOffersCollection();


//     const filters = { categoryId, subcategoryId, accountId };

//     Object.keys(filters).forEach(key => {
//         const k = key as keyof typeof filters;
//         if (filters[k] === 'all' || filters[k] === 'undefined' || filters[k] === undefined) {
//             filters[k] = null;
//         }
//     });

//     log_.info('Filters 1:', { categoryId, subcategoryId, accountId, searchVal });



//     // Convert provided filter IDs to ObjectId.
//     if (categoryId) categoryId = new ObjectId(String(categoryId));
//     if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));
//     if (accountId) accountId = new ObjectId(String(accountId));

//     // If accountId is provided, fetch matching offers to get item IDs.
//     let itemIdsFromOffers: ObjectId[] = [];
//     if (accountId) {
//         log_.info('I am accountId')
//         const offers = await offersCollection.find({ accountId }).toArray();
//         // Assume each offer has a field "itemId" (an ObjectId) that refers to a labor item.
//         itemIdsFromOffers = offers.map(o => o.itemId);
//         if (itemIdsFromOffers.length === 0) {
//             respondJsonData(res, {ok: true});
//             return;
//         }

//     }

//     // Build the aggregation pipeline.
//     const pipeline = [];

//     // (A) If a category filter is provided, match that category.
//     if (categoryId) {
//         log_.info('I am categoryId')

//         pipeline.push({ $match: { _id: categoryId } });
//     }

//     // (B) Lookup subcategories (children) for the category.
//     pipeline.push({
//         $lookup: {
//             from: 'labor_subcategories',
//             localField: '_id',
//             foreignField: 'categoryId',
//             as: 'children'
//         }
//     });

//     // (C) Lookup items for all subcategories.
//     // This top-level lookup returns all items for subcategories in an array "allItems".
//     pipeline.push({
//         $lookup: {
//             from: 'labor_items',
//             let: { childrenIds: "$children._id" },
//             pipeline: [
//                 { $match: { $expr: { $in: ["$subcategoryId", "$$childrenIds"] } } }
//             ],
//             as: "allItems"
//         }
//     });

//     // (D) Merge items into each subcategory using $addFields and $map.
//     pipeline.push({
//         $addFields: {
//             children: {
//                 $map: {
//                     input: "$children",
//                     as: "child",
//                     in: {
//                         $mergeObjects: [
//                             "$$child",
//                             {
//                                 items: {
//                                     $filter: {
//                                         input: "$allItems",
//                                         as: "it",
//                                         cond: { $eq: ["$$it.subcategoryId", "$$child._id"] }
//                                     }
//                                 }
//                             }
//                         ]
//                     }
//                 }
//             }
//         }
//     });

//     // // (E) If a subcategory filter is provided, require that at least one child has that _id.
//     // if (subcategoryId) {
//     //     log_.info('I am subcategoryId')

//     //     pipeline.push({
//     //         $match: { "children._id": subcategoryId }
//     //     });
//     // }

//     // // (F) If an account filter exists, require that at least one item (in any child) has an _id in itemIdsFromOffers.
//     // if (accountId && itemIdsFromOffers.length > 0) {
//     //     pipeline.push({
//     //         $match: { "children.items._id": { $in: itemIdsFromOffers } }
//     //     });
//     // }

//     if (subcategoryId && accountId && itemIdsFromOffers.length > 0) {
//         pipeline.push({
//             $match: {
//                 children: {
//                     $elemMatch: {
//                         _id: subcategoryId,
//                         items: { $elemMatch: { _id: { $in: itemIdsFromOffers } } }
//                     }
//                 }
//             }
//         });
//     } else if (subcategoryId) {
//         // (F) If only subcategory filter is provided, require that at least one child has that _id.
//         log_.info('I am subcategoryId');
//         pipeline.push({
//             $match: {
//                 children: { $elemMatch: { _id: subcategoryId } }
//             }
//         });
//     } else if (accountId && itemIdsFromOffers.length > 0) {
//         // (G) If only account filter is provided, require that at least one child contains an item with _id in itemIdsFromOffers.
//         pipeline.push({
//             $match: {
//                 children: {
//                     $elemMatch: { items: { $elemMatch: { _id: { $in: itemIdsFromOffers } } } }
//                 }
//             }
//         });
//     }

//     // (G) If a search value is provided, add a match stage to check category, subcategory, and item fields.
//     if (searchVal && searchVal !== '') {
//         pipeline.push({
//             $match: {
//                 $or: [
//                     { name: { $regex: searchVal, $options: "i" } },
//                     { code: { $regex: searchVal, $options: "i" } },
//                     { "children.name": { $regex: searchVal, $options: "i" } },
//                     { "children.code": { $regex: searchVal, $options: "i" } },
//                     { "children.items.name": { $regex: searchVal, $options: "i" } },
//                     { "children.items.code": { $regex: searchVal, $options: "i" } },
//                     { "children.items.fullCode": { $regex: searchVal, $options: "i" } }
//                 ]
//             }
//         });
//     }

//     // (E) Append your old stages: add childrenQuantity, sort, and project.
//     pipeline.push({
//         $addFields: {
//             childrenQuantity: { $size: "$children" }
//         }
//     });

//     // (H) Sort and project the final data.
//     pipeline.push({ $sort: { code: 1 } });
//     // Optionally remove the "allItems" array.
//     pipeline.push({ $project: { children: 0, allItems: 0 } });

//     // Run the aggregation.
//     const finalCategories = await categoriesCollection.aggregate(pipeline).toArray();
//     const data = finalCategories.map(item => Db.laborCategoryToApi(item));
//     log_.info('data', data);
//     log_.info('Filters:', { categoryId, subcategoryId, accountId, searchVal });
//     // log_.info('Pipeline:', JSON.stringify(pipeline, null, 2));

//     respondJsonData(res, data);
// });










registerApiSession('labor/fetch_current_account_offers_categories', async (req, res, session) => {
    // Get search value and filters from the request.
    let searchVal = getReqParam(req, 'searchVal');
    let { categoryId, subcategoryId } = req.body || {};

    // Build filters object and normalize values.
    const filters = { categoryId, subcategoryId };
    Object.keys(filters).forEach(key => {
        const k = key as keyof typeof filters;
        if (filters[k] === 'all' || filters[k] === 'undefined' || filters[k] === undefined) {
            filters[k] = null;
        }
    });

    // log_.info('Filters:', { categoryId, subcategoryId, searchVal });

    // Always use the session's accountId.
    // const accountId = session.mongoAccountId;
    const accountId = new ObjectId(requireQueryParam(req, 'accountViewId'));


    // Convert provided filter IDs to ObjectId.
    if (categoryId) categoryId = new ObjectId(String(categoryId));
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));

    // Get a reference to the offers collection.
    const offersCollection = Db.getLaborOffersCollection();

    // Fetch offers for the current user using session.mongoAccountId.
    const offers = await offersCollection.find({ accountId: new ObjectId(String(accountId)) }).toArray();
    const itemIdsFromOffers = offers.map(o => o.itemId);

    // If no offers exist, return an empty array.
    if (itemIdsFromOffers.length === 0) {
        respondJsonData(res, []);
        return;
    }

    // Get references to the categories collection.
    const categoriesCollection = Db.getLaborCategoriesCollection();

    // Build the aggregation pipeline.
    const pipeline = [];

    // (A) If a category filter is provided, match that category.
    if (categoryId) {
        // log_.info('Filtering by categoryId');
        pipeline.push({ $match: { _id: categoryId } });
    }

    // (B) Lookup subcategories (children) for each category.
    pipeline.push({
        $lookup: {
            from: 'labor_subcategories',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'children'
        }
    });

    // (C) Lookup items for all subcategories.
    pipeline.push({
        $lookup: {
            from: 'labor_items',
            let: { childrenIds: "$children._id" },
            pipeline: [
                { $match: { $expr: { $in: ["$subcategoryId", "$$childrenIds"] } } }
            ],
            as: "allItems"
        }
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
                    input: "$children",
                    as: "child",
                    in: {
                        $mergeObjects: [
                            "$$child",
                            {
                                items: {
                                    $filter: {
                                        input: "$allItems",
                                        as: "it",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$it.subcategoryId", "$$child._id"] },
                                                { $in: ["$$it._id", itemIdsFromOffers] }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    });




    // (E) Filter out categories that do not have at least one subcategory
    // containing an item (within that subcategory) matching an offer.
    if (subcategoryId) {
        // If a specific subcategory filter is provided, ensure that subcategory has an item from offers.
        pipeline.push({
            $match: {
                children: {
                    $elemMatch: {
                        _id: subcategoryId,
                        items: { $elemMatch: { _id: { $in: itemIdsFromOffers } } }
                    }
                }
            }
        });
    } else {
        // Otherwise, require that at least one subcategory contains an item in the offers.
        pipeline.push({
            $match: {
                children: {
                    $elemMatch: { items: { $elemMatch: { _id: { $in: itemIdsFromOffers } } } }
                }
            }
        });
    }

    // (F) If a search value is provided, add a match stage.
    if (searchVal && searchVal !== '') {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: searchVal, $options: "i" } },
                    { code: { $regex: searchVal, $options: "i" } },
                    { "children.name": { $regex: searchVal, $options: "i" } },
                    { "children.code": { $regex: searchVal, $options: "i" } },
                    { "children.items.name": { $regex: searchVal, $options: "i" } },
                    { "children.items.code": { $regex: searchVal, $options: "i" } },
                    { "children.items.fullCode": { $regex: searchVal, $options: "i" } }
                ]
            }
        });
    }

    // // (G) Append additional stages: add childrenQuantity, sort, and project.
    // pipeline.push({
    //     $addFields: {
    //         childrenQuantity: { $size: "$children" }
    //     }
    // });


    // First, filter the children to only include those that have at least one item.
    pipeline.push({
        $addFields: {
            filteredChildren: {
                $filter: {
                    input: "$children",
                    as: "child",
                    // Only keep a child if it has at least one item
                    // (i.e. the size of its items array is greater than 0)
                    cond: { $gt: [{ $size: "$$child.items" }, 0] }
                }
            }
        }
    });

    // Then, count the filtered children.
    pipeline.push({
        $addFields: {
            childrenQuantity: { $size: "$filteredChildren" }
        }
    });

    pipeline.push({ $sort: { code: 1 } });
    // pipeline.push({ $project: { children: 0, allItems: 0 } });
    pipeline.push({ $project: { children: 0, filteredChildren: 0, allItems: 0 } });

    // Run the aggregation.
    const data = await categoriesCollection.aggregate(pipeline).toArray();
    
    // log_.info('Final data:', data);

    respondJsonData(res, data);
});



registerHandlerSession('labor', 'add_category', async (req, res, session) => {
    let laborCategoryName = requireQueryParam(req, 'entityName');
    let laborCartegoryCode = requireQueryParam(req, 'entityCode');


    verify(laborCategoryName && laborCartegoryCode, req.t('requireq.catregory_name_&_code'));

    let newLaborCategory: Db.EntityLaborCategories = {} as Db.EntityLaborCategories
    newLaborCategory.code = laborCartegoryCode as string;
    newLaborCategory.name = laborCategoryName as string;

    let laborCategories = Db.getLaborCategoriesCollection();

    const duplicateCategory = await laborCategories.findOne({
        // $or: [
        //     { name: laborCategoryName },
        //     { code: laborCartegoryCode }
        // ]
        code: laborCartegoryCode
    });

    verify(!duplicateCategory, req.t('error.category_already_exists')); //TODO: translate category_name_already_exists  


    const result = await laborCategories.insertOne(newLaborCategory);



    respondJsonData(res, result);
});


// registerHandlerSession('labor', 'update_category', async (req, res, session) => {
//     let laborCategoryNewName = requireQueryParam(req, 'entityName');
//     let laborCategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));

//     verify(laborCategoryNewName, req.t('required.category_name'));

//     let laborCategories = Db.getLaborCategoriesCollection();

//     const duplicateCategory = await laborCategories.findOne({
//         name: laborCategoryNewName,
//     });

//     log_.info('duplicateCategory', duplicateCategory)
//     // {name: "ՔԱՆԴՄԱՆ ԵՎ ԱՊԱՄՈՆՏԱԺՄԱՆ ԱՇԽԱՏԱՆՔՆԵՐ"
//     verify(!duplicateCategory, req.t('error.category_name_already_exists')) //TODO: translate category_name_already_exists  

//     const result = await laborCategories.updateOne({ _id: laborCategoryId }, { $set: { name: laborCategoryNewName } });



//     respondJsonData(res, result);
// });




registerHandlerSession('labor', 'update_category', async (req, res, session) => {
    const categoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    const newName = requireQueryParam(req, 'entityName').trim();
    const newCode = requireQueryParam(req, 'entityCode').trim();
    verify(newName !== '' && newCode !== '', req.t('error.category_name_and_code_required'));

    const catColl = Db.getLaborCategoriesCollection();
    const currentCat = await catColl.findOne({ _id: categoryId }) as Db.EntityLaborCategories | null;
    verify(currentCat, req.t('error.category_not_found'));

    const dupCat = await catColl.findOne({
        _id: { $ne: categoryId },
        // $or: [
        //     { name: newName },
        //     { code: newCode }
        // ]
        code: newCode
    });
    verify(!dupCat, req.t('error.duplicate_item'));

    await catColl.updateOne(
        { _id: categoryId },
        { $set: { name: newName, code: newCode } }
    );

    const subcatColl = Db.getLaborSubcategoriesCollection();
    const itemsColl = Db.getLaborItemsCollection();

    const subcats = await subcatColl
        .find({ categoryId })
        .toArray() as Db.EntityLaborSubcategories[];

    for (const subcat of subcats) {
        const newSubcatFull = newCode + subcat.code;

        await subcatColl.updateOne(
            { _id: subcat._id },
            {
                $set: {
                    categoryCode: newCode,
                    categoryFullCode: newSubcatFull
                }
            }
        );

        await itemsColl.updateMany(
            { subcategoryId: subcat._id },
            [{
                $set: {
                    subcategoryCode: newSubcatFull,
                    fullCode: {
                        $concat: [
                            newSubcatFull,
                            '$code'
                        ]
                    }
                }
            }]
        );
    }

    respondJsonData(res, { ok: true });
});






// registerHandlerSession('labor', 'archive_category', async (req, res, session) => {
//     let laborCategoryNewName = requireQueryParam(req, 'entityName');
//     let laborCategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));

//     verify(laborCategoryNewName, req.t('required.category_name'));

//     let laborCategories = Db.getLaborCategoriesCollection();
//     await laborCategories.updateOne({ _id: laborCategoryId }, { $set: { isArchived: true } });



//     respondJsonData(res, 'new laber category updated');
// });

// registerHandlerSession('labor', 'unarchive_category', async (req, res, session) => {
//     let laborCategoryNewName = requireQueryParam(req, 'entityName');
//     let laborCategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));

//     verify(laborCategoryNewName, req.t('required.category_name'));

//     let laborCategories = Db.getLaborCategoriesCollection();
//     await laborCategories.updateOne({ _id: laborCategoryId }, { $set: { isArchived: false } });



//     respondJsonData(res, 'new laber category updated');
// });