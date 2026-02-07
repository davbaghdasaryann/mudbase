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
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

interface Props {
    widget: any;
    onUpdate: () => void;
}

export default function Widget15Day({ widget, onUpdate }: Props) {
    const [t] = useTranslation();
    const [snapshots, setSnapshots] = useState<Array<{ timestamp: string; value: number }>>([]);
    const [analytics, setAnalytics] = useState<{ min: number; max: number; avg: number } | null>(null);
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
            setSnapshots(result.snapshots || []);
            setAnalytics(result.analytics || null);
        } catch (error) {
            console.error('Failed to fetch widget data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const chartData =
        snapshots.length > 0 && analytics
            ? snapshots.map((s: any, i: number) => ({
                index: i + 1,
                time: new Date(s.timestamp).getTime(),
                value: s.value,
                high: analytics.max,
                low: analytics.min,
                medium: s.value
            }))
            : [];

    const currentValue = snapshots.length > 0 ? snapshots[snapshots.length - 1].value : analytics?.avg ?? 0;
    const firstValue = snapshots.length > 0 ? snapshots[0].value : currentValue;
    const percentChange =
        firstValue !== 0 ? (((currentValue - firstValue) / firstValue) * 100) : 0;
    const dateRange =
        chartData.length >= 2
            ? `${new Date(snapshots[0].timestamp).toLocaleDateString(undefined, { month: 'long' })} - ${new Date(snapshots[snapshots.length - 1].timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
            : '';

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                maxWidth: 340,
                minWidth: 280,
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
                            {t('15 days')}
                        </Typography>
                        <IconButton onClick={handleDelete} size="small" sx={{ ml: 0.25, p: 0.25 }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : chartData.length > 0 ? (
                    <>
                        <Box sx={{ mb: 1.5 }}>
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

                        <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis
                                    dataKey="index"
                                    tick={{ fontSize: 10 }}
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
                                    formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : '', '']}
                                    labelFormatter={(_, payload) =>
                                        payload?.[0]?.payload?.time
                                            ? new Date(payload[0].payload.time).toLocaleString()
                                            : ''
                                    }
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 10 }}
                                    iconType="circle"
                                    iconSize={6}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="high"
                                    stroke="#26a69a"
                                    strokeWidth={1.5}
                                    dot={false}
                                    name={t('High')}
                                    legendType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medium"
                                    stroke="#7b1fa2"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 4 }}
                                    name={t('Medium')}
                                    legendType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="low"
                                    stroke="#66bb6a"
                                    strokeWidth={1.5}
                                    dot={false}
                                    name={t('Low')}
                                    legendType="circle"
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        {dateRange && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {dateRange}
                            </Typography>
                        )}
                    </>
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
