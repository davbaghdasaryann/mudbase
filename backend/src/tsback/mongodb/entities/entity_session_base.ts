import { ObjectId } from "mongodb";

export interface EntitySessionBase {
    _id?: ObjectId;

    token: string;
    userId: string;
    greeting: string;


    access?: string;
    accessGroups?: string[];

    accountId?: string;
    accounts?: string[];

    loginTime: Date;
    logoutTime?: Date;

    lastActivityTime: Date;
}

export function getSessionsCollection() {
    return mongoDb_.collection('sessions');
}

export function getSessionsArchiveCollection() {
    return mongoDb_.collection('sessions_archive');
}

export function sessionToApi(session: any) {
    let api = {...session};
    api._id = undefined;
    return api;
}
