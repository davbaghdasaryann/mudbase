import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';

import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';



registerApiSession('estimate/create', async (req, res, session) => {
    session.assertPermission(Permissions.EstimateCreate);

    let createEstimateData = req.body as Db.EntityEstimate ?? {};

    if (createEstimateData.name !== undefined) {
        createEstimateData.name = createEstimateData.name.trim();
        if (createEstimateData.name === '') {
            verify(createEstimateData.name, req.t('required.name'));
        }
    }

    const allowedFields = ["name", "address", "constructionType", "buildingType", "constructionSurface", "builtUpArea"];

    const filteredCreateEstimateData: Partial<Db.EntityEstimate> = Object.fromEntries(
        Object.entries(createEstimateData).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredCreateEstimateData).length === 0) {
        return respondJsonData(res, "No valid fields to update");
    }

    filteredCreateEstimateData.createdByUserId = session.mongoUserId;
    filteredCreateEstimateData.accountId = session.mongoAccountId;
    filteredCreateEstimateData.createdAt = new Date();
    filteredCreateEstimateData.estimateNumber = await Db.generateNewEstimateId();
    filteredCreateEstimateData.isOriginal = true;

    filteredCreateEstimateData.otherExpenses = [{ typeOfCost: 0 }]

    let estimates = Db.getEstimatesCollection();

    // let estimate = req.body as Db.EntityEstimates
    // estimate.name = estimateName;
    // estimate.createdByUserId = session.mongoUserId;
    // estimate.createdDate = new Date();
    // estimate.estimateNumber = parseInt(await Db.generateNewEstimateId());

    await estimates.insertOne(filteredCreateEstimateData);


    respondJsonData(res, {
        estimateNumber: filteredCreateEstimateData.estimateNumber,
    });
});
