'use client';

import React from 'react';
import PageContents from '@/components/PageContents';
import AccountViewPageContents from './AccountAboutPageContents';


export default function AccountViewPage() {
    return (
        <PageContents title='Company Profile'>
            <AccountViewPageContents />
        </PageContents>
    );
}

