import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';

registerApiSession('user/account_activity_show', async (req, res, session) => {
    let userId = new ObjectId(requireQueryParam(req, 'userId'));

    const users = Db.getUsersCollection();
    let user = await users.findOne({ _id: userId });
    if (!user) {
        throw new Error('User not found');
    }
    let accountId = user.accountId;
    const accounts = Db.getAccountsCollection();
    let account = await accounts.findOne({ _id: accountId });
    if (!account) {
        throw new Error('Account not found');
    }

    let accountActivity = account.accountActivity;

    log_.info('accountActivity', accountActivity)

    respondJsonData(res, accountActivity);
});