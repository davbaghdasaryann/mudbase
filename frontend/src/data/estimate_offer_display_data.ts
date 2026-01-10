import * as OffersApi from 'api/estimateOffer'
import { ApiAccount,  ApiLaborItems, ApiMaterialItems, ApiMeasurementUnit } from '../api';
import { roundToThree } from '../tslib/parse';

export class EstimateLaborOfferDisplayData {
    _id!: string;
    userId!: string;
    accountId!: string;
    itemId!: string;
    createdAt!: Date;
    updatedAt!: Date;
    laborHours!: number; //🔴 TODO: this will need us in version 2 🔴
    measurementUnitMongoId!: string;
    price!: number;
    currency!: string;

    anonymous!: boolean;
    public!: boolean;
    isActive!: boolean;

    // itemData?: any;

    itemName!: string;
    itemFullCode!: string;
    accountName!: string;


    constructor(estimateLaborOffer?: OffersApi.ApiEstimateLaborOffer) {
        if (!estimateLaborOffer)
            return;

        this._id = estimateLaborOffer._id
        this.accountId = estimateLaborOffer.accountId
        this.anonymous = estimateLaborOffer.anonymous
        this.createdAt = estimateLaborOffer.createdAt
        this.isActive = estimateLaborOffer.isActive
        this.itemId = estimateLaborOffer.itemId
        this.price =  roundToThree(estimateLaborOffer.price)
        this.currency = estimateLaborOffer.currency
        this.public = estimateLaborOffer.public
        this.laborHours = estimateLaborOffer.laborHours //🔴 TODO: this will need us in version 2 🔴
        this.measurementUnitMongoId = estimateLaborOffer.measurementUnitMongoId
        this.updatedAt = estimateLaborOffer.updatedAt
        this.userId = estimateLaborOffer.userId

        // this.itemFullCode = estimateLaborOffer.itemFullCode;
        // this.itemName = estimateLaborOffer.itemName;
        // this.accountName = estimateLaborOffer.accountName;

        if (estimateLaborOffer.itemData) {
            let itemDetails = estimateLaborOffer.itemData as ApiLaborItems;
            this.itemName = itemDetails.name;
            this.itemFullCode = itemDetails.fullCode;

        }

        if (estimateLaborOffer.accountMadeOfferData) {
            let accountDetails = estimateLaborOffer.accountMadeOfferData as ApiAccount
            this.accountName = accountDetails.companyName;
        }


    }
}




export class EstimateMaterialOfferDisplayData {
    _id!: string;
    userId!: string;
    accountId!: string;
    itemId!: string;
    createdAt!: Date;
    updatedAt!: Date;
    price!: number;

    anonymous!: boolean;
    public!: boolean;
    isActive!: boolean;

    itemName!: string;
    itemFullCode!: string;
    accountName!: string;

    measurementUnitName?: string;
    measurementUnitMongoId?: string;
    measurementUnitRepresentationSymbol?: string;

    constructor(estimateMaterialOffer?: OffersApi.ApiEstimateMaterialOffer) {
        if (!estimateMaterialOffer)
            return;

        this._id = estimateMaterialOffer._id
        this.accountId = estimateMaterialOffer.accountId
        this.anonymous = estimateMaterialOffer.anonymous
        this.createdAt = estimateMaterialOffer.createdAt
        this.isActive = estimateMaterialOffer.isActive
        this.itemId = estimateMaterialOffer.itemId
        this.price =  roundToThree(estimateMaterialOffer.price)
        this.public = estimateMaterialOffer.public
        this.measurementUnitMongoId = estimateMaterialOffer.measurementUnitMongoId
        this.updatedAt = estimateMaterialOffer.updatedAt
        this.userId = estimateMaterialOffer.userId

        // this.itemFullCode = estimateMaterialOffer.itemFullCode;
        // this.itemName = estimateMaterialOffer.itemName;
        // this.accountName = estimateMaterialOffer.accountName;

        if (estimateMaterialOffer.itemData) {
            let itemDetails = estimateMaterialOffer.itemData as ApiMaterialItems;
            this.itemName = itemDetails.name;
            this.itemFullCode = itemDetails.fullCode;
        }

        if (estimateMaterialOffer.accountMadeOfferData) {
            let accountDetails = estimateMaterialOffer.accountMadeOfferData as ApiAccount
            this.accountName = accountDetails.companyName;
        }

        if (estimateMaterialOffer.measurementUnitData) {
            if (estimateMaterialOffer.measurementUnitData.length > 0) {
                let measurementUnitDetails = estimateMaterialOffer.measurementUnitData[0] as ApiMeasurementUnit;
                this.measurementUnitName = measurementUnitDetails.name;
                this.measurementUnitRepresentationSymbol = measurementUnitDetails.representationSymbol;
            }
        }
    }
}