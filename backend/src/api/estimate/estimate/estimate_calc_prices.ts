import {ObjectId} from 'mongodb';

import {registerApiSession} from '@/server/register';
import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';

export function calcEstimateOtherExpensesCost(estimate: Db.EntityEstimate): number {
    const expenses = estimate.otherExpenses;

    let otherExpensesSum = 0;
    if (Array.isArray(expenses)) {
        for (const expense of expenses) {
            const keys = Object.keys(expense);
            if (keys.length > 0) {
                const expenseValue = Number(expense[keys[0]]) || 0;
                otherExpensesSum += expenseValue;
            }
        }
    }

    const totalCost = estimate.totalCost ?? 0;
    const otherExpensesCost = totalCost * (otherExpensesSum / 100);
    // const totalCostWithOtherExpenses = totalCost + totalCost * (otherExpensesSum / 100);
    return otherExpensesCost;
}

export async function updateEstimateCostById(estimateId: ObjectId) {
    // const estimates
    const estimatesColl = Db.getEstimatesCollection();
    const estimate = (await estimatesColl.findOne({_id: estimateId}))!;

    await updateEstimateCost(estimate);
}

export async function updateEstimateCost(estimate: Db.EntityEstimate) {
    const estimatesColl = Db.getEstimatesCollection();

    let materialTotalCost: number = 0;


    // Get all sections and subsections
    const sectionsColl = Db.getEstimateSectionsCollection();
    const sections = await sectionsColl.find({estimateId: estimate._id}).toArray();
    const sectionsById = new Map<String, Db.EntityEstimateSection>();
    for (let section of sections) {
        section.tempTotalCost = 0;
        sectionsById.set(section._id.toString(), section);
    }

    const subSectionsColl = Db.getEstimateSubsectionsCollection();
    const subSections = await subSectionsColl.find({estimateId: estimate._id}).toArray();
    const subSectionsById = new Map<String, Db.EntityEstimateSubsection>();
    for (let subSection of subSections) {
        subSection.tempTotalCost = 0;
        subSectionsById.set(subSection._id.toString(), subSection);
    }


    const estimateLaborColl = Db.getEstimateLaborItemsCollection();
    const laborItems = await estimateLaborColl.find({estimateId: estimate._id}).toArray();
    const hiddenLaborIds = new Set(laborItems.filter((l) => l.isHidden).map((l) => l._id.toString()));
    let laborTotalWithoutMaterial: number = 0;
    for (let labor of laborItems) {
        if (labor.isHidden) continue;
        if (labor.quantity && labor.changableAveragePrice) {
            let laborCost = labor.quantity * labor.changableAveragePrice
            let subSection = subSectionsById.get(labor.estimateSubsectionId.toString());
            if (subSection) {
                let section = sectionsById.get(subSection.estimateSectionId.toString());
                if (section) {
                    subSection.tempTotalCost += laborCost;
                    section.tempTotalCost += laborCost;

                    laborTotalWithoutMaterial += laborCost;
                }
            }
        }
    }


    const estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();
    const materialItems = await estimateMaterialItemsColl.find({estimateId: estimate._id}).toArray();
    for (let material of materialItems) {
        if (hiddenLaborIds.has(material.estimatedLaborId.toString())) continue;
        if (material.quantity && material.changableAveragePrice) {
            let materialCost = material.quantity * material.changableAveragePrice;

            let subSection = subSectionsById.get(material.estimateSubsectionId.toString());
            if (subSection) {
                let section = sectionsById.get(subSection.estimateSectionId.toString());
                if (section) {
                    subSection.tempTotalCost += materialCost;
                    section.tempTotalCost += materialCost;
                    materialTotalCost += materialCost;
                }
            }
        }
    }

    // Update all the sections and subsections
    for (let [sectionId, section] of sectionsById) {
        if (section.totalCost === section.tempTotalCost)
            continue;
        await sectionsColl.updateOne({_id: section._id}, {$set: {totalCost: section.tempTotalCost}});

        // log_.info("Updating section:", section._id);
    }

    for (let [subSectionId, subSection] of subSectionsById) {
        if (subSection.totalCost === subSection.tempTotalCost)
            continue;
        await subSectionsColl.updateOne({_id: subSection._id}, {$set: {totalCost: subSection.tempTotalCost}});

        // log_.info("Updating subSection:", subSection._id);
    }


    const totalCost = laborTotalWithoutMaterial + materialTotalCost;
    const otherExpensesCost = calcEstimateOtherExpensesCost(estimate);

    // estimate.totalCost

    const totalCostWithOtherExpenses = totalCost + otherExpensesCost;

    // log_.info('est', estimate)

    // Update the document in the database.
    const result = await estimatesColl.updateOne(
        {_id: estimate._id},
        {$set: {totalCost: totalCost, totalCostWithOtherExpenses: totalCostWithOtherExpenses}}
    );
}

function parseOptionalLaborIds(body: any): ObjectId[] | undefined {
    const ids = body?.estimatedLaborIds;
    if (!Array.isArray(ids) || ids.length === 0) return undefined;
    return ids.map((id: string) => new ObjectId(id)).filter(Boolean);
}

registerApiSession('estimate/calc_market_prices', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimatedLaborIds = parseOptionalLaborIds(req.body);

    const estimatesColl = Db.getEstimatesCollection();

    const estimate = (await estimatesColl.findOne({_id: estimateId}))!;

    assertObject(estimate, 'Invalid Estimate Id');

    const laborMatch: any = {estimateId: estimateId};
    if (estimatedLaborIds?.length) {
        laborMatch._id = {$in: estimatedLaborIds};
    }

    //
    // Update labor items (all or selected)
    //
    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();

    await estimateLaborItemsColl
        .aggregate([
            {$match: laborMatch},
            {
                $lookup: {
                    from: 'labor_items',
                    let: {mid: '$laborItemId'},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$mid']}}},
                        {$project: {_id: 0, averagePrice: 1}},
                    ],
                    as: 'matched',
                },
            },
            {$set: {changableAveragePrice: {$first: '$matched.averagePrice'}, priceSource: 'market'}},
            {$unset: 'matched'},
            {
                $merge: {
                    into: 'estimate_labor_items',
                    on: '_id',
                    whenMatched: 'merge',
                    whenNotMatched: 'discard',
                },
            },
        ])
        .toArray(); // force execution

    //
    // Update material items (all or those under selected labor items)
    //
    const estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();

    const materialMatch: any = {estimateId: estimateId};
    if (estimatedLaborIds?.length) {
        materialMatch.estimatedLaborId = {$in: estimatedLaborIds};
    }

    await estimateMaterialItemsColl
        .aggregate([
            {$match: materialMatch},
            {
                $lookup: {
                    from: 'material_items',
                    let: {mid: '$materialItemId'},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$_id', '$$mid']}}},
                        {$project: {_id: 0, averagePrice: 1}},
                    ],
                    as: 'matched',
                },
            },
            {$set: {changableAveragePrice: {$first: '$matched.averagePrice'}}},
            {$unset: 'matched'},
            {
                $merge: {
                    into: 'estimate_material_items',
                    on: '_id',
                    whenMatched: 'merge',
                    whenNotMatched: 'discard',
                },
            },
        ])
        .toArray(); // force execution

    await updateEstimateCostById(estimateId);

    respondJson(res, estimate);
});

/** Import this account's own labor offer prices into estimate labor items (builders). */
registerApiSession('estimate/import_my_prices', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimatedLaborIds = parseOptionalLaborIds(req.body);
    const accountId = session.mongoAccountId;
    if (!accountId) {
        respondJson(res, { ok: false, message: 'Account required' });
        return;
    }

    const estimate = (await Db.getEstimatesCollection().findOne({ _id: estimateId }))!;
    assertObject(estimate, 'Invalid Estimate Id');

    const laborMatch: any = { estimateId };
    if (estimatedLaborIds?.length) laborMatch._id = { $in: estimatedLaborIds };

    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();

    await estimateLaborItemsColl
        .aggregate([
            { $match: laborMatch },
            {
                $lookup: {
                    from: 'labor_offers',
                    let: { laborItemIdVar: '$laborItemId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$itemId', '$$laborItemIdVar'] },
                                accountId: accountId,
                                isArchived: false,
                            },
                        },
                        { $sort: { updatedAt: -1 } },
                        { $limit: 1 },
                        { $project: { price: 1 } },
                    ],
                    as: 'myOffer',
                },
            },
            {
                $set: {
                    changableAveragePrice: { $ifNull: [{ $arrayElemAt: ['$myOffer.price', 0] }, '$changableAveragePrice'] },
                    priceSource: {
                        $cond: {
                            if: { $gt: [{ $size: '$myOffer' }, 0] },
                            then: 'my_offer',
                            else: '$priceSource',
                        },
                    },
                },
            },
            { $unset: 'myOffer' },
            {
                $merge: {
                    into: 'estimate_labor_items',
                    on: '_id',
                    whenMatched: 'merge',
                    whenNotMatched: 'discard',
                },
            },
        ])
        .toArray();

    await updateEstimateCostById(estimateId);

    respondJson(res, estimate);
});
