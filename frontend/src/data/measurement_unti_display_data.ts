import * as MeasurementUnitApi from 'api/measurement_unit'

export class MeasurementUnitDisplayData {
    _id!: string;
    name!: string;
    commonCode!: string;
    levelCat!: string;
    representationSymbol!: string;
    measurementUnitId!: string;

    constructor(measurementUnit?: MeasurementUnitApi.ApiMeasurementUnit) {
        if (!measurementUnit)
            return;

        this._id = measurementUnit._id
        this.name = measurementUnit.name
        this.commonCode = measurementUnit.commonCode
        this.levelCat = measurementUnit.levelCat
        this.representationSymbol = measurementUnit.representationSymbol
        this.measurementUnitId = measurementUnit.measurementUnitId
    }
}

export class MeasurementUnitSelectItem {
    id!: string;
    label!: string;

    constructor(measurementUnit?: MeasurementUnitApi.ApiMeasurementUnit) {
        if (!measurementUnit)
            return;
        
        this.id = measurementUnit._id
        this.label = measurementUnit.name
    }

}