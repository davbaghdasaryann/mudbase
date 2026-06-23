'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Chip, IconButton } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDownOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import PageContents from '@/components/PageContents';
import { mainPrimaryColor } from '@/theme';
import ChronologicalCreateDialog, { ChronologicalSourceType } from './ChronologicalCreateDialog';
import ChronologicalListDialog from './ChronologicalListDialog';
import ChronologicalDateRangeDialog from './ChronologicalDateRangeDialog';
import ChronologicalBreakdownTable, { BreakdownItem } from './ChronologicalBreakdownTable';
import * as Api from '@/api';

type DialogState = 'none' | 'create' | ChronologicalSourceType | 'daterange';

interface AnalyticsResult {
    sourceType: ChronologicalSourceType;
    itemId: string;
    itemName: string;
    fromDate: string;
    toDate: string;
    data: { month: string; value: number }[];
    breakdown: { months: string[]; items: BreakdownItem[] } | null;
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

export default function ChronologicalAnalysisPage() {
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<DialogState>('none');
    const [selection, setSelection] = useState<SelectionParams | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
    const [chartLoading, setChartLoading] = useState(false);

    const listType = (dialog !== 'none' && dialog !== 'create' && dialog !== 'daterange')
        ? dialog as ChronologicalSourceType
        : null;

    const handleCreate = (itemId: string, itemName: string) => {
        if (!listType) return;
        setSelection({ sourceType: listType, itemId, itemName });
        setDialog('daterange');
    };

    const handleDone = (fromDate: string, toDate: string) => {
        if (!selection) return;
        setDialog('none');
        setChartLoading(true);
        setAnalytics(null);

        const isEstimate = selection.sourceType === 'list_of_estimates' || selection.sourceType === 'consolidated_estimates';

        const chartReq = Api.requestSession<{ data: { month: string; value: number }[] }>({
            command: 'analysis/chronological/fetch_monthly_chart',
            json: { sourceType: selection.sourceType, itemId: selection.itemId, fromDate, toDate },
        });

        const breakdownReq = isEstimate
            ? Api.requestSession<{ months: string[]; items: BreakdownItem[] }>({
                command: 'analysis/chronological/fetch_estimate_breakdown',
                json: { estimateId: selection.itemId, fromDate, toDate },
            })
            : Promise.resolve(null);

        Promise.all([chartReq, breakdownReq]).then(([chart, bd]) => {
            setAnalytics({
                ...selection,
                fromDate,
                toDate,
                data: chart?.data ?? [],
                breakdown: bd ?? null,
            });
            setChartLoading(false);
        }).catch(() => setChartLoading(false));
    };

    const AM_MONTHS = ['հնվ','փտվ','մրտ','ապր','մյս','հնս','հլս','օգս','սեպ','հոկ','նոյ','դեկ'];

    const formatMonth = (m: string) => {
        const [y, mo] = m.split('-');
        return `${AM_MONTHS[Number(mo) - 1]} ${y.slice(2)}`;
    };

    const formatMonthTooltip = (m: string) => {
        const [y, mo] = m.split('-');
        return `${AM_MONTHS[Number(mo) - 1]} ${y}`;
    };

    const formatY = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
        return String(Math.round(v));
    };

    const currentValue = analytics?.data?.length ? analytics.data[analytics.data.length - 1].value : 0;
    const firstValue = analytics?.data?.length ? analytics.data[0].value : currentValue;
    const pctChange = firstValue !== 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0;

    const activeValues = analytics?.data?.map((d) => d.value).filter((v) => v > 0) ?? [];
    const yMin = activeValues.length > 0 ? Math.min(...activeValues) : 0;
    const yMax = activeValues.length > 0 ? Math.max(...activeValues) : 0;
    const spread = yMax - yMin;
    const pad = spread > 0 ? spread * 0.15 : yMax * 0.02;
    const yDomain: [number, number] = activeValues.length > 1
        ? [Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]
        : [0, yMax > 0 ? yMax * 1.1 : 1];

    const showEmpty = !analytics && !chartLoading;

    return (
        <PageContents title='Chronological Analytics'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3, pb: 4 }}>
                {/* Empty state */}
                {showEmpty && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                        <TimelineIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                            {t('No analytics created yet')}
                        </Typography>
                        <Button
                            variant='outlined'
                            onClick={() => setDialog('create')}
                            sx={{
                                borderRadius: '25px',
                                height: '40px',
                                mt: 1,
                                borderColor: mainPrimaryColor,
                                color: mainPrimaryColor,
                                '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                            }}
                        >
                            {t('Create')}
                        </Button>
                    </Box>
                )}

                {/* Loading state */}
                {chartLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, pb: 8 }}>
                        <CircularProgress sx={{ color: mainPrimaryColor }} />
                    </Box>
                )}

                {/* Chart result */}
                {analytics && !chartLoading && (
                    <>
                    {/* Back button + title above card */}
                    <Box sx={{ flexShrink: 0, mb: 0.5 }}>
                        <Button
                            startIcon={<ArrowBackIcon fontSize='small' />}
                            size='small'
                            onClick={() => { setAnalytics(null); setSelection(null); }}
                            sx={{ color: 'text.secondary', pl: 0, mb: 0.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                        >
                            {t('Back')}
                        </Button>
                        <Typography sx={{ fontSize: 15, fontWeight: 500, color: TEXT_DARK }}>
                            {analytics.itemName}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            background: 'rgba(255,255,255,0.80)',
                            backdropFilter: 'blur(18px)',
                            borderRadius: 3,
                            border: '1px solid rgba(0,171,190,0.14)',
                            boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                            p: 3,
                        }}
                    >
                        {/* Header row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    {analytics.fromDate} → {analytics.toDate}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        </Box>

                        {/* Chart */}
                        {analytics.data.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Typography color='text.secondary'>{t('No data for selected period')}</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width='100%' height={340}>
                                <BarChart data={analytics.data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
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
                                    <Tooltip
                                        formatter={(v: any) => [Math.round(Number(v)).toLocaleString(), '']}
                                        labelFormatter={(label: any) => formatMonthTooltip(String(label))}
                                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: CARD_SHADOW, fontSize: 13 }}
                                    />
                                    <Bar dataKey='value' radius={[3, 3, 0, 0]} maxBarSize={40}>
                                        {analytics.data.map((_, index) => {
                                            const isLast = index === analytics.data.length - 1;
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
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
                    {/* Breakdown table for estimates */}
                    {analytics.breakdown && analytics.breakdown.items.length > 0 && (
                        <ChronologicalBreakdownTable
                            months={analytics.breakdown.months}
                            items={analytics.breakdown.items}
                        />
                    )}
                    </Box>
                    </>
                )}
            </Box>

            <ChronologicalCreateDialog
                open={dialog === 'create'}
                onClose={() => setDialog('none')}
                onContinue={(type) => setDialog(type)}
            />

            <ChronologicalListDialog
                open={listType !== null}
                type={listType}
                onClose={() => setDialog('none')}
                onPrevious={() => setDialog('create')}
                onCreate={handleCreate}
            />

            <ChronologicalDateRangeDialog
                open={dialog === 'daterange'}
                itemName={selection?.itemName ?? ''}
                onClose={() => setDialog('none')}
                onPrevious={() => setDialog(selection?.sourceType ?? 'create')}
                onDone={handleDone}
            />
        </PageContents>
    );
}
