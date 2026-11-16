import { Collection, ObjectId } from 'mongodb';

export interface EntityShopListing {
    _id?: ObjectId;
    accountId?: ObjectId;
    materialId?: ObjectId;
    materialName?: string;
    materialCode?: string;
    categoryId?: ObjectId;
    price?: number;
    description?: string;
    status?: 'draft' | 'published';
    createdAt?: Date;
}

export function getShopListingsCollection(): Collection<EntityShopListing> {
    return mongoDb_.collection('shop_listings');
}
