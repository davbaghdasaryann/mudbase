'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

const BRAND = '#00abbe';

export default function PaymentsPage() {
    const { t } = useTranslation();

    return (
        <PageContents title='Payments'>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 2 }}>
                <PaymentsOutlinedIcon sx={{ fontSize: 130, color: BRAND, opacity: 0.10 }} />
                <Typography variant='h6' sx={{ fontWeight: 600, color: 'text.secondary', mt: -1 }}>
                    {t('No payments yet')}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                    {t('Payment history will appear here')}
                </Typography>
            </Box>
        </PageContents>
    );
}
