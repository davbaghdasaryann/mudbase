import { Collection, ObjectId } from 'mongodb';

interface OtherExpense {
    [expenseName: string]: number;
}

export interface EntityEstimate {
    _id?: ObjectId;
    createdByUserId?: ObjectId;
    originalEstimateId?: ObjectId;
    accountId?: ObjectId;

    estimateNumber?: string;
    name?: string;

    address?: string;
    constructionType?: string;
    buildingType?: string;
    constructionSurface?: string;
    createdAt?: Date;


    // Sharing information
    sharedWithAccountId?: ObjectId,
    isOriginal?: boolean,

    
    sharedByUserId?: ObjectId,
    sharedByAccountId?: ObjectId,

    totalCost?: number;
    totalCostWithOtherExpenses?: number;

    otherExpenses?: OtherExpense[];


    deleted?: boolean;
    deletedAt?: Date;
}

export function getEstimatesCollection(): Collection<EntityEstimate>{
    return mongoDb_.collection('estimates');
}

// export function estimatesToApi(estimate: any) {
//     let api = { ...estimate } as EntityEstimate;
//     // api._id = undefined;
//     return api;
// }