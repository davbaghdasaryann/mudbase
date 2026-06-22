/**
 * One-time migration: scale old estimate/eci widget snapshots by the
 * otherExpenses multiplier that was missing when they were captured.
 *
 * DRY_RUN=true  → prints what would change, touches nothing
 * DRY_RUN=false → applies updates
 */

import { MongoClient, ObjectId } from 'mongodb';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const MONGO_URL = 'mongodb://mudbase:Me75D89ju3gd@3.75.127.170:37017/mudbase';
// Only touch snapshots taken before today's fix was deployed
const CUTOFF = new Date('2026-06-19T00:00:00.000Z');

const client = new MongoClient(MONGO_URL);
await client.connect();
const db = client.db('mudbase');

const widgets          = db.collection('dashboard_widgets');
const snapshots        = db.collection('dashboard_widget_snapshots');
const estimates        = db.collection('estimates');
const eciEstimates     = db.collection('eci_estimates');

console.log(`\n=== Snapshot scaling migration (DRY_RUN=${DRY_RUN}) ===`);
console.log(`Only touching snapshots with timestamp < ${CUTOFF.toISOString()}\n`);

const estimateWidgets = await widgets.find({ dataSource: { $in: ['estimates', 'eci'] } }).toArray();
console.log(`Found ${estimateWidgets.length} estimate/eci widgets\n`);

let totalSnapshotsUpdated = 0;

for (const widget of estimateWidgets) {
    const widgetId = widget._id;
    let estimateId = null;
    let constructionArea = 1;

    if (widget.dataSource === 'estimates') {
        const rawId = widget.dataSourceConfig?.estimateId;
        if (!rawId) { console.log(`  [${widgetId}] No estimateId, skipping`); continue; }
        estimateId = typeof rawId === 'string' ? new ObjectId(rawId) : rawId;
    } else if (widget.dataSource === 'eci') {
        const rawEciId = widget.dataSourceConfig?.estimateId;
        if (!rawEciId) { console.log(`  [${widgetId}] No eci estimateId, skipping`); continue; }
        const eciId = typeof rawEciId === 'string' ? new ObjectId(rawEciId) : rawEciId;
        const eci = await eciEstimates.findOne({ _id: eciId }, { projection: { estimateId: 1, constructionArea: 1 } });
        if (!eci?.estimateId) { console.log(`  [${widgetId}] ECI has no linked estimateId, skipping`); continue; }
        estimateId = eci.estimateId;
        constructionArea = eci.constructionArea || 1;
    }

    const estimate = await estimates.findOne(
        { _id: estimateId },
        { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
    );

    if (!estimate) { console.log(`  [${widgetId}] Estimate not found, skipping`); continue; }

    const totalWith = estimate.totalCostWithOtherExpenses ?? 0;
    const totalWithout = estimate.totalCost ?? 0;

    if (!totalWithout || totalWithout <= 0) {
        console.log(`  [${widgetId}] totalCost is zero/missing, skipping`);
        continue;
    }

    const scalingFactor = totalWith / totalWithout;

    if (Math.abs(scalingFactor - 1) < 0.0001) {
        console.log(`  [${widgetId}] No other expenses (factor ≈ 1.0), skipping`);
        continue;
    }

    const oldSnapshots = await snapshots.find({
        widgetId,
        timestamp: { $lt: CUTOFF }
    }).toArray();

    if (oldSnapshots.length === 0) {
        console.log(`  [${widgetId}] ${widget.dataSource} — no old snapshots to update`);
        continue;
    }

    console.log(`  [${widgetId}] ${widget.dataSource} widget "${widget.name}"`);
    console.log(`    totalCost=${totalWithout.toLocaleString()}  totalWithOther=${totalWith.toLocaleString()}  factor=${scalingFactor.toFixed(6)}`);
    console.log(`    Old snapshots: ${oldSnapshots.length}`);

    if (oldSnapshots.length > 0) {
        const sample = oldSnapshots[oldSnapshots.length - 1];
        console.log(`    Sample (latest old): ${sample.value.toLocaleString()} → ${Math.round(sample.value * scalingFactor).toLocaleString()}`);
    }

    if (!DRY_RUN) {
        for (const snap of oldSnapshots) {
            await snapshots.updateOne(
                { _id: snap._id },
                { $set: { value: Math.round(snap.value * scalingFactor) } }
            );
        }
        console.log(`    ✓ Updated ${oldSnapshots.length} snapshots`);
    }

    totalSnapshotsUpdated += oldSnapshots.length;
}

console.log(`\n=== ${DRY_RUN ? 'DRY RUN complete' : 'Migration complete'} ===`);
console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${totalSnapshotsUpdated} snapshots\n`);

await client.close();
