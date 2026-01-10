import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';

registerApiSession('user/active_status_change', async (req, res, session) => {
    let userId = new ObjectId(requireQueryParam(req, 'userId'));
    let activeStatusString = requireQueryParam(req, 'activeStatus');
    const users = Db.getUsersCollection();
    const pendingUsers = Db.getPendingUsersCollection();

    //  const users = Db.getUsersCollection();

    let activeStatus: boolean;
    if (activeStatusString === 'true') {
        activeStatus = true;
    } else {
        activeStatus = false;
    }

    if (activeStatus) {
        const userToActivate = await users.findOne({ _id: userId });
        verify(userToActivate, "User not found");

        const accounts = Db.getAccountsCollection();
        const account = await accounts.findOne({ _id: userToActivate?.accountId });
        verify(account, req.t("Account not found"));

        const activeUserCount = await users.countDocuments({
            accountId: account?._id,
            isActive: true
        });

        const pendingInviteCount = await pendingUsers?.countDocuments({
            accountId: account?._id
        });

        const totalCount = activeUserCount + pendingInviteCount;
        if (totalCount >= 3) {
            verify(false, req.t('usersLimit.pendingInviteCountMoreThanZero'));
        }
    }

    log_.info('activeStatus', activeStatus)

    let result = await users.updateOne({ _id: userId }, { $set: { isActive: activeStatus } });

    respondJsonData(res, result);
});
