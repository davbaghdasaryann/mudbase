import {Int32, ObjectId} from 'mongodb';

export interface EntityLaborCategories {
    _id: ObjectId;
    code: string;
    name: string;
}

export function getLaborCategoriesCollection() {
    return mongoDb_.collection('labor_categories');
}

export function laborCategoryToApi(laborCategory: any) {
    let api = {...laborCategory} as EntityLaborCategories;
    // api._id = undefined;
    return api;
}