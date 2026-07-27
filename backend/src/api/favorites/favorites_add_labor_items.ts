import {registerApiSession} from '@/server/register';
import * as Db from '@/db';
import {respondJsonData} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {verify} from '@/tslib/verify';
import {ObjectId} from 'mongodb';

async function fetchMaterialsForLaborItem(estimateMaterialItemsColl: any, laborId: ObjectId): Promise<Db.FavoriteMaterialItem[]> {
    const materials = await estimateMaterialItemsColl.find({estimatedLaborId: laborId}).toArray();
    return materials.map((mat: any) => ({
        materialItemId: mat.materialItemId,
        materialOfferId: mat.materialOfferId,
        materialOfferItemName: mat.materialOfferItemName || '',
        measurementUnitMongoId: mat.measurementUnitMongoId,
        quantity: mat.quantity,
        materialConsumptionNorm: mat.materialConsumptionNorm || 0,
        changableAveragePrice: mat.changableAveragePrice,
    }));
}

registerApiSession('favorites/add_labor_items', async (req, res, session) => {
    const favoriteGroupId = requireMongoIdParam(req, 'favoriteGroupId');
    const estimatedLaborIds = req.body.estimatedLaborIds as string[];

    verify(estimatedLaborIds && estimatedLaborIds.length > 0, 'No labor items selected');

    // Verify the favorite group belongs to the user's account
    const favoriteGroupsCollection = Db.getFavoriteGroupsCollection();
    const group = await favoriteGroupsCollection.findOne({
        _id: favoriteGroupId,
        accountId: session.accountId,
    });

    verify(group, 'Favorite group not found');

    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();
    const favoriteLaborItemsColl = Db.getFavoriteLaborItemsCollection();

    const savedItems = [];

    // Process each labor item
    for (const laborIdStr of estimatedLaborIds) {
        const laborId = new ObjectId(laborIdStr);

        // Fetch the labor item
        const laborItem = await estimateLaborItemsColl.findOne({_id: laborId});

        if (!laborItem) {
            continue; // Skip if not found
        }

        let childWorks: Db.FavoriteChildWork[] | undefined;

        if (laborItem.isGroupRow) {
            // For group rows: fetch child works and their materials
            const children = await estimateLaborItemsColl
                .find({parentGroupRowId: laborId})
                .sort({displayIndex: 1, _id: 1})
                .toArray();

            childWorks = await Promise.all(children.map(async (child: any) => ({
                laborItemId: child.laborItemId,
                laborOfferId: child.laborOfferId,
                laborOfferItemName: child.laborOfferItemName || '',
                measurementUnitMongoId: child.measurementUnitMongoId,
                quantity: child.quantity,
                changableAveragePrice: child.changableAveragePrice,
                laborHours: child.laborHours,
                materials: await fetchMaterialsForLaborItem(estimateMaterialItemsColl, child._id),
            })));
        }

        const materials = laborItem.isGroupRow
            ? []
            : await fetchMaterialsForLaborItem(estimateMaterialItemsColl, laborId);

        // Create the favorite labor item
        const favoriteLaborItem: Db.EntityFavoriteLaborItem = {
            _id: undefined as any,
            favoriteGroupId,
            accountId: session.accountId,
            laborItemId: laborItem.laborItemId,
            laborOfferId: laborItem.laborOfferId,
            laborOfferItemName: laborItem.laborOfferItemName || '',
            measurementUnitMongoId: laborItem.measurementUnitMongoId,
            quantity: laborItem.quantity,
            changableAveragePrice: laborItem.changableAveragePrice,
            laborHours: laborItem.laborHours,
            materials,
            isGroupRow: laborItem.isGroupRow === true ? true : undefined,
            childWorks,
            createdAt: new Date(),
        };

        const result = await favoriteLaborItemsColl.insertOne(favoriteLaborItem);
        savedItems.push(result.insertedId);
    }

    respondJsonData(res, {
        success: true,
        savedCount: savedItems.length,
        savedIds: savedItems,
    });
});
