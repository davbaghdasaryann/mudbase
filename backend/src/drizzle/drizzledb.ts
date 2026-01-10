import {drizzle} from 'drizzle-orm/mysql2';
import { and, lt, sql } from "drizzle-orm";
import mysql from 'mysql2/promise';

import '../config';

export const sessPool = mysql.createPool({
    host: config_.auth.sessdb.host,
    port: config_.auth.sessdb.port,
    user: config_.auth.sessdb.user,
    password: config_.auth.sessdb.pswd,
    database: config_.auth.sessdb.dbse,
    // waitForConnections: true,
    // connectionLimit: 10,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // connectTimeout: 10000, // Increase timeout (default is 10 sec)
});

// console.log(config_.auth.sessdb);

// sessPool.on("connection", () => console.log("🟢 New connection created!"));
// sessPool.on("acquire", () => console.log("🟠 Connection acquired!"));
// sessPool.on("release", () => console.log("🔵 Connection released!"));
// sessPool.on("enqueue", () => console.log("⏳ Waiting for connection..."));

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second base delay for exponential backoff

// Utility function for exponential backoff delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to execute query with retry logic
export async function sessExecuteWithRetry<T>(
    queryFn: () => Promise<T>,
    retries: number = MAX_RETRIES,
    attempt: number = 1
): Promise<T> {
    try {
        return await queryFn();
    } catch (error: any) {
        // Log the error for debugging
        // logger.error(`Attempt ${attempt} failed: ${error.message}`);

        // Check if the error is a connection-related error
        const isConnectionError =
            error.code === 'ECONNREFUSED' ||
            error.code === 'ETIMEDOUT' ||
            error.message.includes('Connection terminated') ||
            error.message.includes('Network error');

        if (isConnectionError && attempt <= retries) {
            const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
            //   logger.info(`Retrying after ${delayMs}ms...`);
            await delay(delayMs);

            // Attempt to reconnect (pool will handle reconnection automatically in most cases)
            try {
                await sessPool.query('SELECT 1'); // Test connection
            } catch (reconnectError) {
                // logger.error(`Reconnection failed: ${reconnectError.message}`);
            }

            // Retry the query
            return sessExecuteWithRetry(queryFn, retries, attempt + 1);
        }

        // If not a connection error or retries exhausted, throw the error
        throw new Error(`Database query failed: ${error.message}`);
    }
}

// export const sessDb = drizzle({client: sessPool});
export const sessDb = drizzle(sessPool);

export async function drizzleWarmUp() {
    await sessDb.execute(`SELECT 1`);
}

export async function drizzleMaintenance() {
    await sessDb.execute(sql`DELETE FROM sessions WHERE tokenExpiration < NOW()`);
}
