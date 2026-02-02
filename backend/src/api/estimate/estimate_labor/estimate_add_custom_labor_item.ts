import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {getReqParam} from '@/tsback/req/req_params';
import {respondJsonData} from '@/tsback/req/req_response';
import {validateMongoObjectId} from '@/tslib/validate';
import {verify} from '@/tslib/verify';
import {assertObject} from '@/tslib/assert';
import {updateEstimateCostById} from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('estimate/add_custom_labor_item', async (req, res, session) => {
    let estimateSectionIdReq = getReqParam(req, 'estimateSectionId') as string;
    let estimateSectionId;

    let estimateSubsectionIdReq = getReqParam(req, 'estimateSubsectionId') as string;
    let estimateSubsectionId: ObjectId | undefined;

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
                });
                estimateSubsectionId = newEstimateSubsectionData?._id;
            }
        }
    }

    verify(estimateSubsectionId, 'Invalid subsection');

    let estimateSubsectionsCollection = Db.getEstimateSubsectionsCollection();
    let estimateLaborItems = Db.getEstimateLaborItemsCollection();
    let subsection = (await estimateSubsectionsCollection.findOne({_id: estimateSubsectionId}))!;

    assertObject(subsection, 'Invalid subsection id')!;

    // Create a custom labor item with default/empty values
    // Use a placeholder ObjectId for laborItemId
    const placeholderLaborItemId = new ObjectId('000000000000000000000000');

    // Get default measurement unit (assuming there's a default one, or use a placeholder)
    const measurementUnitsCollection = Db.getMeasurementUnitCollection();
    const defaultMeasurementUnit = await measurementUnitsCollection.findOne({});
    const measurementUnitId = defaultMeasurementUnit?._id || new ObjectId('000000000000000000000001');

    let estimateLaborItem: Db.EntityEstimateLaborItem = {} as Db.EntityEstimateLaborItem;

    if (estimateSubsectionId) {
        estimateLaborItem.estimateSubsectionId = estimateSubsectionId;
    }
    estimateLaborItem.estimateId = subsection.estimateId;
    estimateLaborItem.quantity = 0;
    estimateLaborItem.measurementUnitMongoId = measurementUnitId;
    estimateLaborItem.laborItemId = placeholderLaborItemId; // Placeholder for custom items
    estimateLaborItem.averagePrice = 0;
    estimateLaborItem.changableAveragePrice = 0;
    estimateLaborItem.laborHours = 0;
    estimateLaborItem.laborOfferItemName = '';

    let newEstimateLaborItem = await estimateLaborItems.insertOne(estimateLaborItem);

    await updateEstimateCostById(subsection.estimateId);

    respondJsonData(res, {
        newEstimateLaborItem,
        insertedId: newEstimateLaborItem.insertedId,
    });
});
