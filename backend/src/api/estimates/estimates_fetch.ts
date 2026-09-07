import * as Db from '@/db';
import {ObjectId} from 'mongodb';

import {requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';

registerApiSession('estimates/fetch', async (req, res, session) => {
    let searchVal = requireQueryParam(req, 'searchVal');
    searchVal = searchVal.trim();

    const includeUnforeseenOnly = req.query.includeUnforeseenOnly === 'true';

    let estimates = Db.getEstimatesCollection();

    const notDeletedFilter = {deleted: {$ne: true}};
    const notArchivedFilter = {archived: {$ne: true}};
    const notUnforeseenOnlyFilter = {isUnforeseenOnly: {$ne: true}};

    let cursor;

    const isInteger = /^\d+$/.test(searchVal);

    const baseFilters: object[] = [
        {isOriginal: true},
        {accountId: session.mongoAccountId},
        notDeletedFilter,
        notArchivedFilter,
        {isLocalCopy: {$ne: true}},
        ...(includeUnforeseenOnly ? [] : [notUnforeseenOnlyFilter]),
    ];

    if (searchVal !== 'empty') {
        cursor = estimates.find({
            $and: [
                ...baseFilters,
                {
                    $or: [
                        isInteger
                            ? {estimateNumber: {$regex: searchVal, $options: 'i'}}
                            : {name: {$regex: searchVal, $options: 'i'}},
                    ],
                },
            ],
        });
    } else {
        cursor = estimates.find({ $and: baseFilters });
    }

    const data = await cursor.toArray();

    // Mark estimates that have an associated costing or performance record
    if (data.length > 0) {
        const estimateIds = data.map(e => e._id);
        const estimateIdStrs = data.map(e => e._id.toString());
        const [costings, performanceActs, schedules, shares] = await Promise.all([
            Db.getCostingsCollection()
                .find({ estimateId: { $in: estimateIds }, deleted: { $ne: true } }, { projection: { estimateId: 1 } })
                .toArray(),
            Db.getPerformanceActsCollection()
                .find({ estimateId: { $in: estimateIds }, deleted: { $ne: true } }, { projection: { estimateId: 1 } })
                .toArray(),
            Db.getSchedulesCollection()
                .find({ estimateId: { $in: estimateIdStrs }, deleted: { $ne: true } }, { projection: { estimateId: 1 } })
                .toArray(),
            Db.getEstimatesCollection()
                .find({ originalEstimateId: { $in: estimateIds }, isOriginal: { $ne: true }, deleted: { $ne: true } }, { projection: { originalEstimateId: 1 } })
                .toArray(),
        ]);
        const costingIds = new Set(costings.map(c => c.estimateId?.toString()));
        const performanceIds = new Set(performanceActs.map(p => p.estimateId?.toString()));
        const scheduleIds = new Set(schedules.map(s => s.estimateId?.toString()));
        const sharedIds = new Set(shares.map((s: any) => s.originalEstimateId?.toString()));
        for (const est of data) {
            (est as any).inCosting = costingIds.has(est._id.toString());
            (est as any).inPerformance = performanceIds.has(est._id.toString());
            (est as any).inSchedule = scheduleIds.has(est._id.toString());
            (est as any).isShared = sharedIds.has(est._id.toString());
        }
    }

    respondJsonData(res, data);
});

// registerHandlerSession('estimates', 'fetch', async (req, res, session) => {
//     let searchVal = requireQueryParam(req, 'searchVal');
//     searchVal = searchVal.trim();

//     let estimatesCollection = Db.getEstimatesCollection();
//     let sectionsCollection = Db.getEstimateSectionsCollection();
//     let subsectionsCollection = Db.getEstimateSubsectionsCollection();
//     let laborItemsCollection = Db.getEstimateLaborItemsCollection();
//     let materialItemsCollection = Db.getEstimateMaterialItemsCollection();

//     const isInteger = /^\d+$/.test(searchVal);

//     // Fetch Estimates
//     let estimatesCursor = searchVal !== 'empty'
//         ? estimatesCollection.find({
//               $or: [
//                   isInteger
//                       ? { estimateNumber: parseInt(searchVal) }
//                       : { estimateNumber: { $regex: searchVal, $options: 'i' } },
//                   { name: { $regex: searchVal, $options: 'i' } },
//               ],
//           })
//         : estimatesCollection.find({ accountId: session.mongoAccountId });

//     let estimatesData = (await estimatesCursor.toArray()) as Db.EntityEstimates[];

//     for (let estimate of estimatesData) {
//         let estimateTotalCost = 0;

//         // Fetch Sections
//         let sectionsData = await sectionsCollection.find({ estimateId: estimate._id }).toArray();

//         for (let section of sectionsData) {
//             let sectionTotalCost = 0;

//             // Fetch Subsections
//             let subsectionsData = await subsectionsCollection.find({ estimateSectionId: section._id }).toArray();

//             for (let subsection of subsectionsData) {
//                 let laborTotalWithoutMaterial = 0;
//                 let materialTotalCost = 0;

//                 // Fetch & Calculate Labor Costs
//                 let laborItems = await laborItemsCollection.find({ estimateSubsectionId: subsection._id }).toArray();
//                 for (let labor of laborItems) {
//                     if (labor.quantity && labor.changableAveragePrice) {
//                         laborTotalWithoutMaterial += labor.quantity * labor.changableAveragePrice;
//                     }
//                 }

//                 // Fetch & Calculate Material Costs
//                 let materialItems = await materialItemsCollection.find({ estimateSubsectionId: subsection._id }).toArray();
//                 for (let material of materialItems) {
//                     if (material.quantity && material.changableAveragePrice) {
//                         materialTotalCost += material.quantity * material.changableAveragePrice;
//                     }
//                 }

//                 // Calculate Total Cost for Subsection
//                 let subsectionTotalCost = laborTotalWithoutMaterial + materialTotalCost;

//                 // Update Subsection with Total Cost
//                 await subsectionsCollection.updateOne(
//                     { _id: subsection._id },
//                     { $set: { totalCost: subsectionTotalCost } }
//                 );

//                 sectionTotalCost += subsectionTotalCost; // Add subsection total to section
//             }

//             // Update Section with Total Cost
//             await sectionsCollection.updateOne(
//                 { _id: section._id },
//                 { $set: { totalCost: sectionTotalCost } }
//             );

//             estimateTotalCost += sectionTotalCost; // Add section total to estimate
//         }

//         // Update Estimate with Total Cost
//         await estimatesCollection.updateOne(
//             { _id: estimate._id },
//             { $set: { totalCost: estimateTotalCost } }
//         );
//     }

//     let updatedEstimates = (await estimatesCollection.find().toArray()) as Db.EntityEstimates[];

//     respondJsonData(res, updatedEstimates);
// });
