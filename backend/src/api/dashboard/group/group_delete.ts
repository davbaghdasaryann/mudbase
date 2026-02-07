import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

registerApiSession('dashboard/group/delete', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const groupIdParam = getReqParam(req, 'groupId');
    verify(groupIdParam, req.t('required.groupId'));

    const groupId = new ObjectId(groupIdParam);

    const groupsColl = Db.getDashboardWidgetGroupsCollection();
    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

    // Verify group belongs to user
    const group = await groupsColl.findOne({
        _id: groupId,
        accountId: session.mongoAccountId,
        userId: session.mongoUserId
    });
    verify(group, req.t('error.group_not_found'));

    // Get all widgets in group
    const widgets = await widgetsColl.find({ groupId }).toArray();
    const widgetIds = widgets.map(w => w._id!);

    // Delete all snapshots for widgets in this group
    if (widgetIds.length > 0) {
        await snapshotsColl.deleteMany({ widgetId: { $in: widgetIds } });
    }

    // Delete all widgets in group
    await widgetsColl.deleteMany({ groupId });

    // Delete group
    await groupsColl.deleteOne({ _id: groupId });

    respondJsonData(res, { ok: true });
});
