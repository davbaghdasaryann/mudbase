import * as EstimateSectionsApi from '@/api/estimate'
import { ApiAccount, ApiLaborItems, ApiMaterialItems } from '../api';
import { roundNumber, roundToThree } from '../tslib/parse';

export class EstimateSectionsDisplayData {
    _id!: string;
    estimateId!: string;
    name!: string;
    displayIndex?: number;
    totalCost?: number;

    constructor(estimateSection?: EstimateSectionsApi.ApiEstimateSecttion) {
        if (!estimateSection)
            return;

        this._id = estimateSection._id
        this.displayIndex = estimateSection.displayIndex
        this.estimateId = estimateSection.estimateId
        this.name = estimateSection.name
        this.totalCost =  roundNumber(estimateSection.totalCost ?? 0);
    }
}
