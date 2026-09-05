import { Collection, ObjectId } from 'mongodb';

export interface EntityScheduleGroup {
    _id?: ObjectId;
    scheduleId?: ObjectId;
    accountId?: ObjectId;
    name?: string;
    displayIndex?: number;
    createdAt?: Date;
}

export function getScheduleGroupsCollection(): Collection<EntityScheduleGroup> {
    return mongoDb_.collection('schedule_groups');
}
