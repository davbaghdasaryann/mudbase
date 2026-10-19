import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('rentayin/save_profit_sim_overrides', async (req, res, session) => {
    const { id, overrides } = req.body as { id: string; overrides: Record<string, number> };

    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId, deleted: { $ne: true } },
        { $set: { profitSimOverrides: overrides, updatedAt: new Date() } }
    );

    respondJsonData(res, { ok: true });
});
