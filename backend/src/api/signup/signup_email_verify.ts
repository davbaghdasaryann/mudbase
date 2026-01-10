import { verify } from '@tslib/verify';

import * as Db from '@/db';
import { registerApiPublic } from '@/server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { authjsCreateUser } from '@/authjs/authjs_signup';


registerApiPublic('signup/email_verify', async (req, res) => {

    let emailVerificationId = requireQueryParam(req, 'emailVerificationId');
    log_.info('emailVerificationId', emailVerificationId)

    verify(emailVerificationId, 'Verification error')

    let pendingUsers = Db.getPendingUsersCollection();

    let pendingUserInfo = await pendingUsers.findOne({ emailVerificationId: emailVerificationId });
    log_.info('pendingUserInfo', pendingUserInfo,)
    verify(pendingUserInfo, 'No such user found. Please check your link.')
    verify(!pendingUserInfo?.emailVerified, 'You have already passed verification')

    await pendingUsers.deleteOne({emailVerificationId: emailVerificationId});


    //let pendingUser = await pendingUsers.updateOne({ emailVerificationId: emailVerificationId }, { $set: { emailVerified: true } });

    // let usersCollection = Db.getUsersCollection();

    const newUserData = {
        email: pendingUserInfo!.email,
        ...(pendingUserInfo?.password && { password: pendingUserInfo.password }),
        ...(pendingUserInfo?.firstName && { firstName: pendingUserInfo.firstName }),
        ...(pendingUserInfo?.lastName && { lastName: pendingUserInfo.lastName }),
        ...(pendingUserInfo?.phoneNumber && { phoneNumber: pendingUserInfo.phoneNumber }),
        permissions: '',
        isActive: true
    };

    await authjsCreateUser(newUserData, true);



    respondJsonData(res, {verified: 1});
});

