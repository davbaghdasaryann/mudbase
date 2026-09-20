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

export interface EntityComparativeAnalysis {
    _id?: ObjectId;
    accountId: ObjectId;
    userId: ObjectId;
    name: string;
    analysisType: 'market' | 'base_proposals' | 'entered_data';
    estimateId: string | null;
    activeTab: string;
    selectedCompanies: ComparativeCompany[];
    submittedSelection: ComparativeSubmittedSelection | null;
    enteredDataCompanies: ComparativeCompany[];
    enteredDataCellValues: Record<string, Record<string, { unitCost: string; qty: string }>>;
    createdAt: Date;
    updatedAt: Date;
}

export function getComparativeAnalysesCollection(): Collection<EntityComparativeAnalysis> {
    return mongoDb_.collection('comparative_analyses');
}
