import { Collection, ObjectId } from 'mongodb';

export interface EntityEstimateMaterialItems {
    _id: ObjectId;
    estimateSubsectionId: ObjectId | string; //maybe there is only section and items that time we use ''
    estimateId: ObjectId;
    materialItemId: ObjectId;
    materialOfferId: ObjectId;
    estimatedLaborId: ObjectId;
    measurementUnitMongoId: ObjectId;
    quantity: number; // this equals labor quantity * materialConsumptionNorm

    averagePrice: number;   // this is current time average price user this can't change
    changableAveragePrice: number; // but this is changable for estimation

    materialOfferItemName: string;

    materialConsumptionNorm: number; //🔴 TODO: this will need us in version 2 🔴

}

export function getEstimateMaterialItemsCollection(): Collection<EntityEstimateMaterialItems> {
    return mongoDb_.collection('estimate_material_items');
}

export function estimateMaterialItemToApi(estimateMaterialItem: any) {
    let api = { ...estimateMaterialItem } as EntityEstimateMaterialItems;
    // api._id = undefined;
    return api;
}