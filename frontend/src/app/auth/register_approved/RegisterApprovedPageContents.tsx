'use client';

import React from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

import * as F from '@/tsui/Form';
import * as Api from '@/api';
import {makeUserFullName} from '@/lib/user_name';
import {useApiFetchOne} from '@/components/ApiDataFetch';
import {raiseError} from '@/lib/app_errors';

export default function RegisterApprovalPageContents() {
    const form = F.useInputForm();
    const apiData = useApiFetchOne<Api.ApiPendingUser>({});
    const [pendigUser, setPendigUser] = React.useState<Api.ApiPendingUser | undefined>();
    const pendingUserIdRef = React.useRef('');
    const searchParams = useSearchParams();
    const router = useRouter();

    console.log(apiData);

    React.useEffect(() => {
        let approvalId = searchParams.get('approvalId');
        if (!approvalId) {
            raiseError('User not approved');
            return;
        }
        apiData.setApi({
            command: 'signup/get_approved_user',
            args: {
                approvalId: approvalId,
            },
        });
    }, []);

    React.useEffect(() => {
        if (!apiData.loading) {
            setPendigUser(apiData.data);
            if (apiData.data?._id)
                pendingUserIdRef.current = apiData.data._id;
        }
    }, [apiData.data]);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {

        let password = evt.data.newPassword;
        let confirmPassword = evt.data.confirmPassword;

        if (password !== confirmPassword) {
            raiseError("Passwords don't match")
            return;
        }

        Api.requestSession({
            command: 'signup/register_approved',
            args: {
                pendingUserId: pendingUserIdRef.current,
                password: password,
            },
        }).then(() => {
            router.replace('/login');
        });

    }, []);

    return (
        <F.PageFormDialog title='Register' form={form} size='sm' onSubmit={onSubmit} loading={apiData.loading} modeless>
            <F.InputText displayonly form={form} value={pendigUser?.email} label='Email' xsHalf />
            <F.InputText displayonly form={form} value={makeUserFullName(pendigUser)} label='Name' xsHalf />

            <F.FormNote text='Please enter new password to register:' />

            <F.InputText required form={form} type='password' xsMax validate='password' id='newPassword' label='New Password' placeholder='Enter New Password' />
            <F.InputText
                required
                form={form}
                type='password'
                validate='password'
                xsMax
                id='confirmPassword'
                label='Confirm Password'
                placeholder='Confirm Password'
            />
        </F.PageFormDialog>
    );
}
