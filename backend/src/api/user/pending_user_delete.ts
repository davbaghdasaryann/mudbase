import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';

registerApiSession('pending_user/delete', async (req, res, session) => {
    const pendingUserId = new ObjectId(requireQueryParam(req, 'pendingUserId'));
    const pendingUsers = Db.getPendingUsersCollection();

    const user = await pendingUsers.findOne({ _id: pendingUserId });
    verify(user, 'Pending user not found');

    const result = await pendingUsers.deleteOne({ _id: pendingUserId });

    respondJsonData(res, result);
});
