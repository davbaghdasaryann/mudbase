import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { respondJsonData } from '@/tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@/tsmudbase/permissions_setup';

registerApiSession('estimate/change_account', async (req, res, session) => {
    session.assertPermission(Permissions.UsersFetchAll);

    const estimateId = requireMongoIdParam(req, 'estimateId');
    const newAccountId = requireMongoIdParam(req, 'accountId');

    const accounts = Db.getAccountsCollection();
    const account = await accounts.findOne({ _id: newAccountId });
    verify(account, 'Account not found');

    const estimates = Db.getEstimatesCollection();
    await estimates.updateOne({ _id: estimateId }, { $set: { accountId: newAccountId } });

    respondJsonData(res, { ok: true });
});
