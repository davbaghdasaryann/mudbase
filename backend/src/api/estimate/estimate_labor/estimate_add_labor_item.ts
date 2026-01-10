import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {getReqParam, requireQueryParam} from '@/tsback/req/req_params';
import {respondJsonData} from '@/tsback/req/req_response';
import {validateMongoObjectId, validateDoubleInteger} from '@/tslib/validate';
import {verify} from '@/tslib/verify';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('estimate/add_labor_item', async (req, res, session) => {
    let estimateSectionIdReq = getReqParam(req, 'estimateSectionId') as string;
    let estimateSectionId;

    let estimateSubsectionIdReq = getReqParam(req, 'estimateSubsectionId') as string;
    let estimateSubsectionId: ObjectId | undefined;

    // log_.info('estimateSectionIdReq: ', estimateSectionIdReq, 'estimateSubsectionIdReq: ', estimateSubsectionIdReq)

    if (validateMongoObjectId(estimateSubsectionIdReq)) {
        estimateSubsectionId = new ObjectId(estimateSubsectionIdReq);
    } else {
        if (validateMongoObjectId(estimateSectionIdReq)) {
            estimateSectionId = new ObjectId(estimateSectionIdReq);
        }
        if (estimateSectionId) {
            let newEstimateSubSection = {} as Db.EntityEstimateSubsection;

            let estimateSections = Db.getEstimateSectionsCollection();
            let estimateSectionData = await estimateSections.findOne({_id: estimateSectionId});
            if (estimateSectionData) {
                newEstimateSubSection.estimateSectionId = estimateSectionData._id;
                newEstimateSubSection.estimateId = estimateSectionData.estimateId;
                newEstimateSubSection.name = '';
            }

            let isEmptySubsection: boolean = false;
            let alreadyCreatedEmptySubsectionId;
            let estimateSubsections = Db.getEstimateSubsectionsCollection();
            const estimateSubsection = await estimateSubsections.findOne({
                estimateSectionId: newEstimateSubSection.estimateSectionId,
            });
            if (estimateSubsection) {
                if (estimateSubsection.name === '' || estimateSubsection.name === ' ') {
                    alreadyCreatedEmptySubsectionId = estimateSubsection._id;
                    isEmptySubsection = true;
                }
            }

            if (isEmptySubsection && alreadyCreatedEmptySubsectionId) {
                estimateSubsectionId = alreadyCreatedEmptySubsectionId;
            } else {
                let insertResult = await estimateSubsections.insertOne(newEstimateSubSection);
                let newEstimateSubsectionData = await estimateSubsections.findOne({
                    _id: insertResult.insertedId,
                }); // insertResult.insertedId it is new mongo Id (_id)
                estimateSubsectionId = newEstimateSubsectionData?._id;
            }
        }
    }

    let laborItemQuantityString = requireQueryParam(req, 'laborItemQuantity');
    verify(validateDoubleInteger(laborItemQuantityString), req.t('validate.float'));
    let laborItemQuantity = parseFloat(laborItemQuantityString);
    // laborItemQuantity = Math.round(laborItemQuantity * 100) / 100;

    let laborOffersAveragePriceString = requireQueryParam(req, 'laborOffersAveragePrice');
    let laborItemId = new ObjectId(requireQueryParam(req, 'laborItemId'));

    let laborOffersAveragePrice = 0;
    const laborOffersColl = Db.getLaborOffersCollection();
    const myOffer = await laborOffersColl.findOne(
        {
            itemId: laborItemId,
            accountId: new ObjectId(session.mongoAccountId),
        },
        {sort: {createdAt: -1}}
    );

    // log_.info('laborItemId', laborItemId);
    // log_.info('myOffer', myOffer);

    if (myOffer && typeof myOffer.price === 'number') {
        laborOffersAveragePrice = myOffer.price;
    } else {
        if (laborOffersAveragePriceString !== 'NaN') {
            // verify(validateInteger(laborOffersAveragePriceString), req.t('validate.integer'));
            // laborOffersAveragePrice = parseInt(laborOffersAveragePriceString);
            
            // log_.info('laborOffersAveragePriceString', laborOffersAveragePriceString);

            if (
                !laborOffersAveragePriceString ||
                laborOffersAveragePriceString === '' ||
                laborOffersAveragePriceString === 'null'
            ) {
                laborOffersAveragePrice = 0;
            } else {
                verify(
                    validateDoubleInteger(laborOffersAveragePriceString),
                    req.t('validate.float')
                );
                laborOffersAveragePrice = parseFloat(laborOffersAveragePriceString);
            }
        }
    }

    if (isNaN(laborOffersAveragePrice)) {
        laborOffersAveragePrice = 0;
    }

    // verify(validatePositiveInteger(laborItemQuantityString), 'Please enter a valid integer')
    // let laborOffersAveragePrice = parseInt(laborOffersAveragePriceString)

    let laborOfferItemLaborHours = parseFloat(requireQueryParam(req, 'laborOfferItemLaborHours')); //🔴 TODO: this will need us in version 2 🔴
    let laborItemMeasurementUnitMongoId = new ObjectId(
        requireQueryParam(req, 'laborItemMeasurementUnitMongoId')
    );

    let laborOfferItemName = requireQueryParam(req, 'laborOfferItemName');
    laborOfferItemName = laborOfferItemName.trim();
    if (laborOfferItemName === '') {
        verify(laborOfferItemName, req.t('validate.name'));
    }

    let laborOfferIdReq = getReqParam(req, 'laborOfferId') as string;
    let laborOfferId;
    if (validateMongoObjectId(laborOfferIdReq)) {
        laborOfferId = new ObjectId(laborOfferIdReq);
    }

    if (isNaN(laborOffersAveragePrice)) {
        laborOffersAveragePrice = 0;
    }

    let estimateSubsectionsCollection = Db.getEstimateSubsectionsCollection();
    // let estimateSectionsCollection = Db.getEstimateSectionsCollection();
    // let estimatesCollection = Db.getEstimatesCollection();
    let estimateLaborItems = Db.getEstimateLaborItemsCollection();
    let subsection = (await estimateSubsectionsCollection.findOne({_id: estimateSubsectionId}))!;

    assertObject(subsection, "Invalid subsection id")!;
    // let section = await estimateSectionsCollection.findOne({_id: subsection?.estimateSectionId});
    // let estimate = await estimatesCollection.findOne({_id: section?.estimateId});

    // let labor = await estimateLaborItems.findOne({
    //     laborItemId: laborItemId,
    // });
    // let hasAlreadyLabor = !!labor; // !! this converts the result to true or false;
    // let accountMatching = false;
    // // if (estimate?.accountId.toString() === session.mongoAccountId?.toString()) {
    // log_.info('labor?.estimateSubsectionId', labor?.estimateSubsectionId, estimateSubsectionId)
    // if (labor?.estimateSubsectionId?.toString() === estimateSubsectionId?.toString()) {
    //     accountMatching = true;
    // }

    // const labors = await estimateLaborItems.find({laborItemId: laborItemId}).toArray();

    // ⚠️ This for duplicateFound
    // const duplicateFound = labors.some(labor =>
    //     labor.estimateSubsectionId?.toString() === estimateSubsectionId?.toString() &&
    //     estimate?.accountId?.toString() === session.mongoAccountId?.toString()
    // );

    // verify(!duplicateFound, req.t('validate.already_added'));

    let estimateLaborItem: Db.EntityEstimateLaborItem = {} as Db.EntityEstimateLaborItem;

    if (estimateSubsectionId) {
        estimateLaborItem.estimateSubsectionId = estimateSubsectionId;
    }
    if (laborOfferId) {
        estimateLaborItem.laborOfferId = laborOfferId; // Now this is not used because user can't see companies that made offers
    }
    estimateLaborItem.estimateId = subsection.estimateId;
    estimateLaborItem.quantity = laborItemQuantity;
    estimateLaborItem.measurementUnitMongoId = laborItemMeasurementUnitMongoId;
    estimateLaborItem.laborItemId = laborItemId;
    estimateLaborItem.averagePrice = laborOffersAveragePrice;
    estimateLaborItem.changableAveragePrice = laborOffersAveragePrice;
    estimateLaborItem.laborHours = laborOfferItemLaborHours; //🔴 TODO: this will need us in version 2 🔴

    estimateLaborItem.laborOfferItemName = laborOfferItemName;

    let newEstimateLaborItem = await estimateLaborItems.insertOne(estimateLaborItem);

    await updateEstimateCostById(subsection.estimateId);


    respondJsonData(res, {newEstimateLaborItem, laborItemId, myOffer});
});
