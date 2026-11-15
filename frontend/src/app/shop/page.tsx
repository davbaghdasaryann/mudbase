'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

export default function ShopPage() {
    const { t } = useTranslation();
    return (
        <PageContents>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <StorefrontIcon sx={{ fontSize: 28, color: '#00abbe' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {t('Shop')}
                </Typography>
            </Box>
        </PageContents>
    );
}
