import { Collection, ObjectId } from 'mongodb';

export type RentayinUnitCostSource = 'actual' | 'library' | 'manual';

export interface RentayinRow {
    laborItemId: string;
    /** Estimate labor item _id — used to map Labors-tab price overrides back to this row. */
    estimateRowId?: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    estimatedUnitCost: number;
    estimatedMaterialUnitCost: number;
    actualLaborUnitCost: number | null;
    actualMaterialUnitCost: number | null;
    actualUnitCost: number | null;
    actualLaborTotal: number | null;
    actualMaterialTotal: number | null;
    unitCostSource: RentayinUnitCostSource | null;
    laborUnitCostSource?: RentayinUnitCostSource | null;
    materialUnitCostSource?: RentayinUnitCostSource | null;
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
    // other cost percentages: key = cost type, value = percentage (0-100)
    otherCostPercentages?: Record<string, number>;
    deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export function getRentayinsCollection(): Collection<EntityRentayin> {
    return mongoDb_.collection('rentayins');
}
