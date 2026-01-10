import { ObjectId } from 'mongodb';

import * as Db from '../../db';

import { getReqParam, requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';


// registerApiSession('estimates_shares/fetch', async (req, res, session) => {
//     let searchVal = getReqParam(req, 'searchVal');
//     let { accountId } = req.body || {};

//     const estimatesSharesCollection = Db.getEstimatesSharesCollection();

//     // Explicitly type the pipeline as any[]
//     let pipeline: any[] = [
//         {
//             $match: { sharedWithAccountId: session.mongoAccountId }
//         } as any
//     ];

//     // If accountId is provided (and not 'all'), add an extra match for sharedByAccountId.
//     if (accountId && accountId !== 'all') {
//         pipeline.push({
//             $match: { sharedByAccountId: new ObjectId(accountId) }
//         } as any);
//     }

//     // Add the lookup and unwind stages.
//     pipeline.push(
//         {
//             $lookup: {
//                 from: "estimates",
//                 localField: "sharedEstimateId",
//                 foreignField: "_id",
//                 as: "estimatesData"
//             }
//         } as any,
//         { $unwind: "$estimatesData" } as any,
//         {
//             $lookup: {
//                 from: "accounts",
//                 localField: "sharedByAccountId",
//                 foreignField: "_id",
//                 as: "sharedByAccountData"
//             }
//         } as any,
//         { $unwind: "$sharedByAccountData" } as any
//     );

//     // If searchVal is provided (and not 'empty'), add filtering for estimatesData fields.
//     if (searchVal !== 'empty') {
//         pipeline.push({
//             $match: {
//                 $or: [
//                     { "estimatesData.estimateNumber": { $regex: searchVal, $options: "i" } },
//                     { "estimatesData.name": { $regex: searchVal, $options: "i" } },
//                     { "estimatesData.address": { $regex: searchVal, $options: "i" } }
//                 ]
//             }
//         } as any);
//     }

//     // Lookup to calculate the average totalCost for estimates with the same estimateNumber.
//     pipeline.push({
//         $lookup: {
//             from: "estimates",
//             let: { estNumber: "$estimatesData.estimateNumber" },
//             pipeline: [
//                 {
//                     $match: {
//                         $expr: {
//                             $and: [
//                                 { $eq: ["$estimateNumber", "$$estNumber"] },
//                                 { $gt: ["$totalCostWithOtherExpenses", 0] }
//                             ]
//                         }
//                     }
//                 },
//                 {
//                     $project: {
//                         adjustedCost: {
//                             $cond: {
//                                 if: { $lt: ["$totalCostWithOtherExpenses", 2] },
//                                 then: 2,
//                                 else: "$totalCostWithOtherExpenses"
//                             }
//                         }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         avgPrice: { $avg: "$adjustedCost" }
//                     }
//                 }
//             ],
//             as: "avgPriceData"
//         }
//     } as any);

//     // Add the calculated average price to the document.
//     pipeline.push({
//         $addFields: {
//             theSameEstNumAveragePrice: { $arrayElemAt: ["$avgPriceData.avgPrice", 0] }
//         }
//     } as any);

//     // Remove the temporary avgPriceData field.
//     pipeline.push({
//         $project: {
//             avgPriceData: 0
//         }
//     } as any);

//     const estimatesData = await estimatesSharesCollection.aggregate(pipeline).toArray();
//     log_.info('estimatesData', estimatesData);
//     respondJsonData(res, estimatesData);
// });

registerApiSession('estimates_shares/fetch', async (req, res, session) => {
    let searchVal = getReqParam(req, 'searchVal');
    let { accountId } = req.body || {};

    const estimatesSharesCollection = Db.getEstimatesSharesCollection();

    const notDeletedFilter = { deleted: { $ne: true } };


    let pipeline: any[] = [
        {
            $match: {
                sharedWithAccountId: session.mongoAccountId,
                ...notDeletedFilter,
                sharedByAccountId: {$ne: session.mongoAccountId}
            }
        } as any
    ];

    // If accountId is provided (and not 'all'), add an extra match for sharedByAccountId.
    if (accountId && accountId !== 'all') {
        pipeline.push({
          $match: {
            sharedByAccountId: new ObjectId(accountId),
            ...notDeletedFilter
          }
        } as any);
      }
      
    // log_.info('accountId', accountId, req.body)

    // Add the lookup and unwind stages.
    pipeline.push(
        {
            $lookup: {
                from: "estimates",
                localField: "sharedEstimateId",
                foreignField: "_id",
                as: "estimatesData"
            }
        } as any,
        { $unwind: "$estimatesData" } as any,
        {
            $lookup: {
                from: "accounts",
                localField: "sharedByAccountId",
                foreignField: "_id",
                as: "sharedByAccountData"
            }
        } as any,
        { $unwind: "$sharedByAccountData" } as any
    );

    // If searchVal is provided (and not 'empty'), add filtering for estimatesData fields.
    if (searchVal !== 'empty') {
        pipeline.push({
            $match: {
                $or: [
                    { "estimatesData.estimateNumber": { $regex: searchVal, $options: "i" } },
                    { "estimatesData.name": { $regex: searchVal, $options: "i" } },
                    { "estimatesData.address": { $regex: searchVal, $options: "i" } }
                ]
            }
        } as any);
    }

    // Lookup to calculate the average totalCostWithOtherExpenses for estimates with the same estimateNumber.
    pipeline.push({
        $lookup: {
            from: "estimates",
            let: { estNumber: "$estimatesData.estimateNumber" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$estimateNumber", "$$estNumber"] },
                                { $gt: ["$totalCostWithOtherExpenses", 0] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        adjustedCost: {
                            $cond: {
                                if: { $lt: ["$totalCostWithOtherExpenses", 2] },
                                then: 2,
                                else: "$totalCostWithOtherExpenses"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgPrice: { $avg: "$adjustedCost" }
                    }
                }
            ],
            as: "avgPriceData"
        }
    } as any);

    // Add the calculated average price to the document.
    pipeline.push({
        $addFields: {
            theSameEstNumAveragePrice: { $arrayElemAt: ["$avgPriceData.avgPrice", 0] }
        }
    } as any);

    // Remove the temporary avgPriceData field.
    pipeline.push({
        $project: {
            avgPriceData: 0
        }
    } as any);

    // New stages: Group duplicates if they have the same sharedEstimateId when sharedByAccountId equals session.mongoAccountId.
    // We create a new field "groupKey": if sharedByAccountId equals session.mongoAccountId, then groupKey is sharedEstimateId, otherwise use _id to keep it unique.
    pipeline.push({
        $addFields: {
            groupKey: {
                $cond: [
                    { $eq: ["$sharedByAccountId", session.mongoAccountId] },
                    "$sharedEstimateId",
                    "$_id"
                ]
            }
        }
    } as any);

    // Group by the groupKey, keeping only one document per group.
    pipeline.push({
        $group: {
            _id: "$groupKey",
            doc: { $first: "$$ROOT" }
        }
    } as any);

    // Replace the root with the deduplicated document.
    pipeline.push({
        $replaceRoot: { newRoot: "$doc" }
    } as any);
    pipeline.push({ $sort: { sharedAt: -1 } });

    const estimatesData = await estimatesSharesCollection.aggregate(pipeline).toArray();
    log_.info('estimate share res data', estimatesData);
    respondJsonData(res, estimatesData);
});



registerApiSession('estimates_shared_by_me/fetch', async (req, res, session) => {
    let searchVal = getReqParam(req, 'searchVal');
    let { accountId } = req.body || {};

    const estimatesSharesCollection = Db.getEstimatesSharesCollection();

    const notDeletedFilter = { deleted: { $ne: true } };


    let pipeline: any[] = [
        {
            $match: {
                sharedByAccountId: session.mongoAccountId,
                ...notDeletedFilter,
                isDuplicatedChild: { $ne: true },
                // isDuplicatedChild: false,
            }
        } as any
    ];

    // If accountId is provided (and not 'all'), add an extra match for sharedByAccountId.
    if (accountId && accountId !== 'all') {
        pipeline.push({
          $match: {
            sharedWithAccountId: new ObjectId(accountId),
            ...notDeletedFilter
          }
        } as any);
      }
      
    // log_.info('accountId', accountId, req.body)

    // Add the lookup and unwind stages.
    pipeline.push(
        {
            $lookup: {
                from: "estimates",
                localField: "sharedEstimateId",
                foreignField: "_id",
                as: "estimatesData"
            }
        } as any,
        { $unwind: "$estimatesData" } as any,
        {
            $lookup: {
                from: "accounts",
                localField: "sharedWithAccountId",
                foreignField: "_id",
                as: "sharedWithAccountData"
            }
        } as any,
        { $unwind: "$sharedWithAccountData" } as any
    );

    // If searchVal is provided (and not 'empty'), add filtering for estimatesData fields.
    if (searchVal !== 'empty') {
        pipeline.push({
            $match: {
                $or: [
                    { "estimatesData.estimateNumber": { $regex: searchVal, $options: "i" } },
                    { "estimatesData.name": { $regex: searchVal, $options: "i" } },
                    { "estimatesData.address": { $regex: searchVal, $options: "i" } }
                ]
            }
        } as any);
    }

    // // Lookup to calculate the average totalCostWithOtherExpenses for estimates with the same estimateNumber.
    // pipeline.push({
    //     $lookup: {
    //         from: "estimates",
    //         let: { estNumber: "$estimatesData.estimateNumber" },
    //         pipeline: [
    //             {
    //                 $match: {
    //                     $expr: {
    //                         $and: [
    //                             { $eq: ["$estimateNumber", "$$estNumber"] },
    //                             { $gt: ["$totalCostWithOtherExpenses", 0] }
    //                         ]
    //                     }
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     adjustedCost: {
    //                         $cond: {
    //                             if: { $lt: ["$totalCostWithOtherExpenses", 2] },
    //                             then: 2,
    //                             else: "$totalCostWithOtherExpenses"
    //                         }
    //                     }
    //                 }
    //             },
    //             {
    //                 $group: {
    //                     _id: null,
    //                     avgPrice: { $avg: "$adjustedCost" }
    //                 }
    //             }
    //         ],
    //         as: "avgPriceData"
    //     }
    // } as any);

    // // Add the calculated average price to the document.
    // pipeline.push({
    //     $addFields: {
    //         theSameEstNumAveragePrice: { $arrayElemAt: ["$avgPriceData.avgPrice", 0] }
    //     }
    // } as any);

    // // Remove the temporary avgPriceData field.
    // pipeline.push({
    //     $project: {
    //         avgPriceData: 0
    //     }
    // } as any);

    // // New stages: Group duplicates if they have the same sharedEstimateId when sharedByAccountId equals session.mongoAccountId.
    // // We create a new field "groupKey": if sharedByAccountId equals session.mongoAccountId, then groupKey is sharedEstimateId, otherwise use _id to keep it unique.
    // pipeline.push({
    //     $addFields: {
    //         groupKey: {
    //             $cond: [
    //                 { $eq: ["$sharedByAccountId", session.mongoAccountId] },
    //                 "$sharedEstimateId",
    //                 "$_id"
    //             ]
    //         }
    //     }
    // } as any);

    // // Group by the groupKey, keeping only one document per group.
    // pipeline.push({
    //     $group: {
    //         _id: "$groupKey",
    //         doc: { $first: "$$ROOT" }
    //     }
    // } as any);

    // // Replace the root with the deduplicated document.
    // pipeline.push({
    //     $replaceRoot: { newRoot: "$doc" }
    // });


    pipeline.push({ $sort: { sharedAt: -1 } });

    const estimatesData = await estimatesSharesCollection.aggregate(pipeline).toArray();

    // log_.info('estimate share res data', estimatesData);

    respondJsonData(res, estimatesData);
});





registerApiSession('estimates_shares/fetch_duplicates', async (req, res, session) => {

    let sharedEstimateId = new ObjectId(requireQueryParam(req, 'sharedEstimateId'));

    let estimatesCollection = Db.getEstimatesCollection();
    let estimatesSharesCollection = Db.getEstimatesSharesCollection();
    // let accountsCollection = Db.getAccountsCollection();


    let sharedEstimate = await estimatesSharesCollection.findOne({ _id: sharedEstimateId })
    let estimate = await estimatesCollection.findOne({ _id: sharedEstimate?.sharedEstimateId });

    verify(estimate, req.t('fetch.estimate'))

    const notDeletedFilter = { deleted: { $ne: true } };


    let estimates = await estimatesCollection.find({
        estimateNumber: estimate!.estimateNumber,
        isOriginal: { $ne: true },
        ...notDeletedFilter
    }).toArray()

    let estimateIds = estimates.map(est => est._id);


    if (estimateIds.length === 0) {
        respondJsonData(res, []);
        return
    }

    // log_.info(estimateIds);

    let pipeline = [
        {
            $match: {
                sharedEstimateId: { $in: estimateIds },
                sharedWithAccountId: { $ne: session.mongoAccountId },
                ...notDeletedFilter
            }
        },
        {
            $lookup: {
                from: "accounts",
                localField: "sharedWithAccountId",
                foreignField: "_id",
                as: "accountData"
            }
        },
        {
            $unwind: { path: "$accountData", preserveNullAndEmptyArrays: true }
        },
        {
            $project: {
                sharedEstimateId: 1,
                sharedWithAccountId: 1,
                companyName: "$accountData.companyName"
            }
        }
    ];

    let sharedEstimates = await estimatesSharesCollection.aggregate(pipeline).toArray();

    // log_.info(sharedEstimates);


    let estimateData: Db.EntityEstimate[] = estimates.map(est => {
        let multiSharedAccountData = sharedEstimates
            .filter(share => share.sharedEstimateId.toString() === est._id.toString())
            .map(share => ({
                sharedWithAccountId: share.sharedWithAccountId,
                companyName: share.companyName
            }));

        return {
            // ...Db.estimatesToApi(est),
            ...est,
            multiSharedAccountData
        };
    });

    // log_.info('estimateData', estimateData)
    respondJsonData(res, estimateData);
});