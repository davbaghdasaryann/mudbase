import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

import { randomUUID, createHash } from 'crypto';

import { verify } from '@tslib/verify';

import * as Db from '@src/db';
import { eq, and, not } from 'drizzle-orm';
import { sessDb } from '@src/drizzle/drizzledb';
import { sessions } from '@src/drizzle/schema';
import { ReqSession } from '../server/session';

export function uuidToShortId(): bigint {
    const uuid = randomUUID().replace(/-/g, ''); // Remove dashes
    const hash = createHash('sha256').update(uuid).digest('hex'); // Hash UUID
    return BigInt('0x' + hash.slice(0, 16)); // Use first 64-bits
}

export function bigintToHex(value: bigint): string {
    return value.toString(16).padStart(16, '0');
}

export function hexToBigint(hex: string): bigint {
    return BigInt('0x' + hex);
}

// console.log(uuidToShortId().toString(16));

export function generateSessionId() {
    return uuidToShortId();
}

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);

    const passwordHash = await bcrypt.hash(password, salt);

    return passwordHash;
}

export async function authjsChangePassword(userId: string, password: string) {
    let users = Db.getUsersCollection();

    let mongoUserId = new ObjectId(userId);

    let storedUser = (await users.findOne({ _id: mongoUserId })) as Db.EntityUser;

    verify(storedUser, 'Invalid user');

    let hashedPassword = await hashPassword(password);

    let result = await users.updateOne(
        { _id: mongoUserId },
        {
            $set: {
                password: hashedPassword,
            },
        }
    );

    return result;
}

export async function authjsLogoutOtherSessions(session: ReqSession) {
    // Logout all the users
    // await sessDb.delete(sessions).where(eq(sessions.userId, userId));
    let sessionId = hexToBigint(session.sessionId);
    await sessDb
        .delete(sessions)
        .where(and(eq(sessions.userId, session.userId), not(eq(sessions.sessionId, sessionId))));
}

export async function authjsLogoutUser(userId: string) {
    await sessDb
        .delete(sessions)
        .where(eq(sessions.userId, userId));
}

export async function authjsUpdateUserName(user: Db.EntityUser) {
    let userName = authjsGenerateUserName(user);

    await sessDb
        .update(sessions)
        .set({ name: userName })
        .where(eq(sessions.userId, user._id!.toString()));
}

export function authjsGenerateUserName(user: Db.EntityUser) {
    let name = '';

    // log_.info(user);

    if (user.firstName) {
        name += user.firstName;
    }

    if (user.lastName) {
        if (name.length > 0) name += ' ';
        name += user.lastName;
    }

    if (name.length == 0) name = user.email;

    return name;
}

export async function authjsUpdateUserPermissions(user: Db.EntityUser) {
    await sessDb
        .update(sessions)
        .set({ permissions: user.permissions })
        .where(eq(sessions.userId, user._id!.toString()));
}
