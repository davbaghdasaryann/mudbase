import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { respondJson } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { updateEstimateCostById } from './estimate_calc_prices';

registerApiSession('estimate/adjust_prices', async (req, res, session) => {
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const { percentage, scope } = req.body ?? {};

    const pct = parseFloat(String(percentage));
    if (isNaN(pct) || pct === 0) {
        respondJson(res, { ok: false, message: 'Invalid percentage' });
        return;
    }

    const factor = 1 + pct / 100;
    const applyToLabor = scope === 'labor' || scope === 'both';
    const applyToMaterials = scope === 'materials' || scope === 'both';

    if (applyToLabor) {
        const laborColl = Db.getEstimateLaborItemsCollection();
        await laborColl.updateMany(
            { estimateId, isFixed: { $ne: true } },
            { $mul: { changableAveragePrice: factor } } as any
        );
    }

    if (applyToMaterials) {
        const materialColl = Db.getEstimateMaterialItemsCollection();
        await materialColl.updateMany(
            { estimateId, isFixed: { $ne: true } },
            { $mul: { changableAveragePrice: factor } } as any
        );
    }

    await updateEstimateCostById(estimateId);

    respondJson(res, { ok: true });
});
