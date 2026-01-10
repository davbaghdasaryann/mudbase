import {registerApiSession} from '@/server/register';
import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {validateDoubleInteger} from '@/tslib/validate';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';
import {updateLaborItemStats } from '@/api/catalog/labors';
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
        if (updatedData.laborOfferItemName === '') {
            verify(updatedData.laborOfferItemName, req.t('required.name'));
        }
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

    const allowedFields = ['laborOfferItemName', 'laborHours', 'quantity', 'changableAveragePrice']; //🔴 TODO: this will need us in version 2 🔴
    // const allowedFields = ["laborOfferItemName", "quantity", "changableAveragePrice",];

    const filteredUpdateData: Partial<Db.EntityEstimateLaborItem> = Object.fromEntries(
        Object.entries(updatedData).filter(([key]) => allowedFields.includes(key))
    );

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

    // only enter if at least one of price or hours is non-negative
    // if ((updatedData.changableAveragePrice >= 0 || updatedData.laborHours >= 0) && session.permissionsSet?.has('OFF_CRT_LBR')) {
    if ((priceChanged || hoursChanged) && session.permissionsSet?.has('OFF_CRT_LBR')) {
        const estLaborItem = (await estimateLaborColl.findOne({_id: estimatedLaborId}))!;
        assertObject(estLaborItem, 'Invalid labor item')!;

        const laborOffersColl = Db.getLaborOffersCollection();
        const laborOffers = await laborOffersColl
            .find({itemId: estLaborItem?.laborItemId})
            .toArray();
        const existingOffer = laborOffers.find(
            (lo) => lo?.accountId.toString() === session.accountId.toString()
        );

        // build a single `$set` object depending on which fields are present
        const setFields: any = {};
        if (updatedData.changableAveragePrice >= 0) {
            if (priceChanged) setFields.price = updatedData.changableAveragePrice;
            // setFields.price = updatedData.changableAveragePrice;
        }
        if (updatedData.laborHours >= 0) {
            if (hoursChanged) setFields.laborHours = parseFloat(updatedData.laborHours);
            // setFields.laborHours = parseFloat(updatedData.laborHours);
        }
        setFields.updatedAt = new Date();

        if (existingOffer) {
            // update only the fields we need
            await laborOffersColl.updateOne({_id: existingOffer._id}, {$set: setFields});

            const updatedLaborOffer = (await laborOffersColl.findOne({_id: existingOffer._id}))!;
            const laborPricesJournal = Db.getLaborPricesJournalCollection();

            let addingLaborOfferPricesJournal = {} as Db.EntityLaborPricesJournal;
            addingLaborOfferPricesJournal.itemId = updatedLaborOffer._id;
            addingLaborOfferPricesJournal.price = updatedLaborOffer.price;
            addingLaborOfferPricesJournal.currency = updatedLaborOffer.currency;
            addingLaborOfferPricesJournal.laborHours = updatedLaborOffer.laborHours;
            addingLaborOfferPricesJournal.userId = updatedLaborOffer.userId;
            addingLaborOfferPricesJournal.date = updatedLaborOffer.updatedAt;
            addingLaborOfferPricesJournal.isArchived = false;

            await laborPricesJournal.insertOne(addingLaborOfferPricesJournal);
        } else {
            const now = new Date();
            let newLaborOffer = {} as Db.EntityLaborOffers;
            newLaborOffer.isActive = true;
            newLaborOffer.itemId = estLaborItem.laborItemId;
            if (session.mongoUserId) {
                newLaborOffer.userId = session.mongoUserId;
            }
            if (session.mongoAccountId) {
                newLaborOffer.accountId = session.mongoAccountId;
            }
            newLaborOffer.createdAt = now;
            newLaborOffer.updatedAt = now;

            newLaborOffer.anonymous = false;
            newLaborOffer.public = true;
            newLaborOffer.price =
                updatedData.changableAveragePrice ?? estLaborItem.changableAveragePrice;
            newLaborOffer.currency = updatedData.laborOfferCurrency || 'AMD';

            newLaborOffer.laborHours =
                updatedData.laborOfferLaborHours !== undefined
                    ? parseFloat(updatedData.laborOfferLaborHours)
                    : estLaborItem.laborHours;
            // newLaborOffer.laborHours = Math.round(newLaborOffer.laborHours * 100) / 100;

            if (estLaborItem.measurementUnitMongoId) {
                newLaborOffer.measurementUnitMongoId = estLaborItem.measurementUnitMongoId;
            }
            newLaborOffer.isArchived = false;

            let newOfferInsertResult = await laborOffersColl.insertOne(newLaborOffer);
            let newOfferId = newOfferInsertResult.insertedId;

            let updatedLaborOffer = await laborOffersColl.findOne({_id: newOfferId});
            updatedLaborOffer = assertObject(updatedLaborOffer, 'Invalid labor offer')!;

            let laborPricesJournal = Db.getLaborPricesJournalCollection();
            let addingLaborOfferPricesJournal = {} as Db.EntityLaborPricesJournal;

            addingLaborOfferPricesJournal.itemId = updatedLaborOffer._id;
            addingLaborOfferPricesJournal.price = updatedLaborOffer.price;
            addingLaborOfferPricesJournal.currency = updatedLaborOffer.currency;
            addingLaborOfferPricesJournal.laborHours = updatedLaborOffer.laborHours;
            addingLaborOfferPricesJournal.measurementUnitMongoId =
                updatedLaborOffer.measurementUnitMongoId;
            addingLaborOfferPricesJournal.userId = updatedLaborOffer.userId;
            addingLaborOfferPricesJournal.date = updatedLaborOffer.updatedAt;
            addingLaborOfferPricesJournal.isArchived = false;

            await laborPricesJournal.insertOne(addingLaborOfferPricesJournal);
        }


        await updateLaborItemStats(estLaborItem.laborItemId);
        
    }

    // log_.info(prevEstLaborItem);

    if ((priceChanged || hoursChanged || updatedData.quantity)) {
        await updateEstimateCostById(prevEstLaborItem.estimateId);
    }

    respondJson(res, {ok: true});
});
