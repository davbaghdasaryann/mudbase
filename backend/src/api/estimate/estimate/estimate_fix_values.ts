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
    const estimateMaterialColl = Db.getEstimateMaterialItemsCollection();

    const laborMatch: any = { estimateId };
    if (estimatedLaborIds?.length) laborMatch._id = { $in: estimatedLaborIds };

    const laborItems = await estimateLaborColl.find(laborMatch).toArray();

    for (const item of laborItems) {
        await estimateLaborColl.updateOne(
            { _id: item._id },
            { $set: { fixedPrice: item.changableAveragePrice, isFixed: true } }
        );
    }

    // Also fix all material items belonging to these labor items
    const fixedLaborIds = laborItems.map(l => l._id);
    if (fixedLaborIds.length > 0) {
        const materialItems = await estimateMaterialColl.find({ estimatedLaborId: { $in: fixedLaborIds } }).toArray();
        for (const mat of materialItems) {
            await estimateMaterialColl.updateOne(
                { _id: mat._id },
                { $set: { fixedPrice: mat.changableAveragePrice, isFixed: true } }
            );
        }
    }

    respondJson(res, { ok: true, count: laborItems.length });
});

registerApiSession('estimate/load_fixed_values', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');

    const estimateLaborColl = Db.getEstimateLaborItemsCollection();
    const estimateMaterialColl = Db.getEstimateMaterialItemsCollection();

    // Restore labor prices
    const laborItems = await estimateLaborColl.find({ estimateId, isFixed: true }).toArray();
    for (const item of laborItems) {
        if (item.fixedPrice !== undefined) {
            await estimateLaborColl.updateOne(
                { _id: item._id },
                { $set: { changableAveragePrice: item.fixedPrice } }
            );
        }
    }

    // Restore material prices
    const fixedLaborIds = laborItems.map(l => l._id);
    if (fixedLaborIds.length > 0) {
        const materialItems = await estimateMaterialColl.find({ estimatedLaborId: { $in: fixedLaborIds }, isFixed: true }).toArray();
        for (const mat of materialItems) {
            if (mat.fixedPrice !== undefined) {
                await estimateMaterialColl.updateOne(
                    { _id: mat._id },
                    { $set: { changableAveragePrice: mat.fixedPrice } }
                );
            }
        }
    }

    respondJson(res, { ok: true, count: laborItems.length });
});
