import {Int32, ObjectId} from 'mongodb';

export interface EntityEstimateLaborOffers {
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

    itemName: string;
    itemFullCode: string;
    accountName: string;

}


export function estimateLaborOfferToApi(laborItem: any) {
    let api = {...laborItem} as EntityEstimateLaborOffers;
    return api;
}

export interface EntityEstimateMaterialOffers {
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

    itemName: string;
    itemFullCode: string;
    accountName: string;

}


