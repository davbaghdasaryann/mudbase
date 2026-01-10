import '@auth/core';

import type {User} from '@auth/core'; // Import the existing User type

declare module '@auth/core' {
    //  * The shape of the user object returned in the OAuth providers' `profile` callback,
    //  * or the second parameter of the `session` callback, when using a database.
    interface User {
        id: string;
        accountId: string;
        email: string;
        name: string;
        sessionId: string;
        permissions: string;

    }
}

/**
 * Returned by `useSession`, `auth`, contains information about the active session.
 */
// Extend the default Session type to include custom properties
declare module '@auth/express' {
    interface Session {
        user: {
            id: string; // Add a custom `id` property to the session user object
            email: string;
            name: string;
            permissions: string;
            sessionId: string;
            accountId?: string;
        };
        expires: string;
    }
}
