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
    let costingOtherActuals: Record<string, number> = {};
    let costingActualTotals: { labor: number; materials: number } = { labor: 0, materials: 0 };
    if (doc.estimateId) {
        const [est, latestCosting] = await Promise.all([
            Db.getEstimatesCollection().findOne(
                { _id: doc.estimateId },
                { projection: { otherExpenses: 1 } }
            ),
            Db.getCostingsCollection().findOne(
                { accountId: session.mongoAccountId, estimateId: doc.estimateId, deleted: { $ne: true }, isUnforeseen: { $ne: true } },
                { sort: { createdAt: -1 }, projection: { vatDeduction: 1, climateImpact: 1, temporaryStructures: 1, transportationCosts: 1, commissioningCosts: 1, stateFees: 1, costHistory: 1 } }
            ),
        ]);
        estimateOtherExpenses = (est?.otherExpenses ?? []) as Record<string, number>[];
        if (latestCosting) {
            costingOtherActuals = {
                valueAddedTax: latestCosting.vatDeduction ?? 0,
                climaticImpactCosts: latestCosting.climateImpact ?? 0,
                temporaryStructures: latestCosting.temporaryStructures ?? 0,
                transportationCosts: latestCosting.transportationCosts ?? 0,
                operationHandoverCosts: latestCosting.commissioningCosts ?? 0,
                stateDutiesAndFees: latestCosting.stateFees ?? 0,
            };
            const ch = (latestCosting.costHistory ?? []) as any[];
            costingActualTotals = {
                materials: ch.filter(e => e.paymentMethod === 'nyuth_tsakhsagrum').reduce((s: number, e: any) => s + (e.total ?? 0), 0),
                labor: ch.filter(e => !e.paymentMethod || e.paymentMethod === '' || (e.paymentMethod as string).startsWith('salary_')).reduce((s: number, e: any) => s + (e.total ?? 0), 0),
            };
        }
    }

    respondJsonData(res, { ...doc, estimateOtherExpenses, costingOtherActuals, costingActualTotals });
});
