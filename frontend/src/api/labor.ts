export class ApiLabor {

    laborKey!: string;
    laborName!: string;

};

export interface ApiLaborCategory{
    _id: string;
    code: string;
    name: string;
    childrenQuantity?: number;

}

export interface ApiLaborSubcategory{
    _id: string;
    code: string;
    name: string;
    categoryCode: string;
    categoryId: string;
    categoryFullCode: string;
    childrenQuantity?: number;

}

export interface ApiLaborItems{
    _id: string;
    code: string;
    name: string;
    subcategoryId: string;
    fullCode: string;

    averagePrice?: number; //this for estimation table
    laborHours?: number; //this for estimation table //🔴 TODO: this will need us in version 2 🔴
    measurementUnitData?: any;

    childrenQuantity?: number;

}
