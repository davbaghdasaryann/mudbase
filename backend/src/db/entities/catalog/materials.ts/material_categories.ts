import {Int32, ObjectId} from 'mongodb';

export interface EntityMaterialCategories {
    _id: ObjectId;
    code: string;
    name: string;
}

export function getMaterialCategoriesCollection() {
    return mongoDb_.collection('material_categories');
}

export function materialCategoryToApi(materialCategory: any) {
    let api = {...materialCategory} as EntityMaterialCategories;
    // api._id = undefined;
    return api;
}