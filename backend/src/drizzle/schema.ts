import {mysqlSchema} from 'drizzle-orm/mysql-core';
import * as t from 'drizzle-orm/mysql-core';

export const sessionsSchema = mysqlSchema('mudbase');

export const sessions = t.mysqlTable(
    'sessions',
    {
        id: t.int().primaryKey().autoincrement(), // Primary Key, Auto-increment
        sessionId: t.bigint({mode: 'bigint', unsigned: true}).notNull().unique(),
        userId: t.varchar({length: 255}).notNull(), // Unique, Indexed for search
        accountId: t.varchar({length: 255}).notNull(),
        email: t.varchar({length: 255}).notNull(), // Unique, Indexed for search
        name: t.varchar({length: 255}).notNull(), // String, No Index
        permissions: t.varchar({length: 1024}).notNull(), // Comma-separated string
        tokenExpiration: t.timestamp({mode: 'date'}).notNull(),
    },

    (table) => [
        t.uniqueIndex('session_id_idx').on(table.sessionId),
        t.index('user_id_idx').on(table.userId),
        t.index('email_idx').on(table.email),
        t.index('expiration_idx').on(table.tokenExpiration),
    ]
);

// export const sessions = mysqlTable('mudbase_sessions', {
//     id: varchar('id', {length: 255}).primaryKey(),
//     sessionToken: varchar('session_token', {length: 255}).unique(),
//     userId: varchar('user_id', {length: 255}),
//     expires: timestamp('expires', {mode: 'date'}).notNull(),
// });
