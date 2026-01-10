import { registerApiSession } from '@src/server/register';

import * as Db from '../../db';
import { DbInsertParams } from '@tsback/mongodb/mongodb_params';
import { verify, verifyObject } from '@tslib/verify';
import { validateEmail } from '@tslib/validate';
import { requireQueryParam } from '@tsback/req/req_params';
import { respondJsonData } from '@src/tsback/req/req_response';
import { generateInvitationId } from '../../lib/invitation';
import { loadEmailTemplate, sendEmail } from '../../lib/email';
import { ObjectId } from 'mongodb';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { AccountActivity } from '../../tsmudbase/company_activities';
import { UserRole } from '../../tsmudbase/user_roles';


registerApiSession('signup/cancel_sent_invitation', async (req, res, session) => {

    let invitedPendingUserId = new ObjectId(requireQueryParam(req, 'invitedPendingUserId'));

    const pendingUsers = Db.getPendingUsersCollection();
    const result = await pendingUsers.deleteOne({ _id: invitedPendingUserId });


    respondJsonData(res, result);
});

registerApiSession('signup/invite', async (req, res, session) => {
    // TODO: check permissions
    session.assertPermission(Permissions.InviteSendAnyone);

    let email = requireQueryParam(req, 'email');
    verify(validateEmail(email), req.t('auth.invalid_email'));


    let pendingUsers = Db.getPendingUsersCollection();
    let users = Db.getUsersCollection();
    let existingPendingUser = await pendingUsers.findOne({ email: email });
    let existingUser = await users.findOne({ email: email });

    verify(!existingPendingUser && !existingUser, req.t('validate.user_already_invited'));

    let pendingUser = req.body as Db.EntityPendingUser;
    let invitationId = generateInvitationId();
    pendingUser.invited = true;
    pendingUser.invitationId = invitationId;
    pendingUser.sentInviteAt = new Date();

    if (session.mongoUserId) {
        pendingUser.whoSentInvite = session.mongoUserId;
    }

    let result = await pendingUsers.insertOne(pendingUser);

    const accounts = Db.getAccountsCollection();
    const fromUser = await users.findOne({ _id: session.mongoUserId });
    const fromUserAccount = await accounts.findOne({ _id: fromUser?.accountId });
    const toUser = pendingUser;

    let linkUrl = `${config_.auth.frontUrl}/auth/accept_invitation?invitationId=${invitationId}`;

    let emailBody = loadEmailTemplate('accept_invitation_email.html', {
        linkUrl: linkUrl,
        emailSubject: req.t('univsersalEmail.email_subject'),
        mainTitle: req.t('univsersalEmail.welcome_text'),
        subTitle: (toUser?.firstName || toUser?.lastName) ? req.t('univsersalEmail.dear_text') : '',
        invitedUserFirstName: toUser?.firstName ?? '',
        invitedUserLastName: toUser?.lastName ?? '',
        invitingUserFirstName: fromUser?.firstName ?? '',
        invitingUserLastName: fromUser?.lastName ?? '',
        invitingMessage: (fromUser?.firstName || fromUser?.lastName) ? req.t('univsersalEmail.inviting_message') : '',
        invitingCompanyName: (fromUser?.firstName || fromUser?.lastName)
            ? fromUserAccount?.companyName ?? req.t('univsersalEmail.default_company_name')
            : '',
        invitingForCompanyText: req.t('univsersalEmail.inviting_for_company_text'),
        acceptInvitationText: req.t('univsersalEmail.accept_invitation_text'),
        activeLinkButtonLabel: req.t('univsersalEmail.accept_invitation_button_label'),
        buttonNotWorksText: req.t('univsersalEmail.button_not_working_text'),
        thanksText: req.t('univsersalEmail.thanks_text'),
        regardsText1: req.t('univsersalEmail.regards_text_first_line'),
        regardsText2: req.t('univsersalEmail.regards_text_second_line'),
    });

    await sendInvitationEmail(
        email,
        invitationId,
        emailBody,
        req.t('univsersalEmail.email_subject_invite_from_admin')
    );

    respondJsonData(res, result);
});

registerApiSession('signup/local_invite', async (req, res, session) => {
    // TODO: check permissions
    session.assertPermission(Permissions.InviteSendLocal);

    let email = requireQueryParam(req, 'email');
    verify(validateEmail(email), req.t('auth.invalid_email'));


    let pendingUsers = Db.getPendingUsersCollection();
    let users = Db.getUsersCollection();
    let existingPendingUser = await pendingUsers.findOne({ email: email });
    let existingUser = await users.findOne({ email: email });

    verify(!existingPendingUser && !existingUser, req.t('validate.user_already_invited'));

    let pendingUser = req.body as Db.EntityPendingUser;
    pendingUser.accountId = new ObjectId(pendingUser.accountId)

    const whoSentInvite = await users.findOne({ _id: session.mongoUserId }) as Db.EntityUser
    const fromUser = whoSentInvite
    const accounts = Db.getAccountsCollection();
    const fromUserAccount = await accounts.findOne({ _id: fromUser?.accountId });
    const toUser = pendingUser;
    log_.info('req.body: ', req.body, 'whoSentInvite: ', whoSentInvite)
    log_.info('pendingUser.chosenPermissions', pendingUser.chosenPermissions)


    const activeUserCount = await users.countDocuments({
        accountId: fromUserAccount?._id,
        isActive: true
    });

    const pendingInviteCount = await pendingUsers.countDocuments({
        whoSentInvite: whoSentInvite._id
    });

    const totalCount = activeUserCount + pendingInviteCount;

    if (totalCount >= 3) {
        if (pendingInviteCount > 0) {
            verify(
                false,
                req.t('usersLimit.pendingInviteCountMoreThanZero')
            ); //TODO: translate this
            // respondJsonData(res, { errMsg: req.t('usersLimit.pendingInviteCountMoreThanZero') });
            // return
        } else {
            console.log(req.language);
            verify(
                false,
                req.t('usersLimit.activeUserCountMoreThanThree')
            );//TODO: translate this
            // respondJsonData(res, { errMsg: req.t('usersLimit.pendingInviteCountMoreThanZero') });
            // return
        }
    }


    // verify(whoSentInvite.userActivity, 'User activity error'); //TODO: translate
    // pendingUser.givenActivities = whoSentInvite.userActivity; 

    verify(pendingUser.chosenPermissions, 'Chosen permission error') //TODO: translate
    // pendingUser.chosenPermissions = convertChosenPermissionsArrayToMap(pendingUser.chosenPermissions);


    const invitationId = generateInvitationId();
    pendingUser.invited = true;
    pendingUser.invitationId = invitationId;
    pendingUser.sentInviteAt = new Date();

    if (session.mongoUserId) {
        pendingUser.whoSentInvite = session.mongoUserId;
    }

    // respondJsonData(res, {});
    // return
    const result = await pendingUsers.insertOne(pendingUser);



    let linkUrl = `${config_.auth.frontUrl}/auth/accept_invitation?invitationId=${invitationId}`;

    let emailBody = loadEmailTemplate('accept_invitation_email.html', {
        linkUrl: linkUrl,
        emailSubject: req.t('univsersalEmail.email_subject'),
        mainTitle: req.t('univsersalEmail.welcome_text'),
        subTitle: (toUser?.firstName || toUser?.lastName) ? req.t('univsersalEmail.dear_text') : '',
        invitedUserFirstName: toUser?.firstName ?? '',
        invitedUserLastName: toUser?.lastName ?? '',
        invitingUserFirstName: fromUser?.firstName ?? '',
        invitingUserLastName: fromUser?.lastName ?? '',
        invitingMessage: (fromUser?.firstName || fromUser?.lastName) ? req.t('univsersalEmail.inviting_message') : '',
        invitingCompanyName: (fromUser?.firstName || fromUser?.lastName)
            ? fromUserAccount?.companyName ?? req.t('univsersalEmail.default_company_name')
            : '',
        invitingForCompanyText: req.t('univsersalEmail.inviting_for_company_text'),
        acceptInvitationText: req.t('univsersalEmail.accept_invitation_text'),
        activeLinkButtonLabel: req.t('univsersalEmail.accept_invitation_button_label'),
        buttonNotWorksText: req.t('univsersalEmail.button_not_working_text'),
        thanksText: req.t('univsersalEmail.thanks_text'),
        regardsText1: req.t('univsersalEmail.regards_text_first_line'),
        regardsText2: req.t('univsersalEmail.regards_text_second_line'),
    });

    await sendInvitationEmail(
        email,
        invitationId,
        emailBody,
        req.t('univsersalEmail.email_subject_invite_from_admin')
    );

    // sendInvitationEmail(req, email, invitationId, session.mongoUserId, pendingUser._id);

    respondJsonData(res, result);
});

registerApiSession('signup/send_invite', async (req, res, session) => {
    // TODO: check permissions
    session.assertPermission(Permissions.InviteSendAnyone);

    let pendingUserId = new ObjectId(requireQueryParam(req, 'pendingUserId'));
    let pendingUsers = Db.getPendingUsersCollection();
    let pendingUser = await pendingUsers.findOne({ _id: pendingUserId });
    pendingUser = verifyObject(pendingUser, req.t('validate.pending_user_not_found'))!;

    verify(pendingUser.invitationId, req.t('validate.user_not_invited'));


    const users = Db.getUsersCollection();
    const accounts = Db.getAccountsCollection();
    const fromUser = await users.findOne({ _id: session.mongoUserId });
    const fromUserAccount = await accounts.findOne({ _id: fromUser?.accountId });
    // pendingUser serves as "toUser"
    const toUser = pendingUser;

    let linkUrl = `${config_.auth.frontUrl}/auth/accept_invitation?invitationId=${pendingUser.invitationId}`;

    let emailBody = loadEmailTemplate('accept_invitation_email.html', {
        linkUrl: linkUrl,
        emailSubject: req.t('univsersalEmail.email_subject'),
        mainTitle: req.t('univsersalEmail.welcome_text'),
        subTitle: (toUser?.firstName || toUser?.lastName) ? req.t('univsersalEmail.dear_text') : '',
        invitedUserFirstName: toUser?.firstName ?? '',
        invitedUserLastName: toUser?.lastName ?? '',
        invitingUserFirstName: fromUser?.firstName ?? '',
        invitingUserLastName: fromUser?.lastName ?? '',
        invitingMessage: (fromUser?.firstName || fromUser?.lastName) ? req.t('univsersalEmail.inviting_message') : '',
        invitingCompanyName: (fromUser?.firstName || fromUser?.lastName)
            ? fromUserAccount?.companyName ?? req.t('univsersalEmail.default_company_name')
            : '',
        invitingForCompanyText: req.t('univsersalEmail.inviting_for_company_text'),
        acceptInvitationText: req.t('univsersalEmail.accept_invitation_text'),
        activeLinkButtonLabel: req.t('univsersalEmail.accept_invitation_button_label'),
        buttonNotWorksText: req.t('univsersalEmail.button_not_working_text'),
        thanksText: req.t('univsersalEmail.thanks_text'),
        regardsText1: req.t('univsersalEmail.regards_text_first_line'),
        regardsText2: req.t('univsersalEmail.regards_text_second_line'),
    });

    let result = await sendInvitationEmail(
        pendingUser.email,
        pendingUser.invitationId!,
        emailBody,
        req.t('univsersalEmail.email_subject_invite_from_admin')
    );

    // let result = await sendInvitationEmail(req, pendingUser.email, pendingUser.invitationId!, session.mongoUserId, pendingUser._id);

    respondJsonData(res, result);
});


export async function sendInvitationEmail(email: string, invitationId: string, emailBody: any, emailSubject?: string) {
    // let linkUrl = `${config_.auth.frontUrl}/auth/accept_invitation?invitationId=${invitationId}`;

    await sendEmail({
        from: config_.email.from,
        to: [email],
        subject: emailSubject || 'MudBase Invitation',
        html: emailBody,
    });
}

export function checkRequiredProperties(
    obj: Record<string, any>,
    requiredProps: string[]
): string[] | null {
    const missingProps = [];

    for (const prop of requiredProps) {
        if (!(prop in obj) || obj[prop] === undefined || obj[prop] === null || obj[prop] === '') {
            missingProps.push(prop);
        }
    }

    if (missingProps.length > 0) {
        return missingProps;
    }

    return null; // Return null if all required properties are present
}


