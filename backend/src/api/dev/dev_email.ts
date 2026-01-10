import {registerApiSession} from '@src/server/register';
import {respondJsonData} from '@tsback/req/req_response';

import {verify} from '@tslib/verify';
import {validateEmail} from '@tslib/validate';
import {requireQueryParam} from '@tsback/req/req_params';
import {generateInvitationId} from '../../lib/invitation';
import {loadEmailTemplate, sendEmail} from '../../lib/email';

registerApiSession('dev/send_email', async (req, res, session) => {
    let email = requireQueryParam(req, 'email');
    verify(validateEmail(email), req.t('auth.invalid_email'));
 
    let invitationId = generateInvitationId();
    let linkUrl = `${config_.auth.frontUrl}/accept_invitation?invitationId=${invitationId}`;
    // let emailBody = loadEmailTemplate("accept_invitation_email.html", {
    //     linkUrl: linkUrl,
    // });
    // let emailBody = loadEmailTemplate("generic_email.html", {
    //     headerText: 'Click the button below to accept the invitation:',
    //     linkUrl: linkUrl,
    //     buttonText:'Accept Invitation',
    //     pText:"If the button doesn't work, you can copy and paste this link into your browser:",
    // });

    /////////// nested htmls

    let invitationContent = loadEmailTemplate('invitation_content.html', {
        headerText: 'Click the button below to accept the invitation:',
        linkUrl: linkUrl,
        buttonText: 'Accept Invitation',
        pText: "If the button doesn't work, you can copy and paste this link into your browser:",
    });

    let emailBody = loadEmailTemplate('nested_email_generator.html', {
        children: invitationContent,
    });

    // console.log(emailBody);

    let result = await sendEmail({
        from: config_.email.from,
        to: [email],
        subject: 'MudBase Invitation',
        html: emailBody,
    });

    respondJsonData(res, result);
});
