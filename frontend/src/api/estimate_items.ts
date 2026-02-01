

export interface ApiEstimateLaborItem{
    _id: string;
    estimateSubsectionId: string;
    laborItemId: string;
    laborOfferId: string;
    // measurementUnit: string;
    quantity: number;

    averagePrice: number;   // this is current time average price user this can't change
    changableAveragePrice: number; // but this is changable for estimation
    laborHours: number; //🔴 TODO: this will need us in version 2 🔴
    laborOfferItemName: string;

    presentLaborOfferAveragePrice: number;

    priceSource?: 'market' | 'my_offer';

    /** When true, not counted in estimation; can be unhidden. */
    isHidden?: boolean;

    estimateLaborItemData?: any;
    estimateLaborOffersData?: any;
    estimateAccountMadeOfferData?: any;
    estimateMaterialItemData?: any;
    estimateMaterialOfferData?: any;
    estimateMeasurementUnitData?: any; 
}

export interface ApiEstimateMaterialItem{
    _id: string;
    estimateSubsectionId: string;
    materialItemId: string;
    materialOfferId: string;
    estimatedLaborId: string;
    // measurementUnit: string;
    quantity: number;

    averagePrice: number;   // this is current time average price user this can't change
    changableAveragePrice: number; // but this is changable for estimation
    materialOfferItemName: string;

    estimateMaterialItemData?: any;
    estimateMeasurementUnitData?: any; 
    
    materialConsumptionNorm?: number;

}

// export interface ApiEstimateMainTableRow{
//     laborData: ApiEstimateLaborItem[];
//     materialData: ApiEstimateLaborItem[];
// }

// export interface ApiEstimateSubsection{
//     _id: string;
//     estimateSectionId: string;
//     name: string;
//     displayIndex: number;
// }