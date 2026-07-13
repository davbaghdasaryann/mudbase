'use client';

import { useState } from 'react';
import { Box, Button, Tab, Typography } from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import CostingTable from './CostingTable';
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

type TabValue = 'main' | 'history';

export default function CostingPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabValue>('main');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    return (
        <PageContents title='Costing'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                {/* Tabs */}
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <TabList onChange={(_, v) => setTab(v as TabValue)}>
                            <Tab label={t('Main')} value='main' />
                            <Tab label={t('Costs History')} value='history' />
                        </TabList>
                    </Box>
                </TabContext>

                {/* Main tab */}
                {tab === 'main' && (
                    <>
                        {!selectedEstimate && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                                <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                                    {t('No Costings created yet')}
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
                                <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', mb: 3 }}>
                                    {selectedEstimate.name}
                                </Typography>
                                <CostingTable estimate={selectedEstimate} />
                            </Box>
                        )}
                    </>
                )}

                {/* Costs History tab */}
                {tab === 'history' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                        <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                            {t('Coming soon')}
                        </Typography>
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
