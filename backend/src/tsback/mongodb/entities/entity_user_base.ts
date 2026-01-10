
/*
import {Collection, ObjectId} from 'mongodb';
import { EntityUser } from '../../../db';

export interface EntityUserBase {
    _id?: ObjectId;

    userId: string;
    awsUserSub?: string;

    email: string;
    password?: string;

    // Access information
    access: string;
    accessGroups?: string[];
    isAdmin: boolean;
    isManager: boolean;
    isRoot: boolean;
    joinDate?: Date;

    phoneNumber: string;
    phoneAreaCode: string;

    namePrefix?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    nameSuffix?: string;
}

export function getUsersCollection() {
    return mongoDb_.collection('users') as Collection<EntityUser>;
}

export function getUsersPendingCollection() {
    return mongoDb_.collection('users_pending');
}

export function userToApi(user: any) {
    let api = {...user};
    api._id = undefined;
    api.password = undefined;
    api.passwordPlain = undefined;
    return api;
}

*/