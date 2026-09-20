import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/widget/reorder', async (req, res, session) => {
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);
    if (isSuperAdmin) throw new Error('Widget builder is not available for superadmin');

    const { groupId, widgetIds } = req.body as { groupId: string; widgetIds: string[] };
    const col = Db.getDashboardWidgetsCollection();

    await Promise.all(widgetIds.map((id, idx) =>
        col.updateOne(
            { _id: new ObjectId(id), groupId: new ObjectId(groupId), accountId: session.mongoAccountId, userId: session.mongoUserId },
            { $set: { displayIndex: idx, updatedAt: new Date() } }
        )
    ));

    respondJsonData(res, { ok: true });
});
