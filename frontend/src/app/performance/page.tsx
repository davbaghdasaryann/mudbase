'use client';

import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import PerformanceActTable from './PerformanceActTable';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';

const outlinedCreateSx = {
    borderRadius: '25px',
    height: '40px',
    mt: 1,
    '&:hover': {
        backgroundColor: mainPrimaryColor,
        color: '#ffffff',
        borderColor: mainPrimaryColor,
    },
};

export default function PerformancePage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    return (
        <PageContents title='Performance'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                {!selectedEstimate && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                        <SpeedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                            {t('No Performance Acts created yet')}
                        </Typography>
                        <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                    </Box>
                )}

                {selectedEstimate && (
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <Button
                            startIcon={<ArrowBackIcon fontSize='small' />}
                            size='small'
                            onClick={() => setSelectedEstimate(null)}
                            sx={{ color: 'text.secondary', pl: 0, mb: 1.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                        >
                            {t('Back')}
                        </Button>

                        <Typography variant='h4' sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em' }}>
                            {selectedEstimate.name}
                        </Typography>

                        <PerformanceActTable estimate={selectedEstimate} />
                    </Box>
                )}

            </Box>

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
