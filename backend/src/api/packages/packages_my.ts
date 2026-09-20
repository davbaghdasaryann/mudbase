import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('packages/my', async (req, res, session) => {
    const accounts = Db.getAccountsCollection();
    const account = await accounts.findOne({ _id: session.mongoAccountId });
    if (!account?.packageId) {
        respondJsonData(res, null);
        return;
    }
    const pkg = await Db.getPackagesCollection().findOne({ _id: account.packageId });
    respondJsonData(res, pkg ?? null);
});
