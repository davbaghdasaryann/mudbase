import { Collection, ObjectId } from 'mongodb';

export type RentayinUnitCostSource = 'actual' | 'library' | 'manual';

export interface RentayinRow {
    laborItemId: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    estimatedUnitCost: number;
    actualUnitCost: number | null;
    unitCostSource: RentayinUnitCostSource | null;
    sectionName: string;
    subsectionName: string;
}

export interface EntityRentayin {
    _id?: ObjectId;
    accountId?: ObjectId;
    estimateId?: ObjectId;
    estimateName?: string;
    rows?: RentayinRow[];
    deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export function getRentayinsCollection(): Collection<EntityRentayin> {
    return mongoDb_.collection('rentayins');
}
