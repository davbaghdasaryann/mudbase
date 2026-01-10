
import { registerApiPublic } from '../../server/register';

import * as Db from '../../db';
import { respondJsonData, respondJsonError } from '@src/tsback/req/req_response';
import { requireQueryParam } from '@src/tsback/req/req_params';
import { ObjectId } from 'mongodb';
import { checkRequiredProperties } from './signup_invite';
import { verify, verifyObject } from '../../tslib/verify';
import { DbFindParams } from '../../tsback/mongodb/mongodb_params';


registerApiPublic('signup/get_invitation', async (req, res) => {

    let invitationId = requireQueryParam(req, "invitationId");

    let pendingUsers = Db.getPendingUsersCollection();

    let options = new DbFindParams(req, {
        // select: ["email", "invitationId", "firstName", "lastName", "accountId"],
        select: ["email", "invitationId", "firstName", "lastName"],
    });

    let pendingUser = await pendingUsers.findOne({ invitationId: invitationId }, options);

    verify(pendingUser, req.t('auth.invalid_invitation_id'));

    log_.info('pendingUser', pendingUser)

    respondJsonData(res, pendingUser);
});


