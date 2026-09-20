import { Collection, ObjectId } from 'mongodb';

export interface ComparativeCompany {
    id: string;
    name: string;
}

export interface ComparativeSubmittedSelection {
    originalEstimateId: string;
    estimate: { _id: string; name: string; [key: string]: any };
    companies: ComparativeCompany[];
}

export interface EntityComparativeState {
    _id?: ObjectId;
    accountId: ObjectId;
    userId: ObjectId;
    analysisType: 'market' | 'base_proposals' | 'entered_data';
    estimateId: string | null;
    activeTab: string;
    selectedCompanies: ComparativeCompany[];
    submittedSelection: ComparativeSubmittedSelection | null;
    enteredDataCompanies: ComparativeCompany[];
    enteredDataCellValues: Record<string, Record<string, { unitCost: string; qty: string }>>;
    updatedAt: Date;
}

export function getComparativeStateCollection(): Collection<EntityComparativeState> {
    return mongoDb_.collection('comparative_analysis_state');
}
