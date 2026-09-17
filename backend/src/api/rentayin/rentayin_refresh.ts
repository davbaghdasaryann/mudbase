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

    // Reapply labor price overrides from the overrides map (keyed by estimateRowId).
    // actualUnitCost = override + existing material cost (preserving materials structure).
    const laborOverrides = doc.laborPriceOverrides ?? {};
    const mergedRows = freshRows.map(r => {
        const estimateRowId = (r as any).estimateRowId as string | undefined;
        const override = estimateRowId ? laborOverrides[estimateRowId] : undefined;
        if (override != null && override > 0) {
            const matCost = r.actualMaterialUnitCost ?? 0;
            return {
                ...r,
                actualLaborUnitCost: override,
                laborUnitCostSource: 'manual' as const,
                unitCostSource: 'manual' as const,
                actualUnitCost: override + matCost,
            };
        }
        return r;
    });

    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id) },
        { $set: { rows: mergedRows, updatedAt: new Date() } }
    );

    respondJsonData(res, { ok: true, rows: mergedRows });
});
