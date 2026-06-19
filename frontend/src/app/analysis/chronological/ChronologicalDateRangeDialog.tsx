'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, CircularProgress, IconButton, TextField, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';
import * as Api from '@/api';

interface Props {
    open: boolean;
    sourceType: string;
    itemId: string | null;
    itemName: string;
    onClose: () => void;
    onPrevious: () => void;
}

const TODAY = new Date().toISOString().slice(0, 10);
const FROM_DEFAULT = '2023-01-01';

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
const TEXT_DARK = '#424242';
const GRID_STROKE = 'rgba(0,0,0,0.05)';
const BAR_TOP = '#a8e6df';
const BAR_BOTTOM = '#007a6e';
const BAR_STROKE = '#005f56';
const BAR_LAST_TOP = '#e1bee7';
const BAR_LAST_BOTTOM = '#6a1b9a';
const BAR_LAST_STROKE = '#4a148c';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

export default function ChronologicalDateRangeDialog({ open, sourceType, itemId, itemName, onClose, onPrevious }: Props) {
    const { t } = useTranslation();
    const [fromDate, setFromDate] = useState(FROM_DEFAULT);
    const [toDate, setToDate] = useState(TODAY);
    const [data, setData] = useState<{ month: string; value: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchData = (from: string, to: string) => {
        if (!itemId) return;
        setLoading(true);
        Api.requestSession<{ data: { month: string; value: number }[] }>({
            command: 'analysis/chronological/fetch_monthly_chart',
            json: { sourceType, itemId, fromDate: from, toDate: to },
        }).then((res) => {
            setData(res?.data ?? []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    // Fetch on open
    useEffect(() => {
        if (!open || !itemId) return;
        setData([]);
        setFromDate(FROM_DEFAULT);
        setToDate(TODAY);
        fetchData(FROM_DEFAULT, TODAY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, itemId]);

    // Debounce on date change
    const handleDateChange = (from: string, to: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchData(from, to), 600);
    };

    const formatMonth = (m: string) => {
        const [y, mo] = m.split('-');
        return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    };

    const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
    const firstValue = data.length > 0 ? data[0].value : currentValue;
    const pctChange = firstValue !== 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0;

    const activeValues = data.map((d) => d.value).filter((v) => v > 0);
    const yMin = activeValues.length > 0 ? Math.min(...activeValues) : 0;
    const yMax = activeValues.length > 0 ? Math.max(...activeValues) : 0;
    const spread = yMax - yMin;
    const pad = spread > 0 ? spread * 0.15 : yMax * 0.02;
    const yDomain: [number, number] = activeValues.length > 1
        ? [Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]
        : [0, yMax > 0 ? yMax * 1.1 : 1];

    const formatY = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
        return String(Math.round(v));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{
                sx: {
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    borderRadius: 3,
                    border: '1px solid rgba(0,171,190,0.16)',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
                },
            }}
        >
            <DialogTitle sx={{ pb: 1.5 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 600,
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            maxWidth: '55%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {itemName}
                    </Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 1 }}>
                {/* Date range row */}
                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                    <TextField
                        type='date'
                        size='small'
                        label={t('From')}
                        value={fromDate}
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            handleDateChange(e.target.value, toDate);
                        }}
                        inputProps={{ min: '2023-01-01', max: TODAY }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ width: 152 }}
                    />
                    <TextField
                        type='date'
                        size='small'
                        label={t('To')}
                        value={toDate}
                        onChange={(e) => {
                            setToDate(e.target.value);
                            handleDateChange(fromDate, e.target.value);
                        }}
                        inputProps={{ min: '2023-01-01', max: TODAY }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ width: 152 }}
                    />
                    <Box sx={{ flex: 1 }} />
                    {/* Summary */}
                    {!loading && data.length > 0 && (
                        <Stack direction='row' alignItems='baseline' spacing={0.75}>
                            <Typography sx={{ fontSize: 22, fontWeight: 600, color: '#212121' }}>
                                {Math.round(currentValue).toLocaleString()}
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: TEXT_DARK }}>AMD</Typography>
                            <Chip
                                size='small'
                                icon={
                                    pctChange >= 0
                                        ? <TrendingUpIcon sx={{ fontSize: 13, color: BADGE_GREEN_TEXT }} />
                                        : <TrendingDownIcon sx={{ fontSize: 13, color: '#c62828' }} />
                                }
                                label={`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1).replace('.', ',')}%`}
                                sx={{
                                    height: 22,
                                    fontSize: '0.72rem',
                                    fontWeight: 500,
                                    bgcolor: pctChange >= 0 ? BADGE_GREEN_BG : 'rgba(244,67,54,0.15)',
                                    color: pctChange >= 0 ? BADGE_GREEN_TEXT : '#c62828',
                                    borderRadius: 1.5,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        </Stack>
                    )}
                </Stack>

                {/* Chart */}
                <Box sx={{ minHeight: 300 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                            <CircularProgress sx={{ color: mainPrimaryColor }} size={36} />
                        </Box>
                    ) : data.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                            <Typography color='text.secondary'>{t('No data for selected period')}</Typography>
                        </Box>
                    ) : (
                        <ResponsiveContainer width='100%' height={300}>
                            <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                                <defs>
                                    <linearGradient id='chronoBarTeal' x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='0%' stopColor={BAR_TOP} />
                                        <stop offset='100%' stopColor={BAR_BOTTOM} />
                                    </linearGradient>
                                    <linearGradient id='chronoBarPurple' x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='0%' stopColor={BAR_LAST_TOP} />
                                        <stop offset='100%' stopColor={BAR_LAST_BOTTOM} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={GRID_STROKE} strokeWidth={0.8} vertical={false} />
                                <XAxis
                                    dataKey='month'
                                    tickFormatter={formatMonth}
                                    tick={{ fontSize: 11, fill: TEXT_DARK }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: TEXT_DARK }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={yDomain}
                                    tickFormatter={formatY}
                                    width={56}
                                />
                                <Tooltip
                                    formatter={(v: any) => [Math.round(Number(v)).toLocaleString(), '']}
                                    labelFormatter={(label: any) => formatMonth(String(label))}
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: CARD_SHADOW, fontSize: 13 }}
                                />
                                <Bar dataKey='value' radius={[3, 3, 0, 0]} maxBarSize={40}>
                                    {data.map((_, index) => {
                                        const isLast = index === data.length - 1;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isLast ? 'url(#chronoBarPurple)' : 'url(#chronoBarTeal)'}
                                                stroke={isLast ? BAR_LAST_STROKE : BAR_STROKE}
                                                strokeWidth={0.5}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onPrevious} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Previous')}
                </Button>
                <Button
                    variant='contained'
                    onClick={onClose}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#007a6e' } }}
                >
                    {t('Done')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
