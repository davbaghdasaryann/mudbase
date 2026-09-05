import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam, getQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/item_add', async (req, res, session) => {
    const scheduleId = requireQueryParam(req, 'scheduleId');
    const laborOfferItemName = requireQueryParam(req, 'laborOfferItemName');
    const quantity = parseFloat(requireQueryParam(req, 'quantity'));
    const laborHours = parseFloat(getQueryParam(req, 'laborHours') ?? '0');
    const unitSymbol = getQueryParam(req, 'unitSymbol') ?? '';
    const sectionName = getQueryParam(req, 'sectionName') ?? '';
    const subsectionName = getQueryParam(req, 'subsectionName') ?? '';

    const col = Db.getScheduleItemsCollection();
    const doc: Db.EntityScheduleItem = {
        scheduleId: new ObjectId(scheduleId),
        accountId: session.mongoAccountId,
        laborOfferItemName,
        quantity,
        laborHours,
        unitSymbol,
        sectionName,
        subsectionName,
        createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
