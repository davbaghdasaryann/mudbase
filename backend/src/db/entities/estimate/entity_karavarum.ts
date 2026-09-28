import { Collection, ObjectId } from 'mongodb';

export interface ConfirmedEst {
    _id: string;
    name?: string;
    estimateNumber?: string;
    totalCostWithOtherExpenses?: number;
    totalCost?: number;
}

export interface EntityKaravarum {
    _id?: ObjectId;
    accountId?: ObjectId;
    name?: string;
    confirmedEsts?: ConfirmedEst[];
    createdAt?: Date;
    updatedAt?: Date;
}

export function getKaravarumCollection(): Collection<EntityKaravarum> {
    return mongoDb_.collection('karavarum');
}
