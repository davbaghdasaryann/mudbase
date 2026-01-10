import {Int32, ObjectId} from 'mongodb';

export interface EntityLaborItems {
    _id: ObjectId;
    code: string;
    name: string;
    subcategoryId: ObjectId;
    subcategoryCode: string;
    fullCode: string;

    measurementUnitMongoId: ObjectId;
}

export function getLaborItemsCollection() {
    return mongoDb_.collection('labor_items');
}

export function laborItemToApi(laborItem: any) {
    let api = {...laborItem} as EntityLaborItems;
    // api._id = undefined;
    return api;
}