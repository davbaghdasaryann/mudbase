import { ObjectId } from 'mongodb';

export interface EntityEciCategories {
    _id: ObjectId;
    code: string;
    name: string;
}

export function getEciCategoriesCollection() {
    return mongoDb_.collection('eci_categories');
}

export function eciCategoryToApi(eciCategory: any) {
    let api = { ...eciCategory } as EntityEciCategories;
    return api;
}
