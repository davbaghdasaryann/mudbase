import * as Db from '@/db';

import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/fetch_material_offers', async (req, res, session) => {
    let materialItemId = requireMongoIdParam(req, 'materialItemId');

    let materialOffersColl = Db.getMaterialOffersCollection();

    let pipeline: any[] = [
        {
            $match: {
                $and: [{itemId: materialItemId}, {isArchived: false}, {price: { $exists: true, $ne: 0 }}],
            },
        },
        {
            $lookup: {
                from: 'material_items',
                let: {itemIdVar: '$itemId'},
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
                            _id: 0, // Optional: Exclude _id if you don't need it
                        },
                    },
                ],
                as: 'itemData',
            },
        },
        {
            $match: {
                itemData: {$ne: []}, // Keep only laborOffers with a valid item
            },
        },
        {
            $lookup: {
                from: 'accounts',
                let: {accountIdVar: '$accountId'},
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
                            _id: 0, // Optional: Exclude _id if you don't need it
                        },
                    },
                ],
                as: 'accountMadeOfferData',
            },
        },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'measurementUnitData',
            },
        },
        {
            $set: {
                // Optional: You can add more custom fields if needed
                itemData: {$arrayElemAt: ['$itemData', 0]}, // Assuming only 1 item per offer
                accountMadeOfferData: {$arrayElemAt: ['$accountMadeOfferData', 0]}, // Assuming only 1 account per offer
            },
        },
        {
            $group: {
                _id: 1,
                offers: {$push: '$$ROOT'}, // Collect all enriched offers
                averagePrice: {$avg: '$price'},
            },
        },
        {
            $project: {
                _id: 3,
                averagePrice: 1,
                offers: 1,
            },
        },
    ];

    const data = await materialOffersColl.aggregate(pipeline).toArray();

    // log_.info('data estimate material offers:', data);

    respondJsonData(res, data);
});
