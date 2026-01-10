import {Collection, Int32, ObjectId} from 'mongodb';

export interface EntityLaborSubcategories {
    _id: ObjectId;
    code: string;
    name: string;
    categoryCode: string;
    categoryId: ObjectId;
    categoryFullCode: string;
}

export function getLaborSubcategoriesCollection(): Collection<EntityLaborSubcategories>  {
    return mongoDb_.collection('labor_subcategories');
}

export function laborSubcategoryToApi(laborSubcategory: any) {
    let api = {...laborSubcategory} as EntityLaborSubcategories;
    // api._id = undefined;
    return api;
}