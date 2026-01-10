import { registerApiSession } from '@/server/register';

import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '@/tsback/req/req_params';
import { respondJsonData } from '@/tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';


registerApiSession('material/fetch_subcategories', async (req, res, session) => {
    // Get category ID from query parameter.
    const categoryMongoId = requireMongoIdParam(req, 'categoryMongoId');
    // Get search value from query parameter.
    let searchVal = getReqParam(req, 'searchVal');

    // Read additional filters from req.body.
    let { subcategoryId, accountId } = req.body || {};

    // Convert 'all' values to null.
    if (subcategoryId === 'all') {
        subcategoryId = null;
    }
    if (accountId === 'all') {
        accountId = null;
    }

    // Convert provided filter IDs to ObjectId if provided.
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));
    if (accountId) accountId = new ObjectId(String(accountId));

    // Get references to your collections.
    const subcategoriesCollection = Db.getMaterialSubcategoriesCollection();
    const itemsCollection = Db.getMaterialItemsCollection();
    const offersCollection = Db.getMaterialOffersCollection();

    // Build the base query for subcategories: they must belong to the current category.
    let baseQuery: any = { categoryId: categoryMongoId };
    if (subcategoryId) {
        baseQuery._id = subcategoryId;
    }

    // Initialize our query.
    let query: any = baseQuery;

    // If a search value is provided, add additional conditions.
    if (searchVal && searchVal !== '') {
        // Build an array of conditions for subcategory fields.
        let orConditions: any[] = [
            { name: { $regex: searchVal, $options: "i" } },
            { code: { $regex: searchVal, $options: "i" } }
        ];

        // Also, search in the material items collection.
        const matchedItems = await itemsCollection.find({
            $or: [
                { name: { $regex: searchVal, $options: "i" } },
                { fullCode: { $regex: searchVal, $options: "i" } }
            ]
        }).toArray();

        // Extract matching subcategory IDs from these items.
        const matchedSubcategoryIds = [
            ...new Set(matchedItems.map(item => item.subcategoryId.toString()))
        ]
            .map(id => ObjectId.isValid(id) ? new ObjectId(id) : null)
            .filter(id => id !== null);

        log_.info('matchedSubcategoryIds', matchedSubcategoryIds);

        if (matchedSubcategoryIds.length > 0) {
            orConditions.push({ _id: { $in: matchedSubcategoryIds } });
        }

        // Combine the base query with the OR conditions.
        query = { $and: [baseQuery, { $or: orConditions }] };
    }

    // Start building the aggregation pipeline.
    const pipeline = [];
    pipeline.push({ $match: query });

    // Lookup material_items for each subcategory.
    pipeline.push({
        $lookup: {
            from: 'material_items', // ensure this matches your collection name
            localField: '_id',
            foreignField: 'subcategoryId',
            as: 'items'
        }
    });

    // If an account filter is provided, fetch matching offers to get item IDs.
    if (accountId) {
        const offers = await offersCollection.find({ accountId }).toArray();
        const itemIdsFromOffers: ObjectId[] = offers.map(o => o.itemId);
        if (itemIdsFromOffers.length > 0) {
            // Ensure that the subcategory's items array contains at least one matching offer item.
            pipeline.push({
                $match: { "items._id": { $in: itemIdsFromOffers } }
            });
            // Filter the items array so that it only contains items that are in the offers list.
            pipeline.push({
                $addFields: {
                    filteredItems: {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: { $in: ["$$item._id", itemIdsFromOffers] }
                        }
                    }
                }
            });
            // Compute childrenQuantity based on the filtered items.
            pipeline.push({
                $addFields: {
                    childrenQuantity: { $size: "$filteredItems" }
                }
            });
            pipeline.push({ $sort: { code: 1 } });
            pipeline.push({ $project: { items: 0, filteredItems: 0 } });
        } else {
            // If no matching offers found, return an empty JSON object.
            respondJsonData(res, []);
            return;
        }
    } else {
        // If no account filter provided, count all items.
        pipeline.push({
            $addFields: {
                childrenQuantity: { $size: "$items" }
            }
        });
        pipeline.push({ $sort: { code: 1 } });
        pipeline.push({ $project: { items: 0 } });
    }

    // Run the aggregation.
    const subcategories = await subcategoriesCollection.aggregate(pipeline).toArray();
    const data: Db.EntityMaterialSubcategories[] = subcategories.map(item => Db.materialSubcategoryToApi(item));

    // log_.info('data', data);
    // log_.info('Filters:', { categoryMongoId, subcategoryId, accountId, searchVal });
    // log_.info('Pipeline:', JSON.stringify(pipeline, null, 2));

    respondJsonData(res, data);
});



registerApiSession('material/fetch_current_account_offers_subcategories', async (req, res, session) => {
    // Get category ID from query parameter.
    const categoryMongoId = requireMongoIdParam(req, 'categoryMongoId');
    const accountId = requireMongoIdParam(req, 'accountViewId');

    // Get search value from query parameter.
    let searchVal = getReqParam(req, 'searchVal');

    // Read additional filter from req.body: only subcategoryId is needed.
    let { subcategoryId } = req.body || {};

    // Convert 'all' values to null.
    if (subcategoryId === 'all') {
        subcategoryId = null;
    }

    // Convert provided subcategoryId to ObjectId if provided.
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));

    // Get references to your collections.
    const subcategoriesCollection = Db.getMaterialSubcategoriesCollection();
    const itemsCollection = Db.getMaterialItemsCollection();
    const offersColl = Db.getMaterialOffersCollection();

    // Build the base query for subcategories: they must belong to the current category.
    let baseQuery: any = { categoryId: categoryMongoId };
    if (subcategoryId) {
        baseQuery._id = subcategoryId;
    }

    // Initialize our query.
    let query: any = baseQuery;

    // If a search value is provided, add additional conditions.
    if (searchVal && searchVal !== '') {
        let orConditions: any[] = [
            { name: { $regex: searchVal, $options: "i" } },
            { code: { $regex: searchVal, $options: "i" } }
        ];

        // Also, search in the material items collection.
        const matchedItems = await itemsCollection.find({
            $or: [
                { name: { $regex: searchVal, $options: "i" } },
                { fullCode: { $regex: searchVal, $options: "i" } }
            ]
        }).toArray();

        // Extract matching subcategory IDs from these items.
        const matchedSubcategoryIds = [
            ...new Set(matchedItems.map(item => item.subcategoryId.toString()))
        ]
            .map(id => ObjectId.isValid(id) ? new ObjectId(id) : null)
            .filter(id => id !== null);

        log_.info('matchedSubcategoryIds', matchedSubcategoryIds);

        if (matchedSubcategoryIds.length > 0) {
            orConditions.push({ _id: { $in: matchedSubcategoryIds } });
        }

        // Combine the base query with the OR conditions.
        query = { $and: [baseQuery, { $or: orConditions }] };
    }

    // Start building the aggregation pipeline.
    const pipeline = [];
    pipeline.push({ $match: query });

    // Lookup material_items for each subcategory.
    pipeline.push({
        $lookup: {
            from: 'material_items',
            localField: '_id',
            foreignField: 'subcategoryId',
            as: 'items'
        }
    });

    // Always use the session's accountId.
    // const accountId = new ObjectId(String(session.mongoAccountId));
    // Fetch offers for the current user.
    const offers = await offersColl.find({ accountId }).toArray();
    const itemIdsFromOffers = offers.map(o => o.itemId);

    // If no offers exist, return an empty JSON object.
    if (itemIdsFromOffers.length === 0) {
        respondJsonData(res, []);
        return;
    }

    // Filter subcategories: require that their items include at least one from the user's offers.
    pipeline.push({
        $match: { "items._id": { $in: itemIdsFromOffers } }
    });

    // Filter the items array so that it only contains items that are in the offers list.
    pipeline.push({
        $addFields: {
            filteredItems: {
                $filter: {
                    input: "$items",
                    as: "item",
                    cond: { $in: ["$$item._id", itemIdsFromOffers] }
                }
            }
        }
    });

    // Compute childrenQuantity based on the filtered items array.
    pipeline.push({
        $addFields: {
            childrenQuantity: { $size: "$filteredItems" }
        }
    });

    // Sort and remove temporary fields.
    pipeline.push({ $sort: { code: 1 } });
    pipeline.push({ $project: { items: 0, filteredItems: 0 } });

    // Run the aggregation.
    const subcategories = await subcategoriesCollection.aggregate(pipeline).toArray();
    const data: Db.EntityMaterialSubcategories[] = subcategories.map(item => Db.materialSubcategoryToApi(item));

    // log_.info('data', data);
    // log_.info('Filters:', { categoryMongoId, subcategoryId, searchVal });
    // log_.info('Pipeline:', JSON.stringify(pipeline, null, 2));

    respondJsonData(res, data);
});








registerApiSession('material/add_subcategory', async (req, res, session) => {
    let materialCategoryId = requireMongoIdParam(req, 'entityMongoId');
    let materialSubcategoryName = requireQueryParam(req, 'entityName');
    let materialSubcartegoryCode = requireQueryParam(req, 'entityCode');

    materialSubcategoryName = materialSubcategoryName.trim();
    if (materialSubcategoryName === '') {
        verify(materialSubcategoryName, req.t('required.subcategory_name'));
    }


    let materialCategories = Db.getMaterialCategoriesCollection();
    let parentMaterialCategory = await materialCategories.findOne({ _id: materialCategoryId }) as Db.EntityMaterialCategories;

    let newMaterialSubcategory: Db.EntityMaterialSubcategories = {} as Db.EntityMaterialSubcategories

    if (parentMaterialCategory) {
        newMaterialSubcategory.code = materialSubcartegoryCode;
        newMaterialSubcategory.name = materialSubcategoryName;
        newMaterialSubcategory.categoryCode = parentMaterialCategory.code;
        newMaterialSubcategory.categoryFullCode = parentMaterialCategory.code + materialSubcartegoryCode;
        newMaterialSubcategory.categoryId = parentMaterialCategory._id;
    }


    let materialSubcategories = Db.getMaterialSubcategoriesCollection();

    const duplicateSubcategory = await materialSubcategories.findOne({
        categoryId: parentMaterialCategory._id,
        // $or: [
        //     { name: materialSubcategoryName },
        //     { code: materialSubcartegoryCode }
        // ]
        code: materialSubcartegoryCode
    });

    verify(!duplicateSubcategory, req.t('error.subcategory_already_exists')); //TODO: translate subcategory_already_exists  

    const result = await materialSubcategories.insertOne(newMaterialSubcategory);

    respondJsonData(res, result);
});


registerApiSession('material/update_subcategory', async (req, res, session) => {
    const materialSubcategoryId = requireMongoIdParam(req, 'entityMongoId');
    const newName = requireQueryParam(req, 'entityName').trim();
    const newCode = requireQueryParam(req, 'entityCode').trim();
    verify(newName !== '', req.t('error.subcategory_name_required'));

    const subcatColl = Db.getMaterialSubcategoriesCollection();
    const currentSubcat = await subcatColl.findOne({ _id: materialSubcategoryId }) as Db.EntityMaterialSubcategories;
    verify(currentSubcat, req.t('error.subcategory_not_found'));

    const catColl = Db.getMaterialCategoriesCollection();
    const parentCategory = await catColl.findOne({ _id: currentSubcat.categoryId }) as Db.EntityMaterialCategories;
    verify(parentCategory, req.t('error.category_not_found'));

    const duplicate = await subcatColl.findOne({
        categoryId: currentSubcat.categoryId,
        _id: { $ne: materialSubcategoryId },
        // $or: [
        //     { name: newName },
        //     { code: newCode }
        // ]
        code: newCode
    });
    verify(!duplicate, req.t('error.duplicate_item'));

    const newFullCode = parentCategory.code + newCode;
    await subcatColl.updateOne(
        { _id: materialSubcategoryId },
        {
            $set: {
                name: newName,
                code: newCode,
                categoryFullCode: newFullCode
            }
        }
    );

    const itemsColl = Db.getMaterialItemsCollection();


    const items = await itemsColl.find({ subcategoryId: materialSubcategoryId }).toArray();
    for (const item of items) {
        await itemsColl.updateOne(
            { _id: item._id },
            {
                $set: {
                    subcategoryCode: newCode,
                    fullCode: parentCategory.code + newCode + item.code
                }
            }
        );
    }

    respondJsonData(res, { ok: true });
});
