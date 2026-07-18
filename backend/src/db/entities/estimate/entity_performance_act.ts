import { Collection, ObjectId } from 'mongodb';

interface ActValues { unitPrice: string; quantity: string; }
export type PerformanceActData = Record<string, ActValues>;
export interface ActDateRange { from: string; to: string; }

export interface EntityPerformanceAct {
    _id?: ObjectId;
    accountId?: ObjectId;
    createdByUserId?: ObjectId;
    estimateId?: ObjectId;
    estimateName?: string;
    acts?: number[];
    actsData?: PerformanceActData[];
    actsDates?: ActDateRange[];
    createdAt?: Date;
    updatedAt?: Date;
}

export function getPerformanceActsCollection(): Collection<EntityPerformanceAct> {
    return mongoDb_.collection('performance_acts');
}
