import {ExpressAuth, ExpressAuthConfig, getSession} from '@auth/express';
import Credentials from '@auth/express/providers/credentials';
import {skipCSRFCheck} from '@auth/core';

import {encode as jwtEncode, decode as jwtDecode} from '@auth/core/jwt';


import {DrizzleAdapter} from '@auth/drizzle-adapter';
import {sessDb} from '@src/drizzle/drizzledb';

import {authjsAuthorizeCredentials} from './authjs_authorize';

export const authjsConfig: ExpressAuthConfig = {
    secret: config_.auth.authSecret,

    trustHost: true,
    // skipCSRFCheck: skipCSRFCheck,
    // csrf: true,

    adapter: DrizzleAdapter(sessDb),
    // session: { strategy: "database" },
    session: {strategy: 'jwt'},

    // debug: true,

    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password)
                    throw new Error('Email and password are required');

                let email = credentials?.email as string;
                let password = credentials.password as string;
                return authjsAuthorizeCredentials(email, password);
            },
        }),
    ],

    // cookies: {
    //     sessionToken: {
    //         name: 'authjs.session-token',
    //         options: {
    //             httpOnly: true,
    //             secure: false, // Set to `true` in production with HTTPS
    //             sameSite: 'lax', // Allows cross-origin cookies
    //             domain: 'localhost', // Ensure cookies work across subdomains
    //         },
    //     },
    // },

    // trustHost: true,

    callbacks: {
        // async signIn(args: any) {
        //     return true; // Only control whether sign-in is allowed
        // },

        async redirect(a) {
            // log_.info(a);
            // return null,
            return `${config_.auth.frontUrl}/api/auth/_redirect_dummy`;
            // return a.url;
            // let redirectUrl = getRedirectUrl(a.url, a.baseUrl);
            // redirectUrl = replacePort(redirectUrl, '3008');
            // log_.info(redirectUrl);
            // return redirectUrl;
        },

        async jwt(a) {
            if (a.trigger === 'signIn') {
                // log_.info('callbacks::jwt', a);
            }

            if (a.user) {
                a.token.id = a.user.id;
                a.token.email = a.user.email;
                a.token.name = a.user.name;
                a.token.image = a.user.image;

                let anyUser = a.user as any;

                a.token.sessionId = anyUser.sessionId;
                a.token.accountId = anyUser.accountId;
                a.token.permissions = anyUser.permissions;

                // log_.info(a.token, anyUser)
            }
            return a.token;
        },

        async session(a) {
            // log_.info('callbacks::session', a);
            // let user = a.session.user;

            if (!a.session.user) return a.session;

            a.session.user.name = a.token.name ?? '';
            a.session.user.permissions = (a.token.permissions ?? '') as string;
            a.session.user.sessionId = a.token.sessionId as string;
            a.session.user.accountId = a.token.accountId as string;

            return a.session;
        },

        // async signIn(a) {
        //     log_.info(a);
        //     if (!a.user) return false; // Reject sign-in for invalid credentials
        //     return true;
        // },
    },


    // csrf: {
    //     cookie: {
    //       secure: false, // Use `true` for HTTPS
    //       httpOnly: true,
    //       sameSite: "lax",
    //       path: "/",
    //     },
    //   },

    // jwt: {
    //     // secret: config_.auth.authSecret,
    //     // maxAge: 30 * 24 * 60 * 60,
    //     encode: (async (params) => {
    //         log_.info(params);
    //         const jwtString = await jwtEncode(params);

    //         console.log(jwtString);

    //         return jwtString;
    //     }),

    //     decode: (async (params) => {
    //         return await jwtDecode(params);
    //     }),
        
    //     // secret: 
    // },

    pages: {
        signIn: '/api/auth/_redirect_signin',
        error: '/api/auth/_redirect_error',
    },
};

function getRedirectUrl(url: string, baseUrl: string) {
    // Allows relative callback URLs
    // if (url.startsWith('/')) return `${baseUrl}${url}`;

    // Allows callback URLs on the same origin
    // if (new URL(url).origin === baseUrl) return url;

    return `${config_.auth.frontUrl}/api/auth/_redirect_error`;
    // return null;
    // return baseUrl;
}

function replacePort(urlString: string, newPort: string) {
    const url = new URL(urlString);
    url.port = newPort;
    return url.toString();
}
