import { ObjectId } from 'mongodb';
import * as Db from '@/db';

export async function buildEstimateSnapshot(estimateIdStr: string): Promise<Db.EstimateSnapshot> {
    const estimateId = new ObjectId(estimateIdStr);

    const rawSections = await Db.getEstimateSectionsCollection()
        .find({ estimateId })
        .sort({ displayIndex: 1 })
        .toArray();

    if (rawSections.length === 0) return { laborRows: [], sections: [], subsections: [] };

    const sectionIds = rawSections.map(s => s._id);
    const sectionMap = new Map(rawSections.map(s => [s._id.toString(), s.name as string]));

    const rawSubsections = await Db.getEstimateSubsectionsCollection()
        .find({ estimateSectionId: { $in: sectionIds } })
        .sort({ displayIndex: 1 })
        .toArray();

    const subsectionMap = new Map(rawSubsections.map(s => [
        s._id.toString(),
        { name: s.name as string, sectionName: sectionMap.get(s.estimateSectionId.toString()) ?? '' },
    ]));

    const laborItems = await Db.getEstimateLaborItemsCollection()
        .aggregate([
            { $match: { estimateSubsectionId: { $in: rawSubsections.map(s => s._id) }, isHidden: { $ne: true } } },
            {
                $lookup: {
                    from: 'labor_items',
                    let: { itemIdVar: '$laborItemId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$itemIdVar'] } } },
                        {
                            $lookup: {
                                from: 'measurement_unit',
                                localField: 'measurementUnitMongoId',
                                foreignField: '_id',
                                as: 'measurementUnitData',
                            },
                        },
                        { $unwind: { path: '$measurementUnitData', preserveNullAndEmptyArrays: true } },
                        { $project: { name: 1, _id: 0, unitSymbol: '$measurementUnitData.representationSymbol' } },
                    ],
                    as: 'catalogItem',
                },
            },
            { $unwind: { path: '$catalogItem', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'measurement_unit',
                    localField: 'measurementUnitMongoId',
                    foreignField: '_id',
                    as: 'directUnit',
                },
            },
            { $unwind: { path: '$directUnit', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    estimateSubsectionId: 1,
                    quantity: 1,
                    changableAveragePrice: 1,
                    catalogName: '$catalogItem.name',
                    laborOfferItemName: 1,
                    unitSymbol: { $ifNull: ['$catalogItem.unitSymbol', '$directUnit.representationSymbol'] },
                    displayIndex: 1,
                    isGroupRow: 1,
                    parentGroupRowId: 1,
                },
            },
            { $sort: { displayIndex: 1, _id: 1 } },
        ])
        .toArray();

    // Fetch all materials using string comparison to catch both ObjectId and string-typed estimatedLaborId
    const subsectionIds = rawSubsections.map(s => s._id);
    const materials = await Db.getEstimateMaterialItemsCollection()
        .find({ estimateSubsectionId: { $in: subsectionIds } })
        .project({ estimatedLaborId: 1, quantity: 1, changableAveragePrice: 1 })
        .toArray();

    const matCostByLaborId = new Map<string, number>();
    for (const mat of materials) {
        const laborIdStr = mat.estimatedLaborId?.toString() ?? '';
        if (!laborIdStr) continue;
        matCostByLaborId.set(laborIdStr, (matCostByLaborId.get(laborIdStr) ?? 0) + (mat.quantity ?? 0) * (mat.changableAveragePrice ?? 0));
    }

    // Compute total cost (labor + materials) for each child row, then aggregate by parentGroupRowId
    const groupCostMap = new Map<string, number>(); // groupRowId -> sum of children labor+material costs
    for (const item of laborItems as any[]) {
        const parentId = item.parentGroupRowId ? item.parentGroupRowId.toString() : null;
        if (!parentId) continue;
        const laborCost = (item.quantity ?? 0) * (item.changableAveragePrice ?? 0);
        const matCost = matCostByLaborId.get(item._id.toString()) ?? 0;
        groupCostMap.set(parentId, (groupCostMap.get(parentId) ?? 0) + laborCost + matCost);
    }

    const laborRows: Db.SnapshotLaborRow[] = laborItems
        .filter((item: any) => !item.parentGroupRowId) // exclude child rows; they're aggregated into group rows
        .map((item: any) => {
            const isGroup = item.isGroupRow === true;
            const groupCost = isGroup ? (groupCostMap.get(item._id.toString()) ?? 0) : 0;
            const qty = item.quantity ?? 0;
            const laborCost = isGroup ? groupCost : Math.round(qty * (item.changableAveragePrice ?? 0));
            const matCost = isGroup ? 0 : (matCostByLaborId.get(item._id.toString()) ?? 0);
            const totalCost = laborCost + matCost;
            const unitPrice = isGroup ? (qty > 0 ? Math.round(groupCost / qty) : 0) : (item.changableAveragePrice ?? 0);
            return {
                _id: item._id.toString(),
                catalogName: item.catalogName ?? '',
                laborOfferItemName: item.laborOfferItemName ?? item.catalogName ?? '',
                unitSymbol: item.unitSymbol ?? '',
                quantity: qty,
                changableAveragePrice: unitPrice,
                cost: totalCost,
                materialTotalCost: matCost,
                subsectionName: subsectionMap.get(item.estimateSubsectionId?.toString())?.name ?? '',
                sectionName: subsectionMap.get(item.estimateSubsectionId?.toString())?.sectionName ?? '',
                isGroupRow: isGroup ? true : undefined,
                parentGroupRowId: undefined,
            };
        });

    const sections: Db.SnapshotSection[] = rawSections.map(s => ({
        _id: s._id.toString(),
        name: s.name as string,
        displayIndex: s.displayIndex as number ?? 0,
    }));

    const subsections: Db.SnapshotSubsection[] = rawSubsections.map(s => ({
        _id: s._id.toString(),
        estimateSectionId: s.estimateSectionId.toString(),
        name: s.name as string,
        displayIndex: s.displayIndex as number ?? 0,
    }));

    return { laborRows, sections, subsections };
}
