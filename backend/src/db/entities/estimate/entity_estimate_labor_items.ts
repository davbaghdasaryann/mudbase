import { Collection, ObjectId } from 'mongodb';

export interface EntityEstimateLaborItem {
    _id: ObjectId;
    estimateSubsectionId: ObjectId | string; //maybe there is only section and items that time we use ''
    estimateId: ObjectId;
    laborItemId: ObjectId;
    laborOfferId: ObjectId; //Now this is not used because user can't see companies that made offers
    measurementUnitMongoId: ObjectId;
    quantity: number;

    laborHours: number; //🔴 TODO: this will need us in version 2 🔴

    averagePrice: number;   // this is current time average price user this can't change
    changableAveragePrice: number; // but this is changable for estimation

    laborOfferItemName: string;

    /** Order within subsection (for drag reorder). */
    displayIndex?: number;

    /** When true, row is hidden from estimation (not counted in totals); can be unhidden. */
    isHidden?: boolean;

    /** 'market' = from catalog average (Update), 'my_offer' = from this account's offer (Import from Library), null = manual edit */
    priceSource?: 'market' | 'my_offer' | null;

    estimateLaborItemData?: any;
    estimateLaborOffersData?: any;
    estimateAccountMadeOfferData?: any;
    estimateMaterialItemData?: any;
}

export function getEstimateLaborItemsCollection(): Collection<EntityEstimateLaborItem> {
    return mongoDb_.collection('estimate_labor_items');
}

export function estimateLaborItemToApi(estimateLaborItem: any) {
    let api = { ...estimateLaborItem } as EntityEstimateLaborItem;
    // api._id = undefined;
    return api;
}