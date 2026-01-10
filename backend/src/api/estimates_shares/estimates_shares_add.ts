import { ObjectId } from 'mongodb';

import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '@/tsback/req/req_params';
import { registerApiSession } from '@/server/register';
import { respondJson } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';

registerApiSession('estimates_shares/add_full_for_share', async (req, res, session) => {
    const originalEstimateId = requireMongoIdParam(req, 'estimateId');
    const sharedWithAccountId = requireMongoIdParam(req, 'sharedWithAccountId');

    const estimateMultiShareType = getReqParam(req, 'estimateMultiShareType');

    let isOnlyEstimateInfo = false;

    // determine if we're sharing only metadata
    if (estimateMultiShareType === 'onlyEstimateInfo') {
        isOnlyEstimateInfo = true;
    }


    //
    // Fetch the original estimate
    //
    const estimatesColl = Db.getEstimatesCollection();
    const originalEstimate = await estimatesColl.findOne({ _id: originalEstimateId }) as Db.EntityEstimate;
    verify(originalEstimate, req.t('validate.estimate_id'));


    //
    // Check if such share already exists
    //
    const sharesColl = Db.getEstimatesSharesCollection();
    const existingShare = await sharesColl.findOne({estimateNumber: originalEstimate!.estimateNumber, sharedWithAccountId: sharedWithAccountId});
    if (existingShare) {
        respondJson(res, {ok: true, duplicate: true});
        return;
    }


    // Fetch the shared with account
    const accountsColl = Db.getAccountsCollection();
    const sharedWithAccount = await accountsColl.findOne({_id: sharedWithAccountId});
    assertObject(sharedWithAccount, "Invalid Account");


    // verify(estimateIdParam && sharedWithAccountIdParam, req.t('req.empty_data'));

    // const originalEstimateId = new ObjectId(estimateIdParam);
    // const sharedWithAccountId = new ObjectId(sharedWithAccountIdParam);

    // fetch original




    // create full duplicate (preserve all fields)
    const newEstimateId = new ObjectId();
    const newEstimate: Db.EntityEstimate = {
        ...originalEstimate,
        _id: newEstimateId,
        createdAt: new Date(),
        isOriginal: false,
        // accountId: 
        sharedWithAccountId: sharedWithAccountId,
        originalEstimateId: originalEstimateId,
        // leave totalCost, subtotals, quantities, prices, etc. exactly as in original
    };
    await estimatesColl.insertOne(newEstimate);

    // if we need to duplicate sections/subsections/items, copy them over with new IDs
    if (!isOnlyEstimateInfo) {
        const estimateSections = Db.getEstimateSectionsCollection();
        const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
        const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
        const estimateMaterialItems = Db.getEstimateMaterialItemsCollection();

        // map to carry over all nested data
        const sectionMap = new Map<string, ObjectId>();
        const subsectionMap = new Map<string, ObjectId>();
        const laborMap = new Map<string, ObjectId>();

        // duplicate sections
        const originalSections = await estimateSections.find({ estimateId: originalEstimateId }).toArray();
        for (const sec of originalSections) {
            const newSecId = new ObjectId();
            sectionMap.set(sec._id.toHexString(), newSecId);
            await estimateSections.insertOne({
                ...sec,
                _id: newSecId,
                estimateId: newEstimateId
            });

            // duplicate subsections
            const originalSubsecs = await estimateSubsectionsColl.find({ estimateSectionId: sec._id }).toArray();
            for (const sub of originalSubsecs) {
                const newSubId = new ObjectId();
                subsectionMap.set(sub._id.toHexString(), newSubId);
                await estimateSubsectionsColl.insertOne({
                    ...sub,
                    _id: newSubId,
                    estimateSectionId: newSecId,
                    estimateId: newEstimateId,
                });

                // duplicate labor items
                const originalLabors = await estimateLaborItemsColl.find({ estimateSubsectionId: sub._id }).toArray();
                for (const lab of originalLabors) {
                    const newLabId = new ObjectId();
                    laborMap.set(lab._id.toHexString(), newLabId);
                    await estimateLaborItemsColl.insertOne({
                        ...lab,
                        _id: newLabId,
                        estimateId: newEstimateId,
                        estimateSubsectionId: newSubId,
                    });

                    // duplicate material items
                    const originalMats = await estimateMaterialItems.find({ estimatedLaborId: lab._id }).toArray();
                    for (const mat of originalMats) {
                        await estimateMaterialItems.insertOne({
                            ...mat,
                            _id: new ObjectId(),
                            estimateId: newEstimateId,
                            estimateSubsectionId: newSubId,
                            estimatedLaborId: newLabId
                        });
                    }
                }
            }
        }
    }

    // finally, record the share
    // const shares = Db.getEstimatesSharesCollection();

    // const newShareId = new ObjectId();

    // // 2. Build the record (now satisfies EntityEstimatesShares)
    // const shareRecord: Db.EntityEstimatesShares = {
    //   _id: newShareId,
    //   sharedEstimateId: newEstimateId,
    //   sharedWithAccountId,
    //   sharedAt: new Date(),
    //   isOnlyEstimateInfo,
    //   // these two may be undefined, but that matches the optional definitions
    //   ...(session.mongoUserId    && { sharedByUserId: session.mongoUserId }),
    //   ...(session.mongoAccountId && { sharedByAccountId: session.mongoAccountId }),
    // };

    // const { acknowledged, insertedId } = await shares.insertOne(shareRecord);
    // verify(acknowledged, req.t('share.fail'));

    // shareRecord._id = insertedId;



    let sharedEstimateData: Db.EntityEstimatesShares = {} as Db.EntityEstimatesShares;

    if (session.mongoUserId)
        sharedEstimateData.sharedByUserId = session.mongoUserId;
    if (session.mongoAccountId)
        sharedEstimateData.sharedByAccountId = session.mongoAccountId;

    sharedEstimateData.sharedEstimateId = newEstimateId;
    sharedEstimateData.estimateNumber = originalEstimate.estimateNumber!;
    sharedEstimateData.sharedWithAccountId = sharedWithAccountId;
    sharedEstimateData.sharedAt = new Date();
    sharedEstimateData.isOnlyEstimateInfo = isOnlyEstimateInfo;


    let data = await sharesColl.insertOne(sharedEstimateData);
    verify(data.acknowledged, req.t('share.fail'));

    sharedEstimateData._id = data.insertedId;


    respondJson(res, sharedEstimateData);
});




/*
registerApiSession('estimates_shares/add_for_view', async (req, res, session) => {

    let estimateId = requireQueryParam(req, 'estimateId');
    let calledFromPageRes = getReqParam(req, 'calledFromPage');

    let sharedWithAccountIdRes = getReqParam(req, 'sharedWithAccountId');
    // log_.info('session: ', session)

    // let estimateId = estimateIdRes;
    let sharedWithAccountId;
    // log_.info('session.permissions', session.permissions, sharedWithAccountIdRes, estimateId)

    if (session.permissions && !sharedWithAccountIdRes) {
        if (session.permissions.includes('EST_CRT_BY_BNK') || session.permissions.includes('EST_CRT_BY_DEV')) {
            sharedWithAccountId = session.mongoAccountId;
        }
    } else {
        sharedWithAccountId = sharedWithAccountIdRes;
    }

    log_.info('estimateId: ', estimateId, 'sharedWithAccountId: ', sharedWithAccountId)
    verify((estimateId && sharedWithAccountId), 'Empty data')


    let estimatesShares = Db.getEstimatesSharesCollection();
    let sharedEstimateData: Db.EntityEstimatesShares = {} as Db.EntityEstimatesShares;

    if (calledFromPageRes === 'estimates') {
        const existingSelfShare = await estimatesShares.findOne({
            sharedEstimateId: new ObjectId(estimateId),
            sharedByAccountId: session.mongoAccountId,
            sharedWithAccountId: session.mongoAccountId,
            deleted: { $ne: true },
        });

        if (existingSelfShare) {
            log_.info('Returning existing self-share', existingSelfShare._id?.toString());
            return respondJsonData(res, existingSelfShare);
        }
    }

    if (session.mongoUserId)
        sharedEstimateData.sharedByUserId = session.mongoUserId;
    if (session.mongoAccountId)
        sharedEstimateData.sharedByAccountId = session.mongoAccountId;

    sharedEstimateData.sharedEstimateId = new ObjectId(estimateId);
    sharedEstimateData.sharedWithAccountId = new ObjectId(sharedWithAccountId);
    sharedEstimateData.sharedAt = new Date();
    sharedEstimateData.isOnlyEstimateInfo = false;
    sharedEstimateData.estimateNumber = sharedEstimateData.estimateNumber!;



    let data = await estimatesShares.insertOne(sharedEstimateData);
    verify(data.acknowledged, req.t('insert.fail'));

    sharedEstimateData._id = data.insertedId;
    respondJsonData(res, sharedEstimateData);
});


registerApiSession('estimates_shares/add_for_update', async (req, res, session) => {

    let estimateShareIdParam = getReqParam(req, 'estimateShareId');
    let sharedWithAccountIdParam = getReqParam(req, 'sharedWithAccountId');
    let estimateMultiShareType = getReqParam(req, 'estimateMultiShareType');

    verify((estimateShareIdParam && sharedWithAccountIdParam), req.t('req.empty_data'));

    let estimateShareId = new ObjectId(estimateShareIdParam)
    let sharedWithAccountId = new ObjectId(sharedWithAccountIdParam)

    const estimatesShares = Db.getEstimatesSharesCollection();
    const estiamtesShare = await estimatesShares.findOne({ _id: estimateShareId })
    const estimateId = estiamtesShare?.sharedEstimateId

    verify(estimateId, req.t('validate.estimate_id'));



    const estimates = Db.getEstimatesCollection();
    const estimateSections = Db.getEstimateSectionsCollection();
    const estimateSubsections = Db.getEstimateSubsectionsCollection();
    const estimateLaborItems = Db.getEstimateLaborItemsCollection();
    const estimateMaterialItems = Db.getEstimateMaterialItemsCollection();

    // Duplicate estimate 
    const originalEstimate = await estimates.findOne({ _id: estimateId }) as Db.EntityEstimate;
    verify(originalEstimate, req.t('validate.estimate_id'));

    const originalEstimateId = originalEstimate._id;
    const newEstimateId = new ObjectId();

    const newEstimate = {
        ...originalEstimate,
        _id: newEstimateId,
        totalCost: 0,
        totalCostWithOtherExpenses: 0,
        createdAt: new Date(),
        isOriginal: false,
        originalEstimateId: originalEstimateId
    } as Db.EntityEstimate;
    await estimates.insertOne(newEstimate)

    log_.info('estimateMultiShareType', estimateMultiShareType)

    let isOnlyEstimateInfo = false;

    if (estimateMultiShareType === 'onlyEstimateInfo') {
        isOnlyEstimateInfo = true;
        // respondJsonData(res, 'onlyEstimateInfo');
    } else {

        // Duplicate estimate sections
        const originalSections = await estimateSections.find({ estimateId: originalEstimateId }).toArray();
        const sectionIdMap = new Map(); // old section IDs to new Ids

        for (const section of originalSections) {
            const newSectionId = new ObjectId();
            sectionIdMap.set(section._id.toString(), newSectionId.toString());

            const newSection = {
                ...section,
                _id: newSectionId,
                estimateId: newEstimateId,
                totalCost: 0
            };
            await estimateSections.insertOne(newSection);

            // Duplicate all subsections
            const originalSubsections = await estimateSubsections.find({ estimateSectionId: section._id }).toArray();
            const subsectionIdMap = new Map(); // old subsection IDs to new Ids

            for (const subsection of originalSubsections) {
                const newSubsectionId = new ObjectId();
                subsectionIdMap.set(subsection._id.toString(), newSubsectionId.toString());

                const newSubsection = {
                    ...subsection,
                    _id: newSubsectionId,
                    estimateSectionId: newSectionId,
                    totalCost: 0
                };
                await estimateSubsections.insertOne(newSubsection);

                // Duplicate labor items
                const originalLaborItems = await estimateLaborItems.find({ estimateSubsectionId: subsection._id }).toArray();
                const laborIdMap = new Map();

                for (const laborItem of originalLaborItems) {
                    const newLaborId = new ObjectId();
                    laborIdMap.set(laborItem._id.toString(), newLaborId.toString());

                    const newLaborItem = {
                        ...laborItem,
                        _id: newLaborId,
                        estimateSubsectionId: newSubsectionId,
                        // quantity: 0,
                        changableAveragePrice: 0,
                    };
                    await estimateLaborItems.insertOne(newLaborItem);

                    // Duplicate material items
                    const originalMaterialItems = await estimateMaterialItems.find({ estimatedLaborId: laborItem._id }).toArray();

                    for (const materialItem of originalMaterialItems) {
                        const newMaterialItem = {
                            ...materialItem,
                            _id: new ObjectId(),
                            estimateSubsectionId: newSubsectionId,
                            estimatedLaborId: newLaborId,
                            // quantity: 0,
                            changableAveragePrice: 0,
                        };
                        await estimateMaterialItems.insertOne(newMaterialItem);
                    }
                }

            }
        }
    }

    // let estimatesShares = Db.getEstimatesSharesCollection();
    let sharedEstimateData: Db.EntityEstimatesShares = {} as Db.EntityEstimatesShares;

    if (session.mongoUserId)
        sharedEstimateData.sharedByUserId = session.mongoUserId;
    if (session.mongoAccountId)
        sharedEstimateData.sharedByAccountId = session.mongoAccountId;

    sharedEstimateData.sharedEstimateId = newEstimateId;
    sharedEstimateData.sharedWithAccountId = sharedWithAccountId;
    sharedEstimateData.sharedAt = new Date();
    sharedEstimateData.estimateNumber = originalEstimate.estimateNumber!;
    sharedEstimateData.isOnlyEstimateInfo = isOnlyEstimateInfo;
    sharedEstimateData.isDuplicatedChild = true;


    let data = await estimatesShares.insertOne(sharedEstimateData);
    verify(data.acknowledged, req.t('share.fail'));

    sharedEstimateData._id = data.insertedId;

    respondJsonData(res, sharedEstimateData);
});
*/



