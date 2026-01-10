'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


import * as F from 'tsui/Form';
import * as Api from 'api';
import { makeUserFullName } from '@/lib/user_name';
import { useApiFetchOne } from '@/components/ApiDataFetch';
import { raiseError } from '../../../lib/app_errors';
import PageDialog from '../../../tsui/PageDialog';
import { Stack } from '@mui/system';
import PageText from '../../../components/PageText';
import ProgressIndicator from '../../../tsui/ProgressIndicator';
import { t } from 'i18next';


export default function RegisterInvitationPageContents() {
    const form = F.useInputForm();
    // const [pendigUser, setPendigUser] = React.useState<Api.ApiPendingUser | null>(null);

    const searchParams = useSearchParams();
    const invitationId = searchParams.get('invitationId');
    const router = useRouter();
    const pendigUserRef = React.useRef<Api.ApiPendingUser | null>(null)
    const [signUpComplete, setSignUpComplete] = React.useState(false);
    const hasUserChangedEmailRef = React.useRef(false)


    // const apiData = useApiFetchOne<Api.ApiAccount>({
    //     defer: true,
    //     api: {
    //         command: 'profile/get_account',
    //     },
    // });
    const apiData = useApiFetchOne<Api.ApiPendingUser>({
        api: {
            command: 'signup/get_invitation',
            args: { invitationId: invitationId }
        },
    });

    if (apiData.data)
        pendigUserRef.current = apiData.data;

    // setPendigUser(apiData.data ?? null);

    // React.useEffect(() => {
    //     let invitationId = searchParams.get("invitationId");

    // }, []);



    // const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
    //     if (form.error) return;
    //     if (!evt.isData()) return;

    //     console.log(evt.data);

    //     let data = evt.data;
    // }, []);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        try {
            let password = evt.data.newPassword;
            let confirmPassword = evt.data.confirmPassword;

            if (password !== confirmPassword) {
                raiseError("Passwords don't match");
                return;
            }
            console.log('pendigUser', pendigUserRef.current, apiData.data)
            if (!pendigUserRef.current || !pendigUserRef.current?.invitationId) {
                raiseError("Something went wrong. Please reload the page and try again.");
                return;
            }



            let response: any = await Api.requestSession({
                command: 'signup/register_invitation',
                json: {
                    invitationId: pendigUserRef.current.invitationId,
                    email: evt.data.email,
                    firstName: evt.data.firstName,
                    lastName: evt.data.lastName,
                    password: password,
                }
            });

            if (response?.emailChanged) {
                if (pendigUserRef.current.email === evt.data.email) {
                    hasUserChangedEmailRef.current = true;
                }
                setSignUpComplete(true);
            } else {
                onSubmissionClose()
            }

        } finally {
            // setBusy(false);
        }
    }, []);

    const onSubmissionClose = React.useCallback(() => {
        router.push("/login");
    }, [router]);


    if (signUpComplete) {
        if (hasUserChangedEmailRef.current) {
            return (
                <PageDialog type='confirm' title='signup.received_title' confirmLabel='Close' size='sm' modeless onConfirm={onSubmissionClose}>
                    <Stack direction='column' spacing={2}>
                        <PageText text='signup.received_message' />
                        <PageText text='signup.received_instruction' />
                    </Stack>
                </PageDialog>
            );
        } else {
            return (
                <PageDialog type='confirm' title='signup.received_title' confirmLabel='Close' size='sm' modeless onConfirm={onSubmissionClose}>
                    <Stack direction='column' spacing={2}>
                        <PageText text='signup.verified_invitation' />
                        <PageText text='signup.received_instruction' />
                    </Stack>
                </PageDialog>
            );
        }
    }


    return (
        <F.PageFormDialog loading={apiData.loading} title={t('Accept invitation')} form={form} size='sm' onSubmit={onSubmit} onClose={onSubmissionClose} modeless>
            {/* <F.InputText form={form} value={pendigUser?.email} label='Email' xsHalf /> */}
            {pendigUserRef.current?.chosenPermissions ? (
                <F.InputText id='email' readonly value={pendigUserRef.current?.email} label='Email' form={form} xsMax validate='email' required />
            ) : (
                <F.InputText id='email' value={pendigUserRef.current?.email} label='Email' form={form} xsMax validate='email' required />
            )}

            <F.InputText id='firstName' value={pendigUserRef.current?.firstName} label='First Name' required form={form} xsHalf />
            <F.InputText id='lastName' value={pendigUserRef.current?.lastName} label='Last Name' required form={form} xsHalf />

            <F.FormNote text='Please enter password:' />


            <F.InputText required form={form} type='password' xsMax validate='password' id='newPassword' label='Password' placeholder='Enter Password' />
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
