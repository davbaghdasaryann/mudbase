import { Collection, ObjectId } from 'mongodb';

export interface EntityKaravarumTask {
    _id?: ObjectId;
    accountId: ObjectId;
    projectId?: ObjectId;
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    color?: string;
    status?: 'pending' | 'in_progress' | 'done';
    createdAt?: Date;
    updatedAt?: Date;
}

export function getKaravarumTasksCollection(): Collection<EntityKaravarumTask> {
    return mongoDb_.collection('karavarum_tasks');
}
