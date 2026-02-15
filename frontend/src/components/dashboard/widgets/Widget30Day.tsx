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

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
const TEXT_DARK = '#424242';
const GRID_STROKE = '#e8e8e8';
const BAR_BLUE_TOP = '#5eb8e0';
const BAR_BLUE_BOTTOM = '#2a8fc2';
const BAR_BLUE_STROKE = '#1e6b8a';
const BAR_PURPLE_TOP = '#ceb3e8';
const BAR_PURPLE_BOTTOM = '#b39ddb';
const BAR_PURPLE_STROKE = '#7e57c2';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

export default function Widget30Day({ widget, onUpdate, liveSnapshots = [], onClearLiveSnapshot }: Props) {
    const [t] = useTranslation();
    const [data, setData] = useState<Array<{ day: string; value: number; ts: number; pctChange: number; isLast?: boolean }>>([]);
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
            const raw = result.snapshots || [];
            const chartData = raw.map((s: any, i: number) => {
                const ts = new Date(s.timestamp).getTime();
                const value = s.value;
                const prevValue = i > 0 ? raw[i - 1].value : value;
                const pctChange = prevValue !== 0 ? ((value - prevValue) / prevValue) * 100 : 0;
                return {
                    day: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    value: s.value,
                    ts,
                    pctChange,
                    isLast: i === raw.length - 1,
                };
            });
            setData(chartData);
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
            const raw = result.snapshots || [];
            const chartData = raw.map((s: any, i: number) => {
                const ts = new Date(s.timestamp).getTime();
                const value = s.value;
                const prevValue = i > 0 ? raw[i - 1].value : value;
                const pctChange = prevValue !== 0 ? ((value - prevValue) / prevValue) * 100 : 0;
                return {
                    day: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    value: s.value,
                    ts,
                    pctChange,
                    isLast: i === raw.length - 1,
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

    useEffect(() => {
        if (isPreview) {
            fetchPreviewData();
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [widget._id, isPreview, widget.widgetType, widget.dataSource, String(widget.dataSourceConfig?.itemId ?? widget.dataSourceConfig?.estimateId ?? '')]);

    const liveForThis = liveSnapshots.filter((s) => s.widgetId === widget._id);
    const merged = [
        ...data,
        ...liveForThis.map((s) => {
            const d = new Date(s.timestamp);
            return {
                day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                value: s.value,
                ts: d.getTime(),
                pctChange: 0,
                isLast: true
            };
        })
    ].sort((a, b) => a.ts - b.ts);

    if (merged.length > 0 && !merged[merged.length - 1].isLast) {
        merged[merged.length - 1] = { ...merged[merged.length - 1], isLast: true };
    }

    const currentValue = merged.length > 0 ? merged[merged.length - 1].value : 0;
    const previousDayValue = merged.length > 1 ? merged[merged.length - 2].value : currentValue;
    const percentChange = previousDayValue !== 0 ? (((currentValue - previousDayValue) / previousDayValue) * 100) : 0;

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

    return (
        <Card
            elevation={0}
            sx={{
                position: 'relative',
                overflow: 'visible',
                height: '100%',
                width: '100%',
                minWidth: 400,
                maxWidth: 560,
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
                            {t('30 days')}
                        </Typography>
                    </Box>
                </Box>

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

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : merged.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={merged} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                            <defs>
                                <linearGradient id="barBlueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={BAR_BLUE_TOP} />
                                    <stop offset="100%" stopColor={BAR_BLUE_BOTTOM} />
                                </linearGradient>
                                <linearGradient id="barPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={BAR_PURPLE_TOP} />
                                    <stop offset="100%" stopColor={BAR_PURPLE_BOTTOM} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={GRID_STROKE} strokeWidth={0.8} vertical={false} />
                            <XAxis
                                dataKey="day"
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
                                    payload?.[0]?.payload?.ts
                                        ? new Date(payload[0].payload.ts).toLocaleString()
                                        : ''
                                }
                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: CARD_SHADOW }}
                            />
                            <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={28}>
                                {merged.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isLast ? 'url(#barPurpleGrad)' : 'url(#barBlueGrad)'}
                                        stroke={entry.isLast ? BAR_PURPLE_STROKE : BAR_BLUE_STROKE}
                                        strokeWidth={0.5}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
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
