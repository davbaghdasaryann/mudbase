import {registerApiSession} from '@/server/register';
import * as Db from '@/db';

import {respondJson} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {ObjectId} from 'mongodb';

function parseOptionalLaborIds(body: any): ObjectId[] | undefined {
    if (!Array.isArray(body?.estimatedLaborIds)) return undefined;
    return body.estimatedLaborIds.map((id: string) => new ObjectId(id));
}

registerApiSession('estimate/fix_labor_values', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const estimatedLaborIds = parseOptionalLaborIds(req.body);

    const estimateLaborColl = Db.getEstimateLaborItemsCollection();

    const laborMatch: any = { estimateId };
    if (estimatedLaborIds?.length) laborMatch._id = { $in: estimatedLaborIds };

    const items = await estimateLaborColl.find(laborMatch).toArray();

    for (const item of items) {
        await estimateLaborColl.updateOne(
            { _id: item._id },
            {
                $set: {
                    fixedPrice: item.changableAveragePrice,
                    isFixed: true,
                }
            }
        );
    }

    respondJson(res, { ok: true, count: items.length });
});

registerApiSession('estimate/load_fixed_values', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimateLaborColl = Db.getEstimateLaborItemsCollection();

    const items = await estimateLaborColl.find({ estimateId, isFixed: true }).toArray();

    for (const item of items) {
        if (item.fixedPrice !== undefined) {
            await estimateLaborColl.updateOne(
                { _id: item._id },
                {
                    $set: { changableAveragePrice: item.fixedPrice }
                }
            );
        }
    }

    respondJson(res, { ok: true, count: items.length });
});
