import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@tsback/req/req_params';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { ObjectId } from 'mongodb';

registerApiSession('packages/delete', async (req, res, session) => {
    session.assertPermission(Permissions.AccountsFetch);
    const id = new ObjectId(requireQueryParam(req, '_id'));
    const col = Db.getPackagesCollection();
    const result = await col.deleteOne({ _id: id });
    respondJsonData(res, result);
});
