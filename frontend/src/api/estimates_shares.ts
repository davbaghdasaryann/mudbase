export interface ApiEstimatesShares{
    _id: string;
    sharedByUserId: string;
    sharedWithAccountId: string;
    sharedEstimateId: string;
    sharedAt: Date
    
    isOnlyEstimateInfo: boolean;

    estimatesData?: any
    sharedByAccountData?: any
    sharedWithAccountData?: any

    estimates?: any

    theSameEstNumAveragePrice?: number;

    deleted?: boolean;
    deletedAt?: Date;
}

