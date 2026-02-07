'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    CircularProgress,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import type { LiveSnapshot } from '../WidgetGroupCard';

interface Props {
    widget: any;
    onUpdate: () => void;
    liveSnapshots?: LiveSnapshot[];
    onClearLiveSnapshot?: (widgetId: string) => void;
}

const BAR_COLOR = '#00ABBE';
const BAR_COLOR_LAST = '#b39ddb'; // light purple for most recent

export default function Widget30Day({ widget, onUpdate, liveSnapshots = [], onClearLiveSnapshot }: Props) {
    const [t] = useTranslation();
    const [data, setData] = useState<Array<{ month: string; value: number; ts: number; pctChange: number; isLast?: boolean }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [widget._id]);

    const fetchData = async () => {
        try {
            const result = await Api.requestSession<any>({
                command: 'dashboard/widget/widget_data_fetch',
                args: { widgetId: widget._id }
            });

            const raw = result.snapshots || [];
            const firstValue = raw.length > 0 ? raw[0].value : 0;
            const chartData = raw.map((s: any, i: number) => {
                const ts = new Date(s.timestamp).getTime();
                const value = s.value;
                const pctChange = firstValue !== 0 ? ((value - firstValue) / firstValue) * 100 : 0;
                return {
                    month: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short' }),
                    value: s.value,
                    ts,
                    pctChange,
                    isLast: i === raw.length - 1
                };
            });
            setData(chartData);
            onClearLiveSnapshot?.(widget._id);
        } catch (error) {
            console.error('Failed to fetch widget data:', error);
        } finally {
            setLoading(false);
        }
    };

    const liveForThis = liveSnapshots.filter((s) => s.widgetId === widget._id);
    const merged = [
        ...data,
        ...liveForThis.map((s) => {
            const d = new Date(s.timestamp);
            const firstVal = data.length > 0 ? data[0].value : s.value;
            const pctChange = firstVal !== 0 ? ((s.value - firstVal) / firstVal) * 100 : 0;
            return {
                month: d.toLocaleDateString(undefined, { month: 'short' }),
                value: s.value,
                ts: d.getTime(),
                pctChange,
                isLast: true
            };
        })
    ].sort((a, b) => a.ts - b.ts);

    if (merged.length > 0 && !merged[merged.length - 1].isLast) {
        merged[merged.length - 1] = { ...merged[merged.length - 1], isLast: true };
    }

    const currentValue = merged.length > 0 ? merged[merged.length - 1].value : 0;
    const firstValue = merged.length > 0 ? merged[0].value : currentValue;
    const percentChange = firstValue !== 0 ? (((currentValue - firstValue) / firstValue) * 100) : 0;

    const handleDelete = async () => {
        if (!confirm(t('Delete this widget?'))) return;

        try {
            await Api.requestSession({
                command: 'dashboard/widget/widget_delete',
                args: { widgetId: widget._id }
            });
            onUpdate();
        } catch (error) {
            console.error('Failed to delete widget data:', error);
        }
    };

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                width: '100%',
                minWidth: 400,
                maxWidth: 560,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, '&:lastChild': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="600" color="text.secondary" noWrap sx={{ maxWidth: '60%' }}>
                        {widget.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                            {t('30 days')}
                        </Typography>
                        <IconButton onClick={handleDelete} size="small" sx={{ ml: 0.25, p: 0.25 }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" component="span">
                        {currentValue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                        AMD
                    </Typography>
                    <Chip
                        size="small"
                        icon={percentChange >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : undefined}
                        label={`${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`}
                        sx={{
                            ml: 1,
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: percentChange >= 0 ? 'success.light' : 'error.light',
                            color: percentChange >= 0 ? 'success.dark' : 'error.dark'
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : merged.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={merged}
                            margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                            />
                            <Tooltip
                                formatter={(value: number) => [value.toLocaleString(), '']}
                                labelFormatter={(_, payload) =>
                                    payload?.[0]?.payload?.ts
                                        ? new Date(payload[0].payload.ts).toLocaleString()
                                        : ''
                                }
                            />
                            <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={24}>
                                {merged.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isLast ? BAR_COLOR_LAST : BAR_COLOR}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('No data available yet. Data will appear after first snapshot.')}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
