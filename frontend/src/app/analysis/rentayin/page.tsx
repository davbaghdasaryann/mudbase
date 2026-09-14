'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';
import { useTranslation } from 'react-i18next';

export default function RentayinPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <PageContents title={t('Rentayin')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 180px)', gap: 2 }}>
                <SavingsOutlinedIcon sx={{ fontSize: 100, color: mainPrimaryColor, opacity: 0.2 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No rentayin created yet')}</Typography>
                <PageButton
                    variant='outlined'
                    label={t('Create')}
                    size='large'
                    onClick={() => setDialogOpen(true)}
                    sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                />
            </Box>
        </PageContents>
    );
}
