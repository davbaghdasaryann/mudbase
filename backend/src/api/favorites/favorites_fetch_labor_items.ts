import {registerApiSession} from '@/server/register';
import * as Db from '@/db';
import {respondJsonData} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {verify} from '@/tslib/verify';

registerApiSession('favorites/fetch_labor_items', async (req, res, session) => {
    const favoriteGroupId = requireMongoIdParam(req, 'favoriteGroupId');

    // Verify the favorite group belongs to the user's account
    const favoriteGroupsCollection = Db.getFavoriteGroupsCollection();
    const group = await favoriteGroupsCollection.findOne({
        _id: favoriteGroupId,
        accountId: session.accountId,
    });

    verify(group, 'Favorite group not found');

    const favoriteLaborItemsColl = Db.getFavoriteLaborItemsCollection();

    // Fetch labor items with measurement unit details
    const pipeline: any[] = [
        {
            $match: {
                favoriteGroupId: favoriteGroupId,
                accountId: session.accountId,
            },
        },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'measurementUnitData',
            },
        },
        {
            $sort: {createdAt: -1},
        },
    ];

    const items = await favoriteLaborItemsColl.aggregate(pipeline).toArray();

    respondJsonData(res, items);
});
