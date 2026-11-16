import { Collection, ObjectId } from 'mongodb';

export interface EntityShopCategory {
    _id?: ObjectId;
    name?: string;
    parentId?: ObjectId;
    displayIndex?: number;
    createdAt?: Date;
}

export function getShopCategoriesCollection(): Collection<EntityShopCategory> {
    return mongoDb_.collection('shop_categories');
}
