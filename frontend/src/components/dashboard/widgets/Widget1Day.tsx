'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import DescriptionIcon from '@mui/icons-material/Description';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import type { LiveSnapshot } from '../WidgetGroupCard';

interface Props {
    widget: any;
    onUpdate: () => void;
    liveSnapshots?: LiveSnapshot[];
    onClearLiveSnapshot?: (widgetId: string) => void;
}

export default function Widget1Day({ widget, onUpdate, liveSnapshots = [], onClearLiveSnapshot }: Props) {
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

    return (
        <Box sx={{ position: 'relative', overflow: 'visible' }}>
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
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                }}
            >
                <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
            )}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : merged.length > 0 ? (
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                    {showAllRows ? (
                        <List sx={{ py: 0 }}>
                            {merged.map((item: any, index: number) => {
                                const prevValue = index > 0 ? merged[index - 1].value : item.value;
                                const diff = item.value - prevValue;
                                const trendIcon = diff > 0 ? (
                                    <TrendingUpIcon sx={{ color: 'error.main' }} />
                                ) : diff < 0 ? (
                                    <TrendingDownIcon sx={{ color: 'success.main' }} />
                                ) : (
                                    <RemoveIcon sx={{ color: 'text.secondary' }} />
                                );
                                return (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            borderBottom: index < merged.length - 1 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                        }}
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {index > 0 && trendIcon}
                                                <Typography variant='body1' fontWeight='bold'>
                                                    {Math.round(item.value).toLocaleString()} AMD
                                                </Typography>
                                            </Box>
                                        }
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <DescriptionIcon color='primary' />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.time}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    ) : (
                        <>
                            <ListItem
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {merged.length > 1 && (() => {
                                            const last = merged[merged.length - 1];
                                            const prev = merged[merged.length - 2];
                                            const diff = last.value - prev.value;
                                            return diff > 0 ? (
                                                <TrendingUpIcon sx={{ color: 'error.main' }} />
                                            ) : diff < 0 ? (
                                                <TrendingDownIcon sx={{ color: 'success.main' }} />
                                            ) : (
                                                <RemoveIcon sx={{ color: 'text.secondary' }} />
                                            );
                                        })()}
                                        <Typography variant='body1' fontWeight='bold'>
                                            {Math.round(merged[merged.length - 1].value).toLocaleString()} AMD
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowAllRows(true)}
                                            sx={{ color: 'text.secondary', p: 0.25 }}
                                            aria-label={t('Show all changes')}
                                        >
                                            <InfoOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <DescriptionIcon color='primary' />
                                </ListItemIcon>
                                <ListItemText
                                    primary={widget.name}
                                    secondary={merged[merged.length - 1].time}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                        </>
                    )}
                    {showAllRows && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button size="small" onClick={() => setShowAllRows(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                                {t('Show less')}
                            </Button>
                        </Box>
                    )}
                </Box>
            ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant='body2' color='textSecondary'>
                        {t('No data available yet. Data will appear after first snapshot.')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
