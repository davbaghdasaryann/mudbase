import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { verify } from '@tslib/verify';

registerApiSession('packages/create', async (req, res, session) => {
    session.assertPermission(Permissions.AccountsFetch);
    const pkg = req.body as Db.EntityPackage;
    verify(pkg.name, 'Package name is required');
    pkg.createdAt = new Date();
    pkg.updatedAt = new Date();
    const col = Db.getPackagesCollection();
    const result = await col.insertOne(pkg);
    respondJsonData(res, { ...pkg, _id: result.insertedId });
});
