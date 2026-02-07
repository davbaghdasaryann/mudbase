import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/groups/fetch', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const groupsColl = Db.getDashboardWidgetGroupsCollection();

    // Fetch all groups for user
    const groups = await groupsColl
        .find({
            accountId: session.mongoAccountId,
            userId: session.mongoUserId
        })
        .sort({ displayIndex: 1 })
        .toArray();

    respondJsonData(res, groups);
});
