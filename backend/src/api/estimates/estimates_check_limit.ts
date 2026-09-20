import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('estimates/check_limit', async (req, res, session) => {
    const account = await Db.getAccountsCollection().findOne({ _id: session.mongoAccountId });
    if (!account?.packageId) {
        return respondJsonData(res, { limited: false });
    }
    const pkg = await Db.getPackagesCollection().findOne({ _id: account.packageId });
    if (!pkg?.numberOfEstimations) {
        return respondJsonData(res, { limited: false });
    }
    const count = await Db.getEstimatesCollection().countDocuments({
        accountId: session.mongoAccountId,
        isArchived: { $ne: true },
    });
    return respondJsonData(res, {
        limited: count >= pkg.numberOfEstimations,
        count,
        limit: pkg.numberOfEstimations,
    });
});
