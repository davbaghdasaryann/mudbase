import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';

registerApiSession('admin/fetch_all_estimates', async (req, res, session) => {
    let searchVal = requireQueryParam(req, 'searchVal');
    searchVal = searchVal.trim();

    const estimatesColl = Db.getEstimatesCollection();

    const notDeletedFilter = {deleted: {$ne: true}};
    const notArchivedFilter = {archived: {$ne: true}};

    const isInteger = /^\d+$/.test(searchVal);

    const pipeline: any[] = [];

    // Match stage
    if (searchVal !== 'empty') {
        pipeline.push({
            $match: {
                $and: [
                    {isOriginal: true},
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
            },
        });
    } else {
        pipeline.push({
            $match: {
                $and: [{isOriginal: true}, notDeletedFilter, notArchivedFilter],
            },
        });
    }

    // Lookup account to get company name
    pipeline.push({
        $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'accountData',
        },
    });

    // Add companyName field
    pipeline.push({
        $addFields: {
            companyName: {$arrayElemAt: ['$accountData.companyName', 0]},
        },
    });

    // Remove accountData array
    pipeline.push({
        $project: {
            accountData: 0,
        },
    });

    // Sort by creation date (newest first)
    pipeline.push({
        $sort: {createdAt: -1},
    });

    const data = await estimatesColl.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});
