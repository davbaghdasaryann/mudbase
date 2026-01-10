'use client';

import React from 'react';

import PageContents from '@/components/PageContents';

import EmailVerificationPageContents from './EmailVerificationPageContents';

export default function EmailVerificationPage() {
    return (
        <PageContents type='public'>
            <EmailVerificationPageContents />
        </PageContents>
    );
}
