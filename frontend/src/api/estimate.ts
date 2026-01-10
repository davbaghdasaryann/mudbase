interface EstimateOtherExpense {
    [expenseName: string]: number;
}

export interface ApiEstimate {
    _id: string;
    createdByUserId?: string;
    accountId?: string; //TODO: this will be select form in front end. For what company is he doing this for?
    name: string;
    address: string;
    constructionType: string;
    buildingType: string;
    constructionSurface: string;
    createdAt: Date;
    estimateNumber: string;

    totalCost: number;
    totalCostWithOtherExpenses: number;

    otherExpenses: EstimateOtherExpense[];


    sharedByAccountData?: any;
    multiSharedAccountData?: any;

    deleted?: boolean;
    deletedAt?: Date;
}

export interface ApiEstimateSecttion{
    _id: string;
    estimateId: string;
    name: string;
    displayIndex: number;
    
    totalCost: number;
}

export interface ApiEstimateSubsection{
    _id: string;
    estimateSectionId: string;
    name: string;
    displayIndex: number;
    
    totalCost: number;
}
