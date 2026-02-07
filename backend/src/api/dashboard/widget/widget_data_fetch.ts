import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { verify } from '@/tslib/verify';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { getReqParam } from '@tsback/req/req_params';

const THIRTY_MIN_MS = 30 * 60 * 1000;

function roundToThirtyMinutes(date: Date): Date {
    return new Date(Math.floor(date.getTime() / THIRTY_MIN_MS) * THIRTY_MIN_MS);
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
    return Array.from(byBucket.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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

    let snapshots: Array<{ timestamp: Date; value: number }>;

    if (widget!.dataSource === 'materials' || widget!.dataSource === 'labor') {
        const rawItemId = widget!.dataSourceConfig?.itemId;
        if (!rawItemId) {
            snapshots = snapshotDocs.map(s => ({ timestamp: s.timestamp, value: s.value }));
        } else {
            const itemId = typeof rawItemId === 'string' ? new ObjectId(rawItemId) : rawItemId;
            const offerIds = await getOfferIdsForItem(itemId, widget!.dataSource);
            const journalPoints = await getJournalPointsInWindow(
                widget!.dataSource,
                offerIds,
                startDate
            );
            snapshots = mergeSnapshotAndJournalPoints(snapshotDocs, journalPoints);
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

    // Always show at least the current 30-min bucket (e.g. 14:14 → 14:00) with current price/cost so "no data" never shows when we have a valid source
    const currentBucket = roundToThirtyMinutes(now);
    const hasCurrentBucket = snapshots.some(
        p => roundToThirtyMinutes(p.timestamp).getTime() === currentBucket.getTime()
    );
    if (!hasCurrentBucket && session.mongoAccountId) {
        const currentValue = await getCurrentValueForWidget(widget!, session.mongoAccountId);
        if (currentValue != null) {
            snapshots.push({ timestamp: currentBucket, value: currentValue });
            snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        }
    }

    // Normalize so every point shows the 30-min slot (e.g. 14:14 → 14:00) with price for that bucket
    snapshots = normalizeToThirtyMinBuckets(snapshots);

    // Calculate analytics for 15-day and 30-day widgets
    let analytics = null;
    if (widget!.widgetType !== '1-day' && snapshots.length > 0) {
        const values = snapshots.map(s => s.value);
        analytics = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length
        };
    }

    respondJsonData(res, {
        widget,
        snapshots,
        analytics
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
        { projection: { laborItemId: 1, quantity: 1, isHidden: 1 } }
    ).toArray();
    const materialItems = await materialColl.find(
        { estimateId },
        { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1 } }
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
            const price = laborPriceMap.get(key) ?? 0;
            if (labor.quantity && price) totalCost += labor.quantity * price;
        }
        for (const mat of materialItems) {
            if (hiddenLaborIds.has(mat.estimatedLaborId.toString())) continue;
            const key = `${t}:${mat.materialItemId.toString()}`;
            const price = materialPriceMap.get(key) ?? 0;
            if (mat.quantity && price) totalCost += mat.quantity * price;
        }
        result.push({ timestamp: new Date(t), value: totalCost });
    }

    return result;
}
