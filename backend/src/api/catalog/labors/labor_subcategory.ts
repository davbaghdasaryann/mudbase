import * as Db from '../../../db';

import { getReqParam, requireQueryParam } from '../../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../../server/register';
import { respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { verify } from '../../../tslib/verify';

// registerApiSession('labor/fetch_all_subcategories', async (req, res, session) => {
//     let subcategoriesCollection = Db.getLaborSubcategoriesCollection();

//     const subcategories = await subcategoriesCollection.find({}).sort({ name: 1 }).toArray();

//     let data: Db.EntityLaborSubcategories[] = subcategories.map(item => Db.laborSubcategoryToApi(item));

//     log_.info('data', data)
//     respondJsonData(res, data);
//   });

registerApiSession('labor/fetch_subcategories', async (req, res, session) => {
    // Get category ID from query parameter.
    const categoryMongoId = new ObjectId(requireQueryParam(req, 'categoryMongoId'));
    // Get search value from query parameter.
    let searchVal = getReqParam(req, 'searchVal');
    // log_.info('searchVal', searchVal)
    // Read additional filters from req.body.
    let { subcategoryId, accountId } = req.body || {};

    // Do NOT override categoryMongoId from req.body.
    // Convert selected subcategory and account IDs to ObjectId if provided.
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));
    if (accountId) accountId = new ObjectId(String(accountId));

    const subcategoriesCollection = Db.getLaborSubcategoriesCollection();
    const itemsCollection = Db.getLaborItemsCollection();
    const offersCollection = Db.getLaborOffersCollection();

    // Build the base query for subcategories: they must belong to the current category.
    let baseQuery: any = { categoryId: categoryMongoId };

    // If a subcategory filter is provided, match that specific subcategory.
    if (subcategoryId) {
        baseQuery._id = subcategoryId;
    }

    // Initialize our query.
    let query: any = baseQuery;

    // If a search value is provided, add additional conditions.
    if (searchVal && searchVal !== '') {
        // Build an array of conditions for subcategory fields.
        let orConditions: any[] = [
            { name: { $regex: searchVal, $options: 'i' } },
            { code: { $regex: searchVal, $options: 'i' } },
        ];

        // Also, search in items collection.
        const matchedItems = await itemsCollection
            .find({
                $or: [
                    { name: { $regex: searchVal, $options: 'i' } },
                    { fullCode: { $regex: searchVal, $options: 'i' } },
                ],
            })
            .toArray();

        // Extract matching subcategory IDs from these items.
        const matchedSubcategoryIds = [
            ...new Set(matchedItems.map((item) => item.subcategoryId.toString())),
        ]
            .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : null))
            .filter((id) => id !== null);

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

    // Lookup labor_items for each subcategory.
    pipeline.push({
        $lookup: {
            from: 'labor_items',
            localField: '_id',
            foreignField: 'subcategoryId',
            as: 'items',
        },
    });

    if (accountId) {
        // Use the provided accountId to get offers.
        const offers = await offersCollection.find({ accountId }).toArray();
        const itemIdsFromOffers = offers.map((o) => o.itemId);
        if (itemIdsFromOffers.length > 0) {
            // Ensure that the subcategory's items array has at least one offer item.
            pipeline.push({
                $match: { 'items._id': { $in: itemIdsFromOffers } },
            });

            // Filter the items array so that it only contains items in which offers exist.
            pipeline.push({
                $addFields: {
                    filteredItems: {
                        $filter: {
                            input: '$items',
                            as: 'item',
                            cond: { $in: ['$$item._id', itemIdsFromOffers] },
                        },
                    },
                },
            });

            // Compute childrenQuantity based on the filtered items array.
            pipeline.push({
                $addFields: {
                    childrenQuantity: { $size: '$filteredItems' },
                },
            });

            // Sort and remove temporary fields.
            pipeline.push({ $sort: { code: 1 } });
            pipeline.push({ $project: { items: 0, filteredItems: 0 } });
        } else {
            // If no matching offers found, return empty JSON.
            respondJsonData(res, []);
            return;
        }
    } else {
        // If no account filter provided, count all items.
        pipeline.push({
            $addFields: {
                childrenQuantity: { $size: '$items' },
            },
        });
        pipeline.push({ $sort: { code: 1 } });
        pipeline.push({ $project: { items: 0 } });
    }

    // Run the aggregation.
    const data = await subcategoriesCollection.aggregate(pipeline).toArray();

    // log_.info('data', data);

    respondJsonData(res, data);
});

registerApiSession('labor/fetch_current_account_offers_subcategories', async (req, res, session) => {
    // Get category ID from query parameter.
    const categoryMongoId = new ObjectId(requireQueryParam(req, 'categoryMongoId'));
    const accountId = new ObjectId(requireQueryParam(req, 'accountViewId'));

    // Get search value from query parameter.
    let searchVal = getReqParam(req, 'searchVal');

    // Read additional filter from req.body (only subcategoryId is needed).
    let { subcategoryId } = req.body || {};

    // Convert provided subcategory ID to ObjectId if provided.
    if (subcategoryId) subcategoryId = new ObjectId(String(subcategoryId));

    const subcategoriesCollection = Db.getLaborSubcategoriesCollection();
    const itemsCollection = Db.getLaborItemsCollection();
    const offersCollection = Db.getLaborOffersCollection();

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
            { name: { $regex: searchVal, $options: 'i' } },
            { code: { $regex: searchVal, $options: 'i' } },
        ];

        // Also, search in the items collection.
        const matchedItems = await itemsCollection
            .find({
                $or: [
                    { name: { $regex: searchVal, $options: 'i' } },
                    { fullCode: { $regex: searchVal, $options: 'i' } },
                ],
            })
            .toArray();

        // Extract matching subcategory IDs from these items.
        const matchedSubcategoryIds = [
            ...new Set(matchedItems.map((item) => item.subcategoryId.toString())),
        ]
            .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : null))
            .filter((id) => id !== null);

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

    // Lookup labor_items for each subcategory.
    pipeline.push({
        $lookup: {
            from: 'labor_items',
            localField: '_id',
            foreignField: 'subcategoryId',
            as: 'items',
        },
    });

    // Always use the session's accountId.
    // const accountId = new ObjectId(String(session.mongoAccountId));
    // Fetch offers for the current user.
    const offers = await offersCollection.find({ accountId }).toArray();
    const itemIdsFromOffers = offers.map((o) => o.itemId);

    // If no offers exist, return an empty array.
    if (itemIdsFromOffers.length === 0) {
        respondJsonData(res, []);
        return;
    }

    // (Optional) First match subcategories that have at least one item in offers.
    pipeline.push({
        $match: { 'items._id': { $in: itemIdsFromOffers } },
    });

    // Filter the items array so that it only contains items that are in offers.
    pipeline.push({
        $addFields: {
            items: {
                $filter: {
                    input: '$items',
                    as: 'it',
                    cond: { $in: ['$$it._id', itemIdsFromOffers] },
                },
            },
        },
    });

    // Now compute childrenQuantity based on the filtered items.
    pipeline.push({
        $addFields: {
            childrenQuantity: { $size: '$items' },
        },
    });

    // Sort and project out the temporary items field.
    pipeline.push({ $sort: { code: 1 } });
    pipeline.push({ $project: { items: 0 } });

    // Run the aggregation.
    const subcategories = await subcategoriesCollection.aggregate(pipeline).toArray();
    const data: Db.EntityLaborSubcategories[] = subcategories.map((item) =>
        Db.laborSubcategoryToApi(item)
    );

    log_.info('data', data);
    respondJsonData(res, data);
});

registerApiSession('labor/add_subcategory', async (req, res, session) => {

    let laborCategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    let laborSubcategoryName = requireQueryParam(req, 'entityName');
    let laborSubcartegoryCode = requireQueryParam(req, 'entityCode');

    laborSubcategoryName = laborSubcategoryName.trim();
    if (laborSubcategoryName === '') {
        verify(laborSubcategoryName, req.t('requireq.subcategory_name'));
    }

    let laborCategories = Db.getLaborCategoriesCollection();
    let parentLaborCategory = (await laborCategories.findOne({
        _id: laborCategoryId,
    })) as Db.EntityLaborCategories;

    let newLaborSubcategory: Db.EntityLaborSubcategories = {} as Db.EntityLaborSubcategories;

    if (parentLaborCategory) {
        newLaborSubcategory.code = laborSubcartegoryCode;
        newLaborSubcategory.name = laborSubcategoryName;
        newLaborSubcategory.categoryCode = parentLaborCategory.code;
        newLaborSubcategory.categoryFullCode = parentLaborCategory.code + laborSubcartegoryCode;
        newLaborSubcategory.categoryId = parentLaborCategory._id;
    }

    let laborSubcategories = Db.getLaborSubcategoriesCollection();

    const duplicateSubcategory = await laborSubcategories.findOne({
        categoryId: parentLaborCategory._id,
        // $or: [{ name: laborSubcategoryName }, { code: laborSubcartegoryCode }],
        code: laborSubcartegoryCode
    });

    verify(!duplicateSubcategory, req.t('error.subcategory_already_exists')); //TODO: translate subcategory_already_exists

    const result = await laborSubcategories.insertOne(newLaborSubcategory);

    respondJsonData(res, result);
    // respondJsonData(res, {ok: true});
});



registerHandlerSession('labor', 'update_subcategory', async (req, res, session) => {
    const subcategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    const newName = requireQueryParam(req, 'entityName').trim();
    const newSubcatCode = requireQueryParam(req, 'entityCode').trim();
    verify(newName !== '', req.t('error.subcategory_name_required'));

    const subcatColl = Db.getLaborSubcategoriesCollection();
    const currentSubcat = await subcatColl.findOne({ _id: subcategoryId }) as Db.EntityLaborSubcategories;
    verify(currentSubcat, req.t('error.subcategory_not_found'));

    const catColl = Db.getLaborCategoriesCollection();
    const parentCat = await catColl.findOne({ _id: currentSubcat.categoryId }) as Db.EntityLaborCategories;
    verify(parentCat, req.t('error.category_not_found'));

    const duplicate = await subcatColl.findOne({
        categoryId: currentSubcat.categoryId,
        _id: { $ne: subcategoryId },
        // $or: [
        //     { name: newName },
        //     { code: newSubcatCode }
        // ]
        code: newSubcatCode
    });
    verify(!duplicate, req.t('error.duplicate_item'));

    const newCategoryFullCode = parentCat.code + newSubcatCode;

    await subcatColl.updateOne(
        { _id: subcategoryId },
        {
            $set: {
                name: newName,
                code: newSubcatCode,
                categoryFullCode: newCategoryFullCode
            }
        }
    );

    const itemsColl = Db.getLaborItemsCollection();

    const items = await itemsColl.find({ subcategoryId }).toArray();
    for (const item of items) {
        await itemsColl.updateOne(
            { _id: item._id },
            {
                $set: {
                    subcategoryCode: newSubcatCode,
                    fullCode: parentCat.code + newSubcatCode + item.code
                }
            }
        );
    }

    respondJsonData(res, { ok: true });
});


