import { verifyObject } from '../../tslib/verify';
import {AwsSession} from '../aws/aws_session';
import {EntitySessionBase, getSessionsCollection} from '../mongodb/entities/entity_session_base';
import {EntityUserBase} from '../mongodb/entities/entity_user_base';
import {generateSessionToken} from './req_token';

export class ReqSessionBase {
    token!: string;
    userId!: string;

    access: string;

    accessGroups: Set<string>;

    accountId?: string;
    accounts?: string[];

    isInvestor = false;
    isAdmin = false;
    isStartUper = false;



    constructor(sess: EntitySessionBase) {
        this.token = sess.token;
        this.userId = sess.userId;
        this.access = sess.access ?? '';
        this.accessGroups = new Set<string>();

        if (sess.accessGroups) {
            for (let ag of sess.accessGroups) {
                sess.accessGroups.push(ag);
            }
        }


        // if (this.access) {
        //     let arr = this.access.split(',');
        //     for (let v of arr) {
        //         switch (v) {
        //             case 'I':
        //                 this.isInvestor = true;
        //                 break;
        //             case 'S':
        //                 this.isStartUper = true;
        //                 break;
        //             case 'A':
        //                 this.isAdmin = true;
        //                 break;
        //         }
        //     }
        // }
    }
}

export function createDbSession(user: EntityUserBase): EntitySessionBase {
    let token = generateSessionToken();

    let session: EntitySessionBase = {
        token: token,
        //token: generateSessionToken(),
        userId: user.userId,
        access: user.access,
        loginTime: new Date(),
        lastActivityTime: new Date(),

        greeting: generateUserGreeting(user),
    };

    return session;
}

export function createDbCognitoSession(
    user: EntityUserBase,
    cognito: AwsSession
): EntitySessionBase {
    let session: EntitySessionBase = {
        token: cognito.accessToken,
        //token: generateSessionToken(),
        userId: user.userId,
        access: user.access,
        loginTime: new Date(),
        lastActivityTime: new Date(),

        greeting: generateUserGreeting(user),
    };

    return session;
}

export function generateUserGreeting(user: EntityUserBase): string {
    let greeting = user.userId;

    if (user.firstName) greeting = user.firstName;
    else if (user.lastName) greeting = user.lastName;
    else if (user.email.length > 0) greeting = user.email;

    return greeting;
}

export function devCreateRootDbSession(token: string): EntitySessionBase {
    let session: EntitySessionBase = {
        token: token,
        userId: '100014',
        loginTime: new Date(),
        lastActivityTime: new Date(),

        greeting: '--- Root ---',
    };

    return session;
}

export async function sessionAuthenticate(token: string): Promise<EntitySessionBase> {
    if (config_.dev) {
        if (token === config_.dev.rootToken) {
            return devCreateRootDbSession(token);
        }
    }

    let sessions = getSessionsCollection();

    let session = await sessions.findOne({token: token}) as EntitySessionBase;

    session = verifyObject(session, 'Invalid session token', 501)!;

    return session;

    // return new Promise((resolve, reject) => {
    //     if (!session) {
    //         reject(new Error('Invalid Session'));
    //         return;
    //     }

    //     resolve(session as unknown as EntitySessionBase);
    // });
}
