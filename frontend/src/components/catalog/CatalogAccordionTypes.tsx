
export interface AccordionItem {
    _id: string;

    
    label: string;  // used in frontend
    name: string;  // from database

    isLoading?: boolean;
    children?: AccordionItem[]; 
    fullCode?: string;
    code: string;
    categoryFullCode?: string;

    measurementUnitRepresentationSymbol?: string;
    averagePrice?: string;
    laborHours?: number; //🔴 TODO this will need us in version 2 🔴

    itemFullCode?: string;
    accountName?: string;
    accountId?: string;
    price?: string;
    createdAt?: Date;
    updatedAt?: Date;

    childrenQuantity?: number;
}

export interface CatalogSelectedFiltersDataProps {
    categoryId: string | null;
    subcategoryId: string | null;
    accountId: string | null;
    timePeriod: '6months' | '1year' | '3years';
}

export type CatalogType = 'labor' | 'material';