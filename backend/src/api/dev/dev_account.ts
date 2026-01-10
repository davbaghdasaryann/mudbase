import * as Db from '../../db';

import {requireQueryParam} from '../../tsback/req/req_params';
import {registerHandlerSession} from '../../server/register';
import {respondJsonData} from '../../tsback/req/req_response';
import {ObjectId} from 'mongodb';

registerHandlerSession('dev', 'fetch_accounts', async (req, res, session) => {
   // throw new Error(req.t('validate.material_id'));
    let accounts = Db.getAccountsCollection();

    let data = await accounts.find().toArray();

    respondJsonData(res, data);
});

registerHandlerSession('dev', 'add_account', async (req, res, session) => {
    let accountInfo = req.body;
    log_.info('accountInfo', accountInfo);

    let accounts = Db.getAccountsCollection();
    await accounts.insertOne(accountInfo);

    let users = Db.getUsersCollection();
    // await users.updateOne({userId: session.userId}, {$set: {account_id: accountInfo._id}});

    respondJsonData(res, 'new account added');
});



// registerHandlerSession('dev', 'delete_account', async (req, res, session) => {
//     let accounts = Db.getAccountsCollection();

//     let account_id = requireQueryParam(req, '_id');
//     let result = await accounts.deleteOne({_id: new ObjectId(account_id)});
//     console.log('result', account_id);
//     respondJsonData(res, result);
// });
