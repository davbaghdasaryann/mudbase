/**
 * One-time migration: repair pahest entries with blank names or zero-ObjectId materialItemId.
 *
 * For each costing, finds pahestEntries where name === '' or name === undefined.
 * Looks up the matching estimate_material_items record using estimatedLaborId,
 * then patches the name (and materialItemId if it was zero-ObjectId) in-place.
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb://mudbase:Me75D89ju3gd@3.75.127.170:37017/mudbase?authSource=admin';
const DB_NAME = 'mudbase';
const ZERO_ID = '000000000000000000000000';

async function run() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const costingsCol = db.collection('costings');
    const materialsCol = db.collection('estimate_material_items');
    const materialItemsCol = db.collection('material_items');

    const costings = await costingsCol
        .find({ 'pahestEntries.name': { $in: ['', null] } })
        .toArray();

    console.log(`Found ${costings.length} costings with blank pahest entry names.`);

    let totalFixed = 0;

    for (const costing of costings) {
        const entries = costing.pahestEntries ?? [];
        let modified = false;
        const updated = [];

        for (const entry of entries) {
            if (entry.name && entry.name !== '') {
                updated.push(entry);
                continue;
            }

            // Try to find the matching estimate_material_items record
            let matRecord = null;

            if (entry.estimatedLaborId) {
                const laborOid = toObjectId(entry.estimatedLaborId);
                if (laborOid) {
                    // Find the blank material for this labor row (zero-ObjectId materialItemId)
                    matRecord = await materialsCol.findOne({
                        estimatedLaborId: laborOid,
                        $or: [
                            { materialItemId: new ObjectId(ZERO_ID) },
                            { materialItemId: { $exists: false } },
                        ],
                    });

                    // If not found by zero-ID, try matching by the entry's materialItemId directly
                    if (!matRecord && entry.materialItemId && entry.materialItemId !== ZERO_ID) {
                        const matOid = toObjectId(entry.materialItemId);
                        if (matOid) {
                            matRecord = await materialsCol.findOne({ _id: matOid });
                        }
                    }
                }
            }

            let name = '—';
            let materialItemId = entry.materialItemId;

            if (matRecord) {
                // Try to get name from catalog
                let catalogName = '';
                if (matRecord.materialItemId && matRecord.materialItemId.toString() !== ZERO_ID) {
                    const catalogItem = await materialItemsCol.findOne(
                        { _id: matRecord.materialItemId },
                        { projection: { name: 1 } }
                    );
                    catalogName = catalogItem?.name ?? '';
                }

                name = matRecord.materialOfferItemName || catalogName || '—';

                // Fix materialItemId: if stored as zero-ObjectId, use document _id
                if (entry.materialItemId === ZERO_ID || !entry.materialItemId) {
                    materialItemId = matRecord._id.toString();
                }
            }

            updated.push({ ...entry, name, materialItemId });
            modified = true;
            totalFixed++;
            console.log(`  Costing ${costing._id}: fixed entry → name="${name}", materialItemId=${materialItemId}`);
        }

        if (modified) {
            await costingsCol.updateOne(
                { _id: costing._id },
                { $set: { pahestEntries: updated, updatedAt: new Date() } }
            );
        }
    }

    console.log(`\nDone. Fixed ${totalFixed} blank pahest entries across ${costings.length} costings.`);
    await client.close();
}

function toObjectId(val) {
    if (!val) return null;
    try {
        if (typeof val === 'object' && val.$oid) return new ObjectId(val.$oid);
        if (typeof val === 'object' && val._bsontype === 'ObjectId') return val;
        return new ObjectId(String(val));
    } catch {
        return null;
    }
}

run().catch(err => { console.error(err); process.exit(1); });
