'use client';

import { useState } from 'react';
import { Box, Stack, Typography, Tab, Paper } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ExtensionIcon from '@mui/icons-material/Extension';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '../structural/ChooseEstimationDialog';
import BreakdownTable from '../structural/BreakdownTable';
import LaborTab from '../structural/LaborTab';
import MaterialsTab from '../structural/MaterialsTab';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

type AnalyticsTab = 'general' | 'labor' | 'materials';

const cards = [
    { key: 'By Market Value', gradientId: 'comparativeGradientGreen' },
    { key: 'By Submitted Estimations', gradientId: 'comparativeGradientBlue' },
    { key: 'By Base Proposals', gradientId: 'comparativeGradientTeal' },
];

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

export default function ComparativeAnalysisPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('general');

    const hasData = !!selectedEstimate;

    const handleCardClick = (key: string) => {
        if (key === 'By Market Value') setDialogOpen(true);
    };

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
        setActiveTab('general');
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

            {hasData ? (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 0.5 }}>
                        <Typography variant='h5' sx={{ fontWeight: 700 }}>
                            {selectedEstimate!.name}
                        </Typography>
                        <PageButton variant='contained' label='Create' size='large' sx={{ borderRadius: '25px', height: '40px' }} onClick={() => setDialogOpen(true)} />
                    </Box>

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
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, flex: 3 }}>
                                    <MetricCard label={t('Total Cost')} value={selectedEstimate!.totalCostWithOtherExpenses ?? selectedEstimate!.totalCost ?? 0} />
                                    <MetricCard label={t('Labor Cost')} value={selectedEstimate!.laborTotalCost ?? 0} />
                                    <MetricCard label={t('Materials Cost')} value={selectedEstimate!.materialTotalCost ?? 0} />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1.1, minWidth: 180 }}>
                                    <ParamCard label={t('Quantity of Labor')} icon={<EngineeringIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.laborItemCount ?? 0} />
                                    <ParamCard label={t('Quantity of Materials')} icon={<BuildIcon sx={{ fontSize: 24 }} />} value={selectedEstimate!.materialItemCount ?? 0} />
                                    <ParamCard label={t('Unit Time')} icon={<AccessTimeIcon sx={{ fontSize: 24 }} />} value={0} />
                                </Box>
                            </Box>
                            <BreakdownTable estimate={selectedEstimate!} />
                        </TabPanel>

                        <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                            <LaborTab estimate={selectedEstimate!} />
                        </TabPanel>

                        <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                            <MaterialsTab estimate={selectedEstimate!} />
                        </TabPanel>
                    </TabContext>
                </>
            ) : (
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
            )}

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
