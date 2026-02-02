import {ObjectId} from 'mongodb';
import {registerApiSession} from '@/server/register';
import * as Db from '@/db';
import {respondJsonData} from '@/tsback/req/req_response';
import {requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {verify} from '@/tslib/verify';
import {assertObject} from '@/tslib/assert';
import {updateEstimateCostById} from '@/api/estimate/estimate/estimate_calc_prices';

registerApiSession('favorites/import_to_estimate', async (req, res, session) => {
    const favoriteLaborItemIds = req.body.favoriteLaborItemIds as string[];
    const estimateSubsectionIdReq = req.body.estimateSubsectionId as string | undefined;
    const estimateSectionIdReq = req.body.estimateSectionId as string | undefined;
    const estimateIdReq = req.body.estimateId as string | undefined;

    verify(favoriteLaborItemIds && favoriteLaborItemIds.length > 0, 'No favorite items selected');
    verify(
        estimateSubsectionIdReq || estimateSectionIdReq || estimateIdReq,
        'Either estimateSubsectionId, estimateSectionId, or estimateId is required'
    );

    let estimateSubsectionId: ObjectId | undefined;
    let estimateId: ObjectId;

    // Determine the subsection and estimate
    if (estimateSubsectionIdReq) {
        estimateSubsectionId = new ObjectId(estimateSubsectionIdReq);
        const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
        const subsection = await estimateSubsectionsColl.findOne({_id: estimateSubsectionId});
        assertObject(subsection, 'Subsection not found');
        estimateId = subsection.estimateId;
    } else if (estimateSectionIdReq) {
        // Create or find empty subsection under the section
        const estimateSectionId = new ObjectId(estimateSectionIdReq);
        const estimateSectionsColl = Db.getEstimateSectionsCollection();
        const section = await estimateSectionsColl.findOne({_id: estimateSectionId});
        assertObject(section, 'Section not found');
        estimateId = section.estimateId;

        // Find or create empty subsection
        const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
        let emptySubsection = await estimateSubsectionsColl.findOne({
            estimateSectionId: estimateSectionId,
            name: '',
        });

        if (!emptySubsection) {
            const newSubsection: Db.EntityEstimateSubsection = {
                _id: undefined as any,
                estimateSectionId: estimateSectionId,
                estimateId: estimateId,
                name: '',
            };
            const result = await estimateSubsectionsColl.insertOne(newSubsection);
            emptySubsection = await estimateSubsectionsColl.findOne({_id: result.insertedId});
        }

        assertObject(emptySubsection, 'Failed to create subsection');
        estimateSubsectionId = emptySubsection._id;
    } else {
        // Only estimateId provided - create a new section and subsection for imported items
        estimateId = new ObjectId(estimateIdReq!);

        // Create a new section for imported favorites
        const estimateSectionsColl = Db.getEstimateSectionsCollection();
        const newSection: Db.EntityEstimateSection = {
            _id: undefined as any,
            estimateId: estimateId,
            name: 'Imported from Favorites',
        };
        const sectionResult = await estimateSectionsColl.insertOne(newSection);
        const estimateSectionId = sectionResult.insertedId;

        // Create empty subsection
        const estimateSubsectionsColl = Db.getEstimateSubsectionsCollection();
        const newSubsection: Db.EntityEstimateSubsection = {
            _id: undefined as any,
            estimateSectionId: estimateSectionId,
            estimateId: estimateId,
            name: '',
        };
        const subsectionResult = await estimateSubsectionsColl.insertOne(newSubsection);
        estimateSubsectionId = subsectionResult.insertedId;
    }

    const favoriteLaborItemsColl = Db.getFavoriteLaborItemsCollection();
    const estimateLaborItemsColl = Db.getEstimateLaborItemsCollection();
    const estimateMaterialItemsColl = Db.getEstimateMaterialItemsCollection();

    const importedLaborIds = [];

    // Import each favorite labor item
    for (const favItemIdStr of favoriteLaborItemIds) {
        const favItemId = new ObjectId(favItemIdStr);

        // Fetch the favorite labor item
        const favItem = await favoriteLaborItemsColl.findOne({
            _id: favItemId,
            accountId: session.accountId,
        });

        if (!favItem) {
            continue; // Skip if not found or doesn't belong to user
        }

        // Create estimate labor item from favorite
        const newLaborItem: Db.EntityEstimateLaborItem = {
            _id: undefined as any,
            estimateSubsectionId: estimateSubsectionId!,
            estimateId: estimateId,
            laborItemId: favItem.laborItemId || new ObjectId('000000000000000000000000'),
            laborOfferId: favItem.laborOfferId || new ObjectId('000000000000000000000000'),
            measurementUnitMongoId: favItem.measurementUnitMongoId,
            quantity: favItem.quantity,
            laborHours: favItem.laborHours || 0,
            averagePrice: favItem.changableAveragePrice,
            changableAveragePrice: favItem.changableAveragePrice,
            laborOfferItemName: favItem.laborOfferItemName,
        };

        const laborResult = await estimateLaborItemsColl.insertOne(newLaborItem);
        const newLaborId = laborResult.insertedId;
        importedLaborIds.push(newLaborId);

        // Import all materials attached to this favorite labor item
        if (favItem.materials && favItem.materials.length > 0) {
            for (const favMaterial of favItem.materials) {
                const newMaterialItem: Db.EntityEstimateMaterialItem = {
                    _id: undefined as any,
                    estimateSubsectionId: estimateSubsectionId!,
                    estimatedLaborId: newLaborId,
                    materialItemId: favMaterial.materialItemId || new ObjectId('000000000000000000000000'),
                    materialOfferId: favMaterial.materialOfferId || new ObjectId('000000000000000000000000'),
                    measurementUnitMongoId: favMaterial.measurementUnitMongoId,
                    quantity: favMaterial.quantity,
                    materialConsumptionNorm: favMaterial.materialConsumptionNorm,
                    averagePrice: favMaterial.changableAveragePrice,
                    changableAveragePrice: favMaterial.changableAveragePrice,
                    materialOfferItemName: favMaterial.materialOfferItemName,
                };

                await estimateMaterialItemsColl.insertOne(newMaterialItem);
            }
        }
    }

    // Update estimate costs
    await updateEstimateCostById(estimateId);

    respondJsonData(res, {
        success: true,
        importedCount: importedLaborIds.length,
        importedIds: importedLaborIds,
    });
});
