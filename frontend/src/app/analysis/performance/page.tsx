'use client';

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';

export default function PerformancePage() {
    const { t } = useTranslation();

    return (
        <PageContents>
            <Box sx={{ p: 3 }}>
                <Typography variant='h5'>{t('Performance')}</Typography>
            </Box>
        </PageContents>
    );
}
