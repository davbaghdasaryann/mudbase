import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';
import { Permissions } from '../../tsmudbase/permissions_setup';

registerApiSession('account/delete', async (req, res, session) => {
    session.assertPermission(Permissions.UsersFetchAll);

    const accountId = new ObjectId(requireQueryParam(req, 'accountId'));
    const accounts = Db.getAccountsCollection();

    const account = await accounts.findOne({ _id: accountId });
    verify(account, 'Account not found');

    const result = await accounts.deleteOne({ _id: accountId });

    respondJsonData(res, result);
});
