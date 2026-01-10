import { ObjectId } from "bson";

export interface EntityTransaction {
    _id: ObjectId;
    code: number;
    text: string;
    date: Date;
}

export function getTransactionsCollection() {
    return mongoDb_.collection<EntityTransaction>('transactions');
}

export function transactionToApi(transaction: any) {
    return transaction;
    // let api = {...transaction};
    // return api;
}