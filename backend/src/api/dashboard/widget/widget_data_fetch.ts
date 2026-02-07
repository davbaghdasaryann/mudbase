import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

registerApiSession('dashboard/widget/widget_data_fetch', async (req, res, session) => {

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

    // Determine time range based on widget type
    const now = new Date();
    let startDate: Date;

    switch (widget!.widgetType) {
        case '1-day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '15-day':
            startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            break;
        case '30-day':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch snapshots
    const snapshots = await snapshotsColl
        .find({
            widgetId,
            timestamp: { $gte: startDate }
        })
        .sort({ timestamp: 1 })
        .toArray();

    // Calculate analytics for 15-day and 30-day widgets
    let analytics = null;
    if (widget!.widgetType !== '1-day' && snapshots.length > 0) {
        const values = snapshots.map(s => s.value);
        analytics = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length
        };
    }

    respondJsonData(res, {
        widget,
        snapshots,
        analytics
    });
});
