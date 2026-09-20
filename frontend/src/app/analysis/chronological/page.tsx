'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, CircularProgress, Chip, IconButton, Tooltip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDownOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';
import ChronologicalCreateDialog, { ChronologicalSourceType } from './ChronologicalCreateDialog';
import ChronologicalListDialog from './ChronologicalListDialog';
import ChronologicalDateRangeDialog from './ChronologicalDateRangeDialog';
import ChronologicalBreakdownTable, { BreakdownItem } from './ChronologicalBreakdownTable';
import * as Api from '@/api';
import PackageLock from '@/components/PackageLock';

type DialogState = 'none' | 'create' | ChronologicalSourceType | 'daterange';

interface ChronologicalRecord {
    _id: string;
    name: string;
    sourceType: ChronologicalSourceType;
    itemId: string;
    fromDate: string;
    toDate: string;
    createdAt: string;
    updatedAt: string;
}

interface SelectionParams {
    sourceType: ChronologicalSourceType;
    itemId: string;
    itemName: string;
}

const TEXT_DARK = '#424242';
const GRID_STROKE = 'rgba(0,0,0,0.05)';
const BAR_TOP = '#a8e6df';
const BAR_BOTTOM = '#007a6e';
const BAR_STROKE = '#005f56';
const BAR_LAST_TOP = '#e1bee7';
const BAR_LAST_BOTTOM = '#6a1b9a';
const BAR_LAST_STROKE = '#4a148c';
const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

const AM_MONTHS = ['հնվ','փտվ','մրտ','ապր','մյս','հնս','հլս','օգս','սեպ','հոկ','նոյ','դեկ'];
const formatMonth = (m: string) => { const [y, mo] = m.split('-'); return `${AM_MONTHS[Number(mo) - 1]} ${y.slice(2)}`; };
const formatMonthTooltip = (m: string) => { const [y, mo] = m.split('-'); return `${AM_MONTHS[Number(mo) - 1]} ${y}`; };
const formatY = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(Math.round(v));

function ChronologicalAnalysisPageInner() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    // List state
    const [records, setRecords] = useState<ChronologicalRecord[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Detail state
    const [chartData, setChartData] = useState<{ month: string; value: number }[]>([]);
    const [breakdown, setBreakdown] = useState<{ months: string[]; items: BreakdownItem[] } | null>(null);
    const [detailRecord, setDetailRecord] = useState<ChronologicalRecord | null>(null);
    const [chartLoading, setChartLoading] = useState(false);

    // Dialog state
    const [dialog, setDialog] = useState<DialogState>('none');
    const [selection, setSelection] = useState<SelectionParams | null>(null);

    const listType = (dialog !== 'none' && dialog !== 'create' && dialog !== 'daterange')
        ? dialog as ChronologicalSourceType : null;

    // Load list on mount
    useEffect(() => {
        Api.requestSession<ChronologicalRecord[]>({ command: 'analysis/chronological/fetch_all', args: {} })
            .then(data => { setRecords(data ?? []); setListLoading(false); })
            .catch(() => setListLoading(false));
    }, []);

    // Load detail when id changes
    useEffect(() => {
        if (!selectedId) { setDetailRecord(null); setChartData([]); setBreakdown(null); return; }
        setChartLoading(true);
        Api.requestSession<ChronologicalRecord>({ command: 'analysis/chronological/fetch', args: { id: selectedId } })
            .then(rec => {
                if (!rec) return;
                setDetailRecord(rec);
                const isEstimate = rec.sourceType === 'list_of_estimates' || rec.sourceType === 'consolidated_estimates';
                const chartReq = Api.requestSession<{ data: { month: string; value: number }[] }>({
                    command: 'analysis/chronological/fetch_monthly_chart',
                    json: { sourceType: rec.sourceType, itemId: rec.itemId, fromDate: rec.fromDate, toDate: rec.toDate },
                });
                const breakdownReq = isEstimate
                    ? Api.requestSession<{ months: string[]; items: BreakdownItem[] }>({
                        command: 'analysis/chronological/fetch_estimate_breakdown',
                        json: { estimateId: rec.itemId, sourceType: rec.sourceType, fromDate: rec.fromDate, toDate: rec.toDate },
                    })
                    : Promise.resolve(null);
                return Promise.all([chartReq, breakdownReq]).then(([chart, bd]) => {
                    setChartData(chart?.data ?? []);
                    setBreakdown(bd ?? null);
                });
            })
            .catch(() => {})
            .finally(() => setChartLoading(false));
    }, [selectedId]);

    const handleCreate = (itemId: string, itemName: string) => {
        if (!listType) return;
        setSelection({ sourceType: listType, itemId, itemName });
        setDialog('daterange');
    };

    const handleDone = async (fromDate: string, toDate: string) => {
        if (!selection) return;
        setDialog('none');
        setCreating(true);
        try {
            const result = await Api.requestSession<{ _id: string }>({
                command: 'analysis/chronological/create',
                json: { name: selection.itemName, sourceType: selection.sourceType, itemId: selection.itemId, fromDate, toDate },
            });
            const newRec: ChronologicalRecord = {
                _id: String(result._id),
                name: selection.itemName,
                sourceType: selection.sourceType,
                itemId: selection.itemId,
                fromDate,
                toDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setRecords(prev => [newRec, ...prev]);
            router.push(`?id=${result._id}`);
        } finally { setCreating(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'analysis/chronological/delete', args: { id } }).catch(() => {});
        setRecords(prev => prev.filter(r => r._id !== id));
    };

    // Chart calculations
    const currentValue = chartData.length ? chartData[chartData.length - 1].value : 0;
    const firstValue = chartData.length ? chartData[0].value : currentValue;
    const pctChange = firstValue !== 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0;
    const activeValues = chartData.map(d => d.value).filter(v => v > 0);
    const yMin = activeValues.length > 0 ? Math.min(...activeValues) : 0;
    const yMax = activeValues.length > 0 ? Math.max(...activeValues) : 0;
    const spread = yMax - yMin;
    const pad = spread > 0 ? spread * 0.15 : yMax * 0.02;
    const yDomain: [number, number] = activeValues.length > 1
        ? [Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]
        : [0, yMax > 0 ? yMax * 1.1 : 1];

    const dialogs = (
        <>
            <ChronologicalCreateDialog open={dialog === 'create'} onClose={() => setDialog('none')} onContinue={type => setDialog(type)} />
            <ChronologicalListDialog open={listType !== null} type={listType} onClose={() => setDialog('none')} onPrevious={() => setDialog('create')} onCreate={handleCreate} />
            <ChronologicalDateRangeDialog open={dialog === 'daterange'} itemName={selection?.itemName ?? ''} onClose={() => setDialog('none')} onPrevious={() => setDialog(selection?.sourceType ?? 'create')} onDone={handleDone} />
        </>
    );

    // ── List view ──────────────────────────────────────────────────────────
    if (!selectedId) {
        if (listLoading) return (
            <PageContents title='Chronological Analytics'>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
            </PageContents>
        );

        if (records.length === 0) return (
            <PageContents title='Chronological Analytics'>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 180px)', gap: 2 }}>
                    <TimelineIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No analytics created yet')}</Typography>
                    <PageButton
                        variant='outlined' label={creating ? t('Loading...') : t('Create')} size='large'
                        onClick={() => setDialog('create')} disabled={creating}
                        sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                    />
                </Box>
                {dialogs}
            </PageContents>
        );

        return (
            <PageContents title='Chronological Analytics'>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <PageButton
                            variant='outlined' label={creating ? t('Loading...') : t('Create')}
                            onClick={() => setDialog('create')} disabled={creating}
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
                                <TimelineIcon sx={{ fontSize: 20, color: mainPrimaryColor, opacity: 0.7 }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.name}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                                        {rec.fromDate} → {rec.toDate} · {new Date(rec.updatedAt).toLocaleDateString()}
                                    </Typography>
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
                {dialogs}
            </PageContents>
        );
    }

    // ── Detail view ────────────────────────────────────────────────────────
    if (chartLoading || (selectedId && !detailRecord)) return (
        <PageContents title='Chronological Analytics'>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
        </PageContents>
    );

    if (!detailRecord) return null;

    return (
        <PageContents title='Chronological Analytics'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3, pb: 4 }}>
                <Box sx={{ flexShrink: 0, mb: 0.5 }}>
                    <Button
                        startIcon={<ArrowBackIcon fontSize='small' />}
                        size='small'
                        onClick={() => router.push('/analysis/chronological')}
                        sx={{ color: 'text.secondary', pl: 0, mb: 0.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                    >
                        {t('Back')}
                    </Button>
                    <Typography variant='h5' sx={{ fontWeight: 700 }}>{detailRecord.name}</Typography>
                </Box>
                <Box sx={{
                    background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(18px)',
                    borderRadius: 3, border: '1px solid rgba(0,171,190,0.14)',
                    boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)', p: 3,
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant='body2' color='text.secondary'>
                            {detailRecord.fromDate} → {detailRecord.toDate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                            <Typography sx={{ fontSize: 26, fontWeight: 600, color: '#212121' }}>
                                {Math.round(currentValue).toLocaleString()}
                            </Typography>
                            <Typography sx={{ fontSize: 15, color: TEXT_DARK }}>AMD</Typography>
                            <Chip
                                size='small'
                                icon={pctChange >= 0
                                    ? <TrendingUpIcon sx={{ fontSize: 13, color: BADGE_GREEN_TEXT }} />
                                    : <TrendingDownIcon sx={{ fontSize: 13, color: '#c62828' }} />}
                                label={`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1).replace('.', ',')}%`}
                                sx={{
                                    height: 22, fontSize: '0.72rem', fontWeight: 500,
                                    bgcolor: pctChange >= 0 ? BADGE_GREEN_BG : 'rgba(244,67,54,0.15)',
                                    color: pctChange >= 0 ? BADGE_GREEN_TEXT : '#c62828',
                                    borderRadius: 1.5, '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        </Box>
                    </Box>
                    {chartData.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color='text.secondary'>{t('No data for selected period')}</Typography>
                        </Box>
                    ) : (
                        <ResponsiveContainer width='100%' height={340}>
                            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                                <defs>
                                    <linearGradient id='chronoTeal' x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='0%' stopColor={BAR_TOP} />
                                        <stop offset='100%' stopColor={BAR_BOTTOM} />
                                    </linearGradient>
                                    <linearGradient id='chronoPurple' x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='0%' stopColor={BAR_LAST_TOP} />
                                        <stop offset='100%' stopColor={BAR_LAST_BOTTOM} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={GRID_STROKE} strokeWidth={0.8} vertical={false} />
                                <XAxis dataKey='month' tickFormatter={formatMonth} tick={{ fontSize: 11, fill: TEXT_DARK }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: TEXT_DARK }} axisLine={false} tickLine={false} domain={yDomain} tickFormatter={formatY} width={56} />
                                <RechartsTooltip
                                    formatter={(v: any) => [Math.round(Number(v)).toLocaleString(), '']}
                                    labelFormatter={(label: any) => formatMonthTooltip(String(label))}
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: CARD_SHADOW, fontSize: 13 }}
                                />
                                <Bar dataKey='value' radius={[3, 3, 0, 0]} maxBarSize={40}>
                                    {chartData.map((_, index) => {
                                        const isLast = index === chartData.length - 1;
                                        return (
                                            <Cell key={`cell-${index}`}
                                                fill={isLast ? 'url(#chronoPurple)' : 'url(#chronoTeal)'}
                                                stroke={isLast ? BAR_LAST_STROKE : BAR_STROKE}
                                                strokeWidth={0.5}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    {breakdown && breakdown.items.length > 0 && (
                        <ChronologicalBreakdownTable months={breakdown.months} items={breakdown.items} />
                    )}
                </Box>
            </Box>
            {dialogs}
        </PageContents>
    );
}

export default function ChronologicalAnalysisPage() {
    return <PackageLock feature="analysis" pageTitle="Chronological Analysis"><ChronologicalAnalysisPageInner /></PackageLock>;
}
