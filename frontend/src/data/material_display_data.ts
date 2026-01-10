import * as MaterialsApi from 'api/material'
import { ApiMeasurementUnit } from '../api';
import { roundToThree } from '../tslib/parse';

export class MaterialCategoryDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    childrenQuantity?: number;

    constructor(materialCat?: MaterialsApi.ApiMaterialCategory) {
        if (!materialCat)
            return;

        this._id = materialCat._id
        this.code = materialCat.code
        this.name = materialCat.name

        this.childrenQuantity = materialCat.childrenQuantity

    }
}

export class MaterialSubcategoryDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    categoryCode!: string;
    categoryId!: string;
    categoryFullCode!: string;
    childrenQuantity?: number;

    constructor(materialCat?: MaterialsApi.ApiMaterialSubcategory) {
        if (!materialCat)
            return;

        this._id = materialCat._id
        this.code = materialCat.code
        this.name = materialCat.name
        this.categoryCode = materialCat.categoryCode
        this.categoryId = materialCat.categoryId
        this.categoryFullCode = materialCat.categoryFullCode

        this.childrenQuantity = materialCat.childrenQuantity

    }
}


export class MaterialItemDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    subcategoryId!: string;
    fullCode!: string;

    averagePrice?: number;
    measurementUnitName?: string;
    measurementUnitMongoId?: string;
    measurementUnitRepresentationSymbol?: string;

    childrenQuantity?: number;


    constructor(materialCat?: MaterialsApi.ApiMaterialItems) {
        if (!materialCat)
            return;

        this._id = materialCat._id
        this.code = materialCat.code
        this.name = materialCat.name
        this.subcategoryId = materialCat.subcategoryId
        this.fullCode = materialCat.fullCode

        
        this.childrenQuantity = materialCat.childrenQuantity


        if (materialCat.averagePrice)
            this.averagePrice =  roundToThree(materialCat.averagePrice)

        if (materialCat.measurementUnitData) {
            if (materialCat.measurementUnitData.length > 0) {
                let measurementUnitDetails = materialCat.measurementUnitData[0] as ApiMeasurementUnit;
                this.measurementUnitName = measurementUnitDetails.name;
                this.measurementUnitMongoId = measurementUnitDetails._id;
                this.measurementUnitRepresentationSymbol = measurementUnitDetails.representationSymbol;
            }
        }


    }
}