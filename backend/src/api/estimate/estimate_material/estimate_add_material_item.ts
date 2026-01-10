import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '../../../tsback/req/req_params';
import { registerApiSession } from '../../../server/register';
import { respondJson, respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { validateMongoObjectId, validateDoubleInteger } from '@/tslib/validate';
import { verify } from '../../../tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';



registerApiSession('estimate/add_material_item', async (req, res, session) => {
    let estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');

    let estimatedLaborItemsCol = Db.getEstimateLaborItemsCollection();
    let laborItem = await estimatedLaborItemsCol.findOne({ _id: estimatedLaborId })

    laborItem = assertObject(laborItem, "Invalid Labor Item")!;


    let estimateSubsectionIdReq = getReqParam(req, 'estimateSubsectionId') as string;
    let estimateSubsectionId: ObjectId | undefined;
    if (validateMongoObjectId(estimateSubsectionIdReq)) {
        estimateSubsectionId = new ObjectId(estimateSubsectionIdReq);
    } else {

        // if (estimatedLaborItem) {
            estimateSubsectionId = laborItem.estimateSubsectionId as ObjectId;
        // }
    }


    // let materialItemQuantityString = requireQueryParam(req, 'materialItemQuantity');
    let materialConsumptionNormString = requireQueryParam(req, 'materialConsumptionNorm');
    // log_.info('materialItemQuantityString', materialConsumptionNormString)
    verify(validateDoubleInteger(materialConsumptionNormString), req.t('validate.float'))
    let materialConsumptionNorm = parseFloat(materialConsumptionNormString)
    // materialConsumptionNorm = Math.round(materialConsumptionNorm * 100) / 100;

    let materialItemMeasurementUnitMongoId = new ObjectId(requireQueryParam(req, 'materialItemMeasurementUnitMongoId'));
    let materialItemId = new ObjectId(requireQueryParam(req, 'materialItemId'));


    let materialOfferItemName = requireQueryParam(req, 'materialOfferItemName');

    materialOfferItemName = materialOfferItemName.trim();
    if (materialOfferItemName === '') {
        verify(materialOfferItemName, req.t('required.name'));
    }

    // 3) Determine averagePrice: pick *this* account’s most-recent offer or else the global average
    const materialOffersColl = Db.getMaterialOffersCollection();
    // try to find the latest offer by *this* account
    const myOffer = await materialOffersColl.findOne(
        { itemId: materialItemId, accountId: new ObjectId(session.mongoAccountId) },
        { sort: { createdAt: -1 } } // or { sort: { _id: -1 } } if no createdAt
    );

    let materialOfferIdReq = getReqParam(req, 'materialOfferId') as string;
    let materialOfferId;

    if (materialOfferId && materialOfferId !== 'null') {
        materialOfferId = new ObjectId(materialOfferIdReq);
    }

    let materialOffersAveragePriceString = requireQueryParam(req, 'materialOffersAveragePrice');
    let materialOffersAveragePrice = 0;

    if (myOffer && typeof myOffer.price === 'number') {
        materialOffersAveragePrice = myOffer.price;
    } else {
        if (materialOffersAveragePriceString !== 'NaN') {
            // verify(validateInteger(materialOffersAveragePriceString), req.t('validate.integer'));
            // materialOffersAveragePrice = parseInt(materialOffersAveragePriceString);
            verify(validateDoubleInteger(materialOffersAveragePriceString), req.t('validate.float'));
            materialOffersAveragePrice = parseFloat(materialOffersAveragePriceString);
        }
    }

    if (isNaN(materialOffersAveragePrice)) {
        materialOffersAveragePrice = 0;
    }


    // let estimateSubsectionsCollection = Db.getEstimateSubsectionsCollection();
    // let estimateSectionsCollection = Db.getEstimateSectionsCollection();
    // let estimatesCollection = Db.getEstimatesCollection();
    let estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();
    // let subsection = await estimateSubsectionsCollection.findOne({ _id: estimateSubsectionId });
    // let section = await estimateSectionsCollection.findOne({ _id: subsection?.estimateSectionId });
    // let estimate = await estimatesCollection.findOne({ _id: section?.estimateId });

    // let material = await estimateMaterialItems.findOne({
    //     materialItemId: materialItemId,
    // });
    // let hasAlreadyMaterial = !!material; // !! this converts the result to true or false;
    // let accountMatching = false;
    // if (estimate?.accountId.toString() === session.mongoAccountId?.toString()) {
    //     accountMatching = true;
    // }

    // verify(!(hasAlreadyMaterial && accountMatching), req.t('validate.already_added'));

    // const materials = await estimateMaterialItemsColl.find({ materialItemId: materialItemId }).toArray();

    // ⚠️ This for duplicateFound
    // const duplicateFound = materials.some(material =>
    //     material.estimatedLaborId?.toString() === estimatedLaborId?.toString() &&
    //     estimate?.accountId?.toString() === session.mongoAccountId?.toString()
    // );

    // verify(!duplicateFound, req.t('validate.already_added'));



    let materialItem = {} as Db.EntityEstimateMaterialItems

    // let estimateSubsections = Db.getEstimateSubsectionsCollection();
    // let estimateSubsectionData = await estimateSubsections.findOne({ _id: estimateSubsectionId });

    // if (estimateSubsectionData && materialOffer) {
    if (estimateSubsectionId) {
        materialItem.estimateSubsectionId = estimateSubsectionId;
    }
    if (materialOfferId) {
        materialItem.materialOfferId = materialOfferId;
    }

    materialItem.estimateId = laborItem.estimateId;

    // log_.info('materialConsumptionNorm', materialConsumptionNorm, estimatedLaborItem.quantity)
    materialItem.quantity = materialConsumptionNorm * laborItem.quantity;

    materialItem.materialConsumptionNorm = materialConsumptionNorm;
    materialItem.measurementUnitMongoId = materialItemMeasurementUnitMongoId;
    materialItem.materialItemId = materialItemId;
    materialItem.estimatedLaborId = estimatedLaborId;
    // }
    materialItem.averagePrice = materialOffersAveragePrice;
    materialItem.changableAveragePrice = materialOffersAveragePrice;

    materialItem.materialOfferItemName = materialOfferItemName;


    let newEstimateMaterialItem = await estimateMaterialItemsColl.insertOne(materialItem);

    log_.info(materialOffersAveragePrice);


    await updateEstimateCostById(materialItem.estimateId);


    respondJson(res, newEstimateMaterialItem);
});
