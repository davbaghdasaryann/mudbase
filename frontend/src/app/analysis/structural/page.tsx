'use client';

import { useState } from 'react';
import { Box, Typography, Tab, Paper } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from './ChooseEstimationDialog';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

type AnalyticsTab = 'general' | 'labor' | 'materials';

const MetricCard = ({ label, value }: { label: string; value: number }) => (
    <Paper elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, p: 2.5 }}>
        <ChatBubbleOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor, mb: 1 }} />
        <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>AMD {formatCurrencyRounded(value)}</Typography>
    </Paper>
);

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
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={(_, v) => setActiveTab(v as AnalyticsTab)}>
                            <Tab label={t('General')} value='general' />
                            <Tab label={t('Labor')} value='labor' />
                            <Tab label={t('Materials')} value='materials' />
                        </TabList>
                    </Box>

                    <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <MetricCard label={t('Total Cost')} value={selectedEstimate!.totalCost ?? 0} />
                            <MetricCard label={t('Labor Cost')} value={selectedEstimate!.laborTotalCost ?? 0} />
                            <MetricCard label={t('Materials Cost')} value={selectedEstimate!.materialTotalCost ?? 0} />
                        </Box>
                    </TabPanel>

                    <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                        <></>
                    </TabPanel>

                    <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                        <></>
                    </TabPanel>
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
