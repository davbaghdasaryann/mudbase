import * as EstimateItemsApi from 'api/estimate_items'
import { ApiAccount, ApiLaborItems, ApiLaborOffer, ApiMaterialItems, ApiMeasurementUnit } from '../api';
import { ApiEstimateMaterialOffer } from '../api/estimateOffer';
import { fixedToThree, roundNumber, roundToThree } from '../tslib/parse';

export class EstimateLaborItemDisplayData {
    _id!: string;
    estimateSubsectionId?: string;
    laborItemId!: string;
    laborOfferId!: string;
    quantity!: number;

    itemName!: string;
    itemChangableName?: string;
    itemFullCode!: string;
    itemMeasurementUnit!: string;
    accountName!: string;

    itemUnitPrice!: number;

    itemAveragePrice!: string; // this is no changable for estimation
    itemChangableAveragePrice!: number; // but this is changable for estimation
    presentItemOfferAveragePrice?: number;

    itemLaborHours?: number; //🔴 TODO: this will need us in version 2 🔴

    materialUnitPrice?: number;
    materialQuantity?: number;
    materialMeasurementUnit?: string;
    materialChangableAveragePrice?: number;
    materialTotalCost?: number;

    constructor(estimateLaborItem?: EstimateItemsApi.ApiEstimateLaborItem) {
        if (!estimateLaborItem)
            return;

        this._id = estimateLaborItem._id
        this.estimateSubsectionId = estimateLaborItem.estimateSubsectionId
        this.laborItemId = estimateLaborItem.laborItemId
        this.laborOfferId = estimateLaborItem.laborOfferId
        this.quantity = roundToThree(estimateLaborItem.quantity)
        this.itemChangableName = estimateLaborItem.laborOfferItemName
        // this.laborMeasurementUnit = estimateLaborItem.measurementUnit

        this.itemChangableAveragePrice = roundToThree(estimateLaborItem.changableAveragePrice);
        if (estimateLaborItem.averagePrice) {
            this.itemAveragePrice = fixedToThree(estimateLaborItem.averagePrice);
        }
        this.itemLaborHours = estimateLaborItem.laborHours; //🔴 TODO: this will need us in version 2 🔴
        this.presentItemOfferAveragePrice = roundToThree(estimateLaborItem.presentLaborOfferAveragePrice);

        if (estimateLaborItem.estimateLaborItemData) {
            if (estimateLaborItem.estimateLaborItemData.length > 0) {
                let itemDetails = estimateLaborItem.estimateLaborItemData[0] as ApiLaborItems;
                this.itemName = itemDetails.name;
                this.itemFullCode = itemDetails.fullCode;
            }
        }

        if (estimateLaborItem.estimateAccountMadeOfferData) {
            if (estimateLaborItem.estimateAccountMadeOfferData.length > 0) {
                let accountDetails = estimateLaborItem.estimateAccountMadeOfferData[0] as ApiAccount
                this.accountName = accountDetails.companyName;
            }
        }

        if (estimateLaborItem.estimateLaborOffersData) {
            if (estimateLaborItem.estimateLaborOffersData.length > 0) {
                let offerDetails = estimateLaborItem.estimateLaborOffersData[0] as ApiLaborOffer
                this.itemUnitPrice = roundToThree(offerDetails.price);
            }
        }

        // if (estimateLaborItem.estimateMaterialItemData) {

        //     if (estimateLaborItem.estimateMaterialItemData.length > 0) {
        //         let estimatedMaterialItemDetails = estimateLaborItem.estimateMaterialItemData[0] as EstimateItemsApi.ApiEstimateMaterialItem
        //         this.materialQuantity = estimatedMaterialItemDetails.quantity;
        //         this.materialChangableAveragePrice = estimatedMaterialItemDetails.changableAveragePrice
        //         // this.materialMeasurementUnit = estimatedMaterialItemDetails.measurementUnit;
        //     } else if (estimateLaborItem.estimateMaterialItemData.length > 1) {
        //         for (let estimatedMaterialItemDetails of estimateLaborItem.estimateMaterialItemData) {
        //             if (this.materialTotalCost === undefined) {
        //                 this.materialTotalCost = estimatedMaterialItemDetails.quantity * estimatedMaterialItemDetails.materialChangableAveragePrice;
        //             } else {
        //                 this.materialTotalCost = this.materialTotalCost + (estimatedMaterialItemDetails.quantity * estimatedMaterialItemDetails.materialChangableAveragePrice);
        //             }
        //         }

        //     }
        // }

        if (estimateLaborItem.estimateMaterialItemData?.length > 0) {
            let estimatedMaterialItemDetails = estimateLaborItem.estimateMaterialItemData[0] as EstimateItemsApi.ApiEstimateMaterialItem;
            this.materialQuantity = estimatedMaterialItemDetails.quantity;
            this.materialChangableAveragePrice = estimatedMaterialItemDetails.changableAveragePrice;
            this.materialTotalCost = estimatedMaterialItemDetails.quantity * estimatedMaterialItemDetails.changableAveragePrice;
            // this.materialMeasurementUnit = estimatedMaterialItemDetails.measurementUnit;
        }

        if (estimateLaborItem.estimateMaterialItemData?.length > 1) {
            this.materialTotalCost = 0;
            for (const item of estimateLaborItem.estimateMaterialItemData as EstimateItemsApi.ApiEstimateMaterialItem[]) {
                this.materialTotalCost += item.quantity * item.changableAveragePrice;
            }
        }



        if (estimateLaborItem.estimateMaterialOfferData) {
            if (estimateLaborItem.estimateMaterialOfferData.length > 0) {
                let estimatedMaterialOfferDetails = estimateLaborItem.estimateMaterialOfferData as ApiEstimateMaterialOffer
                this.materialUnitPrice = estimatedMaterialOfferDetails[0].price;
            }
        }

        if (estimateLaborItem.estimateMeasurementUnitData) {
            if (estimateLaborItem.estimateMeasurementUnitData.length > 0) {
                let estimatedLaborMeasurementUnit = estimateLaborItem.estimateMeasurementUnitData[0] as ApiMeasurementUnit
                this.itemMeasurementUnit = estimatedLaborMeasurementUnit.representationSymbol;
            }
        }

    }
}

















export class EstimateMaterialItemDisplayData {
    _id!: string;
    estimateSubsectionId!: string;
    materialItemId!: string;
    materialOfferId?: string;
    estimatedLaborId!: string;
    estimatedMaterialName!: string;
    estimatedMaterialFullCode!: string;
    estimatedMaterialMeasurementUnit!: string;

    quantity?: number;
    materialConsumptionNorm?: number;

    averagePrice?: number;   // this is current time average price user this can't change
    changableAveragePrice?: number; // but this is changable for estimation
    materialTotalCost?: number;

    materialOfferItemName?: string;

    constructor(estimateMaterialItem?: EstimateItemsApi.ApiEstimateMaterialItem) {
        if (!estimateMaterialItem)
            return;

        this._id = estimateMaterialItem._id
        this.quantity = roundToThree(estimateMaterialItem.quantity)
        this.changableAveragePrice = roundToThree(estimateMaterialItem.changableAveragePrice)
        this.materialOfferItemName = estimateMaterialItem.materialOfferItemName

        if (estimateMaterialItem.materialConsumptionNorm)
            this.materialConsumptionNorm = roundToThree(estimateMaterialItem.materialConsumptionNorm)

        this.materialTotalCost = roundNumber(estimateMaterialItem.quantity * estimateMaterialItem.changableAveragePrice);

        if (estimateMaterialItem.estimateMaterialItemData) {
            if (estimateMaterialItem.estimateMaterialItemData.length > 0) {
                let itemDetails = estimateMaterialItem.estimateMaterialItemData[0] as ApiMaterialItems;
                this.estimatedMaterialName = itemDetails.name;
                this.estimatedMaterialFullCode = itemDetails.fullCode;

            }
        }



        if (estimateMaterialItem.estimateMeasurementUnitData) {
            if (estimateMaterialItem.estimateMeasurementUnitData.length > 0) {
                let estimatedLaborMeasurementUnit = estimateMaterialItem.estimateMeasurementUnitData[0] as ApiMeasurementUnit
                this.estimatedMaterialMeasurementUnit = estimatedLaborMeasurementUnit.representationSymbol;
            }
        }

    }
}