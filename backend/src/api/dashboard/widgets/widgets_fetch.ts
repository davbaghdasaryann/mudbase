import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/widgets/widgets_fetch', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    // Check for admin-specific permissions
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const groupsColl = Db.getDashboardWidgetGroupsCollection();
    const widgetsColl = Db.getDashboardWidgetsCollection();

    // Fetch all groups for user
    const groups = await groupsColl
        .find({
            accountId: session.mongoAccountId,
            userId: session.mongoUserId
        })
        .sort({ displayIndex: 1 })
        .toArray();

    // Fetch widgets for each group using aggregation
    const pipeline = [
        {
            $match: {
                accountId: session.mongoAccountId,
                userId: session.mongoUserId
            }
        },
        {
            $sort: { displayIndex: 1 }
        },
        {
            $group: {
                _id: '$groupId',
                widgets: { $push: '$$ROOT' }
            }
        }
    ];

    const widgetsByGroup = await widgetsColl.aggregate(pipeline).toArray();
    const widgetsMap: Record<string, any[]> = Object.fromEntries(
        widgetsByGroup.map(g => [g._id.toString(), g.widgets])
    );

    // Combine groups with their widgets
    const result = groups.map(group => ({
        ...group,
        widgets: widgetsMap[group._id!.toString()] || []
    }));

    respondJsonData(res, result);
});
