import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { verify } from '@/tslib/verify';

registerApiSession('favorites/delete_group', async (req, res, session) => {
    const favoriteGroupId = requireMongoIdParam(req, 'favoriteGroupId');

    const favoriteGroupsCollection = Db.getFavoriteGroupsCollection();
    const result = await favoriteGroupsCollection.deleteOne({
        _id: favoriteGroupId,
        accountId: session.accountId,
    });

    verify(result.deletedCount === 1, 'Favorite group not found');

    // Also delete all labor items in this group
    const favoriteLaborItemsColl = Db.getFavoriteLaborItemsCollection();
    await favoriteLaborItemsColl.deleteMany({ favoriteGroupId, accountId: session.accountId });

    respondJsonData(res, { success: true });
});
