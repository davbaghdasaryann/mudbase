import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

const THIRTY_MIN_MS = 30 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function roundToThirtyMinutes(date: Date): Date {
    return new Date(Math.floor(date.getTime() / THIRTY_MIN_MS) * THIRTY_MIN_MS);
}

function roundToDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Get current value for the widget so we can show at least the current 30-min bucket (e.g. 14:00) when there's no snapshot/journal yet. */
async function getCurrentValueForWidget(
    widget: { dataSource: string; dataSourceConfig?: { itemId?: unknown; estimateId?: unknown } },
    accountId: ObjectId
): Promise<number | null> {
    try {
        if (widget.dataSource === 'materials' && widget.dataSourceConfig?.itemId) {
            const itemId = typeof widget.dataSourceConfig.itemId === 'string'
                ? new ObjectId(widget.dataSourceConfig.itemId)
                : widget.dataSourceConfig.itemId;
            const item = await Db.getMaterialItemsCollection().findOne({ _id: itemId });
            return item?.averagePrice ?? null;
        }
        if (widget.dataSource === 'labor' && widget.dataSourceConfig?.itemId) {
            const itemId = typeof widget.dataSourceConfig.itemId === 'string'
                ? new ObjectId(widget.dataSourceConfig.itemId)
                : widget.dataSourceConfig.itemId;
            const item = await Db.getLaborItemsCollection().findOne({ _id: itemId });
            return item?.averagePrice ?? null;
        }
        if (widget.dataSource === 'estimates' && widget.dataSourceConfig?.estimateId) {
            const estimateId = typeof widget.dataSourceConfig.estimateId === 'string'
                ? new ObjectId(widget.dataSourceConfig.estimateId)
                : widget.dataSourceConfig.estimateId;
            const estimate = await Db.getEstimatesCollection().findOne({
                _id: estimateId,
                accountId
            });
            return estimate?.totalCost ?? null;
        }
        if (widget.dataSource === 'eci' && widget.dataSourceConfig?.estimateId) {
            const eciId = typeof widget.dataSourceConfig.estimateId === 'string'
                ? new ObjectId(widget.dataSourceConfig.estimateId)
                : widget.dataSourceConfig.estimateId;
            const eci = await Db.getEciEstimatesCollection().findOne({ _id: eciId });
            const linkedId = eci?.estimateId;
            if (!eci || !linkedId) return null;
            const estimate = await Db.getEstimatesCollection().findOne({
                _id: linkedId,
                accountId
            });
            if (!estimate) return null;
            const area = eci.constructionArea || 1;
            return (estimate.totalCost ?? 0) / area;
        }
    } catch {
        // ignore
    }
    return null;
}

/** Ensure every point shows the 30-min slot (e.g. 14:14 → 14:00) and one value per bucket. */
function normalizeToThirtyMinBuckets(
    points: Array<{ timestamp: Date; value: number }>
): Array<{ timestamp: Date; value: number }> {
    const byBucket = new Map<number, { timestamp: Date; value: number }>();
    for (const p of points) {
        const rounded = roundToThirtyMinutes(p.timestamp);
        const key = rounded.getTime();
        byBucket.set(key, { timestamp: rounded, value: p.value });
    }
    const sorted = Array.from(byBucket.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    // Carry forward last known value when we have 0 so charts don't show spurious zeros
    let lastGood = 0;
    for (const p of sorted) {
        if (p.value > 0) lastGood = p.value;
        else if (lastGood > 0) p.value = lastGood;
    }
    return sorted;
}

registerApiSession('dashboard/widget/widget_data_fetch', async (req, res, session) => {

    // Widget builder is only for regular users, not superadmin
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
        session.checkPermission(Permissions.UsersFetchAll) ||
        session.checkPermission(Permissions.AccountsFetch);

    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const widgetIdParam = getReqParam(req, 'widgetId');
    verify(widgetIdParam, req.t('required.widgetId'));

    const widgetId = new ObjectId(widgetIdParam);

    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

    // Verify widget belongs to user
    const widget = await widgetsColl.findOne({
        _id: widgetId,
        accountId: session.mongoAccountId,
        userId: session.mongoUserId
    });
    verify(widget, req.t('error.widget_not_found'));

    // Determine time range based on widget type
    const now = new Date();
    let startDate: Date;

    switch (widget!.widgetType) {
        case '1-day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '15-day':
            startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            break;
        case '30-day':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch snapshots
    const snapshotDocs = await snapshotsColl
        .find({
            widgetId,
            timestamp: { $gte: startDate }
        })
        .sort({ timestamp: 1 })
        .toArray();

    const useDaily = widget!.widgetType === '15-day' || widget!.widgetType === '30-day';
    let snapshots: Array<{ timestamp: Date; value: number }>;
    let dailySnapshots: Array<{ timestamp: Date; value: number; min: number; max: number }> | null = null;

    if (widget!.dataSource === 'materials' || widget!.dataSource === 'labor') {
        const rawItemId = widget!.dataSourceConfig?.itemId;
        if (!rawItemId) {
            snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
        } else {
            const itemId = typeof rawItemId === 'string' ? new ObjectId(rawItemId) : rawItemId;
            const offerIds = await getOfferIdsForItem(itemId, widget!.dataSource);

            if (useDaily) {
                const dayCount = widget!.widgetType === '30-day' ? 30 : 15;
                const dailyJournal = await getJournalPointsInWindowDaily(widget!.dataSource, offerIds, startDate, now, dayCount);
                const merged = mergeSnapshotAndJournalPointsDaily(snapshotDocs, dailyJournal);
                const today = roundToDay(now);
                const todayKey = today.toISOString().slice(0, 10);
                const hasTodayBucket = merged.some(p => roundToDay(p.timestamp).toISOString().slice(0, 10) === todayKey);
                if (!hasTodayBucket && session.mongoAccountId) {
                    let currentValue = await getCurrentValueForWidget(widget!, session.mongoAccountId);
                    if (currentValue == null || currentValue === 0) {
                        const lastPoint = merged.length > 0 ? merged[merged.length - 1] : null;
                        if (lastPoint && lastPoint.value > 0) currentValue = lastPoint.value;
                    }
                    if (currentValue != null && currentValue > 0) {
                        merged.push({ timestamp: today, value: currentValue, min: currentValue, max: currentValue });
                    }
                }
                dailySnapshots = normalizeToDailyBuckets(merged, startDate, now, dayCount);
                snapshots = dailySnapshots.map(d => ({ timestamp: d.timestamp, value: d.value }));
            } else {
                const journalPoints = await getJournalPointsInWindow(widget!.dataSource, offerIds, startDate);
                snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, journalPoints);
            }
        }
    } else if (widget!.dataSource === 'estimates') {
        const rawEstimateId = widget!.dataSourceConfig?.estimateId;
        if (!rawEstimateId) {
            snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
        } else {
            const estimateId = typeof rawEstimateId === 'string' ? new ObjectId(rawEstimateId) : rawEstimateId;
            const estimate = await Db.getEstimatesCollection().findOne({
                _id: estimateId,
                accountId: session.mongoAccountId
            });
            if (!estimate) {
                snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
            } else {
                const reconstructed = await getEstimateReconstructedPoints(estimateId, startDate);
                snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, reconstructed);
            }
        }
    } else if (widget!.dataSource === 'eci') {
        const rawEciEstimateId = widget!.dataSourceConfig?.estimateId;
        if (!rawEciEstimateId) {
            snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
        } else {
            const eciEstimateId = typeof rawEciEstimateId === 'string' ? new ObjectId(rawEciEstimateId) : rawEciEstimateId;
            const eciEstimate = await Db.getEciEstimatesCollection().findOne({ _id: eciEstimateId });
            const linkedEstimateId = eciEstimate?.estimateId;
            if (!eciEstimate || !linkedEstimateId) {
                snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
            } else {
                const estimate = await Db.getEstimatesCollection().findOne({
                    _id: linkedEstimateId,
                    accountId: session.mongoAccountId
                });
                if (!estimate) {
                    snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
                } else {
                    const reconstructed = await getEstimateReconstructedPoints(linkedEstimateId, startDate);
                    const constructionArea = eciEstimate.constructionArea || 1;
                    const eciReconstructed = reconstructed.map(p => ({
                        timestamp: p.timestamp,
                        value: p.value / constructionArea
                    }));
                    snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, eciReconstructed);
                }
            }
        }
    } else {
        snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
    }

    // For estimates/eci with 15-day or 30-day: convert 30-min snapshots to daily
    if (useDaily && !dailySnapshots) {
        const currentBucket = roundToThirtyMinutes(now);
        const hasCurrentBucket = snapshots.some(
            p => roundToThirtyMinutes(p.timestamp).getTime() === currentBucket.getTime()
        );
        if (!hasCurrentBucket && session.mongoAccountId) {
            let currentValue = await getCurrentValueForWidget(widget!, session.mongoAccountId);
            if (currentValue == null || currentValue === 0) {
                const lastPoint = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
                if (lastPoint && lastPoint.value > 0) currentValue = lastPoint.value;
            }
            if (currentValue != null && currentValue > 0) {
                snapshots.push({ timestamp: now, value: currentValue });
            }
        }
        const asDaily = snapshots.map(s => ({ timestamp: s.timestamp, value: s.value, min: s.value, max: s.value }));
        const merged = mergeSnapshotAndJournalPointsDaily(
            [],
            asDaily
        );
        const dayCount = widget!.widgetType === '30-day' ? 30 : 15;
        dailySnapshots = normalizeToDailyBuckets(merged, startDate, now, dayCount);
    }

    // Daily mode: respond with daily data and return early
    if (dailySnapshots) {
        respondJsonData(res, {
            widget,
            snapshots: dailySnapshots,
            analytics: null
        });
        return;
    }

    // Original 30-min logic for 1-day widgets
    const currentBucket = roundToThirtyMinutes(now);
    const hasCurrentBucket = snapshots.some(
        p => roundToThirtyMinutes(p.timestamp).getTime() === currentBucket.getTime()
    );
    if (!hasCurrentBucket && session.mongoAccountId) {
        let currentValue = await getCurrentValueForWidget(widget!, session.mongoAccountId);
        if (currentValue == null || currentValue === 0) {
            const lastPoint = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
            if (lastPoint && lastPoint.value > 0) currentValue = lastPoint.value;
        }
        if (currentValue != null && currentValue > 0) {
            snapshots.push({ timestamp: currentBucket, value: currentValue });
            snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        }
    }

    snapshots = normalizeToThirtyMinBuckets(snapshots);

    respondJsonData(res, {
        widget,
        snapshots,
        analytics: null
    });
});

/** Preview widget data without a saved widget (e.g. in builder step 3). Uses journal/reconstructed + current value only. */
registerApiSession('dashboard/widget/widget_data_preview', async (req, res, session) => {
    const isSuperAdmin = session.checkPermission(Permissions.All) ||
        session.checkPermission(Permissions.UsersFetchAll) ||
        session.checkPermission(Permissions.AccountsFetch);
    if (isSuperAdmin) {
        throw new Error('Widget builder is not available for superadmin');
    }

    const body = (req.body || {}) as { widgetType?: string; dataSource?: string; dataSourceConfig?: { itemId?: string; estimateId?: string }; name?: string };
    const widgetType = body.widgetType || '1-day';
    const dataSource = body.dataSource || 'labor';
    const dataSourceConfig = body.dataSourceConfig || {};
    const name = body.name || 'Preview';

    const widget = {
        _id: 'preview',
        name,
        widgetType,
        dataSource,
        dataSourceConfig
    };

    const now = new Date();
    let startDate: Date;
    switch (widgetType) {
        case '1-day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '15-day':
            startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            break;
        case '30-day':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const snapshotDocs: Array<{ timestamp: Date; value: number }> = [];
    const useDaily = widgetType === '15-day' || widgetType === '30-day';

    let snapshots: Array<{ timestamp: Date; value: number }>;
    let dailySnapshots: Array<{ timestamp: Date; value: number; min: number; max: number }> | null = null;

    if (dataSource === 'materials' || dataSource === 'labor') {
        const rawItemId = dataSourceConfig?.itemId;
        if (!rawItemId) {
            snapshots = [];
        } else {
            const itemId = new ObjectId(rawItemId);
            const offerIds = await getOfferIdsForItem(itemId, dataSource);

            if (useDaily) {
                const dayCount = widgetType === '30-day' ? 30 : 15;
                const dailyJournal = await getJournalPointsInWindowDaily(dataSource, offerIds, startDate, now, dayCount);
                const merged = mergeSnapshotAndJournalPointsDaily(snapshotDocs, dailyJournal);
                const today = roundToDay(now);
                const todayKey = today.toISOString().slice(0, 10);
                const hasTodayBucket = merged.some(p => roundToDay(p.timestamp).toISOString().slice(0, 10) === todayKey);
                if (!hasTodayBucket && session.mongoAccountId) {
                    let currentValue = await getCurrentValueForWidget(widget, session.mongoAccountId);
                    if (currentValue == null || currentValue === 0) {
                        const lastPoint = merged.length > 0 ? merged[merged.length - 1] : null;
                        if (lastPoint && lastPoint.value > 0) currentValue = lastPoint.value;
                    }
                    if (currentValue != null && currentValue > 0) {
                        merged.push({ timestamp: today, value: currentValue, min: currentValue, max: currentValue });
                    }
                }
                dailySnapshots = normalizeToDailyBuckets(merged, startDate, now, dayCount);
                snapshots = dailySnapshots.map(d => ({ timestamp: d.timestamp, value: d.value }));
            } else {
                const journalPoints = await getJournalPointsInWindow(dataSource, offerIds, startDate);
                snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, journalPoints);
            }
        }
    } else if (dataSource === 'estimates') {
        const rawEstimateId = dataSourceConfig?.estimateId;
        if (!rawEstimateId) {
            snapshots = [];
        } else {
            const estimateId = new ObjectId(rawEstimateId);
            const estimate = await Db.getEstimatesCollection().findOne({
                _id: estimateId,
                accountId: session.mongoAccountId
            });
            if (!estimate) {
                snapshots = [];
            } else {
                const reconstructed = await getEstimateReconstructedPoints(estimateId, startDate);
                snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, reconstructed);
            }
        }
    } else if (dataSource === 'eci') {
        const rawEciEstimateId = dataSourceConfig?.estimateId;
        if (!rawEciEstimateId) {
            snapshots = [];
        } else {
            const eciEstimateId = new ObjectId(rawEciEstimateId);
            const eciEstimate = await Db.getEciEstimatesCollection().findOne({ _id: eciEstimateId });
            const linkedEstimateId = eciEstimate?.estimateId;
            if (!eciEstimate || !linkedEstimateId) {
                snapshots = [];
            } else {
                const estimate = await Db.getEstimatesCollection().findOne({
                    _id: linkedEstimateId,
                    accountId: session.mongoAccountId
                });
                if (!estimate) {
                    snapshots = [];
                } else {
                    const reconstructed = await getEstimateReconstructedPoints(linkedEstimateId, startDate);
                    const constructionArea = eciEstimate.constructionArea || 1;
                    const eciReconstructed = reconstructed.map(p => ({
                        timestamp: p.timestamp,
                        value: p.value / constructionArea
                    }));
                    snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, eciReconstructed);
                }
            }
        }
    } else {
        snapshots = [];
    }

    // For estimates/eci with 15-day or 30-day: convert 30-min snapshots to daily
    if (useDaily && !dailySnapshots) {
        if (session.mongoAccountId) {
            let currentValue = await getCurrentValueForWidget(widget, session.mongoAccountId);
            if (currentValue == null || currentValue === 0) {
                const lastPoint = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
                if (lastPoint && lastPoint.value > 0) currentValue = lastPoint.value;
            }
            if (currentValue != null && currentValue > 0) {
                snapshots.push({ timestamp: now, value: currentValue });
            }
        }
        const asDaily = snapshots.map(s => ({ timestamp: s.timestamp, value: s.value, min: s.value, max: s.value }));
        const merged = mergeSnapshotAndJournalPointsDaily([], asDaily);
        const dayCount = widgetType === '30-day' ? 30 : 15;
        dailySnapshots = normalizeToDailyBuckets(merged, startDate, now, dayCount);
    }

    // Daily mode: respond with daily data and return early
    if (dailySnapshots) {
        respondJsonData(res, {
            widget,
            snapshots: dailySnapshots,
            analytics: null
        });
        return;
    }

    // Original 30-min logic for 1-day widgets
    const currentBucket = roundToThirtyMinutes(now);
    const hasCurrentBucket = snapshots.some(
        p => roundToThirtyMinutes(p.timestamp).getTime() === currentBucket.getTime()
    );
    if (!hasCurrentBucket && session.mongoAccountId) {
        let currentValue = await getCurrentValueForWidget(widget, session.mongoAccountId);
        if (currentValue == null || currentValue === 0) {
            const lastPoint = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
            if (lastPoint && lastPoint.value > 0) currentValue = lastPoint.value;
        }
        if (currentValue != null && currentValue > 0) {
            snapshots.push({ timestamp: currentBucket, value: currentValue });
            snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        }
    }

    snapshots = normalizeToThirtyMinBuckets(snapshots);

    respondJsonData(res, {
        widget,
        snapshots,
        analytics: null
    });
});

async function getOfferIdsForItem(
    itemId: ObjectId,
    dataSource: 'materials' | 'labor'
): Promise<ObjectId[]> {
    if (dataSource === 'materials') {
        const coll = Db.getMaterialOffersCollection();
        const offers = await coll.find({ itemId }, { projection: { _id: 1 } }).toArray();
        return offers.map(o => o._id!);
    } else {
        const coll = Db.getLaborOffersCollection();
        const offers = await coll.find({ itemId }, { projection: { _id: 1 } }).toArray();
        return offers.map(o => o._id!);
    }
}

/** Get all offer IDs for multiple catalog items (for estimate reconstruction). */
async function getOfferIdsForItems(
    itemIds: ObjectId[],
    dataSource: 'materials' | 'labor'
): Promise<ObjectId[]> {
    if (itemIds.length === 0) return [];
    if (dataSource === 'materials') {
        const coll = Db.getMaterialOffersCollection();
        const offers = await coll.find({ itemId: { $in: itemIds } }, { projection: { _id: 1 } }).toArray();
        return offers.map(o => o._id!);
    } else {
        const coll = Db.getLaborOffersCollection();
        const offers = await coll.find({ itemId: { $in: itemIds } }, { projection: { _id: 1 } }).toArray();
        return offers.map(o => o._id!);
    }
}

async function getJournalPointsInWindow(
    dataSource: 'materials' | 'labor',
    offerIds: ObjectId[],
    startDate: Date
): Promise<Array<{ timestamp: Date; value: number }>> {
    if (offerIds.length === 0) return [];

    const journalColl = dataSource === 'materials'
        ? Db.getMaterialPricesJournalCollection()
        : Db.getLaborPricesJournalCollection();

    const pipeline = [
        { $match: { itemId: { $in: offerIds }, date: { $gte: startDate } } },
        {
            $addFields: {
                roundedTime: {
                    $toDate: {
                        $multiply: [
                            { $floor: { $divide: [{ $toLong: '$date' }, THIRTY_MIN_MS] } },
                            THIRTY_MIN_MS
                        ]
                    }
                }
            }
        },
        { $group: { _id: '$roundedTime', avgPrice: { $avg: '$price' } } },
        { $sort: { _id: 1 } }
    ];

    const result = await journalColl.aggregate<{ _id: Date; avgPrice: number }>(pipeline).toArray();
    return result.map(r => ({ timestamp: r._id, value: r.avgPrice }));
}

function mergeSnapshotAndJournalPoints(
    snapshotDocs: Array<{ timestamp: Date; value: number }>,
    journalPoints: Array<{ timestamp: Date; value: number }>
): Array<{ timestamp: Date; value: number }> {
    const byTime = new Map<number, { timestamp: Date; value: number }>();

    for (const p of journalPoints) {
        const key = p.timestamp.getTime();
        byTime.set(key, { timestamp: p.timestamp, value: p.value });
    }
    for (const s of snapshotDocs) {
        const key = s.timestamp.getTime();
        byTime.set(key, { timestamp: s.timestamp, value: s.value });
    }

    return Array.from(byTime.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/** Journal aggregation grouped by (roundedTime, catalog itemId). Used to reconstruct estimate totalCost from market prices over time. */
async function getJournalPointsByItemInWindow(
    dataSource: 'materials' | 'labor',
    offerIds: ObjectId[],
    startDate: Date
): Promise<Array<{ roundedTime: Date; itemId: ObjectId; avgPrice: number }>> {
    if (offerIds.length === 0) return [];

    const journalColl = dataSource === 'materials'
        ? Db.getMaterialPricesJournalCollection()
        : Db.getLaborPricesJournalCollection();
    const offersCollectionName = dataSource === 'materials' ? 'material_offers' : 'labor_offers';

    const pipeline = [
        { $match: { itemId: { $in: offerIds }, date: { $gte: startDate } } },
        {
            $lookup: {
                from: offersCollectionName,
                localField: 'itemId',
                foreignField: '_id',
                as: 'offerDoc'
            }
        },
        { $unwind: '$offerDoc' },
        {
            $addFields: {
                roundedTime: {
                    $toDate: {
                        $multiply: [
                            { $floor: { $divide: [{ $toLong: '$date' }, THIRTY_MIN_MS] } },
                            THIRTY_MIN_MS
                        ]
                    }
                },
                catalogItemId: '$offerDoc.itemId'
            }
        },
        { $group: { _id: { roundedTime: '$roundedTime', itemId: '$catalogItemId' }, avgPrice: { $avg: '$price' } } },
        { $sort: { '_id.roundedTime': 1 } }
    ];

    const result = await journalColl.aggregate<{ _id: { roundedTime: Date; itemId: ObjectId }; avgPrice: number }>(pipeline).toArray();
    return result.map(r => ({ roundedTime: r._id.roundedTime, itemId: r._id.itemId, avgPrice: r.avgPrice }));
}

/**
 * Reconstruct historical estimate totalCost from labor/material price journals.
 * Uses the estimate's current labor and material rows (quantities) and fills in
 * market average price per 30-min bucket from journals. Fast when journals are
 * indexed on (itemId, date).
 */
async function getEstimateReconstructedPoints(
    estimateId: ObjectId,
    startDate: Date
): Promise<Array<{ timestamp: Date; value: number }>> {
    const laborColl = Db.getEstimateLaborItemsCollection();
    const materialColl = Db.getEstimateMaterialItemsCollection();

    const laborItems = await laborColl.find(
        { estimateId },
        { projection: { laborItemId: 1, quantity: 1, isHidden: 1, changableAveragePrice: 1, averagePrice: 1 } }
    ).toArray();
    const materialItems = await materialColl.find(
        { estimateId },
        { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1, changableAveragePrice: 1, averagePrice: 1 } }
    ).toArray();

    const hiddenLaborIds = new Set(
        laborItems.filter(l => l.isHidden).map(l => l._id!.toString())
    );

    const laborItemIds = [...new Set(laborItems.map(l => l.laborItemId))];
    const materialItemIds = [...new Set(materialItems.map(m => m.materialItemId))];

    const laborOfferIds = await getOfferIdsForItems(laborItemIds, 'labor');
    const materialOfferIds = await getOfferIdsForItems(materialItemIds, 'materials');

    const [laborPoints, materialPoints] = await Promise.all([
        getJournalPointsByItemInWindow('labor', laborOfferIds, startDate),
        getJournalPointsByItemInWindow('materials', materialOfferIds, startDate)
    ]);

    const laborPriceMap = new Map<string, number>();
    const materialPriceMap = new Map<string, number>();
    const allTimestamps = new Set<number>();

    for (const p of laborPoints) {
        const key = `${p.roundedTime.getTime()}:${p.itemId.toString()}`;
        laborPriceMap.set(key, p.avgPrice);
        allTimestamps.add(p.roundedTime.getTime());
    }
    for (const p of materialPoints) {
        const key = `${p.roundedTime.getTime()}:${p.itemId.toString()}`;
        materialPriceMap.set(key, p.avgPrice);
        allTimestamps.add(p.roundedTime.getTime());
    }

    const timestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const result: Array<{ timestamp: Date; value: number }> = [];

    for (const t of timestamps) {
        let totalCost = 0;
        for (const labor of laborItems) {
            if (labor.isHidden) continue;
            const key = `${t}:${labor.laborItemId.toString()}`;
            const price = laborPriceMap.get(key) ?? (labor as any).changableAveragePrice ?? (labor as any).averagePrice ?? 0;
            if (labor.quantity && price) totalCost += labor.quantity * price;
        }
        for (const mat of materialItems) {
            if (hiddenLaborIds.has(mat.estimatedLaborId.toString())) continue;
            const key = `${t}:${mat.materialItemId.toString()}`;
            const price = materialPriceMap.get(key) ?? (mat as any).changableAveragePrice ?? (mat as any).averagePrice ?? 0;
            if (mat.quantity && price) totalCost += mat.quantity * price;
        }
        result.push({ timestamp: new Date(t), value: totalCost });
    }

    return result;
}

/**
 * Reconstruct per-day offer prices for a material/labor item.
 * For each day, finds the latest journal price for EVERY offer,
 * then computes avg/min/max across all active offers as of that day.
 * This gives correct min/max (spread of all company offers), not just
 * the min/max of entries that changed on that day.
 */
async function getJournalPointsInWindowDaily(
    dataSource: 'materials' | 'labor',
    offerIds: ObjectId[],
    startDate: Date,
    endDate: Date,
    dayCount: number
): Promise<Array<{ timestamp: Date; value: number; min: number; max: number }>> {
    if (offerIds.length === 0) return [];

    const journalColl = dataSource === 'materials'
        ? Db.getMaterialPricesJournalCollection()
        : Db.getLaborPricesJournalCollection();

    // Fetch all journal entries up to endDate (including before window for starting prices)
    const entries = await journalColl
        .find({ itemId: { $in: offerIds }, date: { $lte: endDate } })
        .sort({ date: 1 })
        .toArray();

    // Build per-offer sorted timeline
    const timelines = new Map<string, Array<{ date: Date; price: number; isArchived: boolean }>>();
    for (const e of entries) {
        const key = (e as any).itemId.toString();
        if (!timelines.has(key)) timelines.set(key, []);
        timelines.get(key)!.push({
            date: (e as any).date,
            price: (e as any).price ?? 0,
            isArchived: !!(e as any).isArchived
        });
    }

    const end = roundToDay(endDate);
    const start = new Date(end.getTime() - (dayCount - 1) * ONE_DAY_MS);
    const result: Array<{ timestamp: Date; value: number; min: number; max: number }> = [];

    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + ONE_DAY_MS)) {
        const dayEnd = new Date(d.getTime() + ONE_DAY_MS);
        const prices: number[] = [];

        for (const [, timeline] of timelines) {
            // Find the latest entry on or before this day
            let latest: { price: number; isArchived: boolean } | null = null;
            for (const entry of timeline) {
                if (entry.date < dayEnd) {
                    latest = { price: entry.price, isArchived: entry.isArchived };
                } else {
                    break;
                }
            }
            if (latest && !latest.isArchived && latest.price > 0) {
                prices.push(latest.price);
            }
        }

        if (prices.length > 0) {
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            result.push({
                timestamp: new Date(d),
                value: avg,
                min: Math.min(...prices),
                max: Math.max(...prices)
            });
        }
    }

    return result;
}

/** Merge snapshot docs (30-min) with daily journal points. Journal is primary (has min/max). Snapshots fill gaps. */
function mergeSnapshotAndJournalPointsDaily(
    snapshotDocs: Array<{ timestamp: Date; value: number }>,
    journalPoints: Array<{ timestamp: Date; value: number; min: number; max: number }>
): Array<{ timestamp: Date; value: number; min: number; max: number }> {
    const byDay = new Map<string, { timestamp: Date; value: number; min: number; max: number }>();

    for (const p of journalPoints) {
        const day = roundToDay(p.timestamp);
        const key = day.toISOString().slice(0, 10);
        byDay.set(key, { timestamp: day, value: p.value, min: p.min, max: p.max });
    }

    // Group snapshots by day and average for days without journal data
    const snapshotByDay = new Map<string, { sum: number; count: number; timestamp: Date }>();
    for (const s of snapshotDocs) {
        const day = roundToDay(s.timestamp);
        const key = day.toISOString().slice(0, 10);
        if (!byDay.has(key)) {
            const existing = snapshotByDay.get(key);
            if (existing) {
                existing.sum += s.value;
                existing.count += 1;
            } else {
                snapshotByDay.set(key, { sum: s.value, count: 1, timestamp: day });
            }
        }
    }
    for (const [key, agg] of snapshotByDay) {
        const avg = agg.sum / agg.count;
        byDay.set(key, { timestamp: agg.timestamp, value: avg, min: avg, max: avg });
    }

    return Array.from(byDay.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/** Always produce exactly `dayCount` points (one per day) ending on today. Missing days carry forward, early gaps use first known value or 0. */
function normalizeToDailyBuckets(
    points: Array<{ timestamp: Date; value: number; min: number; max: number }>,
    _startDate: Date,
    endDate: Date,
    dayCount: number
): Array<{ timestamp: Date; value: number; min: number; max: number }> {
    const byDay = new Map<string, { timestamp: Date; value: number; min: number; max: number }>();
    for (const p of points) {
        const day = roundToDay(p.timestamp);
        const key = day.toISOString().slice(0, 10);
        byDay.set(key, { timestamp: day, value: p.value, min: p.min, max: p.max });
    }

    // Build exactly dayCount days ending on endDate
    const end = roundToDay(endDate);
    const start = new Date(end.getTime() - (dayCount - 1) * ONE_DAY_MS);

    // Find the first known value to backfill early gaps
    let firstKnown = { value: 0, min: 0, max: 0 };
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + ONE_DAY_MS)) {
        const key = d.toISOString().slice(0, 10);
        const existing = byDay.get(key);
        if (existing) {
            firstKnown = { value: existing.value, min: existing.min, max: existing.max };
            break;
        }
    }

    const result: Array<{ timestamp: Date; value: number; min: number; max: number }> = [];
    let lastGood = firstKnown;

    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + ONE_DAY_MS)) {
        const key = d.toISOString().slice(0, 10);
        const existing = byDay.get(key);
        if (existing) {
            lastGood = { value: existing.value, min: existing.min, max: existing.max };
            result.push(existing);
        } else {
            result.push({ timestamp: new Date(d), value: lastGood.value, min: lastGood.min, max: lastGood.max });
        }
    }

    return result;
}
