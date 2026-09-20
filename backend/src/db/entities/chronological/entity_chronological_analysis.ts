import { Collection, ObjectId } from 'mongodb';

export type ChronologicalSourceType = 'work_repository' | 'materials_repository' | 'list_of_estimates' | 'consolidated_estimates';

export interface EntityChronologicalAnalysis {
    _id?: ObjectId;
    accountId: ObjectId;
    userId: ObjectId;
    name: string;
    sourceType: ChronologicalSourceType;
    itemId: string;
    fromDate: string;
    toDate: string;
    createdAt: Date;
    updatedAt: Date;
}

export function getChronologicalAnalysesCollection(): Collection<EntityChronologicalAnalysis> {
    return mongoDb_.collection('chronological_analyses');
}
