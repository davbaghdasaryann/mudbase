'use client';

import React from 'react';

import {useRouter, useSearchParams} from 'next/navigation';

import * as F from '@/tsui/Form';
import * as Api from '@/api';

export default function PasswordResetPageContents() {
    const form = F.useInputForm();
    const router = useRouter();

    const [userEmail, setUserEmail] = React.useState<string | undefined>();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        let passwordResetId = searchParams.get('passwordResetId');

        if (!passwordResetId) return;

        console.log(passwordResetId);

        Api.requestPublic<Api.ApiUser>({
            command: 'auth/get_password_reset_data',
            args: {passwordResetId: passwordResetId},
        }).then((res) => {
            setUserEmail(res.email);
        });
    }, [searchParams]);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        let newPassword = evt.data.newPassword;
        let confirmPassword = evt.data.confirmPassword;

        if (newPassword !== confirmPassword) {
            form.setError("Passwords don't match");
            return;
        }

        form.setBusy();

        let passwordResetId = searchParams.get('passwordResetId');

        await Api.requestPublic({
            command: 'auth/reset_password',
            args: {
                passwordResetId: passwordResetId,
                newPassword: newPassword,
            },
        }).then(() => {
            router.replace('/login');
        });

        form.clearBusy();
    }, []);

    return (
        <F.PageFormDialog title='Password Reset' form={form} size='sm' onSubmit={onSubmit} loading={!userEmail}>
            <F.InputText value={userEmail} xsMax id='email' label='Email' displayonly />
            {/* <F.InputText required value={data.code} xsMax id='code' label='Recover code' placeholder='Code' /> */}

            <F.InputText required type='password' xsMax id='newPassword' label='Password' placeholder='New Password' autocomplete='off' />
            <F.InputText required type='password' xsMax id='confirmPassword' label='Confirm password' placeholder='Confirm Password' autocomplete='off' />
        </F.PageFormDialog>
    );
}
