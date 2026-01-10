import {Int32, ObjectId} from 'mongodb';

export interface EntityMaterialSubcategories {
    _id: ObjectId;
    code: string;
    name: string;
    categoryCode: string;
    categoryId: ObjectId;
    categoryFullCode: string;

}

export function getMaterialSubcategoriesCollection() {
    return mongoDb_.collection('material_subcategories');
}

export function materialSubcategoryToApi(materialSubcategory: any) {
    let api = {...materialSubcategory} as EntityMaterialSubcategories;
    // api._id = undefined;
    return api;
}