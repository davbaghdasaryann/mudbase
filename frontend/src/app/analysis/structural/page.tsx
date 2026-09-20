'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Tab, Paper, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
import CostBreakdownChart from './CostBreakdownChart';
import LaborTab from './LaborTab';
import MaterialsTab from './MaterialsTab';
import { mainPrimaryColor } from '@/theme';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded, formatCurrencyRoundedSymbol } from '@/lib/format_currency';

type AnalyticsTab = 'general' | 'labor' | 'materials';

interface StructuralRecord {
    _id: string;
    name: string;
    estimateId: string;
    activeTab: string;
    createdAt: string;
    updatedAt: string;
}

const MetricCard = ({ label, value }: { label: string; value: number }) => (
    <Paper elevation={0} sx={{
        border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5,
        background: 'linear-gradient(135deg, #ffffff 0%, #edfbfc 100%)',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)', borderColor: mainPrimaryColor },
    }}>
        <ChatBubbleOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor, mb: 1 }} />
        <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>{formatCurrencyRoundedSymbol(value)}</Typography>
    </Paper>
);

const ParamCard = ({ label, icon, value }: { label: string; icon: React.ReactNode; value: number | string }) => (
    <Paper elevation={0} sx={{
        border: '1px solid #E8E8E8', borderRadius: 3, p: 2,
        display: 'flex', flexDirection: 'column', gap: 0.5,
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,171,190,0.14)', borderColor: mainPrimaryColor },
    }}>
        <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.2 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
            <Box sx={{ color: mainPrimaryColor }}>{icon}</Box>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>{typeof value === 'number' ? formatCurrencyRounded(value) : value}</Typography>
        </Box>
    </Paper>
);

export default function StructuralAnalysisPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    // List state
    const [records, setRecords] = useState<StructuralRecord[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Detail state
    const [detail, setDetail] = useState<StructuralRecord | null>(null);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('general');

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load list on mount
    useEffect(() => {
        Api.requestSession<StructuralRecord[]>({ command: 'analysis/structural/fetch_all', args: {} })
            .then(data => { setRecords(data ?? []); setListLoading(false); })
            .catch(() => setListLoading(false));
    }, []);

    // Load detail when id changes
    useEffect(() => {
        if (!selectedId) { setDetail(null); setSelectedEstimate(null); return; }
        Api.requestSession<StructuralRecord>({ command: 'analysis/structural/fetch', args: { id: selectedId } })
            .then(rec => {
                if (!rec) return;
                setDetail(rec);
                setActiveTab((rec.activeTab as AnalyticsTab) ?? 'general');
                setEstimateLoading(true);
                Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: rec.estimateId } })
                    .then(full => { if (full) setSelectedEstimate(full); })
                    .catch(() => {})
                    .finally(() => setEstimateLoading(false));
            })
            .catch(() => {});
    }, [selectedId]);

    const triggerSave = useCallback((patch: Partial<StructuralRecord>) => {
        if (!selectedId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            Api.requestSession({ command: 'analysis/structural/update', args: { id: selectedId }, json: patch }).catch(() => {});
        }, 800);
    }, [selectedId]);

    const handleSelect = async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setCreating(true);
        try {
            const full = await Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: String(estimate._id) } }).catch(() => estimate);
            const est = full ?? estimate;
            const result = await Api.requestSession<{ _id: string }>({
                command: 'analysis/structural/create',
                json: { name: est.name, estimateId: String(est._id), activeTab: 'general' },
            });
            const newRec: StructuralRecord = {
                _id: String(result._id), name: est.name, estimateId: String(est._id),
                activeTab: 'general', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            };
            setRecords(prev => [newRec, ...prev]);
            router.push(`?id=${result._id}`);
        } finally { setCreating(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'analysis/structural/delete', args: { id } }).catch(() => {});
        setRecords(prev => prev.filter(r => r._id !== id));
    };

    const handleTabChange = (tab: AnalyticsTab) => {
        setActiveTab(tab);
        triggerSave({ activeTab: tab });
    };

    // ── List view ──────────────────────────────────────────────────────────
    if (!selectedId) {
        if (listLoading) return (
            <PageContents title='Structural Analytics' sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
            </PageContents>
        );

        if (records.length === 0) return (
            <PageContents title='Structural Analytics' sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 2 }}>
                    <AccountTreeIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No analytics created yet')}</Typography>
                    <PageButton variant='outlined' label={creating ? t('Loading...') : t('Create')} size='large' disabled={creating}
                        onClick={() => setDialogOpen(true)}
                        sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                    />
                </Box>
                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelect} />
            </PageContents>
        );

        return (
            <PageContents title='Structural Analytics' sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <PageButton variant='outlined' label={creating ? t('Loading...') : t('Create')} disabled={creating}
                            onClick={() => setDialogOpen(true)}
                            sx={{ borderRadius: '25px', height: '36px', '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                        />
                    </Box>
                    {records.map(rec => (
                        <Box key={rec._id} onClick={() => router.push(`?id=${rec._id}`)}
                            sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 2.5, py: 1.8, borderRadius: 2, border: '1px solid #e0f5f7',
                                backgroundColor: '#fafeff', cursor: 'pointer',
                                transition: 'box-shadow 0.15s, border-color 0.15s',
                                '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor },
                            }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <AccountTreeIcon sx={{ fontSize: 20, color: mainPrimaryColor, opacity: 0.7 }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.name}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>{new Date(rec.updatedAt).toLocaleDateString()}</Typography>
                                </Box>
                            </Box>
                            <Tooltip title={t('Delete')}>
                                <IconButton size='small' onClick={e => handleDelete(rec._id, e)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                    <DeleteOutlineIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ))}
                </Box>
                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelect} />
            </PageContents>
        );
    }

    // ── Detail view ────────────────────────────────────────────────────────
    if (estimateLoading || (selectedId && !detail)) return (
        <PageContents title='Structural Analytics' sx={{ pb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
        </PageContents>
    );

    if (!detail || !selectedEstimate) return null;

    return (
        <PageContents title='Structural Analytics' sx={{ pb: 0 }}>
            <Box>
                <Box sx={{ flexShrink: 0, mb: 0.5 }}>
                    <Button startIcon={<ArrowBackIcon fontSize='small' />} size='small'
                        onClick={() => router.push('/analysis/structural')}
                        sx={{ color: 'text.secondary', pl: 0, mb: 0.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}>
                        {t('Back')}
                    </Button>
                    <Typography variant='h5' sx={{ fontWeight: 700 }}>{selectedEstimate.name}</Typography>
                </Box>
                <TabContext value={activeTab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                        <TabList onChange={(_, v) => handleTabChange(v as AnalyticsTab)}>
                            <Tab label={t('General')} value='general' />
                            <Tab label={t('Labor')} value='labor' />
                            <Tab label={t('Materials')} value='materials' />
                        </TabList>
                    </Box>
                    <Box>
                        <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch', mb: 2 }}>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, minHeight: 180 }}>
                                    <Box sx={{ flex: 1 }}><CostBreakdownChart estimate={selectedEstimate} height={220} /></Box>
                                    <Box sx={{ flex: 1 }}><OtherExpensesChart estimate={selectedEstimate} height={220} /></Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 1.5, flex: { xs: 'unset', md: '0 0 220px' } }}>
                                    <ParamCard label={t('Quantity of Labor')} icon={<EngineeringIcon sx={{ fontSize: 24 }} />} value={selectedEstimate.laborItemCount ?? 0} />
                                    <ParamCard label={t('Quantity of Materials')} icon={<BuildIcon sx={{ fontSize: 24 }} />} value={selectedEstimate.materialItemCount ?? 0} />
                                    <ParamCard label={t('Unit Time')} icon={<AccessTimeIcon sx={{ fontSize: 24 }} />} value={selectedEstimate.unitTime ?? 0} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                                <MetricCard label={t('Total Cost')} value={selectedEstimate.totalCostWithOtherExpenses ?? selectedEstimate.totalCost ?? 0} />
                                <MetricCard label={t('Materials Cost')} value={selectedEstimate.materialTotalCost ?? 0} />
                                <MetricCard label={t('Labor Cost')} value={selectedEstimate.laborTotalCost ?? 0} />
                            </Box>
                            <BreakdownTable estimate={selectedEstimate} />
                        </TabPanel>
                        <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                            <LaborTab estimate={selectedEstimate} />
                        </TabPanel>
                        <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                            <MaterialsTab estimate={selectedEstimate} />
                        </TabPanel>
                    </Box>
                </TabContext>
            </Box>
        </PageContents>
    );
}
