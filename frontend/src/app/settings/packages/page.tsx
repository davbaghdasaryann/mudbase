'use client';

import React from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

export default function PackagesPage() {
    const { t } = useTranslation();

    return (
        <PageContents title='Packages'>
            <Box sx={{ p: 3 }}>
                <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    sx={{
                        borderRadius: '8px',
                        bgcolor: '#00abbe',
                        '&:hover': { bgcolor: '#009aaa' },
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    {t('Create')}
                </Button>
            </Box>
        </PageContents>
    );
}
