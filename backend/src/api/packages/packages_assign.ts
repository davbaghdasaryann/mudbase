import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@tsback/req/req_params';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { ObjectId } from 'mongodb';

registerApiSession('packages/assign', async (req, res, session) => {
    session.assertPermission(Permissions.AccountsFetch);
    const accountId = new ObjectId(requireQueryParam(req, 'accountId'));
    const { packageId, packageStartDate, packageEndDate } = req.body as { packageId: string | null; packageStartDate?: string; packageEndDate?: string };
    const accounts = Db.getAccountsCollection();
    let result;
    if (packageId) {
        const $set: any = { packageId: new ObjectId(packageId) };
        if (packageStartDate) $set.packageStartDate = new Date(packageStartDate);
        if (packageEndDate) $set.packageEndDate = new Date(packageEndDate);
        result = await accounts.updateOne({ _id: accountId }, { $set });
    } else {
        result = await accounts.updateOne({ _id: accountId }, { $unset: { packageId: '', packageStartDate: '', packageEndDate: '' } } as any);
    }
    respondJsonData(res, result);
});
