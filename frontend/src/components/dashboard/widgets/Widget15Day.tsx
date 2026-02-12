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
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
const TEXT_DARK = '#424242';
const GRID_STROKE = '#e8e8e8';
const HIGH_LINE = '#26a69a';
const MEDIUM_LINE = '#7b1fa2';
const LOW_LINE = '#66bb6a';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

interface Props {
    widget: any;
    onUpdate: () => void;
}

export default function Widget15Day({ widget, onUpdate }: Props) {
    const [t] = useTranslation();
    const [snapshots, setSnapshots] = useState<Array<{ timestamp: string; value: number }>>([]);
    const [analytics, setAnalytics] = useState<{ min: number; max: number; avg: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const isPreview = widget._id === 'preview';

    const fetchPreviewData = async () => {
        try {
            const result = await Api.requestSession<any>({
                command: 'dashboard/widget/widget_data_preview',
                json: {
                    widgetType: widget.widgetType,
                    dataSource: widget.dataSource,
                    dataSourceConfig: widget.dataSourceConfig,
                    name: widget.name,
                },
            });
            setSnapshots(result.snapshots || []);
            setAnalytics(result.analytics || null);
        } catch (error) {
            console.error('Failed to fetch preview data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        if (isPreview) return;
        try {
            const result = await Api.requestSession<any>({
                command: 'dashboard/widget/widget_data_fetch',
                args: { widgetId: widget._id },
            });
            setSnapshots(result.snapshots || []);
            setAnalytics(result.analytics || null);
        } catch (error) {
            console.error('Failed to fetch widget data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isPreview) {
            fetchPreviewData();
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [widget._id, isPreview, widget.widgetType, widget.dataSource, String(widget.dataSourceConfig?.itemId ?? widget.dataSourceConfig?.estimateId ?? '')]);

    const handleDelete = async () => {
        if (isPreview) return;
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
            elevation={0}
            sx={{
                position: 'relative',
                overflow: 'visible',
                height: '100%',
                maxWidth: 340,
                minWidth: 280,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderRadius: 2,
                boxShadow: CARD_SHADOW,
                border: 'none'
            }}
        >
            {!isPreview && (
            <IconButton
                onClick={handleDelete}
                size="small"
                sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    zIndex: 1,
                    p: 0.5,
                    bgcolor: 'rgba(0,0,0,0.06)',
                    color: TEXT_DARK,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                }}
            >
                <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
            )}
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{ fontSize: 17, fontWeight: 400, color: TEXT_DARK, maxWidth: '60%' }}
                        noWrap
                    >
                        {widget.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: TEXT_DARK }} />
                        <Typography variant="body2" sx={{ fontSize: 14, color: TEXT_DARK }}>
                            {t('15 days')}
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : chartData.length > 0 ? (
                    <>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                component="span"
                                sx={{ fontSize: 38, fontWeight: 700, color: '#212121', letterSpacing: 0 }}
                            >
                                {Math.round(currentValue).toLocaleString()}
                            </Typography>
                            <Typography component="span" sx={{ ml: 0.75, fontSize: 18, fontWeight: 400, color: TEXT_DARK }}>
                                AMD
                            </Typography>
                            <Chip
                                size="small"
                                icon={percentChange >= 0 ? <TrendingUpIcon sx={{ fontSize: 14, color: BADGE_GREEN_TEXT }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: '#c62828' }} />}
                                label={`${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1).replace('.', ',')}%`}
                                sx={{
                                    ml: 1.5,
                                    height: 22,
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    bgcolor: percentChange >= 0 ? BADGE_GREEN_BG : 'rgba(244,67,54,0.15)',
                                    color: percentChange >= 0 ? BADGE_GREEN_TEXT : '#c62828',
                                    borderRadius: 1.5,
                                    '& .MuiChip-icon': { color: 'inherit' }
                                }}
                            />
                        </Box>

                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                                <CartesianGrid stroke={GRID_STROKE} strokeWidth={0.8} vertical={true} horizontal={true} />
                                <XAxis
                                    dataKey="index"
                                    tick={{ fontSize: 11, fill: TEXT_DARK }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: TEXT_DARK }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                                />
                                <Tooltip
                                    formatter={(value: number | undefined) => [value != null ? Math.round(value).toLocaleString() : '', '']}
                                    labelFormatter={(_, payload) =>
                                        payload?.[0]?.payload?.time
                                            ? new Date(payload[0].payload.time).toLocaleString()
                                            : ''
                                    }
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: CARD_SHADOW }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="high"
                                    stroke={HIGH_LINE}
                                    strokeWidth={2}
                                    dot={{ r: 3.5, fill: HIGH_LINE }}
                                    activeDot={{ r: 4 }}
                                    name={t('High')}
                                    legendType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medium"
                                    stroke={MEDIUM_LINE}
                                    strokeWidth={2}
                                    dot={{ r: 3.5, fill: MEDIUM_LINE }}
                                    activeDot={{ r: 4 }}
                                    name={t('Medium')}
                                    legendType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="low"
                                    stroke={LOW_LINE}
                                    strokeWidth={2}
                                    dot={{ r: 3.5, fill: LOW_LINE }}
                                    activeDot={{ r: 4 }}
                                    name={t('Low')}
                                    legendType="circle"
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: HIGH_LINE }} />
                                    <Typography component="span" variant="caption" sx={{ fontSize: 12, color: TEXT_DARK }}>{t('High')}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: MEDIUM_LINE }} />
                                    <Typography component="span" variant="caption" sx={{ fontSize: 12, color: TEXT_DARK }}>{t('Medium')}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: LOW_LINE }} />
                                    <Typography component="span" variant="caption" sx={{ fontSize: 12, color: TEXT_DARK }}>{t('Low')}</Typography>
                                </Box>
                            </Box>
                            {dateRange && (
                                <Typography variant="caption" sx={{ fontSize: 12, color: TEXT_DARK }}>
                                    {dateRange}
                                </Typography>
                            )}
                        </Box>
                    </>
                ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: TEXT_DARK }}>
                            {t('No data available yet. Data will appear after first snapshot.')}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
