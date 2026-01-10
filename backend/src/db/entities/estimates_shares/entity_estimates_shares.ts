import { Collection, ObjectId } from 'mongodb';

export interface EntityEstimatesShares {
    _id: ObjectId;
    sharedByUserId: ObjectId;
    sharedByAccountId: ObjectId;
    sharedWithAccountId: ObjectId;
    sharedEstimateId: ObjectId;
    estimateNumber: string;
    sharedAt: Date;

    isOnlyEstimateInfo: boolean;
    isDuplicatedChild?: boolean; 
    
    deleted?: boolean;
    deletedAt?: Date;
}

export function getEstimatesSharesCollection(): Collection<EntityEstimatesShares> {
    return mongoDb_.collection('estimates_shares');
}

