import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiPublic, registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { DbFindParams, DbInsertParams } from '../../tsback/mongodb/mongodb_params';
import { getUserProfileFetchFields, getUserProfileUpdateFields } from '../../permissions/db_get_fields';
import { verify } from '../../tslib/verify';
import { ObjectId } from 'mongodb';

registerApiSession('user/fetch', async (req, res, session) => {
    let userId = requireQueryParam(req, 'userId');
    let users = Db.getUsersCollection();

    let options = new DbFindParams(req, {
        // select: userSelectFields,
        allowed: getUserProfileFetchFields(),
    });

    let data = await users.findOne({ userId: userId }, options.getFindOptions());

    respondJsonData(res, options.processResult(data));
});

registerApiSession('user/get', async (req, res, session) => {
    let userId = new ObjectId(requireQueryParam(req, 'userId'));
    let users = Db.getUsersCollection();

    let options = new DbFindParams(req, {
        // select: userSelectFields,
        allowed: getUserProfileFetchFields(),
    });

    let data = await users.findOne({ _id: userId }, options.getFindOptions());

    respondJsonData(res, options.processResult(data));
});


registerApiPublic('user/has_account', async (req, res) => {
    let email = requireQueryParam(req, 'email');
    const users = Db.getUsersCollection();

    let user = await users.findOne({ email: email })

    if (!user?.isActive && user?.accountId) {
        // This time signInWithEmail logic will work and throw user Invalid login error for that I return true manually. 
        // This way navigatePageUrlRef.current will be null

        return respondJsonData(res, { hasAccount: true })
    }


    respondJsonData(res, {
        hasAccount: user?.accountId
            ? true
            : false,
        isAccountActive: user?.isActive
            ? true
            : false,
    });

})
