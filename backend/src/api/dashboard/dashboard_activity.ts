import * as Db from '../../db';
import { registerApiSession } from '@src/server/register';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/fetch_activity', async (req, res, session) => {
    session.assertPermission(Permissions.DashboardUse);
    const accounts = Db.getAccountsCollection();
    const data = await accounts
        .find({ lastVisitedAt: { $exists: true } } as any)
        .sort({ lastVisitedAt: -1 })
        .project({ companyName: 1, lastVisitedAt: 1, isActive: 1 })
        .limit(100)
        .toArray();
    respondJsonData(res, data);
});
