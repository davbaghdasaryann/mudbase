import {ObjectId} from 'mongodb';

import * as Db from '@/db';
import {registerApiSession} from '@/server/register';
import {respondJsonData} from '@/tsback/req/req_response';
import {getReqParam, requireQueryParam} from '@src/tsback/req/req_params';
import {DbFindParams} from '@/tsback/mongodb/mongodb_params';

import {Permissions} from '@src/tsmudbase/permissions_setup';
import {getPendingUserFields} from '@/permissions/db_get_fields';

registerApiSession('signup/pending_users', async (req, res, session) => {
    session.assertPermission(Permissions.UsersFetchAll);

    let pendingUsers = Db.getPendingUsersCollection();

    let search = getReqParam(req, 'search');

    let cursor;
    let options = new DbFindParams(req, {
        // select: userSelectFields,
        allowed: getPendingUserFields(),
    });
    if (!search) {
        cursor = pendingUsers.find({_id: {$ne: session.mongoUserId}}, options.getFindOptions());
    } else {
        cursor = pendingUsers.find(
            {
                _id: {$ne: session.mongoUserId},
                $or: [
                    {email: {$regex: search, $options: 'i'}},
                    {firstName: {$regex: search, $options: 'i'}},
                    {lastName: {$regex: search, $options: 'i'}},
                    {phoneNumber: {$regex: search, $options: 'i'}},
                ],
            },
            options.getFindOptions()
        );
    }

    const data = await cursor.toArray();
    respondJsonData(res, data);
});

registerApiSession('signup/set_account', async (req, res, session) => {
    // session.assertPermission(Permissions.UserManageAll);

    let pendingUserId = new ObjectId(requireQueryParam(req, 'pendingUserId'));
    let accountId = new ObjectId(requireQueryParam(req, 'accountId'));

    let pendingUsers = Db.getPendingUsersCollection();

    const result = await pendingUsers.updateOne(
        {_id: pendingUserId},
        {$set: {accountId: accountId}}
    );

    respondJsonData(res, result);
});

registerApiSession('signup/reject', async (req, res, session) => {
    session.assertPermission(Permissions.UserManageAll);

    let pendingUsers = Db.getPendingUsersCollection();
    let pendingUserId = new ObjectId(requireQueryParam(req, 'pendingUserId'));

    const result = await pendingUsers.deleteOne({_id: pendingUserId});

    respondJsonData(res, result);
});
