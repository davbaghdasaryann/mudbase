import * as Db from '../../db';

import { registerApiSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';
import { arraysEqual } from '../accounts/accounts';
import { combineUserPermissions } from '../../permissions/roles_setup';
import { authjsLogoutUser } from '../../authjs/authjs_lib';

registerApiSession('profile/update_account', async (req, res, session) => {

    // let parm = new DbUpdateParams<Db.EntityAccount>(req, session.accountId, {
    //     query: getAccountUpdateFields(),
    //     allowed: getAccountUpdateFields(),
    // });

    let accounts = Db.getAccountsCollection();
    // let data = parm.getObject();
    let data = req.body;

    let updateUserPermissions = false;
    let newAccountActivity;
    // log_.info('I am hereasdasdasd', data)

    if (data.accountActivity) {
        // log_.info('I am here')

        newAccountActivity = data.accountActivity; // should be an array of strings like ['A', 'F', ...]
        // Get current account document
        const currentAccount = await accounts.findOne({ _id: session.mongoAccountId });
        verify(currentAccount, 'auth.account_not_found');

        if (!currentAccount?.accountActivity || !arraysEqual(currentAccount?.accountActivity, newAccountActivity)) {
            updateUserPermissions = true;
        }
    }


    let result: any;


    if (updateUserPermissions) {
        let usersCollection = Db.getUsersCollection();
        const users = await usersCollection.find({ accountId: session.mongoAccountId }).toArray();
        for (const user of users) {

            let permissionsStr: string = combineUserPermissions(user.role!, newAccountActivity!);

            await usersCollection.updateOne(
                { _id: user._id },
                {
                    $set: { permissions: permissionsStr, isActive: false },
                    $unset: { chosenPermissions: "" }
                }
            );

            authjsLogoutUser(user._id.toString());
        }

        result = await accounts.updateOne({ _id: session.mongoAccountId }, { $set: {...data, isActive: false} })
    } else {
        result = await accounts.updateOne({ _id: session.mongoAccountId }, { $set: data })
    }


    respondJsonData(res, result);
});
