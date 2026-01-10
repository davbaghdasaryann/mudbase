import {Collection, ObjectId} from 'mongodb';

export interface EntityMaterialItem {
    _id: ObjectId;
    code: string;
    name: string;
    subcategoryId: ObjectId;
    subcategoryCode: string;
    fullCode: string;

    measurementUnitMongoId: ObjectId;

    averagePrice: number;
}

export function getMaterialItemsCollection(): Collection<EntityMaterialItem> {
    return mongoDb_.collection('material_items');
}

