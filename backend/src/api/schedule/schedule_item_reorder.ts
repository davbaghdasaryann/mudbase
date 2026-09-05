import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('schedule/item_reorder', async (req, res, session) => {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids)) {
        respondJsonData(res, { ok: false });
        return;
    }
    const col = Db.getScheduleItemsCollection();
    await Promise.all(ids.map((id, index) =>
        col.updateOne(
            { _id: new ObjectId(id), accountId: session.mongoAccountId },
            { $set: { displayIndex: index } }
        )
    ));
    respondJsonData(res, { ok: true });
});
