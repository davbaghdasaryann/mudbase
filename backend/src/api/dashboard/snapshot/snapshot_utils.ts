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
 * Capture today's totalCostWithOtherExpenses for all estimate/eci widgets.
 * Idempotent — skips any widget that already has a snapshot for today.
 * Timestamp is set to start-of-day (UTC) for clean daily bucketing.
 */
export async function captureEstimateSnapshotsForToday(): Promise<void> {
    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();
    const estimatesColl = Db.getEstimatesCollection();
    const eciEstimatesColl = Db.getEciEstimatesCollection();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const widgets = await widgetsColl
        .find({ dataSource: { $in: ['estimates', 'eci'] } })
        .toArray();

    for (const widget of widgets) {
        if (!widget._id) continue;
        try {
            const alreadyCaptured = await snapshotsColl.findOne({
                widgetId: widget._id,
                timestamp: { $gte: todayStart, $lt: todayEnd },
            });
            if (alreadyCaptured) continue;

            let value: number | null = null;

            if (widget.dataSource === 'estimates') {
                const rawId = widget.dataSourceConfig?.estimateId;
                if (!rawId) continue;
                const estimateId = typeof rawId === 'string' ? new ObjectId(rawId) : rawId as ObjectId;
                const estimate = await estimatesColl.findOne(
                    { _id: estimateId },
                    { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
                );
                value = estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? null;
            } else if (widget.dataSource === 'eci') {
                const rawEciId = widget.dataSourceConfig?.estimateId;
                if (!rawEciId) continue;
                const eciId = typeof rawEciId === 'string' ? new ObjectId(rawEciId) : rawEciId as ObjectId;
                const eci = await eciEstimatesColl.findOne({ _id: eciId });
                if (!eci?.estimateId) continue;
                const estimate = await estimatesColl.findOne(
                    { _id: eci.estimateId },
                    { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
                );
                const total = estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? null;
                if (total != null && total > 0) {
                    value = total / (eci.constructionArea || 1);
                }
            }

            if (value != null && value > 0) {
                await snapshotsColl.insertOne({
                    widgetId: widget._id,
                    timestamp: todayStart,
                    value,
                    metadata: { auto: true },
                });
                log_.info(`[Snapshot] Daily auto-captured widget ${widget._id}: ${Math.round(value).toLocaleString()}`);
            }
        } catch (err) {
            log_.warn(`[Snapshot] Daily capture failed for widget ${widget._id}:`, err);
        }
    }
}

/**
 * Start a scheduler that captures daily estimate snapshots once per hour.
 * The capture function is idempotent — it only writes one snapshot per widget per day.
 */
export function startDailyEstimateSnapshotScheduler(): void {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    setInterval(async () => {
        try {
            await captureEstimateSnapshotsForToday();
        } catch (err) {
            log_.error('[Snapshot] Daily scheduler error:', err);
        }
    }, ONE_HOUR_MS);
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
