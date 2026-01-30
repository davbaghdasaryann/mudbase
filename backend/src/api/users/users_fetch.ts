import * as Db from '../../db';
import { ObjectId } from 'mongodb';
import { getReqParam, requireQueryParam } from '@src/tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verifyObject } from '../../tslib/verify';
import { DbFindParams, DbInsertParams } from '../../tsback/mongodb/mongodb_params';

import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getPendingUserFields, getUsersFetchFields } from '@src/permissions/db_get_fields';

registerApiSession('users/fetch', async (req, res, session) => {
    const usersCollection = Db.getUsersCollection();
    const search = getReqParam(req, 'search');
    const accountId = getReqParam(req, 'accountId'); // Filter by account (superadmin only)

    const pipeline = [];

    pipeline.push({ $match: { _id: { $ne: session.mongoUserId } } });

    pipeline.push({ $match: { accountId: { $exists: true, $ne: null } } });

    if (process.env.NODE_ENV === 'production') {
        pipeline.push({ $match: { isDev: { $ne: true } } });
    }

    if (session.checkPermissionsOr([Permissions.UsersFetchAll, Permissions.All])) {
        // Superadmin: can filter by accountId if provided
        if (accountId) {
            try {
                const accountObjectId = new ObjectId(accountId);
                pipeline.push({ $match: { accountId: accountObjectId } });
            } catch (error) {
                // Invalid ObjectId, ignore filter
            }
        }
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { email: { $regex: search, $options: 'i' } },
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { phoneNumber: { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }
    } else if (session.checkPermission(Permissions.UsersFetchLocal)) {
        pipeline.push({ $match: { accountId: session.mongoAccountId } });
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { email: { $regex: search, $options: 'i' } },
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { phoneNumber: { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }
    }

    pipeline.push({
        $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'accountInfo',
        },
    });

    pipeline.push({
        $unwind: { path: '$accountInfo', preserveNullAndEmptyArrays: true },
    });

    if (process.env.NODE_ENV === 'production') {
        pipeline.push({
            $match: {
                'accountInfo.isDev': { $ne: true },
            },
        });
    }

    pipeline.push({
        $addFields: {
            companyName: '$accountInfo.companyName',
        },
    });

    pipeline.push({
        $project: {
            accountInfo: 0,
        },
    });

    const data = await usersCollection.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});

// registerApiSession('users/fetch', async (req, res, session) => {
//     // session.assertPermission(Permissions.UsersFetchAll);

//     let users = Db.getUsersCollection();

//     let options = new DbFindParams(req, {
//         // select: userSelectFields,
//         allowed: getUsersFetchFields(),
//     });

//     let cursor;
//    // log_.info('session', session)
//     // let filter: Filter<Db.EntityUser> = {};
//     // let searchCondition: RootFilterOperators<Db.EntityUser> | undefined = undefined;

//     let search = getReqParam(req, 'search');

//     // 1. check if fetch all.
//     if (session.checkPermissionsOr([Permissions.UsersFetchAll, Permissions.All])) {
//         if (search) {
//             cursor = users.find(
//                 {
//                     _id: { $ne: session.mongoUserId },
//                     $or: [
//                         { email: { $regex: search, $options: 'i' } },
//                         { firstName: { $regex: search, $options: 'i' } },
//                         { lastName: { $regex: search, $options: 'i' } },
//                         { phoneNumber: { $regex: search, $options: 'i' } },

//                     ],
//                 },
//                 options.getFindOptions()
//             );
//         } else {
//             cursor = users.find(
//                 {
//                     _id: { $ne: session.mongoUserId },
//                 },
//                 options.getFindOptions()
//             );
//         }
//     } else if (session.checkPermission(Permissions.UsersFetchLocal)) {

//         if (search) {
//             cursor = users.find(
//                 {
//                     _id: { $ne: session.mongoUserId },
//                     accountId: session.mongoAccountId,
//                     $or: [
//                         { email: { $regex: search, $options: 'i' } },
//                         { firstName: { $regex: search, $options: 'i' } },
//                         { lastName: { $regex: search, $options: 'i' } },
//                         { phoneNumber: { $regex: search, $options: 'i' } },
//                     ],
//                 },
//                 options.getFindOptions()
//             );
//         } else {
//             cursor = users.find(
//                 {
//                     _id: { $ne: session.mongoUserId },
//                     accountId: session.mongoAccountId,
//                 },
//                 options.getFindOptions()
//             );
//         }
//     }

//     // // 2. check if fetch account
//     // if (!cursor && session.checkPermissionsOr([Permissions.UsersFetchAccount, Permissions.All])) {
//     //     cursor = await users.find(
//     //         {accountId: session.accountId, ...searchCondition},
//     //         options.getFindOptions()
//     //     );
//     // }

//     verifyObject(cursor, req.t('auth.permission_denied'));

//     const data = await cursor!.toArray();

//     respondJsonData(res, data);
// });

registerApiSession('pending_users/fetch_invited', async (req, res, session) => {
    // Only users with INV_FCH permission can fetch invited users
    session.assertPermission(Permissions.InvitesFetch);

    let search = getReqParam(req, 'search');

    let pendingUsers = Db.getPendingUsersCollection();

    let cursor;
    log_.info('session.mongoUserId', session.mongoUserId);
    if (!search) {
        cursor = pendingUsers.find({
            invited: true,
            _id: { $ne: session.mongoUserId },
            whoSentInvite: session.mongoUserId,
        });
    } else {
        cursor = pendingUsers.find({
            invited: true,

            _id: { $ne: session.mongoUserId },
            whoSentInvite: session.mongoUserId,
            $or: [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
            ],
        });
    }

    const data = await cursor.toArray();
    log_.info('data', data);

    respondJsonData(res, data);
});

registerApiSession('users/fetch_free', async (req, res, session) => {
    // Only users with PND_USR_FCH permission can fetch free users
    session.assertPermission(Permissions.PendingUsersFetch);

    const usersCollection = Db.getUsersCollection();
    const search = getReqParam(req, 'search');

    const pipeline = [];

    pipeline.push({ $match: { _id: { $ne: session.mongoUserId } } });
    if (process.env.NODE_ENV === 'production') {
        pipeline.push({ $match: { isDev: { $ne: true } } });
    }

    if (session.checkPermissionsOr([Permissions.UsersFetchAll, Permissions.All])) {
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { email: { $regex: search, $options: 'i' } },
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { phoneNumber: { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }
    } else if (session.checkPermission(Permissions.UsersFetchLocal)) {
        pipeline.push({ $match: { accountId: session.mongoAccountId } });
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { email: { $regex: search, $options: 'i' } },
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { phoneNumber: { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }
    }

    pipeline.push({
        $match: {
            $or: [{ accountId: { $exists: false } }, { accountId: null }],
        },
    });

    pipeline.push({
        $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'accountInfo',
        },
    });

    pipeline.push({
        $unwind: { path: '$accountInfo', preserveNullAndEmptyArrays: true },
    });

    if (process.env.NODE_ENV === 'production') {
        pipeline.push({
            $match: {
                'accountInfo.isDev': { $ne: true },
            },
        });
    }

    pipeline.push({
        $addFields: {
            companyName: '$accountInfo.companyName',
        },
    });

    pipeline.push({
        $project: {
            accountInfo: 0,
        },
    });
    const data = await usersCollection.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});

registerApiSession('users/remove_free_user', async (req, res, session) => {
    const usersCollection = Db.getUsersCollection();
    let userId = new ObjectId(requireQueryParam(req, 'freeUserId'));

    // log_.info('userId', userId)
    await usersCollection.deleteOne({ _id: userId });

    respondJsonData(res);
});
