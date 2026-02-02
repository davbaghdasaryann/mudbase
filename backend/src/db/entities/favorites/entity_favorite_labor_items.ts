import { Collection, ObjectId } from 'mongodb';

interface FavoriteMaterialItem {
    materialItemId?: ObjectId;
    materialOfferId?: ObjectId;
    materialOfferItemName: string;
    measurementUnitMongoId: ObjectId;
    quantity: number;
    materialConsumptionNorm: number;
    changableAveragePrice: number;
}

export interface EntityFavoriteLaborItem {
    _id: ObjectId;
    favoriteGroupId: ObjectId;
    accountId: ObjectId;

    // Labor item data
    laborItemId?: ObjectId; // Original catalog item (if not custom)
    laborOfferId?: ObjectId; // Original offer (if any)
    laborOfferItemName: string;
    measurementUnitMongoId: ObjectId;
    quantity: number;
    changableAveragePrice: number;
    laborHours?: number;

    // Materials attached to this labor item
    materials: FavoriteMaterialItem[];

    createdAt: Date;
}

export function getFavoriteLaborItemsCollection(): Collection<EntityFavoriteLaborItem> {
    return mongoDb_.collection('favorite_labor_items');
}

export function favoriteLaborItemToApi(favoriteLaborItem: any) {
    let api = { ...favoriteLaborItem } as EntityFavoriteLaborItem;
    return api;
}
