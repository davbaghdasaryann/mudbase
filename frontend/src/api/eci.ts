export interface ApiEciCategory {
    _id: string;
    code: string;
    name: string;
    childrenQuantity?: number;
}

export interface ApiEciSubcategory {
    _id: string;
    code: string;
    name: string;
    categoryCode: string;
    categoryId: string;
    categoryFullCode: string;
    childrenQuantity?: number;
}

export interface ApiEciEstimate {
    _id: string;
    code: string;
    name: string;
    subcategoryId: string;
    fullCode: string;

    averagePrice?: number;
    measurementUnitData?: any;

    estimateId?: string;
    constructionArea?: number;

    childrenQuantity?: number;
}
