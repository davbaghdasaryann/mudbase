import { ObjectId } from 'mongodb';

export interface EntityEciEstimates {
    _id: ObjectId;
    code: string;
    name: string;
    subcategoryId: ObjectId;
    subcategoryCode: string;
    fullCode: string;

    measurementUnitMongoId: ObjectId;

    // Reference to the actual estimate in the estimates collection
    estimateId?: ObjectId;

    // Construction area for cost calculation
    constructionArea?: number;
}

export function getEciEstimatesCollection() {
    return mongoDb_.collection('eci_estimates');
}

export function eciEstimateToApi(eciEstimate: any) {
    let api = { ...eciEstimate } as EntityEciEstimates;
    return api;
}
