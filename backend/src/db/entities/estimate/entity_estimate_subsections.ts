import {Collection, Int32, ObjectId} from 'mongodb';

export interface EntityEstimateSubsection {
    _id: ObjectId;
    estimateSectionId: ObjectId;
    estimateId: ObjectId;
    name: string;
    displayIndex: number;

    totalCost: number;

    // Temporary variables
    tempTotalCost: number;
}

export function getEstimateSubsectionsCollection(): Collection<EntityEstimateSubsection> {
    return mongoDb_.collection('estimate_subsections');
}

export function estimateSubsectionToApi(estimateSubsection: any) {
    let api = {...estimateSubsection} as EntityEstimateSubsection;
    // api._id = undefined;
    return api;
}