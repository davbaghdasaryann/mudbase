import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';

registerApiSession('user/delete', async (req, res, session) => {
    const userId = new ObjectId(requireQueryParam(req, 'userId'));
    const users = Db.getUsersCollection();

    const userToDelete = await users.findOne({ _id: userId });
    verify(userToDelete, 'User not found');

    // Prevent self-deletion
    verify(
        String(userId) !== String(session.mongoUserId),
        'Cannot delete your own account'
    );

    const result = await users.deleteOne({ _id: userId });

    respondJsonData(res, result);
});
