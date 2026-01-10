import { ObjectId } from 'mongodb';

import * as Db from '@/db';
import { requireQueryParam } from '@/tsback/req/req_params';
import { registerApiSession } from '@/server/register';
import { respondJson } from '@/tsback/req/req_response';
import { AccountActivity } from '@/tsmudbase/company_activities';
import { verify } from '../../tslib/verify';
import { UserRole } from '../../tsmudbase/user_roles';
import { combineUserPermissions, userPermissionsSetUp } from '../../permissions/roles_setup';

registerApiSession('account/activate_status_change', async (req, res, session) => {
    let accountId = new ObjectId(requireQueryParam(req, 'accountId'));
    let activeStatusString = requireQueryParam(req, 'activeStatus');
    const accounts = Db.getAccountsCollection();
    const users = Db.getUsersCollection();

    let activeStatus: boolean;
    if (activeStatusString === 'true') {
        activeStatus = true;
    } else {
        activeStatus = false;
    }

    log_.info('activeStatus', activeStatus)
    let account = await accounts.findOne({ _id: accountId })

    if (activeStatus) {
        // let user = await users.findOne({ _id: account?.adminUserId })

        verify(account?.accountActivity, 'Account activity error')

        const selectedActivities: AccountActivity[] = account!.accountActivity!;

        const userRole: UserRole = 'A';

        // let combinedPermissions: string[] = [];
        // if (Array.isArray(selectedActivities)) {
        //     for (const activity of selectedActivities) {
        //         const perms = userPermissionsSetUp(userRole, activity);
        //         combinedPermissions = [...new Set([...combinedPermissions, ...perms])];
        //     }
        // }

        // const permissionsStr = combinedPermissions.join(',');
        let permissionsStr: string = combineUserPermissions(userRole, selectedActivities);

        log_.info('permissionsStr', permissionsStr)

        users.updateMany({ accountId: account?._id }, { $set: { permissions: permissionsStr, isActive: true } })
    } else {
        users.updateMany({ accountId: account?._id }, { $set: { isActive: false } })

    }

    let result = await accounts.updateOne({ _id: accountId }, { $set: { isActive: activeStatus } });

    respondJson(res, result);
});
