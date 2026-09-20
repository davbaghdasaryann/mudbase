import { Collection, ObjectId } from 'mongodb';

export interface EntityPackage {
    _id?: ObjectId;
    name: string;
    price: number;
    numberOfUsers: number;
    numberOfEstimations: number;

    // Catalog access
    worksCatalog: boolean;
    materialsCatalog: boolean;
    aggregatedCatalog: boolean;

    // Section access
    costing: boolean;
    analysis: boolean;
    performance: boolean;

    // Estimation features
    seeOffers: boolean;
    archiveEstimations: boolean;
    shareEstimations: boolean;
    duplicateEstimation: boolean;
    exportEstimation: boolean;
    exportBoQ: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export function getPackagesCollection(): Collection<EntityPackage> {
    return mongoDb_.collection('packages');
}
