import { Collection, ObjectId } from 'mongodb';

export interface EntityEciSubcategories {
    _id: ObjectId;
    code: string;
    name: string;
    categoryCode: string;
    categoryId: ObjectId;
    categoryFullCode: string;
}

export function getEciSubcategoriesCollection(): Collection<EntityEciSubcategories> {
    return mongoDb_.collection('eci_subcategories');
}

export function eciSubcategoryToApi(eciSubcategory: any) {
    let api = { ...eciSubcategory } as EntityEciSubcategories;
    return api;
}
