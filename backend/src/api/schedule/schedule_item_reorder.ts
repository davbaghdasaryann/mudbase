import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('schedule/item_reorder', async (req, res, session) => {
    const { items } = req.body as { items: { id: string; groupId: string | null; displayIndex: number }[] };
    if (!Array.isArray(items)) { respondJsonData(res, { ok: false }); return; }
    const col = Db.getScheduleItemsCollection();
    await Promise.all(items.map(({ id, groupId, displayIndex }) => {
        const setFields: Record<string, unknown> = { displayIndex };
        if (groupId) setFields.groupId = new ObjectId(groupId);
        const update = groupId
            ? { $set: setFields }
            : { $set: { displayIndex }, $unset: { groupId: '' } };
        return col.updateOne(
            { _id: new ObjectId(id), accountId: session.mongoAccountId },
            update,
        );
    }));
    respondJsonData(res, { ok: true });
});
