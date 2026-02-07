import { Collection, ObjectId } from 'mongodb';

export interface EntityDashboardWidgetSnapshot {
    _id?: ObjectId;
    widgetId: ObjectId;
    timestamp: Date;
    value: number;
    metadata?: {
        itemName?: string;
        estimateName?: string;
    };
}

export function getDashboardWidgetSnapshotsCollection(): Collection<EntityDashboardWidgetSnapshot> {
    return mongoDb_.collection('dashboard_widget_snapshots');
}
