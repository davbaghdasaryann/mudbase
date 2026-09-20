import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('packages/fetch', async (req, res, session) => {
    session.assertPermission(Permissions.AccountsFetch);
    const col = Db.getPackagesCollection();
    const packages = await col.find({}).sort({ createdAt: -1 }).toArray();
    respondJsonData(res, packages);
});
