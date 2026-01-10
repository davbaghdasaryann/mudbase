'use server';

import { getReqParam, requireQueryParam } from '../../tsback/req/req_params';
import { registerApiPublic } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';

import { getUsersCollection } from '@src/db';
import { generateInvitationId } from '@src/lib/invitation';
import { verify } from '@src/tslib/verify';
import { authjsChangePassword } from '@src/authjs/authjs_lib';
import { loadEmailTemplate, sendEmail } from '@src/lib/email';

registerApiPublic('auth/send_password_reset_email', async (req, res) => {
    let email = requireQueryParam(req, 'email');

    let users = getUsersCollection();

    let user = await users.findOne({ email: email });
    verify(user, req.t('auth.email_not_found'));

    let passwordResetId = generateInvitationId();

    let result = await users.updateOne(
        { email: email },
        { $set: { passwordResetId: passwordResetId } }
    );
    // log_.info('update passwordRecovery id', result);

    // let link = genRecoveryLink(passRecoveryId, email);
    // // log_.info('recovery link is', link);

    // let recoverEmailContent = loadEmailTemplate("invitation_content.html",{
    //     headerText: 'Please click this button to recover your password.',
    //     linkUrl: link,
    //     buttonText:'Recover Email',
    //     pText:"If the button doesn't work, you can copy and paste this link into your browser:",
    // })

    // let emailBody = loadEmailTemplate("nested_email_generator.html", {
    //     children: recoverEmailContent,
    // });

    const linkUrl = `${config_.auth.frontUrl}/auth/password_reset?passwordResetId=${passwordResetId}`;

    // let emailBody = loadEmailTemplate('password_reset_email.html', {
    //     linkUrl: linkUrl,
    // });

    // let emailResult = await sendEmail({
    //     from: config_.email.from,
    //     to: [email],
    //     subject: 'Mudbase Password Reset',
    //     html: emailBody,
    // });

    let emailBody = loadEmailTemplate('password_reset_email.html', {
        linkUrl: linkUrl,
        emailSubject: req.t('univsersalEmail.reset_password_email_subject'),
        subTitle: (user?.firstName || user?.lastName) ? req.t('univsersalEmail.dear_text') : '',
        userFirstName: user?.firstName ?? '',
        userLastName: user?.lastName ?? '',
        passwordRecoverEmailMsg: req.t('univsersalEmail.password_reset_email_msg'),
        activeLinkButtonLabel: req.t('univsersalEmail.reset_password_button_label'),
        buttonNotWorksText: req.t('univsersalEmail.button_not_working_text'),
        thanksText: req.t('univsersalEmail.thanks_text'),
        regardsText1: req.t('univsersalEmail.regards_text_first_line'),
        regardsText2: req.t('univsersalEmail.regards_text_second_line'),
    });

    let emailResult = await sendEmail({
        from: config_.email.from,
        to: [email],
        // subject: 'MudBase Invitation',
        subject: req.t('univsersalEmail.reset_password_email_subject'),
        html: emailBody,
    });

    respondJsonData(res, emailResult);
});

registerApiPublic('auth/get_password_reset_data', async (req, res) => {
    const passwordResetId = requireQueryParam(req, 'passwordResetId');

    let users = getUsersCollection();
    let user = await users.findOne({ passwordResetId: passwordResetId });
    verify(user, req.t('auth.invalid_password_reset_id')); //TODO: translate


    respondJsonData(res, {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
    });

});


registerApiPublic('auth/reset_password', async (req, res) => {
    const passwordResetId = requireQueryParam(req, 'passwordResetId');
    const newPassword = requireQueryParam(req, 'newPassword');

    let users = getUsersCollection();
    let user = await users.findOne({ passwordResetId: passwordResetId });
    verify(user, req.t('auth.invalid_password_reset_id'));

    const result = await users.updateOne({ _id: user?._id }, { $set: { passwordResetId: undefined } });

    authjsChangePassword(user!._id.toString(), newPassword);

    respondJsonData(res, result);
});



// registerApiPublic('auth/submit_recover_pass_code', async (req, res) => {
//     log_.info('hello from recover_password');
//     log_.info('req.body is ', req.body);

//     // let passwordRecoveryId = getReqParam(req, "passwordRecoveryId");
//     // let email = getReqParam(req, "email");
//     let passwordRecoveryId = req.body.code;
//     let newPassword = req.body.password;
//     let email = req.body.email;

//     let users = Db.getUsersCollection();
//     log_.info(passwordRecoveryId, email);
//     let user = await users.findOne({passwordRecoveryId: passwordRecoveryId, email: email});

//     log_.info(user);
//     verify(user, req.t('auth.password_recovery'));

//     let result1 = await users.updateOne(
//         //todo
//         {email: email},
//         {$unset: {passwordRecoveryId: ''}}
//     );
//     let result = await authjsChangePassword(user!._id.toString(), newPassword);
//     log_.info('password changed');

//     respondJsonData(res, result);
// });
