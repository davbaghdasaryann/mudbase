import { registerApiSession } from '@/server/register';

import * as Db from '../../../db';

import { requireQueryParam } from '../../../tsback/req/req_params';
import { respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { verify } from '../../../tslib/verify';
import { validateDoubleInteger } from '../../../tslib/validate';
import { updateMaterialItemStats } from '@/api/catalog/materials';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';


registerApiSession('estimate/update_material_item', async (req, res, session) => {
    let estimatedMaterialId = requireMongoIdParam(req, 'estimatedMaterialId');
    let estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');

    let updatedData = req.body ?? {};

    const estimatedMaterialCollection = Db.getEstimateMaterialItemsCollection();

    const prevMatItem = (await estimatedMaterialCollection.findOne({ _id: estimatedMaterialId }))!;
    assertObject(prevMatItem, "Invalid Material Item");

    // Helpers
    const EPS = 1e-6;
    const nearlyEqual = (a?: number | null, b?: number | null) =>
        a != null && b != null && Math.abs(a - b) <= EPS;


    if (updatedData.materialOfferItemName !== undefined) {
        updatedData.materialOfferItemName = updatedData.materialOfferItemName.trim();
        if (updatedData.materialOfferItemName === '') {
            verify(updatedData.materialOfferItemName, req.t('required.name'));
        }
    }

    // if (updatedData.quantity !== undefined) {
    //     verify(validatePositiveDoubleInteger(updatedData.quantity), req.t('validate.float')) 
    //     updatedData.quantity = parseFloat(updatedData.quantity);
    //     updatedData.quantity = Math.round(updatedData.quantity * 100) / 100;
    // }


    if (updatedData.changableAveragePrice !== undefined) {
        // verify(validateInteger(updatedData.changableAveragePrice), req.t('validate.integer'))
        // updatedData.changableAveragePrice = parseFloat(updatedData.changableAveragePrice);
        verify(validateDoubleInteger(updatedData.changableAveragePrice), req.t('validate.float'))
        updatedData.changableAveragePrice = parseFloat(updatedData.changableAveragePrice);
    }

    if (updatedData.materialConsumptionNorm !== undefined) {
        verify(validateDoubleInteger(updatedData.materialConsumptionNorm), req.t('validate.integer'))
        updatedData.materialConsumptionNorm = parseFloat(updatedData.materialConsumptionNorm);
        // updatedData.materialConsumptionNorm = Math.round(updatedData.materialConsumptionNorm * 100) / 100;
    }

    const allowedFields = ["materialOfferItemName", "quantity", "changableAveragePrice", "materialConsumptionNorm"];

    const filteredUpdateData: Partial<Db.EntityEstimateMaterialItems> = Object.fromEntries(
        Object.entries(updatedData).filter(([key]) => allowedFields.includes(key))
    );



    // let estimatedMaterialCollection = Db.getEstimateMaterialItemsCollection();

    if (filteredUpdateData.materialConsumptionNorm || filteredUpdateData.materialConsumptionNorm === 0) {

        const estimatedMaterial = await estimatedMaterialCollection.findOne({ _id: estimatedMaterialId }) as Db.EntityEstimateMaterialItems;

        let currentQuantity = parseFloat(estimatedMaterial.quantity.toString());
        const currentConsumptionNorm = parseFloat(estimatedMaterial.materialConsumptionNorm.toString());
        const newConsumptionNorm = parseFloat(filteredUpdateData.materialConsumptionNorm.toString());

        let safeComputedQuantity = 0;
        if ((currentQuantity === 0 || currentConsumptionNorm === 0) && newConsumptionNorm !== 0) {
            const estimatedLaborItems = Db.getEstimateLaborItemsCollection();
            const estimatedLaborItem = await estimatedLaborItems.findOne({ _id: estimatedLaborId }) as Db.EntityEstimateLaborItem;

            filteredUpdateData.quantity = estimatedLaborItem.quantity * newConsumptionNorm;
            currentQuantity = filteredUpdateData.quantity;

            safeComputedQuantity = isFinite(currentQuantity) ? currentQuantity : 0;
        } else {
            const computedQuantity = (currentQuantity / currentConsumptionNorm) * newConsumptionNorm;
            safeComputedQuantity = isFinite(computedQuantity) ? computedQuantity : 0;
        }

        // log_.info('currentQuantity / currentConsumptionNorm', currentQuantity, currentConsumptionNorm, newConsumptionNorm, safeComputedQuantity)

        filteredUpdateData.quantity = safeComputedQuantity;

        // filteredUpdateData.quantity = Math.round(safeComputedQuantity * 100) / 100;

    }

    verify(Object.keys(filteredUpdateData).length !== 0, "No valid fields to update")

    // if (Object.keys(filteredUpdateData).length === 0) {
    //     return respondJsonData(res, "No valid fields to update");
    // }

    // log_.info('filteredUpdateData', filteredUpdateData)

    // ----- change detection (price only, as requested) BEFORE we update DB -----
    const priceChanged =
        updatedData.changableAveragePrice !== undefined &&
        prevMatItem &&
        !nearlyEqual(updatedData.changableAveragePrice, prevMatItem.changableAveragePrice);


    const updatedItem = await estimatedMaterialCollection.updateOne(
        { _id: estimatedMaterialId },
        { $set: filteredUpdateData },
    );

    // if (updatedData.changableAveragePrice >= 0 && session.permissionsSet?.has('OFF_CRT_MTRL')) {
    if (priceChanged && session.permissionsSet?.has('OFF_CRT_MTRL')) {

        // let estMaterialItem = await estimatedMaterialCollection.findOne({ _id: estimatedMaterialId }) as Db.EntityEstimateMaterialItems
        // let materialOffersColleciton = Db.getMaterialOffersCollection();
        // let materialOffers = await materialOffersColleciton.find({ itemId: estMaterialItem?.materialItemId }).toArray();

        // for (let materialOffer of materialOffers) {
        //     if (materialOffer?.accountId.toString() === session.accountId.toString()) {
        //         await materialOffersColleciton.updateOne(
        //             { _id: materialOffer._id },
        //             { $set: { price: updatedData.changableAveragePrice } }
        //         );
        //     }
        // }


        let estMaterialItem = (await estimatedMaterialCollection.findOne({ _id: estimatedMaterialId }))!;
        let materialOffersCollection = Db.getMaterialOffersCollection();

        let materialOffers = await materialOffersCollection.find({ itemId: estMaterialItem?.materialItemId }).toArray();

        let existingOffer = materialOffers.find(materialOffer => materialOffer?.accountId.toString() === session.accountId.toString());

        if (existingOffer) {
            await materialOffersCollection.updateOne(
                { _id: existingOffer._id },
                { $set: { price: updatedData.changableAveragePrice } }
            );

            let updatedMaterialOffer = await materialOffersCollection.findOne({ _id: existingOffer._id }) as Db.EntityMaterialOffer;
            let materialPricesJournal = Db.getMaterialPricesJournalCollection();

            let addingMaterialOfferPricesJournal: Db.EntityMaterialPricesJournal = {} as Db.EntityMaterialPricesJournal;
            addingMaterialOfferPricesJournal.itemId = updatedMaterialOffer._id;
            addingMaterialOfferPricesJournal.price = updatedMaterialOffer.price;
            addingMaterialOfferPricesJournal.currency = updatedMaterialOffer.currency;
            addingMaterialOfferPricesJournal.measurementUnitMongoId = updatedMaterialOffer.measurementUnitMongoId;
            addingMaterialOfferPricesJournal.userId = updatedMaterialOffer.userId;
            addingMaterialOfferPricesJournal.date = updatedMaterialOffer.updatedAt;
            addingMaterialOfferPricesJournal.isArchived = updatedMaterialOffer.isArchived;

            await materialPricesJournal.insertOne(addingMaterialOfferPricesJournal);
        } else {
            const now = new Date();
            let newMaterialOffer: Db.EntityMaterialOffer = {} as Db.EntityMaterialOffer;
            newMaterialOffer.isActive = true;
            newMaterialOffer.itemId = estMaterialItem?.materialItemId;
            if (session.mongoUserId) {
                newMaterialOffer.userId = session.mongoUserId;
            }
            if (session.mongoAccountId) {
                newMaterialOffer.accountId = session.mongoAccountId;
            }
            newMaterialOffer.createdAt = now;
            newMaterialOffer.updatedAt = now;

            newMaterialOffer.anonymous = false;
            newMaterialOffer.public = true;
            newMaterialOffer.price = updatedData.changableAveragePrice ?? estMaterialItem.changableAveragePrice;
            newMaterialOffer.currency = updatedData.materialOfferCurrency || "AMD";

            if (estMaterialItem.measurementUnitMongoId) {
                newMaterialOffer.measurementUnitMongoId = estMaterialItem.measurementUnitMongoId;
            }
            newMaterialOffer.isArchived = false;

            let newOfferInsertResult = await materialOffersCollection.insertOne(newMaterialOffer);
            let newOfferId = newOfferInsertResult.insertedId;
            let updatedMaterialOffer = await materialOffersCollection.findOne({ _id: newOfferId }) as Db.EntityMaterialOffer;

            let materialPricesJournal = Db.getMaterialPricesJournalCollection();
            let addingMaterialOfferPricesJournal: Db.EntityMaterialPricesJournal = {} as Db.EntityMaterialPricesJournal;
            addingMaterialOfferPricesJournal.itemId = updatedMaterialOffer._id;
            addingMaterialOfferPricesJournal.price = updatedMaterialOffer.price;
            addingMaterialOfferPricesJournal.currency = updatedMaterialOffer.currency;
            addingMaterialOfferPricesJournal.measurementUnitMongoId = updatedMaterialOffer.measurementUnitMongoId;
            addingMaterialOfferPricesJournal.userId = updatedMaterialOffer.userId;
            addingMaterialOfferPricesJournal.date = updatedMaterialOffer.updatedAt;
            addingMaterialOfferPricesJournal.isArchived = false;

            await materialPricesJournal.insertOne(addingMaterialOfferPricesJournal);
        }

        updateMaterialItemStats(estMaterialItem.materialItemId);

    }


    if (updatedData.quantity || priceChanged) {
        await updateEstimateCostById(prevMatItem.estimateId);
    }

    // log_.info(updatedItem);

    // let laborCategories = Db.getLaborCategoriesCollection();
    // await laborCategories.updateOne({_id: laborCategoryId}, {$set: {name: laborCategoryNewName}});



    respondJsonData(res, { ok: true });
});