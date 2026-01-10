export class ApiLaborOffer {

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

    // itemName!: string;
    // itemFullCode!: string;
    measurementUnitData?: any;

    isArchived!: boolean;

    accountMadeOfferData?: any;

};


export class ApiMaterialOffer {

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

    // itemName!: string;
    // itemFullCode!: string;

    measurementUnitData?: any;

    isArchived!: boolean;

    accountMadeOfferData?: any;

};
