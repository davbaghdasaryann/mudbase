import { Collection, ObjectId } from 'mongodb';

export interface EntitySchedule {
    _id?: ObjectId;
    accountId?: ObjectId;
    estimateId?: string;
    estimateName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export function getSchedulesCollection(): Collection<EntitySchedule> {
    return mongoDb_.collection('schedules');
}
