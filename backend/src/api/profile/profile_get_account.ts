import * as Db from '@src/db';

import { registerApiSession } from '@src/server/register';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('profile/get_account', async (req, res, session) => {

    let accounts = Db.getAccountsCollection();

    let account: Db.EntityAccount = {} as Db.EntityAccount;
    account = await accounts.findOne({ _id: session.mongoAccountId }) as Db.EntityAccount;


    respondJsonData(res, account);
});

