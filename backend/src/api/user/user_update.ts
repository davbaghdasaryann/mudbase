import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { DbFindParams, DbInsertParams } from '../../tsback/mongodb/mongodb_params';
import { getUserProfileFetchFields, getUserProfileUpdateFields } from '../../permissions/db_get_fields';
import { ObjectId } from 'mongodb';
import { combineUserPermissions, userPermissionsSetUp } from '../../permissions/roles_setup';
import { verify } from '../../tslib/verify';
import { authjsLogoutUser } from '../../authjs/authjs_lib';


registerApiSession('user/update', async (req, res, session) => {
    let userId = new ObjectId(requireQueryParam(req, 'userId'));

    let parm = new DbInsertParams<Db.EntityUser>(req, {
        query: ['firstName', 'middleName', 'lastName', 'phoneAreaCode', 'phoneNumber'],
        allowed: getUserProfileUpdateFields(),
    });

    let users = Db.getUsersCollection();
    let data = parm.getObject();
    if (req.body.chosenPermissions) {
        data.chosenPermissions = req.body.chosenPermissions;
    }

    const user = await users.findOne({ _id: userId }) as Db.EntityUser;
    const accounts = Db.getAccountsCollection();
    const account = await accounts.findOne({ _id: user?.accountId }) as Db.EntityAccount

    let isPermissionsUpdated = false;

    log_.info('data', data)
    // if (account.accountActivity) {
    if (account.accountActivity && data.chosenPermissions) {
        // let user = await users.findOne({ _id: userId }) as Db.EntityUser
        verify(user.role, 'auth.role_not_found')
        // data.userActivity = req.body.userActivity;



        // let combinedPermissions: string[] = [];
        // if (Array.isArray(req.body.userActivity)) {
        //     for (const activity of req.body.userActivity) {
        //         const perms = userPermissionsSetUp(user.role!, activity);
        //         combinedPermissions = [...new Set([...combinedPermissions, ...perms])];
        //     }
        // }

        // const permissionsStr = combinedPermissions.join(',');

        let permissionsStr: string = '';
        if (data.chosenPermissions) {
            permissionsStr = combineUserPermissions(user.role!, account.accountActivity, data.chosenPermissions);
        }
        // else if (user.chosenPermissions) {
        //     permissionsStr = combineUserPermissions(user.role!, account.accountActivity, user.chosenPermissions);
        // } else {
        //     permissionsStr = combineUserPermissions(user.role!, account.accountActivity);

        // }

        data.permissions = permissionsStr;

        isPermissionsUpdated = true;
    }


    let result = await users.updateOne({ _id: userId }, { $set: data });

    if (isPermissionsUpdated) {
        authjsLogoutUser(userId.toString());
    }

    respondJsonData(res, result);
});


