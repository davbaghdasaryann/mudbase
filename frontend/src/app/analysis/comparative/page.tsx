'use client';

import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import ChooseEstimationDialog from '../structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';

const cards = [
    { key: 'By Market Value', gradientId: 'comparativeGradientGreen' },
    { key: 'By Submitted Estimations', gradientId: 'comparativeGradientBlue' },
    { key: 'By Base Proposals', gradientId: 'comparativeGradientTeal' },
];

export default function ComparativeAnalysisPage() {
    const { t } = useTranslation();
    const [marketValueDialogOpen, setMarketValueDialogOpen] = useState(false);
    const [marketValueEstimate, setMarketValueEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    const handleCardClick = (key: string) => {
        if (key === 'By Market Value') setMarketValueDialogOpen(true);
    };

    return (
        <PageContents title='Comparative Analytics'>
            <Box component='svg' width={0} height={0} sx={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id='comparativeGradientGreen' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#2ECC71' />
                        <stop offset='100%' stopColor='#1CA461' />
                    </linearGradient>
                    <linearGradient id='comparativeGradientBlue' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#29B6F6' />
                        <stop offset='100%' stopColor='#0288D1' />
                    </linearGradient>
                    <linearGradient id='comparativeGradientTeal' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#1CA461' />
                        <stop offset='100%' stopColor='#00ABBE' />
                    </linearGradient>
                </defs>
            </Box>

            <Stack direction='row' spacing={3} flexWrap='wrap' useFlexGap justifyContent='center' sx={{ width: '100%' }}>
                {cards.map((card) => (
                    <Box
                        key={card.key}
                        role='button'
                        tabIndex={0}
                        onClick={() => handleCardClick(card.key)}
                        sx={{
                            position: 'relative',
                            width: 180,
                            minHeight: 160,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 3,
                            cursor: 'pointer',
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.55)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
                            },
                        }}
                    >
                        <AddIcon
                            sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                fontSize: 20,
                                color: 'text.primary',
                            }}
                        />
                        <ExtensionIcon
                            sx={{
                                fontSize: 56,
                                fill: `url(#${card.gradientId})`,
                            }}
                        />
                        <Typography variant='body2' align='center' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {t(card.key)}
                        </Typography>
                    </Box>
                ))}
            </Stack>

            {marketValueEstimate && (
                <Typography variant='body1' sx={{ fontWeight: 600, mt: 1 }}>
                    {t('Choose an Estimation')}: {marketValueEstimate.name}
                </Typography>
            )}

            <ChooseEstimationDialog
                open={marketValueDialogOpen}
                onClose={() => setMarketValueDialogOpen(false)}
                onSelect={(estimate) => {
                    setMarketValueDialogOpen(false);
                    setMarketValueEstimate(estimate);
                }}
            />
        </PageContents>
    );
}
