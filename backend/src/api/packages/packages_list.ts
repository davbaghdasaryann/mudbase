import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

// Read-only endpoint — returns all packages for any authenticated user
registerApiSession('packages/list', async (req, res, session) => {
    const col = Db.getPackagesCollection();
    const packages = await col.find({}).sort({ price: 1 }).toArray();
    respondJsonData(res, packages);
});
