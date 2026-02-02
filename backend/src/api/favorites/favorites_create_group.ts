import {registerApiSession} from '@/server/register';
import * as Db from '@/db';
import {respondJsonData} from '@/tsback/req/req_response';
import {requireQueryParam} from '@/tsback/req/req_params';
import {verify} from '@/tslib/verify';

registerApiSession('favorites/create_group', async (req, res, session) => {
    const name = requireQueryParam(req, 'name');

    verify(name && name.trim() !== '', 'Group name is required');

    const favoriteGroupsCollection = Db.getFavoriteGroupsCollection();

    const newGroup: Db.EntityFavoriteGroup = {
        _id: undefined as any,
        accountId: session.accountId,
        name: name.trim(),
        createdAt: new Date(),
    };

    const result = await favoriteGroupsCollection.insertOne(newGroup);

    respondJsonData(res, {
        _id: result.insertedId,
        ...newGroup,
    });
});
