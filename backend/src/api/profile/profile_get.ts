import * as Db from '@/db';

import { registerApiSession} from '@/server/register';
import { respondJson } from '@/tsback/req/req_response';
import { verifyObject } from '@/tslib/verify';
import { DbFindParams } from '@/tsback/mongodb/mongodb_params';

import { getProfileFetchFields} from '@src/permissions/db_get_fields';

registerApiSession('profile/get', async (req, res, session) => {

    let users = Db.getUsersCollection();

    let options = new DbFindParams(req, {
        allowed: getProfileFetchFields(),
    });

    const data = await users.findOne({ _id: session.mongoUserId }, options.getFindOptions());

    verifyObject(data, req.t('auth.invalid_user'));


    respondJson(res, data);
});
