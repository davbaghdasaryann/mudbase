import { Collection, ObjectId } from 'mongodb';

export interface EntityMaterialOffer {
    _id: ObjectId;
    userId: ObjectId;
    accountId: ObjectId;
    itemId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    price: number;
    currency: string;
    measurementUnitMongoId: ObjectId;
    anonymous: boolean;
    public: boolean;
    isActive: boolean;

    itemData: any;


    isArchived: boolean;
    archivedAt: Date;
    unarchivedAt: Date;

}

export function getMaterialOffersCollection(): Collection<EntityMaterialOffer> {
    return mongoDb_.collection('material_offers');
}
