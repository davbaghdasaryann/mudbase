import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { getReqParam, requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { DbFindParams } from '../../tsback/mongodb/mongodb_params';
import { verify } from '../../tslib/verify';

registerApiSession('account/get', async (req, res, session) => {
    let accountIdString = getReqParam(req, 'accountId');
    verify(accountIdString !== 'undefined', 'validate.user_have_not_company')
    let accountId = new ObjectId(accountIdString as string);

    let accounts = Db.getAccountsCollection();

    let options = new DbFindParams(req, {
        // select: userSelectFields,
        // allowed: getUserProfileFetchFields(),
    });

    let result = await accounts.findOne({ _id: accountId }, options.getFindOptions());
    log_.info('result', result, accountId)
    respondJsonData(res, result);
});

registerApiSession('account/get_my', async (req, res, session) => {
    let accountId = new ObjectId(session.mongoAccountId);
    let accounts = Db.getAccountsCollection();

    let options = new DbFindParams(req, {
        // select: userSelectFields,
        // allowed: getUserProfileFetchFields(),
    });

    let result = await accounts.findOne({ _id: accountId }, options.getFindOptions());

    respondJsonData(res, result);
})

