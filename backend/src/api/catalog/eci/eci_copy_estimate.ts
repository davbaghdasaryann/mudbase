import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';

registerApiSession('eci/copy_estimate_to_eci', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const subcategoryId = requireMongoIdParam(req, 'subcategoryId');
    const buildingType = requireQueryParam(req, 'buildingType');

    // Verify the estimate exists
    const estimatesColl = Db.getEstimatesCollection();
    const sourceEstimate = await estimatesColl.findOne({_id: estimateId});
    verify(sourceEstimate, req.t('error.estimate_not_found'));

    // Verify the subcategory exists
    const subcategoriesColl = Db.getEciSubcategoriesCollection();
    const targetSubcategory = await subcategoriesColl.findOne({_id: subcategoryId});
    verify(targetSubcategory, req.t('error.subcategory_not_found'));

    // Get measurement unit (optional - default to square meter if available)
    const measurementUnitCollection = Db.getMeasurementUnitCollection();
    const defaultMeasurementUnit = await measurementUnitCollection.findOne({
        measurementUnitId: 'mSquare',
    });

    // Generate a new code for the ECI estimate
    const eciEstimatesColl = Db.getEciEstimatesCollection();

    // Find the highest code in this subcategory
    const existingEstimates = await eciEstimatesColl
        .find({subcategoryId: subcategoryId})
        .sort({code: -1})
        .limit(1)
        .toArray();

    let newCode = '01';
    if (existingEstimates.length > 0 && existingEstimates[0].code) {
        const lastCode = parseInt(existingEstimates[0].code);
        if (!isNaN(lastCode)) {
            newCode = String(lastCode + 1).padStart(2, '0');
        }
    }

    // Create the new ECI estimate entry
    const constructionArea = parseFloat(sourceEstimate!.constructionSurface) || 0;

    const newEciEstimate: any = {
        code: newCode,
        name: sourceEstimate!.name,
        subcategoryCode: targetSubcategory!.categoryFullCode,
        fullCode: targetSubcategory!.categoryFullCode + newCode,
        subcategoryId: targetSubcategory!._id,
        estimateId: estimateId,
        buildingType: buildingType,
        constructionArea: constructionArea,
    };

    // Only add measurement unit if found
    if (defaultMeasurementUnit) {
        newEciEstimate.measurementUnitMongoId = defaultMeasurementUnit._id;
    }

    const result = await eciEstimatesColl.insertOne(newEciEstimate);

    respondJsonData(res, {
        ok: true,
        eciEstimateId: result.insertedId,
        fullCode: newEciEstimate.fullCode,
    });
});
