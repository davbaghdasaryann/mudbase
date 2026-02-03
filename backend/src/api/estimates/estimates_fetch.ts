import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';

registerApiSession('estimates/fetch', async (req, res, session) => {
    let searchVal = requireQueryParam(req, 'searchVal');
    searchVal = searchVal.trim();

    let estimates = Db.getEstimatesCollection();

    const notDeletedFilter = {deleted: {$ne: true}};
    const notArchivedFilter = {archived: {$ne: true}};

    let cursor;

    const isInteger = /^\d+$/.test(searchVal);

    if (searchVal !== 'empty') {
        cursor = estimates.find({
            $and: [
                {isOriginal: true},
                {accountId: session.mongoAccountId},
                notDeletedFilter,
                notArchivedFilter,
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
        cursor = estimates.find({
            $and: [{isOriginal: true}, {accountId: session.mongoAccountId}, notDeletedFilter, notArchivedFilter],
        });
    }

    const data = await cursor.toArray();

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
