'use client';

import React from 'react';
import { Box } from '@mui/material';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

export default function KaravariumPage() {
    const { t } = useTranslation();
    return (
        <PageContents title={t('Karavarium')}>
            <Box />
        </PageContents>
    );
}
