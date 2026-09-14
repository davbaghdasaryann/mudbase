import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

// Update a single row's actualUnitCost (manual entry) and save to library
registerApiSession('rentayin/update_row', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const laborItemId = requireQueryParam(req, 'laborItemId');
    const rowIndex = parseInt(req.query.rowIndex as string);
    const unitCost = parseFloat(req.query.unitCost as string);

    if (isNaN(rowIndex) || isNaN(unitCost) || unitCost <= 0) {
        res.status(400).json({ error: 'Invalid params' });
        return;
    }

    const col = Db.getRentayinsCollection();
    const doc = await col.findOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    if (!doc || !doc.rows) { res.status(404).json({ error: 'Not found' }); return; }

    const rows = [...doc.rows];
    if (rowIndex < 0 || rowIndex >= rows.length) { res.status(400).json({ error: 'Invalid row index' }); return; }

    rows[rowIndex] = { ...rows[rowIndex], actualUnitCost: unitCost, unitCostSource: 'manual' };

    await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { rows, updatedAt: new Date() } }
    );

    // Save to library: upsert labor_offer for this account/itemId
    if (laborItemId) {
        const laborOffersCol = Db.getLaborOffersCollection();
        const existing = await laborOffersCol.findOne({ accountId: session.mongoAccountId, itemId: new ObjectId(laborItemId) });
        if (existing) {
            await laborOffersCol.updateOne({ _id: existing._id }, { $set: { price: unitCost, updatedAt: new Date() } });
        } else {
            await laborOffersCol.insertOne({
                accountId: session.mongoAccountId,
                userId: session.mongoUserId,
                itemId: new ObjectId(laborItemId),
                price: unitCost,
                currency: 'AMD',
                laborHours: 0,
                measurementUnitMongoId: new ObjectId(),
                anonymous: false,
                public: false,
                isActive: true,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);
        }
    }

    respondJsonData(res, { ok: true, rows });
});
