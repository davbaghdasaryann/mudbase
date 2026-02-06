import * as EciApi from 'api/eci';
import { ApiMeasurementUnit } from '../api';
import { roundToThree } from '../tslib/parse';

export class EciCategoryDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    childrenQuantity?: number;

    constructor(cat?: EciApi.ApiEciCategory) {
        if (!cat) return;

        this._id = cat._id;
        this.code = cat.code;
        this.name = cat.name;
        this.childrenQuantity = cat.childrenQuantity;
    }
}

export class EciSubcategoryDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    categoryCode!: string;
    categoryId!: string;
    categoryFullCode!: string;
    childrenQuantity?: number;

    constructor(subcat?: EciApi.ApiEciSubcategory) {
        if (!subcat) return;

        this._id = subcat._id;
        this.code = subcat.code;
        this.name = subcat.name;
        this.categoryCode = subcat.categoryCode;
        this.categoryId = subcat.categoryId;
        this.categoryFullCode = subcat.categoryFullCode;
        this.childrenQuantity = subcat.childrenQuantity;
    }
}

export class EciEstimateDisplayData {
    _id!: string;
    code!: string;
    name!: string;
    subcategoryId!: string;
    fullCode!: string;

    averagePrice?: number;

    measurementUnitName?: string;
    measurementUnitMongoId?: string;
    measurementUnitRepresentationSymbol?: string;

    estimateId?: string;
    constructionArea?: number;

    childrenQuantity?: number;

    constructor(est?: EciApi.ApiEciEstimate) {
        if (!est) return;

        this._id = est._id;
        this.code = est.code;
        this.name = est.name;
        this.subcategoryId = est.subcategoryId;
        this.fullCode = est.fullCode;

        this.estimateId = est.estimateId;
        this.constructionArea = est.constructionArea;

        this.childrenQuantity = est.childrenQuantity;

        if (est.averagePrice)
            this.averagePrice = roundToThree(est.averagePrice);

        if (est.measurementUnitData) {
            if (est.measurementUnitData.length > 0) {
                let measurementUnitDetails = est.measurementUnitData[0] as ApiMeasurementUnit;
                this.measurementUnitName = measurementUnitDetails.name;
                this.measurementUnitMongoId = measurementUnitDetails._id;
                this.measurementUnitRepresentationSymbol = measurementUnitDetails.representationSymbol;
            }
        }
    }
}
