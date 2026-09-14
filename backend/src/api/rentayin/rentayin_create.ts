import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from '../costing/costing_snapshot';

registerApiSession('rentayin/create', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const estimateName = requireQueryParam(req, 'estimateName');

    const estimateObjId = new ObjectId(estimateId);

    // Build snapshot to get labor rows with estimatedUnitCost and laborItemId
    const [snapshot, latestCosting, laborOffers] = await Promise.all([
        buildEstimateSnapshot(estimateId),
        Db.getCostingsCollection()
            .findOne(
                { accountId: session.mongoAccountId, estimateId: estimateObjId, deleted: { $ne: true }, isUnforeseen: { $ne: true } },
                { sort: { createdAt: -1 }, projection: { actualData: 1 } }
            ),
        Db.getLaborOffersCollection()
            .find({ accountId: session.mongoAccountId, isArchived: { $ne: true } }, { projection: { itemId: 1, price: 1 } })
            .toArray(),
    ]);

    const libraryPriceByItemId = new Map(laborOffers.map(o => [o.itemId?.toString(), o.price]));

    // Get laborItemIds from estimate labor items for the snapshot rows
    const estimateLaborItems = await Db.getEstimateLaborItemsCollection()
        .find({ estimateId: estimateObjId }, { projection: { _id: 1, laborItemId: 1 } })
        .toArray();
    const laborItemIdByRowId = new Map(estimateLaborItems.map(i => [i._id.toString(), i.laborItemId?.toString()]));

    const rows: Db.RentayinRow[] = snapshot.laborRows
        .filter(r => !r.isGroupRow)
        .map(r => {
            const laborItemId = laborItemIdByRowId.get(r._id) ?? '';
            const estimatedUnitCost = r.changableAveragePrice ?? 0;

            // Priority 1: actual unit cost from latest costing
            const actualEntry = latestCosting?.actualData?.[r._id];
            if (actualEntry && actualEntry.unitPrice && parseFloat(actualEntry.unitPrice) > 0) {
                return {
                    laborItemId,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    actualUnitCost: parseFloat(actualEntry.unitPrice),
                    unitCostSource: 'actual' as const,
                    sectionName: r.sectionName,
                    subsectionName: r.subsectionName,
                };
            }

            // Priority 2: library unit cost
            const libraryPrice = libraryPriceByItemId.get(laborItemId);
            if (libraryPrice && libraryPrice > 0) {
                return {
                    laborItemId,
                    laborOfferItemName: r.laborOfferItemName,
                    unitSymbol: r.unitSymbol,
                    quantity: r.quantity,
                    estimatedUnitCost,
                    actualUnitCost: libraryPrice,
                    unitCostSource: 'library' as const,
                    sectionName: r.sectionName,
                    subsectionName: r.subsectionName,
                };
            }

            // Priority 3: manual entry needed
            return {
                laborItemId,
                laborOfferItemName: r.laborOfferItemName,
                unitSymbol: r.unitSymbol,
                quantity: r.quantity,
                estimatedUnitCost,
                actualUnitCost: null,
                unitCostSource: null,
                sectionName: r.sectionName,
                subsectionName: r.subsectionName,
            };
        });

    const doc: Db.EntityRentayin = {
        accountId: session.mongoAccountId,
        estimateId: estimateObjId,
        estimateName,
        rows,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await Db.getRentayinsCollection().insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
