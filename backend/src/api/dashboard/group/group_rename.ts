import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

registerApiSession('dashboard/group/rename', async (req, res, session) => {

    const isSuperAdmin = session.checkPermission(Permissions.All) ||
                        session.checkPermission(Permissions.UsersFetchAll) ||
                        session.checkPermission(Permissions.AccountsFetch);
    if (isSuperAdmin) throw new Error('Widget builder is not available for superadmin');

    const groupIdParam = getReqParam(req, 'groupId');
    const name = getReqParam(req, 'name');
    verify(groupIdParam, req.t('required.groupId'));
    verify(name && name.trim(), req.t('required.name'));

    const groupsColl = Db.getDashboardWidgetGroupsCollection();
    const group = await groupsColl.findOne({
        _id: new ObjectId(groupIdParam),
        accountId: session.mongoAccountId,
        userId: session.mongoUserId
    });
    verify(group, req.t('error.group_not_found'));

    await groupsColl.updateOne(
        { _id: new ObjectId(groupIdParam) },
        { $set: { name: name.trim() } }
    );

    respondJsonData(res, { ok: true });
});
