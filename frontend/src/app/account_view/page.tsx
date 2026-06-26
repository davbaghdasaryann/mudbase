'use client';

import React from 'react';
import PageContents from '@/components/PageContents';
import AccountViewPageContents from './AccountAboutPageContents';
import { useTranslation } from 'react-i18next';


export default function AccountViewPage() {
    const { t } = useTranslation();
    return (
        <PageContents title={t('Company Profile')} sx={{ backgroundColor: '#F5F9F9' }}>
            <AccountViewPageContents />
        </PageContents>
    );
}

