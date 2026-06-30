'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import type { LiveSnapshot } from '../WidgetGroupCard';

interface Props {
    widget: any;
    onUpdate: () => void;
    liveSnapshots?: LiveSnapshot[];
    onClearLiveSnapshot?: (widgetId: string) => void;
    grouped?: boolean;
}

export default function Widget1Day({ widget, onUpdate, liveSnapshots = [], onClearLiveSnapshot, grouped = false }: Props) {
    const [t] = useTranslation();
    const [data, setData] = useState<Array<{ time: string; value: number; ts: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [showAllRows, setShowAllRows] = useState(false);

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
            const chartData = (result.snapshots || []).map((s: any) => {
                const ts = new Date(s.timestamp).getTime();
                return {
                    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: s.value,
                    ts,
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
            const chartData = (result.snapshots || []).map((s: any) => {
                const ts = new Date(s.timestamp).getTime();
                return {
                    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: s.value,
                    ts,
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
        ...liveForThis.map((s) => ({
            time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: s.value,
            ts: new Date(s.timestamp).getTime()
        }))
    ].sort((a, b) => a.ts - b.ts);

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
            console.error('Failed to delete widget:', error);
        }
    };

    const latestValue = merged.length > 0 ? merged[merged.length - 1] : null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTs = todayStart.getTime();
    const yesterdaySnapshots = merged.filter(s => s.ts < todayStartTs);
    const yesterdayValue = yesterdaySnapshots.length > 0
        ? yesterdaySnapshots[yesterdaySnapshots.length - 1].value
        : null;

    const diff = latestValue && yesterdayValue !== null ? latestValue.value - yesterdayValue : 0;
    const trendIcon = diff > 0
        ? <TrendingUpIcon sx={{ fontSize: 14, color: 'error.main' }} />
        : diff < 0
            ? <TrendingDownIcon sx={{ fontSize: 14, color: 'success.main' }} />
            : <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#F9A825' }} />;

    const rowContent = loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
        </Box>
    ) : latestValue ? (
        <>
            {showAllRows ? (
                <List sx={{ py: 0 }}>
                    {merged.map((item: any, index: number) => {
                        const pv = index > 0 ? merged[index - 1].value : item.value;
                        const d = item.value - pv;
                        const icon = d > 0
                            ? <TrendingUpIcon sx={{ fontSize: 14, color: 'error.main' }} />
                            : d < 0
                                ? <TrendingDownIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                : <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#F9A825' }} />;
                        return (
                            <ListItem
                                key={index}
                                sx={{ px: 1.5, minHeight: 50, borderBottom: '1px solid rgba(0,0,0,0.06)', transition: 'background 0.15s', '&:hover': { background: 'rgba(0,171,190,0.06)' } }}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        {index > 0 && icon}
                                        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
                                            {Math.round(item.value).toLocaleString()} AMD
                                        </Typography>
                                    </Box>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    <DescriptionIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={widget.name}
                                    primaryTypographyProps={{ variant: 'body2', sx: { fontSize: 14, fontWeight: 500 } }}
                                />
                            </ListItem>
                        );
                    })}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, py: 0.25, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <Button size="small" onClick={() => setShowAllRows(false)} sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 12 }}>
                            {t('Show less')}
                        </Button>
                    </Box>
                </List>
            ) : (
                <List sx={{ py: 0 }}>
                    <ListItem
                        sx={{ px: 1.5, minHeight: 50, transition: 'background 0.15s', '&:hover': { background: 'rgba(0,171,190,0.06)' } }}
                        secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {merged.length > 1 && trendIcon}
                                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
                                    {Math.round(latestValue.value).toLocaleString()} AMD
                                </Typography>
                                {!isPreview && (
                                    <IconButton
                                        size="small"
                                        onClick={handleDelete}
                                        sx={{ color: 'text.disabled', p: 0.25, '&:hover': { color: 'error.main' } }}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                )}
                            </Box>
                        }
                    >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <DescriptionIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={widget.name}
                            primaryTypographyProps={{ variant: 'body2', sx: { fontSize: 14, fontWeight: 500 } }}
                        />
                    </ListItem>
                </List>
            )}
        </>
    ) : (
        <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='textSecondary' sx={{ fontSize: 12 }}>
                {t('No data available yet. Data will appear after first snapshot.')}
            </Typography>
        </Box>
    );

    if (grouped) {
        return (
            <Box>
                {rowContent}
            </Box>
        );
    }

    return (
        <Box sx={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 3,
            boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,171,190,0.14)',
            overflow: 'hidden',
        }}>
            {rowContent}
        </Box>
    );
}
