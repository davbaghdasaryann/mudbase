import { ObjectId } from 'mongodb';
import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';
import { respondJsonData } from '@/tsback/req/req_response';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('estimate/add_custom_material_item', async (req, res, session) => {
    const estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');

    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const laborItem = assertObject(
        await laborItemsCol.findOne({ _id: estimatedLaborId }),
        'Invalid labor item'
    )!;

    const measurementUnitCol = Db.getMeasurementUnitCollection();
    const defaultUnit = await measurementUnitCol.findOne({});
    const measurementUnitId = defaultUnit?._id ?? new ObjectId('000000000000000000000001');

    const placeholderItemId = new ObjectId('000000000000000000000000');

    const materialItem = {
        estimateSubsectionId: laborItem.estimateSubsectionId,
        estimateId: laborItem.estimateId,
        estimatedLaborId,
        materialItemId: placeholderItemId,
        measurementUnitMongoId: measurementUnitId,
        quantity: 0,
        materialConsumptionNorm: 0,
        averagePrice: 0,
        changableAveragePrice: 0,
        materialOfferItemName: '',
    } as Db.EntityEstimateMaterialItems;

    const result = await Db.getEstimateMaterialItemsCollection().insertOne(materialItem);

    await updateEstimateCostById(laborItem.estimateId);

    respondJsonData(res, { insertedId: result.insertedId });
});
