export class ApiMaterial {

    materialKey!: string;
    materialName!: string;

};

export interface ApiMaterialCategory{
    _id: string;
    code: string;
    name: string;
    fullCode: string;

    childrenQuantity?: number;

}

export interface ApiMaterialSubcategory{
    _id: string;
    code: string;
    name: string;
    categoryCode: string;
    categoryId: string;
    fullCode: string;
    categoryFullCode: string;

    childrenQuantity?: number;

}

export interface ApiMaterialItems{
    _id: string;
    code: string;
    name: string;
    subcategoryId: string;
    fullCode: string;

    averagePrice?: number; //this for estimation table
    measurementUnitData?: any;

    childrenQuantity?: number;

}

