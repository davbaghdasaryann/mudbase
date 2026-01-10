import * as EstimateSectionsApi from '@/api/estimate'
import { ApiAccount, ApiLaborItems, ApiMaterialItems } from '../api';
import { roundNumber, roundToThree } from '../tslib/parse';

export class EstimateSubsectionsDisplayData {
    _id!: string;
    estimateSectionId!: string;
    name!: string;
    displayIndex?: number;
    totalCost?: number;

    constructor(estimateSubsection?: EstimateSectionsApi.ApiEstimateSubsection) {
        if (!estimateSubsection)
            return;

        this._id = estimateSubsection._id
        this.displayIndex = estimateSubsection.displayIndex
        this.estimateSectionId = estimateSubsection.estimateSectionId
        this.name = estimateSubsection.name
        this.totalCost =  roundNumber(estimateSubsection.totalCost ?? 0);
    }
}
