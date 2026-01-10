'use client';
import React from 'react';

import {Stack} from '@mui/material';

import {useSearchParams, useRouter} from 'next/navigation';

import PageDialog from '@/tsui/PageDialog';
import PageText from '@/components/PageText';
import {useApiFetchOne} from '@/components/ApiDataFetch';
import * as Api from '@/api';
import ProgressIndicator from '@/tsui/ProgressIndicator';
import {raiseError} from '@/lib/app_errors';

export default function EmailVerificationPageContents() {
    const router = useRouter();

    const searchParams = useSearchParams();

    const apiData = useApiFetchOne<Api.ApiPendingUser>({});

    React.useEffect(() => {
        let emailVerificationId = searchParams.get('emailVerificationId');

        if (!emailVerificationId) {
            raiseError('Email verification id is missing');
            return;
        }

        // console.log('emailVerificationId', emailVerificationId);

        apiData.setApi({
            command: 'signup/email_verify',
            args: {emailVerificationId: emailVerificationId},
        });
    }, []);

    const onSubmissionClose = React.useCallback(() => {
        router.push('/login');
    }, [router]);

    if (apiData.loading) {
        return <ProgressIndicator show={apiData.loading} background='backdrop' />;
    }

    if (apiData.error) {
        return (
            <PageDialog type='confirm' title='Email Verification Error' confirmLabel='Close' size='sm' modeless onConfirm={() => router.push('/login')}>
                <Stack direction='column' spacing={2}>
                    <PageText text={apiData.error.message || 'No such user found. Please check your link.'} />
                </Stack>
            </PageDialog>
        );
    }

    return (
        <PageDialog type='confirm' title='signup.verified_title' confirmLabel='Close' size='sm' modeless onConfirm={onSubmissionClose}>
            <Stack direction='column' spacing={2}>
                <PageText text='signup.verified_message' />
                <PageText text='signup.verified_instruction' />
            </Stack>
        </PageDialog>
    );
}
