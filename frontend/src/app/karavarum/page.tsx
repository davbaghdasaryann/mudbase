'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

const EmptyIllustration = () => (
    <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* desk/table surface */}
        <rect x="20" y="110" width="140" height="10" rx="5" fill="#e0f2f0" />
        {/* monitor */}
        <rect x="55" y="55" width="70" height="50" rx="6" fill="#b2dfdb" />
        <rect x="61" y="61" width="58" height="36" rx="3" fill="#e8f5e9" />
        {/* screen content lines */}
        <rect x="67" y="68" width="30" height="4" rx="2" fill="#80cbc4" />
        <rect x="67" y="76" width="20" height="4" rx="2" fill="#a5d6a7" />
        <rect x="67" y="84" width="25" height="4" rx="2" fill="#80cbc4" />
        {/* monitor stand */}
        <rect x="86" y="105" width="8" height="8" rx="2" fill="#b2dfdb" />
        <rect x="76" y="112" width="28" height="5" rx="2.5" fill="#b2dfdb" />
        {/* folder left */}
        <rect x="22" y="88" width="28" height="22" rx="4" fill="#00A390" opacity="0.18" />
        <rect x="22" y="84" width="14" height="6" rx="2" fill="#00A390" opacity="0.28" />
        {/* folder right */}
        <rect x="130" y="88" width="28" height="22" rx="4" fill="#00A390" opacity="0.18" />
        <rect x="130" y="84" width="14" height="6" rx="2" fill="#00A390" opacity="0.28" />
        {/* plus badge */}
        <circle cx="138" cy="48" r="18" fill="#00A390" opacity="0.12" />
        <circle cx="138" cy="48" r="13" fill="#00A390" />
        <rect x="132" y="46.5" width="12" height="3" rx="1.5" fill="#fff" />
        <rect x="136.5" y="42" width="3" height="12" rx="1.5" fill="#fff" />
    </svg>
);

export default function KaravariumPage() {
    const { t } = useTranslation();

    const handleCreate = () => {
        // to be wired up
    };

    return (
        <PageContents title={t('Karavarium')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
                <EmptyIllustration />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mt: 1 }}>
                    {t('No records yet')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', textAlign: 'center', maxWidth: 320 }}>
                    {t('Create your first record to get started')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{
                        mt: 1,
                        borderRadius: '24px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        bgcolor: '#00A390',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#008a79', boxShadow: 'none' },
                    }}
                >
                    {t('Create')}
                </Button>
            </Box>
        </PageContents>
    );
}
