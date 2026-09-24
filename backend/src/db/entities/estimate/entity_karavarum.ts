import { Collection, ObjectId } from 'mongodb';

export interface EntityKaravarum {
    _id?: ObjectId;
    accountId?: ObjectId;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export function getKaravarumCollection(): Collection<EntityKaravarum> {
    return mongoDb_.collection('karavarum');
}
