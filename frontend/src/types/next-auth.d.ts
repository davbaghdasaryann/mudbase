import NextAuth, {DefaultSession, DefaultUser, JWT} from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: DefaultUser & {
            id: string;
            accountId?: string;

            permissions: string;
            permissionsSet: Set<string>;
        };
        accessToken?: string;
    }

    interface JWT {
        accessToken?: string;
    }
}
