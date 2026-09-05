import { Collection, ObjectId } from 'mongodb';

export interface EntityScheduleItem {
    _id?: ObjectId;
    scheduleId?: ObjectId;
    accountId?: ObjectId;
    laborOfferItemName?: string;
    quantity?: number;
    laborHours?: number;
    unitSymbol?: string;
    sectionName?: string;
    subsectionName?: string;
    startDay?: number;
    createdAt?: Date;
}

export function getScheduleItemsCollection(): Collection<EntityScheduleItem> {
    return mongoDb_.collection('schedule_items');
}
