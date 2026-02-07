import { Collection, ObjectId } from 'mongodb';

export interface EntityDashboardWidgetGroup {
    _id?: ObjectId;
    accountId: ObjectId;
    userId: ObjectId;
    name: string;
    displayIndex: number;
    createdAt: Date;
    updatedAt?: Date;
}

export function getDashboardWidgetGroupsCollection(): Collection<EntityDashboardWidgetGroup> {
    return mongoDb_.collection('dashboard_widget_groups');
}
