import {Int32, ObjectId} from 'mongodb';

export interface EntityMaterialPricesJournal {
    _id: ObjectId;
    userId: ObjectId;
    itemId: ObjectId;
    date: Date;
    price: number;
    currency: string;
    measurementUnitMongoId: ObjectId;

    isArchived: boolean;
    archivedAt: Date;
    unarchivedAt: Date;
}

export function getMaterialPricesJournalCollection() {
    return mongoDb_.collection('material_prices_journal');
}

export function materialPricesJournalToApi(materialPriceJournal: any) {
    let api = {...materialPriceJournal} as EntityMaterialPricesJournal;
    // api._id = undefined;
    return api;
}