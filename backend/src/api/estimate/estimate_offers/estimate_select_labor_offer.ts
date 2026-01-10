import * as Db from '../../../db';

import { requireQueryParam } from '../../../tsback/req/req_params';
import { registerHandlerSession } from '../../../server/register';
import { respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';



registerHandlerSession('estimate', 'select_labor_offer', async (req, res, session) => {

    respondJsonData(res, 'estimate material item removed');
});




registerHandlerSession('estimate', 'fetch_labor_offers', async (req, res, session) => {

    let laborItemId = new ObjectId(requireQueryParam(req, 'laborItemId'));

    let laborOffers = Db.getLaborOffersCollection();

    let pipeline: any[] = [
        {
            $match: {
                $and: [
                    { itemId: laborItemId },
                    { isArchived: false }
                ]
             },
        },
        {
            $lookup: {
                from: 'labor_items',
                let: { itemIdVar: '$itemId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$itemIdVar'], // Join on _id === itemId
                            },
                        },
                    },
                    {
                        $project: {
                            fullCode: 1,
                            name: 1,
                            _id: 0 // Optional: Exclude _id if you don't need it
                        },
                    },
                ],
                as: 'itemData',
            },
        },
        {
            $match: {
                itemData: { $ne: [] }, // Keep only laborOffers with a valid item
            },
        },
        {
            $lookup: {
                from: 'accounts',
                let: { accountIdVar: '$accountId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$accountIdVar'],
                            },
                        },
                    },
                    {
                        $project: {
                            companyName: 1,
                            _id: 0 // Optional: Exclude _id if you don't need it
                        },
                    },
                ],
                as: 'accountMadeOfferData',
            },
        },
        {
            $set: {
                // Optional: You can add more custom fields if needed
                itemData: { $arrayElemAt: ['$itemData', 0] }, // Assuming only 1 item per offer
                accountMadeOfferData: { $arrayElemAt: ['$accountMadeOfferData', 0] }, // Assuming only 1 account per offer
            },
        },
        {
            $group: {
                _id: 1,
                offers: { $push: '$$ROOT' }, // Collect all enriched offers
                averagePrice: { $avg: '$price' },
            },
        },
        {
            $project: {
                _id: 3,
                averagePrice: 1,
                offers: 1,
            },
        }
    ];

    let data: Db.EntityEstimateLaborOffers[] = [];

    const cursor = laborOffers.aggregate(pipeline);
    await cursor.forEach((item) => {
        data.push(Db.estimateLaborOfferToApi(item));
    });

    log_.info('dataaaaaaaaaaaaaaaaa', data)

    // log_.info('fetch_labor_offers data', data)

    respondJsonData(res, data);

})