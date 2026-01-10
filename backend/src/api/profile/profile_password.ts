import bcrypt from 'bcrypt';

import * as Db from '@/db';
import {registerApiSession} from '@/server/register';
import {respondJson} from '@/tsback/req/req_response';
import {authjsChangePassword, authjsLogoutOtherSessions} from '@/authjs/authjs_lib';

import {verify} from '@src/tslib/verify';

registerApiSession('profile/change_password', async (req, res, session) => {
    const {currentPassword, newPassword} = req.body;

    const users = Db.getUsersCollection();
    const user = await users.findOne({_id: session.mongoUserId});
    verify(user, req.t('auth.user_not_found'));

    const match = await bcrypt.compare(currentPassword, user?.password!);
    verify(match, req.t('auth.invalid_login'));

    const result = await authjsChangePassword(session.userId, newPassword);

    await authjsLogoutOtherSessions(session);

    respondJson(res, result);
});
