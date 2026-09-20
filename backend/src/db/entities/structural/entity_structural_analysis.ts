import { Collection, ObjectId } from 'mongodb';

export interface EntityStructuralAnalysis {
    _id?: ObjectId;
    accountId: ObjectId;
    userId: ObjectId;
    name: string;
    estimateId: string;
    activeTab: string;
    createdAt: Date;
    updatedAt: Date;
}

export function getStructuralAnalysesCollection(): Collection<EntityStructuralAnalysis> {
    return mongoDb_.collection('structural_analyses');
}
