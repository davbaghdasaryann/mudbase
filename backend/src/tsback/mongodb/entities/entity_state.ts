import {ObjectId} from 'mongodb';

export interface EntityState {
    _id: ObjectId;
    name: string;
    intValue: number;
    strValue?: string;
}

export function getStateCollection() {
    return mongoDb_.collection('state');
}
