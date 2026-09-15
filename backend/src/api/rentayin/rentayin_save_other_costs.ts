import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('rentayin/save_other_costs', async (req, res, session) => {
    const { id, percentages } = req.body as { id: string; percentages: Record<string, number> };

    await Db.getRentayinsCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId, deleted: { $ne: true } },
        { $set: { otherCostPercentages: percentages, updatedAt: new Date() } }
    );

    respondJsonData(res, { ok: true });
});
