import {User} from '@auth/core';
import bcrypt from 'bcrypt';

import {sql} from 'drizzle-orm';
import {sessDb, sessExecuteWithRetry} from '@src/drizzle/drizzledb';
import {sessions} from '@src/drizzle/schema';

import * as Db from '@src/db';
import {verify} from '@tslib/verify';
import {authjsGenerateUserName, bigintToHex, generateSessionId} from './authjs_lib';

export async function authjsAuthorizeCredentials(
    email: string,
    password: string
): Promise<User | null> {
    let users = Db.getUsersCollection();

    let storedUser = await users.findOne({email: email});

    if (!storedUser) throw new Error(`Invalid user: ${email}`);

    verify(storedUser.isActive, 'Inactive user');
    // verify(storedUser.accountId, 'The user is not affiliated with any account');
    verify(storedUser, 'Invalid email or password');
    verify(storedUser.password, 'User is not active');

    const isValid = await bcrypt.compare(password, storedUser.password!);

    log_.info(isValid, password, storedUser.password);

    // verify(isValid, 'Invalid password');

    if (!isValid) return null;

    const sessionId = generateSessionId();

    // console.log(sessionId);

    const userName = authjsGenerateUserName(storedUser);

    let user: User = {
        id: storedUser._id!.toString(),
        email: storedUser.email,
        name: userName,
        sessionId: bigintToHex(sessionId),
        accountId: storedUser.accountId?.toString() ?? '', //TODO: acountId
        permissions: storedUser.permissions,
    };

    await sessExecuteWithRetry(
        async () =>
            await sessDb
                .insert(sessions)
                .values({
                    sessionId: sessionId,
                    userId: user.id,
                    accountId: user.accountId,
                    email: user.email,
                    name: userName,
                    permissions: user.permissions,
                    tokenExpiration: sql`NOW() + INTERVAL 30 DAY`,
                })
                .onDuplicateKeyUpdate({
                    set: {
                        accountId: user.accountId,
                        name: user.name,
                        permissions: user.permissions,
                    },
                })
    );

    // await sessDb
    //     .insert(sessions)
    //     .values({
    //         sessionId: sessionId,
    //         userId: user.id,
    //         accountId: user.accountId,
    //         email: user.email,
    //         name: userName,
    //         permissions: user.permissions,
    //         tokenExpiration: sql`NOW() + INTERVAL 30 DAY`,
    //     })
    //     .onDuplicateKeyUpdate({
    //         set: {
    //             accountId: user.accountId,
    //             name: user.name,
    //             permissions: user.permissions,
    //         },
    //     });

    return user;
}
