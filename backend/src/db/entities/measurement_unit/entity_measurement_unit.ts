import { Int32, ObjectId } from 'mongodb';

export interface EntityMeasurementUnit {
    _id: ObjectId;
    name: string;
    commonCode: string;
    levelCat: string;
    representationSymbol: string;
    measurementUnitId: string;
}

export function getMeasurementUnitCollection() {
    return mongoDb_.collection('measurement_unit');
}

export function measurementUnitToApi(measurementUnit: any) {
    let api = { ...measurementUnit } as EntityMeasurementUnit;
    // api._id = undefined;
    return api;
}