'use client';

import { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
    fromDate: string;
    toDate: string;
    onClose: () => void;
    onPrevious: () => void;
}

const TEAL_TOP = '#00ABBE';
const TEAL_BOTTOM = 'rgba(0,171,190,0.35)';
const GRID = 'rgba(0,0,0,0.06)';

export default function ChronologicalChartDialog({ open, sourceType, itemId, itemName, fromDate, toDate, onClose, onPrevious }: Props) {
    const { t } = useTranslation();
    const [data, setData] = useState<{ month: string; value: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !itemId) return;
        setLoading(true);
        setData([]);
        Api.requestSession<{ data: { month: string; value: number }[] }>({
            command: 'analysis/chronological/fetch_monthly_chart',
            json: { sourceType, itemId, fromDate, toDate },
        }).then((res) => {
            setData(res?.data ?? []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [open, sourceType, itemId, fromDate, toDate]);

    const yMax = data.length ? Math.max(...data.map((d) => d.value)) : 0;
    const yMin = data.length ? Math.min(...data.map((d) => d.value)) : 0;
    const pad = (yMax - yMin) * 0.1 || yMax * 0.1 || 100;
    const yDomain = [Math.max(0, yMin - pad), yMax + pad];

    const formatY = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
        return String(Math.round(v));
    };

    const formatMonth = (m: string) => {
        const [y, mo] = m.split('-');
        return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1.5 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {itemName}
                    </Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 1, minHeight: 360 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
                        <CircularProgress sx={{ color: mainPrimaryColor }} />
                    </Box>
                ) : data.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 1 }}>
                        <Typography color='text.secondary'>{t('No data for selected period')}</Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5, ml: 1 }}>
                            {fromDate} → {toDate}
                        </Typography>
                        <ResponsiveContainer width='100%' height={320}>
                            <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                                <defs>
                                    <linearGradient id='chronoBarGrad' x1='0' y1='0' x2='0' y2='1'>
                                        <stop offset='0%' stopColor={TEAL_TOP} />
                                        <stop offset='100%' stopColor={TEAL_BOTTOM} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={GRID} strokeWidth={0.8} vertical={false} />
                                <XAxis
                                    dataKey='month'
                                    tickFormatter={formatMonth}
                                    tick={{ fontSize: 11, fill: '#555' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#555' }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={yDomain}
                                    tickFormatter={formatY}
                                    width={56}
                                />
                                <Tooltip
                                    formatter={(v: any) => [Math.round(Number(v)).toLocaleString(), '']}
                                    labelFormatter={(label: any) => formatMonth(String(label))}
                                    contentStyle={{ borderRadius: 8, border: `1px solid ${mainPrimaryColor}`, fontSize: 13 }}
                                />
                                <Bar dataKey='value' fill='url(#chronoBarGrad)' radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                )}
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
