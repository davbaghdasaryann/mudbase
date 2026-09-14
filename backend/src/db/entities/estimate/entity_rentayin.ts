import { Collection, ObjectId } from 'mongodb';

export type RentayinUnitCostSource = 'actual' | 'library' | 'manual';

export interface RentayinRow {
    laborItemId: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    estimatedUnitCost: number;
    estimatedMaterialUnitCost: number;
    actualLaborUnitCost: number | null;
    actualMaterialUnitCost: number | null;
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
    // price overrides for Labor/Materials tabs: key = laborItemId (group) or estimateRowId (item)
    laborPriceOverrides?: Record<string, number>;
    materialPriceOverrides?: Record<string, number>;
    deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export function getRentayinsCollection(): Collection<EntityRentayin> {
    return mongoDb_.collection('rentayins');
}
