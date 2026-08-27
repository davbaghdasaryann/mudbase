import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildEstimateSnapshot } from './costing_snapshot';

registerApiSession('costing/fork_estimate', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getCostingsCollection();

    const costing = await col.findOne({ _id: new ObjectId(id), accountId: session.mongoAccountId });
    if (!costing || !costing.estimateId) throw new Error('Costing not found');

    if (costing.localEstimateId) {
        // Already forked — just return current state
        respondJsonData(res, { localEstimateId: costing.localEstimateId, snapshot: costing.estimateSnapshot ?? null, actualData: costing.actualData ?? {} });
        return;
    }

    const estimateId = costing.estimateId;
    const estimatesCol = Db.getEstimatesCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborItemsCol = Db.getEstimateLaborItemsCollection();
    const materialItemsCol = Db.getEstimateMaterialItemsCollection();

    const original = await estimatesCol.findOne({ _id: estimateId });
    if (!original) throw new Error('Original estimate not found');

    const newEst: Partial<Db.EntityEstimate> = {
        name: original.name,
        address: original.address,
        constructionType: original.constructionType,
        buildingType: original.buildingType,
        constructionSurface: original.constructionSurface,
        builtUpArea: original.builtUpArea,
        createdByUserId: session.mongoUserId,
        accountId: session.mongoAccountId,
        createdAt: new Date(),
        estimateNumber: await Db.generateNewEstimateId(),
        isOriginal: true,
        totalCost: original.totalCost,
        totalCostWithOtherExpenses: original.totalCostWithOtherExpenses,
        laborTotalCost: original.laborTotalCost,
        materialTotalCost: original.materialTotalCost,
        laborItemCount: original.laborItemCount,
        materialItemCount: original.materialItemCount,
        otherExpenses: original.otherExpenses ? [...original.otherExpenses] : [{ typeOfCost: 0 }],
        isLocalCopy: true,
    };

    const newEstResult = await estimatesCol.insertOne(newEst);
    const newEstimateId = newEstResult.insertedId;

    // Track old labor item ID → new labor item ID (for remapping actualData)
    const oldToNewLaborId = new Map<string, ObjectId>();

    const sections = await sectionsCol.find({ estimateId }).toArray();
    for (const section of sections) {
        const newSection: Partial<Db.EntityEstimateSection> = {
            estimateId: newEstimateId,
            name: section.name,
            displayIndex: section.displayIndex,
            totalCost: section.totalCost,
        };
        const newSectionResult = await sectionsCol.insertOne(newSection);
        const newSectionId = newSectionResult.insertedId;

        const subsections = await subsectionsCol.find({ estimateSectionId: section._id }).toArray();
        for (const subsection of subsections) {
            const newSub: Partial<Db.EntityEstimateSubsection> = {
                estimateSectionId: newSectionId,
                estimateId: newEstimateId,
                name: subsection.name,
                displayIndex: subsection.displayIndex,
                totalCost: subsection.totalCost,
            };
            const newSubResult = await subsectionsCol.insertOne(newSub);
            const newSubId = newSubResult.insertedId;

            const laborItems = await laborItemsCol.find({ estimateSubsectionId: subsection._id }).toArray();

            // Pass 1: non-child rows
            const nonChildItems = laborItems.filter(li => !li.parentGroupRowId);
            for (const li of nonChildItems) {
                const newLi: Partial<Db.EntityEstimateLaborItem> = {
                    estimateSubsectionId: newSubId,
                    estimateId: newEstimateId,
                    laborItemId: li.laborItemId,
                    laborOfferId: li.laborOfferId,
                    measurementUnitMongoId: li.measurementUnitMongoId,
                    quantity: li.quantity,
                    averagePrice: li.averagePrice,
                    changableAveragePrice: li.changableAveragePrice,
                    laborOfferItemName: li.laborOfferItemName,
                    laborHours: li.laborHours,
                    isHidden: li.isHidden,
                    displayIndex: li.displayIndex,
                    priceSource: li.priceSource,
                    isGroupRow: li.isGroupRow,
                };
                const newLiResult = await laborItemsCol.insertOne(newLi);
                const newLiId = newLiResult.insertedId;
                oldToNewLaborId.set(li._id.toString(), newLiId);

                const materials = await materialItemsCol.find({ estimatedLaborId: li._id }).toArray();
                for (const mat of materials) {
                    await materialItemsCol.insertOne({
                        estimateSubsectionId: newSubId,
                        estimateId: newEstimateId,
                        estimatedLaborId: newLiId,
                        materialItemId: mat.materialItemId,
                        materialOfferId: mat.materialOfferId,
                        measurementUnitMongoId: mat.measurementUnitMongoId,
                        quantity: mat.quantity,
                        averagePrice: mat.averagePrice,
                        changableAveragePrice: mat.changableAveragePrice,
                        materialOfferItemName: mat.materialOfferItemName,
                        materialConsumptionNorm: mat.materialConsumptionNorm,
                    } as Partial<Db.EntityEstimateMaterialItems> as any);
                }
            }

            // Pass 2: child rows with remapped parentGroupRowId
            const childItems = laborItems.filter(li => !!li.parentGroupRowId);
            for (const li of childItems) {
                const newParentId = oldToNewLaborId.get(li.parentGroupRowId!.toString());
                if (!newParentId) continue;
                const newLi: Partial<Db.EntityEstimateLaborItem> = {
                    estimateSubsectionId: newSubId,
                    estimateId: newEstimateId,
                    laborItemId: li.laborItemId,
                    laborOfferId: li.laborOfferId,
                    measurementUnitMongoId: li.measurementUnitMongoId,
                    quantity: li.quantity,
                    averagePrice: li.averagePrice,
                    changableAveragePrice: li.changableAveragePrice,
                    laborOfferItemName: li.laborOfferItemName,
                    laborHours: li.laborHours,
                    isHidden: li.isHidden,
                    displayIndex: li.displayIndex,
                    priceSource: li.priceSource,
                    parentGroupRowId: newParentId,
                };
                const newLiResult = await laborItemsCol.insertOne(newLi);
                const newLiId = newLiResult.insertedId;
                oldToNewLaborId.set(li._id.toString(), newLiId);

                const materials = await materialItemsCol.find({ estimatedLaborId: li._id }).toArray();
                for (const mat of materials) {
                    await materialItemsCol.insertOne({
                        estimateSubsectionId: newSubId,
                        estimateId: newEstimateId,
                        estimatedLaborId: newLiId,
                        materialItemId: mat.materialItemId,
                        materialOfferId: mat.materialOfferId,
                        measurementUnitMongoId: mat.measurementUnitMongoId,
                        quantity: mat.quantity,
                        averagePrice: mat.averagePrice,
                        changableAveragePrice: mat.changableAveragePrice,
                        materialOfferItemName: mat.materialOfferItemName,
                        materialConsumptionNorm: mat.materialConsumptionNorm,
                    } as Partial<Db.EntityEstimateMaterialItems> as any);
                }
            }
        }
    }

    // Remap actualData keys
    const oldActualData = costing.actualData ?? {};
    const newActualData: Record<string, { quantity: string; unitPrice: string }> = {};
    for (const [oldId, value] of Object.entries(oldActualData)) {
        const newId = oldToNewLaborId.get(oldId);
        if (newId) newActualData[newId.toString()] = value as { quantity: string; unitPrice: string };
    }

    // Remap costHistory laborItemId references
    const oldCostHistory: any[] = costing.costHistory ?? [];
    const newCostHistory = oldCostHistory.map((e: any) => {
        if (e.laborItemId) {
            const newId = oldToNewLaborId.get(e.laborItemId.toString());
            if (newId) return { ...e, laborItemId: newId.toString() };
        }
        return e;
    });

    // Remap pahestEntries estimatedLaborId references
    const oldPahestEntries: any[] = costing.pahestEntries ?? [];
    const newPahestEntries = oldPahestEntries.map((e: any) => {
        if (e.estimatedLaborId) {
            const newId = oldToNewLaborId.get(e.estimatedLaborId.toString());
            if (newId) return { ...e, estimatedLaborId: newId.toString() };
        }
        return e;
    });

    // Build new snapshot from forked estimate
    const newSnapshot = await buildEstimateSnapshot(newEstimateId.toString());

    // Persist to costing
    await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { localEstimateId: newEstimateId.toString(), estimateSnapshot: newSnapshot, actualData: newActualData, costHistory: newCostHistory, pahestEntries: newPahestEntries, updatedAt: new Date() } }
    );

    respondJsonData(res, { localEstimateId: newEstimateId.toString(), snapshot: newSnapshot, actualData: newActualData, costHistory: newCostHistory, pahestEntries: newPahestEntries });
});
