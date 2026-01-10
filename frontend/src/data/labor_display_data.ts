import * as LaborsApi from 'api/labor'
import { ApiMeasurementUnit } from '../api';
import { roundToThree } from '../tslib/parse';

export class LaborCategoryDisplayData {
    _id!: string;
    code!: string;
    name!: string;

    childrenQuantity?: number;

    constructor(laborCat?: LaborsApi.ApiLaborCategory) {
        if (!laborCat)
            return;

        this._id = laborCat._id
        this.code = laborCat.code
        this.name = laborCat.name

        this.childrenQuantity = laborCat.childrenQuantity
    }
}

export class LaborSubcategoryDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    categoryCode!: string;
    categoryId!: string;
    categoryFullCode!: string;
    childrenQuantity?: number;

    constructor(laborCat?: LaborsApi.ApiLaborSubcategory) {
        if (!laborCat)
            return;

        this._id = laborCat._id
        this.code = laborCat.code
        this.name = laborCat.name
        this.categoryCode = laborCat.categoryCode
        this.categoryId = laborCat.categoryId
        this.categoryFullCode = laborCat.categoryFullCode
        
        this.childrenQuantity = laborCat.childrenQuantity
    }
}


export class LaborItemDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    subcategoryId!: string;
    fullCode!: string;

    averagePrice?: number; //this for estimation table
    laborHours?: number; //this for estimation table //🔴 TODO: this will need us in version 2 🔴
    
    measurementUnitName?: string;
    measurementUnitMongoId?: string;
    measurementUnitRepresentationSymbol?: string;
    childrenQuantity?: number;


    constructor(laborCat?: LaborsApi.ApiLaborItems) {
        if (!laborCat)
            return;

        this._id = laborCat._id
        this.code = laborCat.code
        this.name = laborCat.name
        this.subcategoryId = laborCat.subcategoryId
        this.fullCode = laborCat.fullCode


        this.childrenQuantity = laborCat.childrenQuantity



        if (laborCat.averagePrice)
            this.averagePrice =  roundToThree(laborCat.averagePrice)

        //🔴 TODO: this will need us in version 2 🔴
        if(laborCat.laborHours)
            this.laborHours = laborCat.laborHours

        if (laborCat.measurementUnitData) {
            if (laborCat.measurementUnitData.length > 0) {
                let measurementUnitDetails = laborCat.measurementUnitData[0] as ApiMeasurementUnit;
                this.measurementUnitName = measurementUnitDetails.name;
                this.measurementUnitMongoId = measurementUnitDetails._id;
                this.measurementUnitRepresentationSymbol = measurementUnitDetails.representationSymbol;
            }
        }

    }
}