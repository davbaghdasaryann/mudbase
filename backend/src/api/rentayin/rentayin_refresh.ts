import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildRentayinRows } from './rentayin_row_builder';

// Re-reads costing actual data and refreshes the rows of an existing rentayin.
// Manual overrides (actualUnitCost with source 'manual') are preserved.
registerApiSession('rentayin/refresh', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');

    const doc = await Db.getRentayinsCollection().findOne({
        _id: new ObjectId(id),
        accountId: session.mongoAccountId,
        deleted: { $ne: true },
    });
    if (!doc || !doc.estimateId) { res.status(404).json({ error: 'Not found' }); return; }

    const freshRows = await buildRentayinRows(doc.estimateId.toString(), session.mongoAccountId);

    // Preserve manual overrides
    const manualByLaborItemId = new Map<string, number>();
    for (const r of doc.rows ?? []) {
        if (r.unitCostSource === 'manual' && r.actualUnitCost != null) {
            manualByLaborItemId.set(r.laborItemId, r.actualUnitCost);
        }
    }

    const mergedRows = freshRows.map(r => {
        const manual = manualByLaborItemId.get(r.laborItemId);
        if (manual != null && r.actualUnitCost === null) {
            return { ...r, actualUnitCost: manual, actualLaborUnitCost: manual, unitCostSource: 'manual' as const };
        }
        return r;
    });

    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id) },
        { $set: { rows: mergedRows, updatedAt: new Date() } }
    );

    respondJsonData(res, { ok: true, rows: mergedRows });
});
