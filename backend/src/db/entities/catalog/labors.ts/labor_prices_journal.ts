import {Int32, ObjectId} from 'mongodb';

export interface EntityLaborPricesJournal {
    _id: ObjectId;
    userId: ObjectId;
    itemId: ObjectId;
    date: Date;
    laborHours: number; //🔴 TODO: this will need us in version 2 🔴
    measurementUnitMongoId: ObjectId;
    price: number;
    currency: string;

    isArchived: boolean;
    archivedAt: Date;
    unarchivedAt: Date;
}

export function getLaborPricesJournalCollection() {
    return mongoDb_.collection('labor_prices_journal');
}

export function laborPricesJournalToApi(laborPriceJournal: any) {
    let api = {...laborPriceJournal} as EntityLaborPricesJournal;
    // api._id = undefined;
    return api;
}