import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('schedule/group_delete', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getScheduleGroupsCollection();
    await col.deleteOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    // Ungroup items that belonged to this group
    const itemCol = Db.getScheduleItemsCollection();
    await itemCol.updateMany(
        { groupId: new ObjectId(id), accountId: session.mongoAccountId },
        { $unset: { groupId: '' } },
    );
    respondJsonData(res, { ok: true });
});
