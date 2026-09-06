import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam, getQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/item_add', async (req, res, session) => {
    const scheduleId = requireQueryParam(req, 'scheduleId');
    const laborOfferItemName = requireQueryParam(req, 'laborOfferItemName');
    const quantityRaw = requireQueryParam(req, 'quantity');
    const quantity = parseFloat(quantityRaw);
    const laborHoursRaw = getQueryParam(req, 'laborHours') ?? '0';
    const laborHours = parseFloat(laborHoursRaw);
    console.log(`[item_add] name="${laborOfferItemName.substring(0,30)}" quantityRaw="${quantityRaw}" quantity=${quantity} laborHoursRaw="${laborHoursRaw}" laborHours=${laborHours}`);
    if (!isFinite(quantity)) throw new Error(`Invalid quantity: "${quantityRaw}"`);
    const unitSymbol = getQueryParam(req, 'unitSymbol') ?? '';
    const sectionName = getQueryParam(req, 'sectionName') ?? '';
    const subsectionName = getQueryParam(req, 'subsectionName') ?? '';
    const startDayParam = getQueryParam(req, 'startDay');
    const startDay = startDayParam ? parseInt(startDayParam) : 1;
    const startHourParam = getQueryParam(req, 'startHour');
    const startHour = startHourParam ? parseInt(startHourParam) : undefined;
    const groupIdParam = getQueryParam(req, 'groupId');
    const parentItemIdParam = getQueryParam(req, 'parentItemId');

    const col = Db.getScheduleItemsCollection();
    const groupFilter = groupIdParam
        ? { groupId: new ObjectId(groupIdParam) }
        : { groupId: { $exists: false } };
    const displayIndex = await col.countDocuments({
        scheduleId: new ObjectId(scheduleId),
        accountId: session.mongoAccountId,
        ...groupFilter,
    });

    const doc: Db.EntityScheduleItem = {
        scheduleId: new ObjectId(scheduleId),
        accountId: session.mongoAccountId,
        laborOfferItemName,
        quantity,
        laborHours,
        unitSymbol,
        sectionName,
        subsectionName,
        startDay,
        ...(startHour !== undefined ? { startHour } : {}),
        displayIndex,
        ...(groupIdParam ? { groupId: new ObjectId(groupIdParam) } : {}),
        ...(parentItemIdParam ? { parentItemId: new ObjectId(parentItemIdParam) } : {}),
        createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
