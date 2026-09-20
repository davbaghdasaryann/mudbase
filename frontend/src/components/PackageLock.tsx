'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslation } from 'react-i18next';
import { useMyPackage, MyPackage } from '@/hooks/useMyPackage';

interface Props {
    feature: keyof MyPackage;
    children: React.ReactNode;
}

export default function PackageLock({ feature, children }: Props) {
    const { t } = useTranslation();
    const pkg = useMyPackage();

    // No package assigned — full access (unassigned companies are unrestricted)
    if (pkg === null || pkg === undefined) return <>{children}</>;

    if (pkg[feature]) return <>{children}</>;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
            color: 'text.secondary',
        }}>
            <LockOutlinedIcon sx={{ fontSize: 72, opacity: 0.18 }} />
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
                {t('This feature is not included in your package')}
            </Typography>
            <Typography variant='body2' color='text.disabled'>
                {t('Contact your administrator to upgrade')}
            </Typography>
        </Box>
    );
}
