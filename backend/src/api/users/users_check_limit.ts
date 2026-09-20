import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('users/check_limit', async (req, res, session) => {
    const users = Db.getUsersCollection();
    const pendingUsers = Db.getPendingUsersCollection();
    const accounts = Db.getAccountsCollection();

    const fromUser = await users.findOne({ _id: session.mongoUserId });
    const fromUserAccount = await accounts.findOne({ _id: fromUser?.accountId });

    if (!fromUserAccount?.packageId) {
        return respondJsonData(res, { limited: false });
    }

    const pkg = await Db.getPackagesCollection().findOne({ _id: fromUserAccount.packageId });
    if (!pkg?.numberOfUsers) {
        return respondJsonData(res, { limited: false });
    }

    const activeUserCount = await users.countDocuments({
        accountId: fromUserAccount._id,
        isActive: true,
    });

    const pendingInviteCount = await pendingUsers.countDocuments({
        accountId: fromUserAccount._id,
    });

    const totalCount = activeUserCount + pendingInviteCount;

    return respondJsonData(res, {
        limited: totalCount >= pkg.numberOfUsers,
        count: totalCount,
        limit: pkg.numberOfUsers,
    });
});
