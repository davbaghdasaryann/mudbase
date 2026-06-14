import { ObjectId } from 'mongodb';
import { registerApiSession } from '@/server/register';
import * as Db from '@/db';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { respondJsonData } from '@/tsback/req/req_response';
import { assertObject } from '@/tslib/assert';
import { updateEstimateCostById } from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('estimate/duplicate_labor_item', async (req, res, session) => {
    const estimatedLaborId = requireMongoIdParam(req, 'estimatedLaborId');

    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();

    const source = await estimateLaborItemsColl.findOne({ _id: estimatedLaborId });
    assertObject(source, 'Labor item not found');

    // Find all siblings in the same subsection, sorted by displayIndex
    const siblings = await estimateLaborItemsColl
        .find({ estimateSubsectionId: source!.estimateSubsectionId })
        .sort({ displayIndex: 1, _id: 1 })
        .toArray();

    const sourceIndex = siblings.findIndex((s) => s._id.equals(estimatedLaborId));
    const insertAfterIndex = sourceIndex >= 0 ? sourceIndex : siblings.length - 1;

    // Shift displayIndex of all items after the source to make room
    const itemsAfter = siblings.slice(insertAfterIndex + 1);
    if (itemsAfter.length > 0) {
        await Promise.all(
            itemsAfter.map((item, i) =>
                estimateLaborItemsColl.updateOne(
                    { _id: item._id },
                    { $set: { displayIndex: (insertAfterIndex + 2 + i) * 10 } }
                )
            )
        );
    }

    // Also set the source's displayIndex explicitly
    await estimateLaborItemsColl.updateOne(
        { _id: source!._id },
        { $set: { displayIndex: (insertAfterIndex) * 10 } }
    );

    // Create the duplicate labor item
    const { _id: _omit, ...sourceData } = source!;
    const newLaborItem = {
        ...sourceData,
        _id: new ObjectId(),
        displayIndex: (insertAfterIndex + 1) * 10,
    };
    const insertResult = await estimateLaborItemsColl.insertOne(newLaborItem);
    const newLaborId = insertResult.insertedId;

    // Duplicate associated material items
    const materials = await estimateMaterialItemsColl
        .find({ estimatedLaborId: estimatedLaborId })
        .toArray();

    if (materials.length > 0) {
        const newMaterials = materials.map(({ _id: _omitId, ...mat }) => ({
            ...mat,
            _id: new ObjectId(),
            estimatedLaborId: newLaborId,
        }));
        await estimateMaterialItemsColl.insertMany(newMaterials);
    }

    await updateEstimateCostById(source!.estimateId);

    respondJsonData(res, { ok: true, newLaborId });
});
