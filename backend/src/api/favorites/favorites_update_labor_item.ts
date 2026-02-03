import { ObjectId } from 'mongodb';
import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { verify } from '@/tslib/verify';

function toObjectId(v: any): ObjectId | undefined {
    if (v == null) return undefined;
    if (v instanceof ObjectId) return v;
    if (typeof v === 'string' && ObjectId.isValid(v)) return new ObjectId(v);
    return undefined;
}

registerApiSession('favorites/update_labor_item', async (req, res, session) => {
    const favoriteLaborItemId = requireMongoIdParam(req, 'favoriteLaborItemId');

    const favoriteLaborItemsColl = Db.getFavoriteLaborItemsCollection();

    const body = req.body ?? {};
    const update: any = {};

    if (body.laborOfferItemName !== undefined) {
        update.laborOfferItemName = String(body.laborOfferItemName);
    }

    if (body.quantity !== undefined) {
        const q = Number(body.quantity);
        verify(!Number.isNaN(q), 'Invalid quantity');
        update.quantity = q;
    }

    if (body.changableAveragePrice !== undefined) {
        const p = Number(body.changableAveragePrice);
        verify(!Number.isNaN(p), 'Invalid price');
        update.changableAveragePrice = p;
    }

    if (body.laborHours !== undefined) {
        const h = Number(body.laborHours);
        verify(!Number.isNaN(h), 'Invalid labor hours');
        update.laborHours = h;
    }

    if (body.materials !== undefined) {
        verify(Array.isArray(body.materials), 'Invalid materials array');
        update.materials = body.materials.map((m: any) => ({
            materialItemId: toObjectId(m.materialItemId),
            materialOfferId: toObjectId(m.materialOfferId),
            materialOfferItemName: String(m.materialOfferItemName ?? ''),
            measurementUnitMongoId: toObjectId(m.measurementUnitMongoId) ?? new ObjectId('000000000000000000000000'),
            quantity: Number(m.quantity) || 0,
            materialConsumptionNorm: Number(m.materialConsumptionNorm) ?? 0,
            changableAveragePrice: Number(m.changableAveragePrice) ?? 0,
        }));
    }

    if (Object.keys(update).length === 0) {
        respondJsonData(res, { success: true, modifiedCount: 0 });
        return;
    }

    const result = await favoriteLaborItemsColl.updateOne(
        { _id: favoriteLaborItemId, accountId: session.accountId },
        { $set: update }
    );

    verify(result.matchedCount === 1, 'Favorite labor item not found');

    respondJsonData(res, { success: true, modifiedCount: result.modifiedCount });
});

