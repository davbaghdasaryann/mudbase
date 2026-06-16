'use client';

import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';

export default function ComparativeAnalysisPage() {
    const { t } = useTranslation();
    return (
        <PageContents title='Comparative Analytics'>
            <Typography variant='body1' color='text.secondary'>
                {t('No analytics created yet')}
            </Typography>
        </PageContents>
    );
}
