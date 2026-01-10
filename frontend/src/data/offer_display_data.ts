import * as OffersApi from 'api/offer'
import { ApiLaborItems, ApiMaterialItems, ApiMeasurementUnit, ApiAccount } from '../api';
import { roundToThree } from '../tslib/parse';

export class LaborOfferDisplayData {
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
    itemName!: string;
    itemFullCode!: string;

    measurementUnitName?: string;
    measurementUnitRepresentationSymbol?: string;

    accountName?: string;

    isArchived!: boolean;



    constructor(laborOffer?: OffersApi.ApiLaborOffer) {
        if (!laborOffer)
            return;

        this._id = laborOffer._id
        this.accountId = laborOffer.accountId
        this.anonymous = laborOffer.anonymous
        this.createdAt = laborOffer.createdAt
        this.isActive = laborOffer.isActive
        this.itemId = laborOffer.itemId
        this.price = roundToThree(laborOffer.price)
        this.public = laborOffer.public
        this.laborHours = laborOffer.laborHours //🔴 TODO: this will need us in version 2 🔴
        this.currency = laborOffer.currency
        this.measurementUnitMongoId = laborOffer.measurementUnitMongoId
        this.updatedAt = laborOffer.updatedAt
        this.userId = laborOffer.userId


        this.isArchived = laborOffer.isArchived;

        // this.itemFullCode = laborOffer.itemFullCode;
        // this.itemName = laborOffer.itemName;

        if (laborOffer.itemData && laborOffer.itemData.length > 0) {
            let itemDetails = laborOffer.itemData as ApiLaborItems;
            this.itemName = itemDetails[0].name;
            this.itemFullCode = itemDetails[0].fullCode;
        }

        if (laborOffer.measurementUnitData) {
            if (laborOffer.measurementUnitData.length > 0) {
                let measurementUnitDetails = laborOffer.measurementUnitData[0] as ApiMeasurementUnit;
                this.measurementUnitName = measurementUnitDetails.name;
                this.measurementUnitRepresentationSymbol = measurementUnitDetails.representationSymbol;
            }
        }

        if (laborOffer.accountMadeOfferData && laborOffer.accountMadeOfferData.length > 0) {
            let accountDetails = laborOffer.accountMadeOfferData[0] as ApiAccount
            this.accountName = accountDetails.companyName;
        }

    }
}




export class MaterialOfferDisplayData {
    _id!: string;
    userId!: string;
    accountId!: string;
    itemId!: string;
    createdAt!: Date;
    updatedAt!: Date;
    price!: number;
    measurementUnitMongoId!: string;
    anonymous!: boolean;
    public!: boolean;
    isActive!: boolean;
    itemName!: string;
    itemFullCode!: string;

    measurementUnitName?: string;
    measurementUnitRepresentationSymbol?: string;

    accountName?: string;

    isArchived!: boolean;


    constructor(materialOffer?: OffersApi.ApiMaterialOffer) {
        if (!materialOffer)
            return;

        this._id = materialOffer._id
        this.accountId = materialOffer.accountId
        this.anonymous = materialOffer.anonymous
        this.createdAt = materialOffer.createdAt
        this.isActive = materialOffer.isActive
        this.itemId = materialOffer.itemId
        this.price = roundToThree(materialOffer.price)
        this.public = materialOffer.public
        this.measurementUnitMongoId = materialOffer.measurementUnitMongoId
        this.updatedAt = materialOffer.updatedAt
        this.userId = materialOffer.userId

        this.isArchived = materialOffer.isArchived;

        // this.itemFullCode = materialOffer.itemFullCode;
        // this.itemName = materialOffer.itemName;

        if (materialOffer.itemData) {
            let itemDetails = materialOffer.itemData! as ApiMaterialItems;
            this.itemName = itemDetails[0].name;
            this.itemFullCode = itemDetails[0].fullCode;
        }

        if (materialOffer.measurementUnitData) {
            if (materialOffer.measurementUnitData.length > 0) {
                let measurementUnitDetails = materialOffer.measurementUnitData[0] as ApiMeasurementUnit;
                this.measurementUnitName = measurementUnitDetails.name;
                this.measurementUnitRepresentationSymbol = measurementUnitDetails.representationSymbol;
            }
        }

        if (materialOffer.accountMadeOfferData) {
            if (materialOffer.accountMadeOfferData.length > 0) {
                let accountDetails = materialOffer.accountMadeOfferData[0] as ApiAccount
                this.accountName = accountDetails.companyName;
            }
        }
    }
}