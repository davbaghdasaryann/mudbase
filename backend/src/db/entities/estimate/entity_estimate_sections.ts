import {Collection,ObjectId} from 'mongodb';

export interface EntityEstimateSection {
    _id: ObjectId;
    estimateId: ObjectId;
    name: string;
    displayIndex: number;

    totalCost: number;


    // Temporary variables
    tempTotalCost: number;
}

export function getEstimateSectionsCollection(): Collection<EntityEstimateSection> {
    return mongoDb_.collection('estimate_sections');
}

// export function estimateSectionToApi(estimateSection: any) {
//     let api = {...estimateSection} as EntityEstimateSections;
//     // api._id = undefined;
//     return api;
// }