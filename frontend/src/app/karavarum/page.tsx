'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

export default function KaravariumPage() {
    const { t } = useTranslation();

    const handleCreate = () => {
        // to be wired up
    };

    return (
        <PageContents title={t('Karavarium')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 2 }}>
                <ManageAccountsOutlinedIcon sx={{ fontSize: 100, color: '#00A390', opacity: 0.2 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No records yet')}</Typography>
                <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ borderRadius: '25px', height: '40px', mt: 1, borderColor: '#00A390', color: '#00A390', '&:hover': { backgroundColor: '#00A390', color: '#fff', borderColor: '#00A390' } }}
                >
                    {t('Create')}
                </Button>
            </Box>
        </PageContents>
    );
}
