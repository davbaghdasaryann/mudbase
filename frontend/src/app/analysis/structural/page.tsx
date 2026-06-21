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
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded, formatCurrencyRoundedSymbol } from '@/lib/format_currency';

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
        <Typography variant='h6' sx={{ fontWeight: 700 }}>{formatCurrencyRoundedSymbol(value)}</Typography>
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

    const handleSelect = async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        try {
            const full = await Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: String(estimate._id) } });
            setSelectedEstimate(full ?? estimate);
        } catch {
            setSelectedEstimate(estimate);
        }
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
        <PageContents title='Structural Analytics' sx={{ overflow: 'hidden', pb: 0 }}>
            {/* Single flex-column wrapper that fills the Stack height */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {hasData && (
                    <>
                        {/* Project name + Create button — fixed, doesn't scroll */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mt: 1, mb: 0.5, flexShrink: 0 }}>
                            <Typography variant='h5' sx={{ fontWeight: 700, flex: 1 }}>
                                {selectedEstimate!.name}
                            </Typography>
                            <PageButton variant='outlined' label='Create' size='large' sx={{ ...outlinedCreateSx, flexShrink: 0 }} onClick={() => setDialogOpen(true)} />
                        </Box>

                        <TabContext value={activeTab}>
                            {/* Tab bar — fixed, doesn't scroll */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                                <TabList onChange={(_, v) => setActiveTab(v as AnalyticsTab)}>
                                    <Tab label={t('General')} value='general' />
                                    <Tab label={t('Labor')} value='labor' />
                                    <Tab label={t('Materials')} value='materials' />
                                </TabList>
                            </Box>

                            {/* Scrollable tab content only */}
                            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                                <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                                    {/* Top row: pie placeholder | bar chart | param cards */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch', mb: 2 }}>
                                        {/* Pie chart placeholder (empty for now) */}
                                        <Paper elevation={0} sx={{ flex: 1, border: '1px solid #e0f0f4', borderRadius: 3, p: 2.5, background: '#fff', minHeight: 220 }} />
                                        {/* Other Expenses bar chart */}
                                        <Box sx={{ flex: 1 }}>
                                            <OtherExpensesChart estimate={selectedEstimate!} height={220} />
                                        </Box>
                                        {/* Param cards stacked */}
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 1.5, flex: { xs: 'unset', md: 0.7 } }}>
                                            <ParamCard label={t('Quantity of Labor')} icon={<EngineeringIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.laborItemCount ?? 0} />
                                            <ParamCard label={t('Quantity of Materials')} icon={<BuildIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.materialItemCount ?? 0} />
                                            <ParamCard label={t('Unit Time')} icon={<AccessTimeIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.unitTime ?? 0} />
                                        </Box>
                                    </Box>
                                    {/* Bottom row: 3 metric cards */}
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                                        <MetricCard label={t('Total Cost')} value={selectedEstimate!.totalCostWithOtherExpenses ?? selectedEstimate!.totalCost ?? 0} />
                                        <MetricCard label={t('Materials Cost')} value={selectedEstimate!.materialTotalCost ?? 0} />
                                        <MetricCard label={t('Labor Cost')} value={selectedEstimate!.laborTotalCost ?? 0} />
                                    </Box>
                                    <BreakdownTable estimate={selectedEstimate!} />
                                </TabPanel>

                                <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                                    <LaborTab estimate={selectedEstimate!} />
                                </TabPanel>

                                <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                                    <MaterialsTab estimate={selectedEstimate!} />
                                </TabPanel>
                            </Box>
                        </TabContext>
                    </>
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
            </Box>

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
