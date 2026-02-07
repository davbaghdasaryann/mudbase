import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

registerApiSession('dashboard/widget/widget_create', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const groupIdParam = getReqParam(req, 'groupId');
    const name = getReqParam(req, 'name');
    const widgetType = getReqParam(req, 'widgetType') as Db.WidgetType;
    const dataSource = getReqParam(req, 'dataSource') as Db.DataSource;

    verify(groupIdParam, req.t('required.groupId'));
    verify(name && name.trim(), req.t('required.name'));
    verify(widgetType, req.t('required.widgetType'));
    verify(dataSource, req.t('required.dataSource'));

    const groupId = new ObjectId(groupIdParam);
    const dataSourceConfig = req.body.dataSourceConfig as Db.DataSourceConfig;
    verify(dataSourceConfig, 'Data source configuration required');

    const widgetsColl = Db.getDashboardWidgetsCollection();
    const groupsColl = Db.getDashboardWidgetGroupsCollection();

    // Verify group exists and belongs to user
    const group = await groupsColl.findOne({
        _id: groupId,
        accountId: session.mongoAccountId,
        userId: session.mongoUserId
    });
    verify(group, req.t('error.group_not_found'));

    // Get next display index
    const lastWidget = await widgetsColl
        .find({ groupId })
        .sort({ displayIndex: -1 })
        .limit(1)
        .next();

    const displayIndex = lastWidget ? lastWidget.displayIndex + 1 : 0;

    const newWidget: Db.EntityDashboardWidget = {
        accountId: session.mongoAccountId,
        userId: session.mongoUserId,
        groupId,
        name: name.trim(),
        widgetType,
        dataSource,
        dataSourceConfig,
        displayIndex,
        createdAt: new Date()
    };

    const result = await widgetsColl.insertOne(newWidget);
    respondJsonData(res, { insertedId: result.insertedId });
});
