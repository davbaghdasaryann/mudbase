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

const AM_MONTHS_SHORT = ['Հնվ', 'Փտվ', 'Մրտ', 'Ապր', 'Մայ', 'Հնս', 'Հլս', 'Օգս', 'Սեպ', 'Հոկ', 'Նոյ', 'Դեկ'];
const AM_MONTHS_LONG = ['Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս', 'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր'];
const fmtDay = (d: Date) => `${d.getDate()} ${AM_MONTHS_SHORT[d.getMonth()]}`;
const fmtMonthYear = (d: Date) => `${AM_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
const fmtMonth = (d: Date) => AM_MONTHS_LONG[d.getMonth()];

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
const TEXT_DARK = '#424242';
const GRID_STROKE = 'rgba(0,0,0,0.05)';
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
        snapshots.length > 0
            ? snapshots.map((s: any, i: number) => ({
                index: i + 1,
                time: new Date(s.timestamp).getTime(),
                day: fmtDay(new Date(s.timestamp)),
                value: s.value,
                high: s.max ?? s.value,
                low: s.min ?? s.value,
                medium: s.value
            }))
            : [];

    const currentValue = snapshots.length > 0 ? snapshots[snapshots.length - 1].value : 0;
    const previousDayValue = snapshots.length > 1 ? snapshots[snapshots.length - 2].value : currentValue;
    const percentChange =
        previousDayValue !== 0 ? (((currentValue - previousDayValue) / previousDayValue) * 100) : 0;

    // Dynamic Y-axis: narrow to actual data spread including high/low lines
    const activeValues = snapshots.map((s: any) => [s.value, s.min, s.max]).flat().filter((v): v is number => typeof v === 'number' && v > 0);
    const yMin = activeValues.length > 0 ? Math.min(...activeValues) : 0;
    const yMax = activeValues.length > 0 ? Math.max(...activeValues) : 0;
    const spread = yMax - yMin;
    const pad = spread > 0 ? spread * 0.15 : yMax * 0.02;
    const yDomain: [number, number] = activeValues.length > 1
        ? [Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]
        : [0, yMax > 0 ? yMax * 1.1 : 1];
    const dateRange =
        chartData.length >= 2
            ? `${fmtMonth(new Date(snapshots[0].timestamp))} - ${fmtMonthYear(new Date(snapshots[snapshots.length - 1].timestamp))}`
            : '';

    return (
        <Card
            elevation={0}
            sx={{
                position: 'relative',
                overflow: 'visible',
                height: '100%',
                maxWidth: 460,
                minWidth: 340,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 3,
                boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,171,190,0.14)',
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{ fontSize: 17, fontWeight: 400, color: TEXT_DARK, maxWidth: '60%' }}
                        noWrap
                    >
                        {widget.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#43a047' }} />
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
                                sx={{ fontSize: 38, fontWeight: 600, color: '#212121', letterSpacing: 0 }}
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
                                    dataKey="day"
                                    tick={{ fontSize: 11, fill: TEXT_DARK }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: TEXT_DARK }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={yDomain}
                                    tickFormatter={(v) => {
                                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                                        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                                        return String(Math.round(v));
                                    }}
                                />
                                <Tooltip
                                    formatter={(value) => [value != null ? Math.round(Number(value)).toLocaleString() : '', '']}
                                    labelFormatter={(_, payload) =>
                                        payload?.[0]?.payload?.time
                                            ? (() => { const d = new Date(payload[0].payload.time); return `${fmtDay(d)} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; })()
                                            : ''
                                    }
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: CARD_SHADOW }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="high"
                                    stroke={HIGH_LINE}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: HIGH_LINE, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: HIGH_LINE, stroke: 'rgba(255,255,255,0.85)', strokeWidth: 2 }}
                                    name={t('High')}
                                    legendType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medium"
                                    stroke={MEDIUM_LINE}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: MEDIUM_LINE, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: MEDIUM_LINE, stroke: 'rgba(255,255,255,0.85)', strokeWidth: 2 }}
                                    name={t('Medium')}
                                    legendType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="low"
                                    stroke={LOW_LINE}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: LOW_LINE, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: LOW_LINE, stroke: 'rgba(255,255,255,0.85)', strokeWidth: 2 }}
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
