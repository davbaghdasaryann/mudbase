import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';

registerApiSession('estimates/fetch_archived', async (req, res, session) => {
    let searchVal = requireQueryParam(req, 'searchVal');
    searchVal = searchVal.trim();

    let estimates = Db.getEstimatesCollection();

    const archivedFilter = {archived: true};
    const notDeletedFilter = {deleted: {$ne: true}};

    let cursor;

    const isInteger = /^\d+$/.test(searchVal);

    if (searchVal !== 'empty') {
        cursor = estimates.find({
            $and: [
                {isOriginal: true},
                {accountId: session.mongoAccountId},
                archivedFilter,
                notDeletedFilter,
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
            $and: [{isOriginal: true}, {accountId: session.mongoAccountId}, archivedFilter, notDeletedFilter],
        });
    }

    const data = await cursor.toArray();

    respondJsonData(res, data);
});
