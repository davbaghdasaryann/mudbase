import { Collection, ObjectId } from 'mongodb';

export type WidgetType = '1-day' | '15-day' | '30-day';
export type DataSource = 'estimates' | 'materials' | 'labor' | 'eci';

export interface DataSourceConfig {
    itemId?: ObjectId;
    estimateId?: ObjectId;
    field: 'price' | 'cost';
}

export interface EntityDashboardWidget {
    _id?: ObjectId;
    accountId: ObjectId;
    userId: ObjectId;
    groupId: ObjectId;
    name: string;
    widgetType: WidgetType;
    dataSource: DataSource;
    dataSourceConfig: DataSourceConfig;
    displayIndex: number;
    createdAt: Date;
    updatedAt?: Date;
}

export function getDashboardWidgetsCollection(): Collection<EntityDashboardWidget> {
    return mongoDb_.collection('dashboard_widgets');
}
