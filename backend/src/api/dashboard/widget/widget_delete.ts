import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

registerApiSession('dashboard/widget/widget_delete', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const widgetIdParam = getReqParam(req, 'widgetId');
    verify(widgetIdParam, req.t('required.widgetId'));

    const widgetId = new ObjectId(widgetIdParam);

    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

    // Verify widget belongs to user
    const widget = await widgetsColl.findOne({
        _id: widgetId,
        accountId: session.mongoAccountId,
        userId: session.mongoUserId
    });
    verify(widget, req.t('error.widget_not_found'));

    // Delete widget
    await widgetsColl.deleteOne({ _id: widgetId });

    // Delete associated snapshots
    await snapshotsColl.deleteMany({ widgetId });

    respondJsonData(res, { ok: true });
});
