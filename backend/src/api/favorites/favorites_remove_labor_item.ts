import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { verify } from '@/tslib/verify';

registerApiSession('favorites/remove_labor_item', async (req, res, session) => {
    const favoriteGroupId = requireMongoIdParam(req, 'favoriteGroupId');
    const favoriteLaborItemId = requireMongoIdParam(req, 'favoriteLaborItemId');

    const favoriteGroupsCollection = Db.getFavoriteGroupsCollection();
    const group = await favoriteGroupsCollection.findOne({
        _id: favoriteGroupId,
        accountId: session.accountId,
    });

    verify(group, 'Favorite group not found');

    const favoriteLaborItemsColl = Db.getFavoriteLaborItemsCollection();
    const result = await favoriteLaborItemsColl.deleteOne({
        _id: favoriteLaborItemId,
        favoriteGroupId,
        accountId: session.accountId,
    });

    verify(result.deletedCount === 1, 'Favorite labor item not found');

    respondJsonData(res, { success: true });
});
