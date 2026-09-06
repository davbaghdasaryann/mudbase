import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam, getQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/item_update', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getScheduleItemsCollection();
    const update: Partial<Db.EntityScheduleItem> = {};

    const startDayParam = getQueryParam(req, 'startDay');
    if (startDayParam !== null) update.startDay = parseInt(startDayParam);

    const startHourParam = getQueryParam(req, 'startHour');
    if (startHourParam !== null) update.startHour = parseInt(startHourParam);

    const quantityParam = getQueryParam(req, 'quantity');
    if (quantityParam !== null) {
        const qty = parseFloat(quantityParam);
        if (isFinite(qty)) update.quantity = qty;
    }

    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: update },
    );
    respondJsonData(res, { ok: true });
});
