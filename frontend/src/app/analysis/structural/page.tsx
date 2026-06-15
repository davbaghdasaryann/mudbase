'use client';

import { useState } from 'react';
import { Box, Typography, Tab } from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from './ChooseEstimationDialog';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';

type AnalyticsTab = 'general' | 'labor' | 'materials';

export default function StructuralAnalysisPage() {
    const { t } = useTranslation();
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('general');

    const hasData = !!selectedEstimate;

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

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

    return (
        <PageContents title='Structural Analytics'>
            {hasData && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 0.5 }}>
                    <Typography variant='h5' sx={{ fontWeight: 700 }}>
                        {selectedEstimate!.name}
                    </Typography>
                    <PageButton variant='contained' label='Create' size='large' sx={{ borderRadius: '25px', height: '40px' }} onClick={() => setDialogOpen(true)} />
                </Box>
            )}

            {hasData && (
                <TabContext value={activeTab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <TabList onChange={(_, v) => setActiveTab(v as AnalyticsTab)}>
                            <Tab label={t('General')} value='general' />
                            <Tab label={t('Labor')} value='labor' />
                            <Tab label={t('Materials')} value='materials' />
                        </TabList>
                    </Box>
                </TabContext>
            )}

            {!hasData && (
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
                    <AccountTreeIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {t('No analytics created yet')}
                    </Typography>
                    <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                </Box>
            )}

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
