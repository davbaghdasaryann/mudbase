'use client';

import { useState } from 'react';
import { Box, Typography, Tab, Paper } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from './ChooseEstimationDialog';
import BreakdownTable from './BreakdownTable';
import OtherExpensesChart from './OtherExpensesChart';
import LaborTab from './LaborTab';
import MaterialsTab from './MaterialsTab';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

type AnalyticsTab = 'general' | 'labor' | 'materials';

const MetricCard = ({ label, value }: { label: string; value: number }) => (
    <Paper
        elevation={0}
        sx={{
            border: '1px solid #d0f0f4',
            borderRadius: 3,
            p: 2.5,
            background: 'linear-gradient(135deg, #ffffff 0%, #edfbfc 100%)',
            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(0,171,190,0.18)',
                borderColor: mainPrimaryColor,
            },
        }}
    >
        <ChatBubbleOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor, mb: 1 }} />
        <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>AMD {formatCurrencyRounded(value)}</Typography>
    </Paper>
);

const ParamCard = ({ label, icon, value }: { label: string; icon: React.ReactNode; value: number | string }) => (
    <Paper
        elevation={0}
        sx={{
            border: '1px solid #E8E8E8',
            borderRadius: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 18px rgba(0,171,190,0.14)',
                borderColor: mainPrimaryColor,
            },
        }}
    >
        <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.2 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
            <Box sx={{ color: mainPrimaryColor }}>{icon}</Box>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>{typeof value === 'number' ? formatCurrencyRounded(value) : value}</Typography>
        </Box>
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
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            {/* Left: 3 cost metric cards */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, flex: 3 }}>
                                <MetricCard label={t('Total Cost')} value={selectedEstimate!.totalCostWithOtherExpenses ?? selectedEstimate!.totalCost ?? 0} />
                                <MetricCard label={t('Labor Cost')} value={selectedEstimate!.laborTotalCost ?? 0} />
                                <MetricCard label={t('Materials Cost')} value={selectedEstimate!.materialTotalCost ?? 0} />
                            </Box>
                            {/* Right: 3 parameter cards stacked */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1.1, minWidth: 180 }}>
                                <ParamCard label={t('Quantity of Labor')} icon={<EngineeringIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.laborItemCount ?? 0} />
                                <ParamCard label={t('Quantity of Materials')} icon={<BuildIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.materialItemCount ?? 0} />
                                <ParamCard label={t('Unit Time')} icon={<AccessTimeIcon sx={{ fontSize: 24 }} />} value={0} />
                            </Box>
                        </Box>
                        <BreakdownTable estimate={selectedEstimate!} />
                        <OtherExpensesChart estimate={selectedEstimate!} />
                    </TabPanel>

                    <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                        <LaborTab estimate={selectedEstimate!} />
                    </TabPanel>

                    <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                        <MaterialsTab estimate={selectedEstimate!} />
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
