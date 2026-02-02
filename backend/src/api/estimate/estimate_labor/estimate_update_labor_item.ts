import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';
import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {validateDoubleInteger} from '@/tslib/validate';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';
import {updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('estimate/update_labor_item', async (req, res, session) => {
    const estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');
    const estimatesLaborColl = Db.getEstimateLaborItemsCollection();

    let updatedData = req.body ?? {};
    // log_.info('updatedData', updatedData);
    // respondJsonData(res, {})
    // return

    // Define key mappings
    const keyMapping: Record<string, string> = {
        itemChangableAveragePrice: 'changableAveragePrice',
        itemChangableName: 'laborOfferItemName',
        itemLaborHours: 'laborHours', //🔴 TODO: this will need us in version 2 🔴
        itemMeasurementUnit: 'measurementUnitMongoId',
    };

    const prevEstLaborItem = (await estimatesLaborColl.findOne({_id: estimatedLaborId}))!;

    assertObject(prevEstLaborItem, "Invalid Labor Item");

    // Helpers
    const EPS = 1e-6;
    const nearlyEqual = (a?: number | null, b?: number | null) =>
        a != null && b != null && Math.abs(a - b) <= EPS;

    // Transform keys based on mapping
    updatedData = Object.fromEntries(
        Object.entries(updatedData).map(([key, value]) => [
            keyMapping[key] ?? key, // Change key if in mapping, else keep original
            value,
        ])
    );

    // log_.info('updatedData', updatedData)
    if (updatedData.laborOfferItemName !== undefined) {
        updatedData.laborOfferItemName = updatedData.laborOfferItemName.trim();
        // Allow empty names for custom labor items
    }
    //🔴 TODO: this will need us in version 2 🔴
    if (updatedData.laborHours !== undefined) {
        updatedData.laborHours = parseFloat(updatedData.laborHours);
    }

    if (updatedData.quantity !== undefined) {
        // log_.info('updatedData.quantity 1', updatedData.quantity);

        verify(validateDoubleInteger(updatedData.quantity), req.t('validate.float'));
        updatedData.quantity = parseFloat(updatedData.quantity);

        const estimatedMaterialCollection = Db.getEstimateMaterialItemsCollection();
        // log_.info('updatedData.quantity', updatedData.quantity);

        // Update all documents where estimatedLaborId matches
        await estimatedMaterialCollection.updateMany({estimatedLaborId: estimatedLaborId}, [
            {
                $set: {
                    // Multiply updatedData.quantity by the document's materialConsumptionNorm
                    // and round the result to 2 decimal places.
                    quantity: {
                        $round: [
                            {
                                $multiply: [
                                    updatedData.quantity,
                                    {$toDouble: '$materialConsumptionNorm'},
                                ],
                            },
                            2,
                        ],
                    },
                },
            },
        ]);
    }
    if (updatedData.changableAveragePrice !== undefined) {
        // log_.info('updatedData.changableAveragePrice', updatedData.changableAveragePrice);

        // verify(validateInteger(updatedData.changableAveragePrice), req.t('validate.integer'))
        // updatedData.changableAveragePrice = parseInt(updatedData.changableAveragePrice);
        verify(validateDoubleInteger(updatedData.changableAveragePrice), req.t('validate.float'));
        updatedData.changableAveragePrice = parseFloat(updatedData.changableAveragePrice);
    }

    if (updatedData.measurementUnitMongoId !== undefined) {
        // Convert string to ObjectId if needed
        if (typeof updatedData.measurementUnitMongoId === 'string') {
            // Skip empty strings - don't update measurement unit if empty
            if (updatedData.measurementUnitMongoId === '') {
                delete updatedData.measurementUnitMongoId;
            } else {
                updatedData.measurementUnitMongoId = new ObjectId(updatedData.measurementUnitMongoId);
            }
        }
    }

    const allowedFields = ['laborOfferItemName', 'laborHours', 'quantity', 'changableAveragePrice', 'measurementUnitMongoId']; //🔴 TODO: this will need us in version 2 🔴
    // const allowedFields = ["laborOfferItemName", "quantity", "changableAveragePrice",];

    const filteredUpdateData: Partial<Db.EntityEstimateLaborItem> = Object.fromEntries(
        Object.entries(updatedData).filter(([key]) => allowedFields.includes(key))
    );

    // Manual price edit in estimate must not affect catalog; clear priceSource so cell is no longer market/my_offer highlighted.
    if (filteredUpdateData.changableAveragePrice !== undefined) {
        filteredUpdateData.priceSource = null;
    }

    verify(Object.keys(filteredUpdateData).length !== 0, 'No valid fields to update');
    // if (Object.keys(filteredUpdateData).length === 0) {
    //     return respondJsonData(res, "No valid fields to update");
    // }

    // 3) Detect true changes vs previous values (BEFORE updating DB)
    const priceChanged =
        updatedData.changableAveragePrice !== undefined &&
        prevEstLaborItem &&
        !nearlyEqual(updatedData.changableAveragePrice, prevEstLaborItem.changableAveragePrice);

    const hoursChanged =
        updatedData.laborHours !== undefined &&
        prevEstLaborItem &&
        !nearlyEqual(updatedData.laborHours, prevEstLaborItem.laborHours);

    let estimateLaborColl = Db.getEstimateLaborItemsCollection();

    const updatedItem = await estimateLaborColl.updateOne(
        {_id: estimatedLaborId},
        {$set: filteredUpdateData}
    );

    // if (updatedData.changableAveragePrice >= 0) {
    //     let estLaborItem = await estimatedLaborCollection.findOne({ _id: estimatedLaborId }) as Db.EntityEstimateLaborItems
    //     let laborOffersColleciton = Db.getLaborOffersCollection();
    //     let laborOffers = await laborOffersColleciton.find({ itemId: estLaborItem?.laborItemId }).toArray();

    //     for (let laborOffer of laborOffers) {
    //         if (laborOffer?.accountId.toString() === session.accountId.toString()) {
    //             await laborOffersColleciton.updateOne(
    //                 { _id: laborOffer._id },
    //                 { $set: { price: updatedData.changableAveragePrice } }
    //             );
    //         }
    //     }

    // }

    // Estimate edits must never update the catalog (labor_offers or labor_items stats).
    // Only the estimate labor item and estimate cost are updated.

    if ((priceChanged || hoursChanged || updatedData.quantity)) {
        await updateEstimateCostById(prevEstLaborItem.estimateId);
    }

    respondJson(res, {ok: true});
});
