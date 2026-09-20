import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@tsback/req/req_params';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { ObjectId } from 'mongodb';

registerApiSession('packages/assign', async (req, res, session) => {
    session.assertPermission(Permissions.AccountsFetch);
    const accountId = new ObjectId(requireQueryParam(req, 'accountId'));
    const { packageId } = req.body as { packageId: string | null };
    const accounts = Db.getAccountsCollection();
    const update = packageId
        ? { $set: { packageId: new ObjectId(packageId) } }
        : { $unset: { packageId: '' } };
    const result = await accounts.updateOne({ _id: accountId }, update as any);
    respondJsonData(res, result);
});
