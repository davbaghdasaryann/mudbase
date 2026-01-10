import { registerApiPublic } from '../../server/register';

import * as Db from '@/db';
import { respondJsonData } from '@src/tsback/req/req_response';
import { requireQueryParam } from '@src/tsback/req/req_params';
import { verify, verifyObject } from '@/tslib/verify';
import { generateInvitationId } from '@/lib/invitation';
import { hashPassword } from '@/authjs/authjs_lib';
import { loadEmailTemplate, sendEmail } from '@/lib/email';
import { authjsCreateUser } from '@/authjs/authjs_signup';
import { AccountActivity } from '@/tsmudbase/company_activities';
import { UserRole } from '@/tsmudbase/user_roles';
import { combineUserPermissions } from '@/permissions/roles_setup';

function makeUserFromPending(pendingUser: Db.EntityPendingUser): Db.EntityUser {
    let user: Db.EntityUser = {
        email: pendingUser.email,
        accountId: pendingUser.accountId,

        firstName: pendingUser.firstName,
        middleName: pendingUser.middleName,
        lastName: pendingUser.lastName,

        permissions: 'ALL', // TODO based on role and account type
    };

    return user;
}

registerApiPublic('signup/register_invitation', async (req, res) => {
    //REMINDER if local invite than user can not change email

    const { invitationId, email, firstName, lastName, password } = req.body;
    verify(email, req.t('required.email'));
    verify(password, req.t('required.password'));
    verify(invitationId, req.t('auth.invalid_invitationId'));

    const pendingUsers = Db.getPendingUsersCollection();

    let pendingUser = await pendingUsers.findOne({ invitationId: invitationId });
    // verify(pendingUser, req.t('validate.pending_user_not_found'))
    pendingUser = verifyObject(pendingUser, req.t('validate.pending_user_not_found'))!;

    const accounts = Db.getAccountsCollection();
    const account = await accounts.findOne({ _id: pendingUser?.accountId }) as Db.EntityAccount;
    // verify(account, 'The user is not affiliated with any accounts') //TODO: translate

    if (pendingUser.email === email) {
        //if email has not changed
        //REMINDER if local invite than user can not change email

        pendingUser.emailVerified = true;

        const newUserData: Db.EntityUser = {
            email: pendingUser!.email,
            password: await hashPassword(password!),
            firstName: firstName ?? pendingUser?.firstName,
            lastName: lastName ?? pendingUser?.lastName,
            permissions: '',
            isActive: true,
            role: 'R',
            whoSentInvite: pendingUser.whoSentInvite,
            sentInviteAt: pendingUser.sentInviteAt,
            acceptInviteAt: new Date()
        };

        if (account?.accountActivity && !pendingUser.chosenPermissions) {
            verify(account?.accountActivity.length >= 1, 'Permissions Activities error');

            const selectedActivities: AccountActivity[] = account?.accountActivity;

            const userRole: UserRole = 'R';

            // let combinedPermissions: string[] = [];
            // if (Array.isArray(selectedActivities)) {
            //     for (const activity of selectedActivities) {
            //         const perms = userPermissionsSetUp(userRole, activity);
            //         combinedPermissions = [...new Set([...combinedPermissions, ...perms])];
            //     }
            // }

            // const permissionsStr = combinedPermissions.join(',');

            let permissionsStr: string = combineUserPermissions(userRole, selectedActivities);

            newUserData.permissions = permissionsStr;
            newUserData.accountId = pendingUser.accountId;

            if (pendingUser.whoSentInvite)
                newUserData.whoSentInvite = pendingUser.whoSentInvite

        } else if (account?.accountActivity && pendingUser.chosenPermissions) {
            verify(account?.accountActivity.length >= 1, 'Permissions Activities error');
            verify(
                pendingUser.chosenPermissions && Object.keys(pendingUser.chosenPermissions).length >= 1,
                'Permissions error'
            );


            const selectedActivities: AccountActivity[] = account?.accountActivity;

            const userRole: UserRole = 'R';

            let permissionsStr: string = combineUserPermissions(userRole, selectedActivities, pendingUser.chosenPermissions);


            newUserData.permissions = permissionsStr;
            newUserData.accountId = pendingUser.accountId;

            newUserData.chosenPermissions = pendingUser.chosenPermissions;

            if (pendingUser.whoSentInvite)
                newUserData.whoSentInvite = pendingUser.whoSentInvite
        }

        await authjsCreateUser(newUserData, true);

        await pendingUsers.deleteOne({ invitationId: invitationId });

    } else {
        //if email has changed

        pendingUser.email = email;
        pendingUser.firstName = firstName;
        pendingUser.lastName = lastName;
        pendingUser.password = await hashPassword(password!);
        // pendingUser.password = password; // You might want to hash this if needed.
        pendingUser.emailVerificationSent = true;
        pendingUser.emailVerificationId = generateInvitationId();
        pendingUser.emailVerified = false;

        let linkUrl = `${config_.auth.frontUrl}/auth/email_verification?emailVerificationId=${pendingUser.emailVerificationId}`;

        // let emailBody = loadEmailTemplate('accept_invitation_email.html', {
        //     linkUrl: linkUrl,
        // });

        // let emailResult = await sendEmail({
        //     from: config_.email.from,
        //     to: [email],
        //     subject: 'MudBase Invitation',
        //     html: emailBody,
        // });

        let emailBody = loadEmailTemplate('signup_verification_email.html', {
            linkUrl: linkUrl,
            emailSubject: req.t('univsersalEmail.email_subject'),
            mainTitle: req.t('univsersalEmail.welcome_text'),
            subTitle: (pendingUser?.firstName || pendingUser?.lastName) ? req.t('univsersalEmail.dear_text') : '',
            invitedUserFirstName: pendingUser.firstName ?? '',
            invitedUserLastName: pendingUser.lastName ?? '',
            signUpConfirmationMsg: req.t('univsersalEmail.sign_up_confirmation_msg'),
            activeLinkButtonLabel: req.t('univsersalEmail.confirm_button_label'),
            buttonNotWorksText: req.t('univsersalEmail.button_not_working_text'),
            thanksText: req.t('univsersalEmail.thanks_text'),
            regardsText1: req.t('univsersalEmail.regards_text_first_line'),
            regardsText2: req.t('univsersalEmail.regards_text_second_line'),
        });

        let emailResult = await sendEmail({
            from: config_.email.from,
            to: [email],
            // subject: 'MudBase Invitation',
            subject: req.t('univsersalEmail.email_subject'),
            html: emailBody,
        });

        await pendingUsers.updateOne({ invitationId: invitationId }, { $set: pendingUser });
    }


    respondJsonData(res, {
        emailChanged: pendingUser.emailVerified ? false : true,
        pendingUser,
    });
});

registerApiPublic('signup/register_approval', async (req, res) => {
    let approvalId = requireQueryParam(req, 'approvalId');
    let password = requireQueryParam(req, 'password');

    let pendingUsers = Db.getPendingUsersCollection();
    let pendingUser = await pendingUsers.findOne({ approvalId: approvalId });
    pendingUser = verifyObject(pendingUser, req.t('validate.pending_user_not_found'))!;

    let user = makeUserFromPending(pendingUser);

    user.password = password;

    // Delete from pending users
    // await pendingUsers.deleteOne({_id: pendingUserId});

    respondJsonData(res, { ok: true });
});
