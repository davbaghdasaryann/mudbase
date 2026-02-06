import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '@/tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '@/server/register';
import { respondJsonData } from '@/tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { verify } from '@/tslib/verify';


registerApiSession('eci/fetch_subcategories', async (req, res, session) => {
    const categoryMongoId = new ObjectId(requireQueryParam(req, 'categoryMongoId'));
    let searchVal = getReqParam(req, 'searchVal');

    const subcategoriesCollection = Db.getEciSubcategoriesCollection();
    const estimatesCollection = Db.getEciEstimatesCollection();

    let baseQuery: any = { categoryId: categoryMongoId };
    let query: any = baseQuery;

    if (searchVal && searchVal !== '') {
        let orConditions: any[] = [
            { name: { $regex: searchVal, $options: 'i' } },
            { code: { $regex: searchVal, $options: 'i' } },
        ];

        const matchedEstimates = await estimatesCollection
            .find({
                $or: [
                    { name: { $regex: searchVal, $options: 'i' } },
                    { fullCode: { $regex: searchVal, $options: 'i' } },
                ],
            })
            .toArray();

        const matchedSubcategoryIds = [
            ...new Set(matchedEstimates.map((item) => item.subcategoryId.toString())),
        ]
            .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : null))
            .filter((id) => id !== null);

        if (matchedSubcategoryIds.length > 0) {
            orConditions.push({ _id: { $in: matchedSubcategoryIds } });
        }

        query = { $and: [baseQuery, { $or: orConditions }] };
    }

    const pipeline: any[] = [];
    pipeline.push({ $match: query });

    // Lookup eci_estimates for each subcategory
    pipeline.push({
        $lookup: {
            from: 'eci_estimates',
            localField: '_id',
            foreignField: 'subcategoryId',
            as: 'items',
        },
    });

    // Count estimates as childrenQuantity
    pipeline.push({
        $addFields: {
            childrenQuantity: { $size: '$items' },
        },
    });
    pipeline.push({ $sort: { code: 1 } });
    pipeline.push({ $project: { items: 0 } });

    const data = await subcategoriesCollection.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});


registerApiSession('eci/add_subcategory', async (req, res, session) => {
    let categoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    let subcategoryName = requireQueryParam(req, 'entityName');
    let subcategoryCode = requireQueryParam(req, 'entityCode');

    subcategoryName = subcategoryName.trim();
    verify(subcategoryName !== '', req.t('requireq.subcategory_name'));

    let categoriesColl = Db.getEciCategoriesCollection();
    let parentCategory = await categoriesColl.findOne({ _id: categoryId });
    verify(parentCategory, req.t('error.category_not_found'));

    let newSubcategory: Db.EntityEciSubcategories = {} as Db.EntityEciSubcategories;
    newSubcategory.code = subcategoryCode;
    newSubcategory.name = subcategoryName;
    newSubcategory.categoryCode = parentCategory!.code;
    newSubcategory.categoryFullCode = parentCategory!.code + subcategoryCode;
    newSubcategory.categoryId = parentCategory!._id;

    let subcategoriesColl = Db.getEciSubcategoriesCollection();

    const duplicateSubcategory = await subcategoriesColl.findOne({
        categoryId: parentCategory!._id,
        code: subcategoryCode
    });
    verify(!duplicateSubcategory, req.t('error.subcategory_already_exists'));

    const result = await subcategoriesColl.insertOne(newSubcategory);

    respondJsonData(res, result);
});


registerHandlerSession('eci', 'update_subcategory', async (req, res, session) => {
    const subcategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));
    const newName = requireQueryParam(req, 'entityName').trim();
    const newSubcatCode = requireQueryParam(req, 'entityCode').trim();
    verify(newName !== '', req.t('error.subcategory_name_required'));

    const subcatColl = Db.getEciSubcategoriesCollection();
    const currentSubcat = await subcatColl.findOne({ _id: subcategoryId });
    verify(currentSubcat, req.t('error.subcategory_not_found'));

    const catColl = Db.getEciCategoriesCollection();
    const parentCat = await catColl.findOne({ _id: currentSubcat!.categoryId });
    verify(parentCat, req.t('error.category_not_found'));

    const duplicate = await subcatColl.findOne({
        categoryId: currentSubcat!.categoryId,
        _id: { $ne: subcategoryId },
        code: newSubcatCode
    });
    verify(!duplicate, req.t('error.duplicate_item'));

    const newCategoryFullCode = parentCat!.code + newSubcatCode;

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

    // Cascade to estimates
    const estimatesColl = Db.getEciEstimatesCollection();
    const estimates = await estimatesColl.find({ subcategoryId }).toArray();
    for (const est of estimates) {
        await estimatesColl.updateOne(
            { _id: est._id },
            {
                $set: {
                    subcategoryCode: newSubcatCode,
                    fullCode: parentCat!.code + newSubcatCode + est.code
                }
            }
        );
    }

    respondJsonData(res, { ok: true });
});


registerHandlerSession('eci', 'delete_subcategory', async (req, res, session) => {
    const subcategoryId = new ObjectId(requireQueryParam(req, 'entityMongoId'));

    const subcatColl = Db.getEciSubcategoriesCollection();
    const estimatesColl = Db.getEciEstimatesCollection();

    const subcategory = await subcatColl.findOne({ _id: subcategoryId });
    verify(subcategory, req.t('error.subcategory_not_found'));

    await estimatesColl.deleteMany({ subcategoryId });
    const result = await subcatColl.deleteOne({ _id: subcategoryId });

    respondJsonData(res, { ok: true, deletedCount: result.deletedCount });
});
