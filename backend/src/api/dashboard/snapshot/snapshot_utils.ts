import * as Db from '@/db';
import { ObjectId } from 'mongodb';

const THIRTY_MIN_MS = 30 * 60 * 1000;

function roundToThirtyMinutes(date: Date): Date {
    return new Date(
        Math.floor(date.getTime() / THIRTY_MIN_MS) * THIRTY_MIN_MS
    );
}

/**
 * Capture snapshots for all widgets that track the given item.
 * Called after offer changes so charts get event-driven data points.
 * No-op if no widgets track this item.
 */
export async function captureSnapshotsForItem(
    itemId: ObjectId,
    dataSource: 'materials' | 'labor'
): Promise<void> {
    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

    const widgets = await widgetsColl
        .find({
            dataSource,
            'dataSourceConfig.itemId': itemId,
        })
        .toArray();

    if (widgets.length === 0) {
        return;
    }

    let currentAveragePrice: number;
    if (dataSource === 'materials') {
        const materialItemsColl = Db.getMaterialItemsCollection();
        const item = await materialItemsColl.findOne({ _id: itemId });
        currentAveragePrice = item?.averagePrice ?? 0;
    } else {
        const laborItemsColl = Db.getLaborItemsCollection();
        const item = await laborItemsColl.findOne({ _id: itemId });
        currentAveragePrice = item?.averagePrice ?? 0;
    }

    const now = new Date();
    const roundedTime = roundToThirtyMinutes(now);

    for (const widget of widgets) {
        if (widget._id == null) continue;
        try {
            await snapshotsColl.insertOne({
                widgetId: widget._id,
                timestamp: roundedTime,
                value: currentAveragePrice,
                metadata: {},
            });
        } catch (err) {
            log_.warn(`[Snapshot] Failed to capture for widget ${widget._id}:`, err);
        }
    }
}

/**
 * Prune dashboard widget snapshots older than 30 days.
 * Run only on server startup (maintenance). Journal data is never touched.
 */
export async function snapshotMaintenance(): Promise<void> {
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await snapshotsColl.deleteMany({
        timestamp: { $lt: thirtyDaysAgo },
    });
    if (result.deletedCount > 0) {
        log_.info(`[Snapshot] Maintenance: deleted ${result.deletedCount} snapshots older than 30 days`);
    }
}

export { roundToThirtyMinutes };
