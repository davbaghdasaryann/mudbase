'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';

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

export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        // next steps will build the widget here
    };

    return (
        <PageContents title={t('Risk Monitoring')} current='risk-monitoring'>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    gap: 2,
                    pb: 8,
                }}
            >
                <MonitorHeartOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                    {t('No Risk Monitor created yet')}
                </Typography>
                <PageButton
                    variant='outlined'
                    label='Create'
                    size='large'
                    sx={outlinedCreateSx}
                    onClick={() => setDialogOpen(true)}
                />
            </Box>

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
