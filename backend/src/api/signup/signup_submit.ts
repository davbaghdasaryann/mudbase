import {verify} from '@tslib/verify';

import * as Db from '../../db';
import {registerApiPublic} from '../../server/register';
import {validateEmail} from '@src/tslib/validate';
import {respondJsonData} from '../../tsback/req/req_response';
import {requireQueryParam} from '../../tsback/req/req_params';
import {DbInsertParams} from '../../tsback/mongodb/mongodb_params';
import {Fields} from '../../permissions/db_fields_setup';
import {hashPassword} from '../../authjs/authjs_lib';
import {loadEmailTemplate, sendEmail} from '../../lib/email';
import {generateInvitationId} from '../../lib/invitation';

registerApiPublic('signup/submit', async (req, res) => {
    let email = requireQueryParam(req, 'email');
    verify(validateEmail(email), req.t('auth.invalid_email'));

    let pendingUsers = Db.getPendingUsersCollection();
    let existingPendingUser = await pendingUsers.findOne({email: email});
    verify(!existingPendingUser, req.t('validate.user_reg_pending'));

    let users = Db.getUsersCollection();
    let existingUser = await users.findOne({email: email});
    verify(!existingUser, req.t('validate.user_already_reg'));

    let parm = new DbInsertParams<Db.EntityPendingUser>(req, {
        query: [
            Fields.UserFirstName,
            Fields.UserLastName,
            Fields.UserEmail,
            Fields.UserPassword,
            Fields.UserPhoneNumber,
        ],
    });

    let pendingUser = parm.getObject();

    verify(pendingUser.email, 'auth.missing_email');
    verify(pendingUser.password, 'auth.missing_password');

    pendingUser.password = await hashPassword(pendingUser.password!);

    pendingUser.emailVerificationSent = true;
    pendingUser.emailVerificationId = generateInvitationId();
    pendingUser.emailVerified = false;

    let result = await pendingUsers.insertOne(pendingUser);

    let linkUrl = `${config_.auth.frontUrl}/auth/email_verification?emailVerificationId=${pendingUser.emailVerificationId}`;

    // let emailBody = loadEmailTemplate('accept_invitation_email.html', {
    let emailBody = loadEmailTemplate('signup_verification_email.html', {
        linkUrl: linkUrl,
        emailSubject: req.t('univsersalEmail.email_subject'),
        mainTitle: req.t('univsersalEmail.welcome_text'),
        subTitle:
            pendingUser?.firstName || pendingUser?.lastName
                ? req.t('univsersalEmail.dear_text')
                : '',
        invitedUserFirstName: pendingUser.firstName ?? '',
        invitedUserLastName: pendingUser.lastName ?? '',
        signUpConfirmationMsg: req.t('univsersalEmail.sign_up_confirmation_msg'),
        activeLinkButtonLabel: req.t('univsersalEmail.confirm_button_label'),
        buttonNotWorksText: req.t('univsersalEmail.button_not_working_text'),
        thanksText: req.t('univsersalEmail.thanks_text'),
        regardsText1: req.t('univsersalEmail.regards_text_first_line'),
        regardsText2: req.t('univsersalEmail.regards_text_second_line'),
    });

    // log_.info('Email Body:', emailBody);
    // return

    let emailResult = await sendEmail({
        from: config_.email.from,
        to: [email],
        subject: req.t('univsersalEmail.email_subject'),
        html: emailBody,
    });

    return respondJsonData(res, result);
});
