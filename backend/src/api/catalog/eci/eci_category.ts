import { ObjectId } from 'mongodb';

import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '@/tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '@/server/register';
import { respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';


registerApiSession('eci/fetch_categories', async (req, res, session) => {
    let searchVal = getReqParam(req, 'searchVal');

    const categoriesColl = Db.getEciCategoriesCollection();

    const pipeline: any[] = [];

    // Lookup subcategories
    pipeline.push({
        $lookup: {
            from: 'eci_subcategories',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'children'
        }
    });

    // Lookup estimates for all subcategories
    pipeline.push({
        $lookup: {
            from: 'eci_estimates',
            let: { childrenIds: "$children._id" },
            pipeline: [
                { $match: { $expr: { $in: ["$subcategoryId", "$$childrenIds"] } } }
            ],
            as: "allItems"
        }
    });

    // Merge estimates into each subcategory
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
                                        cond: { $eq: ["$$it.subcategoryId", "$$child._id"] }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    // Search filter
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

    // Compute childrenQuantity
    pipeline.push({
        $addFields: {
            childrenQuantity: { $size: "$children" }
        }
    });

    pipeline.push({ $sort: { code: 1 } });
    pipeline.push({ $project: { children: 0, allItems: 0 } });

    const finalCategories = await categoriesColl.aggregate(pipeline).toArray();
    const data = finalCategories.map(item => Db.eciCategoryToApi(item));

    respondJsonData(res, data);
});


registerHandlerSession('eci', 'add_category', async (req, res, session) => {
    let categoryName = requireQueryParam(req, 'entityName');
    let categoryCode = requireQueryParam(req, 'entityCode');

    verify(categoryName && categoryCode, req.t('requireq.catregory_name_&_code'));

    let newCategory: Db.EntityEciCategories = {} as Db.EntityEciCategories;
    newCategory.code = categoryCode as string;
    newCategory.name = categoryName as string;

    let categoriesColl = Db.getEciCategoriesCollection();

    const duplicateCategory = await categoriesColl.findOne({ code: categoryCode });
    verify(!duplicateCategory, req.t('error.category_already_exists'));

    const result = await categoriesColl.insertOne(newCategory);

    respondJsonData(res, result);
});


registerHandlerSession('eci', 'update_category', async (req, res, session) => {
    const categoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    const newName = requireQueryParam(req, 'entityName').trim();
    const newCode = requireQueryParam(req, 'entityCode').trim();
    verify(newName !== '' && newCode !== '', req.t('error.category_name_and_code_required'));

    const catColl = Db.getEciCategoriesCollection();
    const currentCat = await catColl.findOne({ _id: categoryId });
    verify(currentCat, req.t('error.category_not_found'));

    const dupCat = await catColl.findOne({
        _id: { $ne: categoryId },
        code: newCode
    });
    verify(!dupCat, req.t('error.duplicate_item'));

    await catColl.updateOne(
        { _id: categoryId },
        { $set: { name: newName, code: newCode } }
    );

    // Cascade update to subcategories and estimates
    const subcatColl = Db.getEciSubcategoriesCollection();
    const estimatesColl = Db.getEciEstimatesCollection();

    const subcats = await subcatColl.find({ categoryId }).toArray();

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

        await estimatesColl.updateMany(
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


registerHandlerSession('eci', 'delete_category', async (req, res, session) => {
    const categoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));

    const catColl = Db.getEciCategoriesCollection();
    const subcatColl = Db.getEciSubcategoriesCollection();
    const estimatesColl = Db.getEciEstimatesCollection();

    const category = await catColl.findOne({ _id: categoryId });
    verify(category, req.t('error.category_not_found'));

    const subcategories = await subcatColl.find({ categoryId }).toArray();

    for (const subcat of subcategories) {
        await estimatesColl.deleteMany({ subcategoryId: subcat._id });
    }

    await subcatColl.deleteMany({ categoryId });
    const result = await catColl.deleteOne({ _id: categoryId });

    respondJsonData(res, { ok: true, deletedCount: result.deletedCount });
});
