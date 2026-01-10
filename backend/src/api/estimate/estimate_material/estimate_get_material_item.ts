import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {respondJson, respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('estimate/fetch_material_items', async (req, res, session) => {

    let estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');
    
    let estimatedMaterialsColl = Db.getEstimateMaterialItemsCollection();

    let pipeline: any[] = [
        {
            $match: {
                estimatedLaborId: estimatedLaborId,
            },
        },
        {
            $lookup: {
                from: 'material_items',
                let: {materialItemIdIdVar: '$materialItemId'},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$materialItemIdIdVar'], // Join on _id === itemId
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
                as: 'estimateMaterialItemData',
            },
        },
        {
            $match: {
                itemData: {$ne: []}, // Keep only laborOffers with a valid item
            },
        },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'estimateMeasurementUnitData',
            },
        },
    ];

    const data = await estimatedMaterialsColl.aggregate(pipeline).toArray();

    // log_.info('estimated material data', data)

    respondJsonData(res, data);
});

registerApiSession('estimate/get_material_item', async (req, res, session) => {
    let estimateMaterialId = requireMongoIdParam(req, 'estimatedMaterialId');

    let estimateMaterialsColl = Db.getEstimateMaterialItemsCollection();

    let estimateMaterialItem = await estimateMaterialsColl.findOne({_id: estimateMaterialId});

    // log_.info('estimatedLaborItem', materialItem)

    respondJsonData(res, estimateMaterialItem);
});

registerApiSession('estimate/get_material_item_for_view', async (req, res, session) => {
    let estimateItemId = requireMongoIdParam(req, 'estimatedItemId');

    let estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();
    let estimateMaterialItem = (await estimateMaterialItemsColl.findOne({_id: estimateItemId}))!;

    log_.info(estimateMaterialItem);

    verify(estimateMaterialItem, req.t('validate.material_not_found'));

    let materialItemId = estimateMaterialItem!.materialItemId;

    verify(materialItemId, req.t('validate.material_id'));

    // log_.info('estimatedMaterialItem', estimateMaterialItem)

    let materialItemsColl = Db.getMaterialItemsCollection();
    let materialItem = await materialItemsColl.findOne(
        {_id: materialItemId},
        {projection: {name: 1, averagePrice: 1}}
    );

    // // log_.info('materialItem', materialItem)

    // let materialItemName = materialItem ? materialItem.name : 'Unknown';
    // // log_.info('materialItemName', materialItemName)

    // let materialOffersColl = Db.getMaterialOffersCollection();
    // let offers = await materialOffersColl
    //     .find({
    //         itemId: materialItemId,
    //         isArchived: false,
    //         price: {$ne: 0},
    //     })
    //     .toArray();

    // // log_.info('offers', offers)

    // let totalPrice = 0;
    // let count = offers.length;

    // for (let offer of offers) {
    //     totalPrice += offer.price;
    // }

    // let averagePrice = count > 0 ? totalPrice / count : null;

    // let result = {
    //     name: estimateMaterialItem.materialOfferItemName,
    //     averagePrice: estimateMaterialItem.averagePrice,
    // };


    // respondJson(res, result);
    respondJson(res, materialItem);
});
