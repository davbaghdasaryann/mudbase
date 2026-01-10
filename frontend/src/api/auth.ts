import {getCsrfToken, signIn, signOut, useSession} from 'next-auth/react';

import * as Api from './api';
import {getErrorString} from '../tslib/error';
import {ApiSession} from './session';
import React from 'react';

export function usePermissions() {
    const {data: session, status} = useSession();

    // console.log('session', session, status)

    const permissionsSet = React.useMemo(() => {
        if (status !== 'authenticated' || !session?.user?.permissions) {
            return new Set();
        }

        return new Set(session.user.permissions.split(',').map((p) => p.trim()));
    }, [session?.user?.permissions, status]);

    return {session, status, permissionsSet};
}

export async function signInWithEmail(email: string, password: string) {
    try {
        const csrfToken = await getCsrfToken();

        if (!csrfToken) {
            return Promise.reject(new Error('Failed to fetch CSRF token'));
        }

        const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost';
        // const rootUrl = new URL(currentUrl).origin + '/';

        const result = await signIn('credentials', {
            redirect: false,
            email: email,
            password: password,
            // callbackUrl: rootUrl,
            // url: rootUrl,
            csrfToken: csrfToken,
        });

        if (result?.error) {
            return Promise.reject(result.error);
        }

        return result;
    } catch (error) {
        console.error('Login error:', error);
        return Promise.reject(getErrorString(error));
    }
}

export async function authSignOut() {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost';
    const rootUrl = new URL(currentUrl).origin;

    await signOut({
        redirect: false,
        //callbackUrl: `${rootUrl}/login/`,
    });
}

// export function submitRecoverPassCode(data: Record<string, string>): Promise<ApiSession> {
//     console.log(data);
//     return new Promise((resolve, reject) => {
//         Api.requestPublic<ApiSession>({
//             command: 'auth/submit_recover_pass_code',
//             json: data,
//         })
//             .then((sess) => {
//                 resolve(sess);
//             })
//             .catch(reject);
//     });
// }

export function resendVerificationEmail(data: Record<string, string>): Promise<ApiSession> {
    return new Promise((resolve, reject) => {
        Api.requestPublic<ApiSession>({
            command: 'auth/resend_verification_email',
            body: data,
        })
            .then((sess) => {
                resolve(sess);
            })
            .catch(reject);
    });
}

export function confirmUserEmail(data: Record<string, string>): Promise<ApiSession> {
    return new Promise((resolve, reject) => {
        Api.requestPublic<ApiSession>({
            command: 'auth/join_confirm_user_email',
            body: data,
        })
            .then((sess) => {
                resolve(sess);
            })
            .catch(reject);
    });
}
