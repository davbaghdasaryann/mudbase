import * as Db from '@/db';
import {registerApiSession} from '@/server/register';
import {respondJson} from '@/tsback/req/req_response';
import {DbUpdateParams} from '@/tsback/mongodb/mongodb_params';

import { authjsUpdateUserName } from '@/authjs/authjs_lib';
import { getProfileUpdateFields} from '@/permissions/db_get_fields';
import { assertObject } from '@/tslib/assert';

registerApiSession('profile/update', async (req, res, session) => {
    let parm = new DbUpdateParams<Db.EntityUser>(req, {
        query: getProfileUpdateFields(),
        allowed: getProfileUpdateFields(),
    });

    let users = Db.getUsersCollection();
    let data = parm.getObject();

    let result = await users.updateOne({_id: session.mongoUserId}, {$set: data});

    if (data.firstName || data.lastName) {
        let user = await users.findOne({_id: session.mongoUserId});
        user = assertObject(user, "Invalid User")!;
        await authjsUpdateUserName(user);
    }

    respondJson(res, result);
});
