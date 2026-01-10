import {Request, NextFunction, Response} from 'express';

import {getSession} from '@auth/express';

import {ObjectId} from 'mongodb';
import * as Db from '@src/db';

import {eq} from 'drizzle-orm';
import {sessions} from '@src/drizzle/schema';
import {sessDb, sessExecuteWithRetry} from '@src/drizzle/drizzledb';

import {ReqSession} from '../server/session';
import {authjsConfig} from './authjs_config';
import {hexToBigint} from './authjs_lib';

export async function getSessionAuthJS(req: Request, res: Response) {
    // log_.info('getSessionAuthJS');

    let authSession = await getSession(req, authjsConfig);

    // log_.info(authSession);

    if (!authSession) {
        res.status(401).json({error: 'Unauthorized: Invalid Session'});
        return null;
    }

    // let sessionUser = authSession.user;
    if (!authSession.user) {
        res.status(401).json({error: 'Unauthorized: Invalid Session User'});
        return null;
    }

    let sessionId = authSession.user.sessionId;
    if (!sessionId) {
        res.status(401).json({error: 'Unauthorized: Invalid Session User'});
        return null;
    }

    let sessionIdInt = hexToBigint(sessionId);
    let email = authSession.user.email;

    let session = new ReqSession();

    const sessionUser = await sessExecuteWithRetry(async () => {
        let usr = await sessDb
            .select()
            .from(sessions)
            // .where(eq(sessions.email, email))
            .where(eq(sessions.sessionId, sessionIdInt))
            .limit(1)
            .then((rows) => rows[0]);

        if (!usr) {
            return null;
        }
        return usr;
    });

    if (!sessionUser) {
        res.status(401).json({error: 'Unauthorized: Invalid Session User'});
        return null;
    }

    // log_.info(sessionUser);
    session.sessionId = sessionId;

    session.userId = sessionUser.userId;
    session.mongoUserId = new ObjectId(sessionUser.userId);

    //TODO: acountId
    // session.accountId = sessionUser.accountId;
    // session.mongoAccountId = new ObjectId(sessionUser.accountId);
    const users = Db.getUsersCollection();
    let user = await users.findOne({_id: session.mongoUserId});
    if (user?.accountId) {
        session.accountId = user.accountId.toString();
        session.mongoAccountId = new ObjectId(user.accountId);
    }
    session.email = email;

    session.permissions = sessionUser.permissions.split(',').map((perm) => perm.trim());
    session.permissionsSet = new Set(session.permissions);

    // log_.info(session);

    return session;
}
