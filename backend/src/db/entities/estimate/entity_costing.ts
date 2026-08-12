import { Collection, ObjectId } from 'mongodb';

export interface CostingHistoryRecord {
    id: string;
    workName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    addedAt: Date;
    contractor?: string;
    isSubcontractor?: boolean;
    note?: string;
    paymentMethod?: string;
    paymentValue?: string;
    laborRows?: { id: string; description: string; quantity: string; unitPrice: string }[];
    mechanismRows?: { id: string; description: string; quantity: string; unitPrice: string }[];
    materialRows?: { id: string; description: string; quantity: string; unitPrice: string }[];
}

export interface CostingPahestHistoryRecord {
    quantity: number;
    costPerUnit: number;
    addedAt: Date;
}

export interface CostingPahestEntry {
    materialItemId: string;
    name: string;
    unit: string;
    quantity: number;
    costPerUnit: number;
    costedQuantity?: number;
    history: CostingPahestHistoryRecord[];
}

export interface CostingAylHistoryRecord {
    quantity: number;
    costPerUnit: string;
    addedAt: Date;
}

export interface CostingAylEntry {
    id: string;
    name: string;
    unit: string;
    mutq: number;
    tsakh: string;
    costPerUnit: string;
    history: CostingAylHistoryRecord[];
}

export interface CostingSalaryData {
    druqayin: number;
    gorcarqayin: number;
    miavorZham: number;
}

export interface SnapshotLaborRow {
    _id: string;
    laborOfferItemName: string;
    catalogName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    materialTotalCost?: number;
    subsectionName: string;
    sectionName: string;
    isGroupRow?: boolean;
    parentGroupRowId?: string;
}

export interface SnapshotSection {
    _id: string;
    name: string;
    displayIndex: number;
}

export interface SnapshotSubsection {
    _id: string;
    estimateSectionId: string;
    name: string;
    displayIndex: number;
}

export interface EstimateSnapshot {
    laborRows: SnapshotLaborRow[];
    sections: SnapshotSection[];
    subsections: SnapshotSubsection[];
}

export interface EntityCosting {
    _id?: ObjectId;
    accountId?: ObjectId;
    estimateId?: ObjectId;
    estimateName?: string;
    costHistory?: CostingHistoryRecord[];
    pahestEntries?: CostingPahestEntry[];
    aylEntries?: CostingAylEntry[];
    actualData?: Record<string, { quantity: string; unitPrice: string }>;
    salaryData?: CostingSalaryData;
    estimateSnapshot?: EstimateSnapshot;
    unforeseenEstimateSnapshot?: EstimateSnapshot;
    unforeseenEstimateId?: string;
    unforeseenCostingId?: string;
    smallScaleEstimateSnapshot?: EstimateSnapshot;
    smallScaleEstimateId?: string;
    smallScaleCostingId?: string;
    localEstimateId?: string;
    vatDeduction?: number;
    isUnforeseen?: boolean;
    parentCostingId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export function getCostingsCollection(): Collection<EntityCosting> {
    return mongoDb_.collection('costings');
}
