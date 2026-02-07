import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

registerApiSession('dashboard/group/create', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const name = getReqParam(req, 'name');
    verify(name && name.trim(), req.t('required.name'));

    const groupsColl = Db.getDashboardWidgetGroupsCollection();

    // Get next display index
    const lastGroup = await groupsColl
        .find({ accountId: session.mongoAccountId, userId: session.mongoUserId })
        .sort({ displayIndex: -1 })
        .limit(1)
        .next();

    const displayIndex = lastGroup ? lastGroup.displayIndex + 1 : 0;

    const newGroup: Db.EntityDashboardWidgetGroup = {
        accountId: session.mongoAccountId,
        userId: session.mongoUserId,
        name: name.trim(),
        displayIndex,
        createdAt: new Date()
    };

    const result = await groupsColl.insertOne(newGroup);
    respondJsonData(res, { insertedId: result.insertedId });
});
