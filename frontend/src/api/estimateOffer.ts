export class ApiEstimateLaborOffer {

    _id!: string;
    userId!: string;
    accountId!: string;
    itemId!: string;
    createdAt!: Date;
    updatedAt!: Date;
    laborHours!: number; //🔴 TODO: this will need us in version 2 🔴
    measurementUnitMongoId!: string;
    price!: number;
    currency!: string;
    anonymous!: boolean;
    public!: boolean;
    isActive!: boolean;


    itemData?: any;
    accountMadeOfferData?: any;

    // itemName!: string;
    // itemFullCode!: string;
    // accountName!: string;

};

export class ApiMainEstimateLaborOffer {
    averagePrice?: number;
    offers!: ApiEstimateLaborOffer[];
}


export class ApiEstimateMaterialOffer {

    _id!: string;
    userId!: string;
    accountId!: string;
    itemId!: string;
    createdAt!: Date;
    updatedAt!: Date;
    price!: number;
    measurementUnitMongoId!: string;
    anonymous!: boolean;
    public!: boolean;
    isActive!: boolean;

    itemData?: any;
    accountMadeOfferData?: any;

    // itemName!: string;
    // itemFullCode!: string;
    // accountName!: string;
    
    measurementUnitData?: any;

};

export class ApiMainEstimateMaterialOffer {
    averagePrice?: number;
    offers!: ApiEstimateMaterialOffer[];
}