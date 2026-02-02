import {registerApiSession} from '@/server/register';
import * as Db from '@/db';
import {respondJsonData} from '@/tsback/req/req_response';

registerApiSession('favorites/fetch_groups', async (req, res, session) => {
    const favoriteGroupsCollection = Db.getFavoriteGroupsCollection();

    const groups = await favoriteGroupsCollection
        .find({accountId: session.accountId})
        .sort({createdAt: -1})
        .toArray();

    const apiGroups = groups.map((group) => Db.favoriteGroupToApi(group));

    respondJsonData(res, apiGroups);
});
