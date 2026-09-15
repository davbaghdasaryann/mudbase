import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('rentayin/fetch', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const doc = await Db.getRentayinsCollection().findOne({
        _id: new ObjectId(id),
        accountId: session.mongoAccountId,
        deleted: { $ne: true },
    });
    if (!doc) { respondJsonData(res, null); return; }

    let estimateOtherExpenses: Record<string, number>[] = [];
    if (doc.estimateId) {
        const est = await Db.getEstimatesCollection().findOne(
            { _id: doc.estimateId },
            { projection: { otherExpenses: 1 } }
        );
        estimateOtherExpenses = (est?.otherExpenses ?? []) as Record<string, number>[];
    }

    respondJsonData(res, { ...doc, estimateOtherExpenses });
});
