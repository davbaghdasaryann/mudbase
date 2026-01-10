import {ObjectId } from 'mongodb';

export interface EntityLaborOffers {
    _id: ObjectId;
    userId: ObjectId;
    accountId: ObjectId;
    itemId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    laborHours: number; //🔴 TODO: this will need us in version 2 🔴
    measurementUnitMongoId: ObjectId;
    price: number;
    currency: string;
    anonymous: boolean;
    public: boolean;
    isActive: boolean;
    
    itemData: any;

    
    isArchived: boolean;
    archivedAt: Date;
    unarchivedAt: Date;
    
}

export function getLaborOffersCollection() {
    return mongoDb_.collection('labor_offers');
}

export function laborOfferToApi(laborItem: any) {
    let api = { ...laborItem } as EntityLaborOffers;
    // api._id = undefined;
    return api;
}