import {ObjectId} from 'mongodb';

import {verify, verifyObject} from '@tslib/verify';

import * as Db from '../../db';
import {registerApiSession, registerHandlerSession} from '../../server/register';
import {respondJsonData, respondJsonError} from '../../tsback/req/req_response';
import {getReqParam, requireQueryParam} from '@src/tsback/req/req_params';
import {DbFindParams} from '../../tsback/mongodb/mongodb_params';

import {Permissions} from '@src/tsmudbase/permissions_setup';
import {generateInvitationId} from '../../lib/invitation';
import {loadEmailTemplate, sendEmail} from '../../lib/email';


//not used in front end 
registerApiSession('signup/approve', async (req, res, session) => {
    session.assertPermission(Permissions.UserManageAll);

    let pendingUsers = Db.getPendingUsersCollection();
    let pendingUserId = new ObjectId(requireQueryParam(req, 'pendingUserId'));

    let pendingUser = await pendingUsers.findOne({_id: pendingUserId});
    pendingUser = verifyObject(pendingUser, req.t('validate.pending_user_not_found'))!;

    verify(pendingUser.accountId, req.t('validate.account_not_set'));

    let approvalId = generateInvitationId();

    // let pUser = pendingUsers.findOne({ _id: mongoUserId})
    //TODO: add here function for to update

    let result = await pendingUsers.updateOne(
        {_id: pendingUserId},
        {
            $set: {
                approved: true,
                approvalId: approvalId,
            },
        }
    );

    // Send email to the user with approval notification
    let linkUrl = `${config_.auth.frontUrl}/auth/signup_approved?approvalId=${approvalId}`;

    let emailBody = loadEmailTemplate('signup_approved_email.html', {
        linkUrl: linkUrl,
    });

    let emailResult = await sendEmail({
        from: config_.email.from,
        to: [pendingUser.email],
        subject: 'MudBase Sign Up Approved',
        html: emailBody,
    });

    respondJsonData(res, result);
});

registerApiSession('signup/get_approved_user', async (req, res, session) => {
    session.assertPermission(Permissions.UserManageAll);

    let pendingUsers = Db.getPendingUsersCollection();
    let approvalId = requireQueryParam(req, 'approvalId');

    let pendingUser = await pendingUsers.findOne({approvalId: approvalId});
    pendingUser = verifyObject(pendingUser, req.t('validate.pending_user_not_found'))!;

    respondJsonData(res, pendingUser);
});

