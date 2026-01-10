import {ObjectId} from 'mongodb';

import * as Db from '@/db';

import {requireQueryParam} from '@/tsback/req/req_params';
import {registerApiSession} from '@/server/register';
import {respondJson, respondJsonData} from '@/tsback/req/req_response';
import {verify} from '@/tslib/verify';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {assertObject} from '@/tslib/assert';
import {deleteEstimateFromDatabase} from '@/api/estimate/estimate/estimate_delete';

registerApiSession('estimates_shares/delete_share_by_me', async (req, res, session) => {
    const shareId = requireMongoIdParam(req, 'shareId');
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimatesSharesCol = Db.getEstimatesSharesCollection();
    const estimatesCol = Db.getEstimatesCollection();

    const share = await estimatesSharesCol.findOne({
        _id: shareId,
        sharedByAccountId: new ObjectId(session.accountId),
    });

    assertObject(share, 'Invalid share');

    verify(share?.sharedEstimateId.toString() === estimateId.toString(), 'Invalid estimate id');

    const estimate = await estimatesCol.findOne({_id: estimateId});
    assertObject(share, 'Invalid estimate');

    if (estimate && estimate.isOriginal === false) {
        await deleteEstimateFromDatabase(estimate);
    }

    await estimatesSharesCol.deleteOne({_id: shareId});

    respondJson(res, {ok: true});
});

registerApiSession('estimates_shares/delete_share_by_me_group', async (req, res, session) => {
    const estimateNumber = requireQueryParam(req, 'estimateNumber');

    const estimatesSharesCol = Db.getEstimatesSharesCollection();
    const estimatesCol = Db.getEstimatesCollection();

    const shares = await estimatesSharesCol
        .find({estimateNumber: estimateNumber, sharedByAccountId: new ObjectId(session.accountId)})
        .toArray();

    log_.info(`delete estimate: ${estimateNumber}, count: ${shares.length}`);

    for (let share of shares) {
        log_.info('deleting', share._id);

        const estimate = await estimatesCol.findOne({_id: share.sharedEstimateId});

        if (estimate && estimate.isOriginal === false) {
            await deleteEstimateFromDatabase(estimate);
        }

        await estimatesSharesCol.deleteOne({_id: share._id});
    }

    respondJson(res, {ok: true});
});

registerApiSession('estimates_shares/delete_parent', async (req, res, session) => {
    const sharedEstimateRecordId = requireMongoIdParam(req, 'sharedEstimateId');

    const estimatesSharesCol = Db.getEstimatesSharesCollection();
    const estimatesCol = Db.getEstimatesCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    const now = new Date();

    // 1) Load & verify the share record
    const shareRow = await estimatesSharesCol.findOne({_id: sharedEstimateRecordId});
    verify(shareRow, req.t('share.not_found'));

    // log_.info('sharedEstimateRecordId', sharedEstimateRecordId)
    // respondJsonData(res, {})
    // return

    // 2) Soft‑delete the share record itself
    await estimatesSharesCol.deleteOne({_id: sharedEstimateRecordId});

    // await estimatesSharesCol.updateOne(
    //     { _id: sharedEstimateRecordId },
    //     { $set: { deleted: true, deletedAt: now } }
    // );

    // 3) Load & verify the underlying estimate
    const targetEstimateId = shareRow!.sharedEstimateId;
    log_.info('targetEstimateId', targetEstimateId);

    const estimate = (await estimatesCol.findOne({
        _id: targetEstimateId,
        isOriginal: true,
    })) as Db.EntityEstimate;

    if (!estimate || !estimate.estimateNumber) {
        respondJson(res, {ok: true});
        return;
    }

    // verify(estimate, req.t('estimate.not_found'));
    // verify(estimate?.estimateNumber, req.t('estimate.not_found'));

    const {estimateNumber} = estimate;

    // 4) Find all non‑deleted duplicatedEstimatesArray with the same estimateNumber
    const duplicatedEstimatesArray = await estimatesCol
        .find({
            estimateNumber,
            isOriginal: false,
            deleted: {$ne: true},
        })
        .toArray();

    if (duplicatedEstimatesArray.length) {
        const allDuplicatedEstimatesIds = duplicatedEstimatesArray.map((c) => c._id);

        const myShares = await estimatesSharesCol
            .find({
                sharedEstimateId: {$in: allDuplicatedEstimatesIds},
                sharedByAccountId: session.mongoAccountId,
                deleted: {$ne: true},
            })
            .toArray();

        // 6) Cascade‑soft‑delete each of those clone‑estimates + nested docs
        const toDeleteCloneIds = myShares.map((s) => s.sharedEstimateId);
        for (const cloneId of toDeleteCloneIds) {
            const secs = await sectionsCol.find({estimateId: cloneId}).toArray();
            for (const sec of secs) {
                const subs = await subsectionsCol.find({estimateSectionId: sec._id}).toArray();
                for (const sub of subs) {
                    const labs = await laborItemsCol
                        .find({estimateSubsectionId: sub._id})
                        .toArray();
                    for (const lab of labs) {
                        await laborItemsCol.deleteMany({_id: lab._id});
                        await materialItemsCol.deleteMany({estimatedLaborId: lab._id});
                    }
                    await subsectionsCol.deleteOne({_id: sub._id});
                }
                await sectionsCol.deleteOne({_id: sec._id});
            }
            await estimatesCol.deleteOne({_id: cloneId});
        }

        await estimatesSharesCol.deleteMany({_id: {$in: myShares.map((s) => s._id)}});

        /*
        // 5a) Find only _your_ share‑rows for those duplicatedEstimatesArray
        const myShares = await estimatesSharesCol.find({
            sharedEstimateId: { $in: allDuplicatedEstimatesIds },
            sharedByAccountId: session.mongoAccountId,
            deleted: { $ne: true }
        }).toArray();

        // 5b) Soft‑delete those share‑rows
        await estimatesSharesCol.updateMany(
            { _id: { $in: myShares.map(s => s._id) } },
            { $set: { deleted: true, deletedAt: now } }
        );

        // 6) Cascade‑soft‑delete each of those clone‑estimates + nested docs
        const toDeleteCloneIds = myShares.map(s => s.sharedEstimateId);
        for (const cloneId of toDeleteCloneIds) {
            const secs = await sectionsCol.find({ estimateId: cloneId }).toArray();
            for (const sec of secs) {
                const subs = await subsectionsCol.find({ estimateSectionId: sec._id }).toArray();
                for (const sub of subs) {
                    const labs = await laborItemsCol.find({ estimateSubsectionId: sub._id }).toArray();
                    for (const lab of labs) {
                        await materialItemsCol.updateMany(
                            { estimatedLaborId: lab._id },
                            { $set: { deleted: true, deletedAt: now } }
                        );
                        await laborItemsCol.updateOne(
                            { _id: lab._id },
                            { $set: { deleted: true, deletedAt: now } }
                        );
                    }
                    await subsectionsCol.updateOne(
                        { _id: sub._id },
                        { $set: { deleted: true, deletedAt: now } }
                    );
                }
                await sectionsCol.updateOne(
                    { _id: sec._id },
                    { $set: { deleted: true, deletedAt: now } }
                );
            }
            await estimatesCol.updateOne(
                { _id: cloneId },
                { $set: { deleted: true, deletedAt: now } }
            );
        }
        */
    }

    respondJson(res, {ok: true});
});

registerApiSession('estimates_shares/delete_duplicate', async (req, res, session) => {
    const sharedDuplicatedEstimateId = new ObjectId(
        requireQueryParam(req, 'sharedDuplicatedEstimateId')
    );

    const estimatesSharesCol = Db.getEstimatesSharesCollection();
    const estimatesCol = Db.getEstimatesCollection();

    // 1) Load the share‐row
    // const shareRow = await estimatesSharesCol.findOne({ _id: sharedDuplicatedEstimateId });
    const shareRow = await estimatesSharesCol.findOne({
        sharedEstimateId: sharedDuplicatedEstimateId,
    });
    verify(shareRow, 'Share record not found');

    // 2) Load the estimate it points at
    const targetEstimateId = sharedDuplicatedEstimateId;
    const estimate = await estimatesCol.findOne({_id: targetEstimateId});

    // log_.info('targetEstimateId', targetEstimateId)
    // respondJsonData(res, {})
    // return
    // 3) If the estimate exists and is a duplicate (isOriginal === false), soft‐delete it and all its children
    if (estimate && estimate.isOriginal === false) {
        await deleteEstimateFromDatabase(estimate);
    }

    await estimatesSharesCol.deleteOne({sharedEstimateId: sharedDuplicatedEstimateId});

    respondJsonData(res, {ok: true});
});

registerApiSession('estimates_shares/delete_from_common_table', async (req, res, session) => {
    const sharedEstimateMongoId = new ObjectId(requireQueryParam(req, 'sharedEstimateMongoId'));

    const estimatesSharesCol = Db.getEstimatesSharesCollection();
    const estimatesCol = Db.getEstimatesCollection();

    const shareRow = (await estimatesSharesCol.findOne({
        _id: sharedEstimateMongoId,
    })) as Db.EntityEstimatesShares;
    verify(shareRow, 'Share record not found');

    // log_.info('targetEstimateId', sharedEstimateMongoId)
    // respondJsonData(res, {})
    // return
    // 2) Load the estimate it points at
    const targetEstimateId = shareRow?.sharedEstimateId;
    verify(targetEstimateId, 'Shared Estimate record not found');

    const estimate = await estimatesCol.findOne({_id: targetEstimateId});

    // log_.info('targetEstimateId', targetEstimateId, shareRow?.sharedEstimateId)
    // respondJsonData(res, {})
    // return
    // 3) If the estimate exists and is a duplicate (isOriginal === false), soft‐delete it and all its children
    if (estimate && estimate.isOriginal === false) {
        await deleteEstimateFromDatabase(estimate);
    }

    // // 4) If the estimate was a duplicate or doesn’t exist, soft‐delete the share record
    // if (!estimate || estimate.isOriginal === false) {
    await estimatesSharesCol.deleteOne({_id: sharedEstimateMongoId});
    // await estimatesSharesCol.updateOne(
    //     {_id: sharedEstimateMongoId},
    //     {$set: {deleted: true, deletedAt: now}}
    // );
    // }

    respondJson(res, {ok: true});
});
