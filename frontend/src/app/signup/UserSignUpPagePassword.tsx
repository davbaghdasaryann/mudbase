'use client';

import React from 'react';

import {Button, Stack} from '@mui/material';

import * as F from 'tsui/Form';
import * as Api from 'api';
import PageDialog from '../../tsui/PageDialog';
import PageText from '../../components/PageText';
import {raiseError} from '../../lib/app_errors';
import {useRouter} from 'next/navigation';
import {useTranslation} from 'react-i18next';

export default function UserSignUpPagePassword() {
    const form = F.useInputForm();
    const router = useRouter();
    const [t] = useTranslation();
    const [signUpComplete, setSignUpComplete] = React.useState(false);
    const [busy, setBusy] = React.useState(false);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        setBusy(true);
        try {
            let password = evt.data.newPassword;
            let confirmPassword = evt.data.confirmPassword;

            if (password !== confirmPassword) {
                raiseError("Passwords don't match");
                return;
            }

            await Api.requestPublic({
                command: 'signup/submit',
                json: {
                    email: evt.data.email,
                    firstName: evt.data.firstName,
                    lastName: evt.data.lastName,
                    password: password,
                },
            });
            setSignUpComplete(true);
        } finally {
            setBusy(false);
        }
    }, []);

    const onSubmissionClose = React.useCallback(() => {
        router.push('/login');
    }, [router]);

    if (signUpComplete) {
        return (
            <PageDialog type='confirm' title='signup.received_title' confirmLabel='Close' size='sm' modeless onConfirm={onSubmissionClose}>
                <Stack direction='column' spacing={2}>
                    <PageText text='signup.received_message' />
                    <PageText text='signup.received_instruction' />
                </Stack>
            </PageDialog>
        );
    }

    return (
        <>
            {/* <F.PageFormDialog type='confirm' title='Sign Up' form={form} size='xs' onSubmit={onSubmit} confirmLabel='Sign Up' loading={busy} modeless confirmButtonSx={{
                width: '100%',
            }}> */}
            <F.PageFormDialog
                type='confirm'
                title='Sign Up'
                form={form}
                size='xs'
                onSubmit={onSubmit}
                loading={busy}
                modeless
                slotProps={{
                    cancelButton: {
                        show: false,
                    },
                    submitButton: {
                        label: 'Sign Up',
                        sx: {
                            width: '100%',
                        },
                    },
                }}
            >
                <F.InputText id='email' label='Email' xsMax validate='email' required autocomplete='email' />
                <F.InputText id='firstName' label='First Name' required xsMax />
                <F.InputText id='lastName' label='Last Name' required xsMax />

                <F.InputText
                    required
                    type='password'
                    xsMax
                    validate='password'
                    id='newPassword'
                    label='Password'
                    placeholder='Enter Password'
                    autocomplete='off'
                />
                <F.InputText
                    required
                    type='password'
                    validate='password'
                    xsMax
                    id='confirmPassword'
                    label='Confirm Password'
                    placeholder='Confirm Password'
                />
            </F.PageFormDialog>
        </>
    );
}
