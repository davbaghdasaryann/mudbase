'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, IconButton, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30 * 60 * 1000); // Refresh every 30 min
        return () => clearInterval(interval);
    }, [widget._id]);

    const fetchData = async () => {
        try {
            const result = await Api.requestSession<any>({
                command: 'dashboard/widget/widget_data_fetch',
                args: { widgetId: widget._id }
            });

            const chartData = result.snapshots.map((s: any) => {
                const ts = new Date(s.timestamp).getTime();
                return {
                    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: s.value,
                    ts
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
        ...liveForThis.map((s) => ({
            time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: s.value,
            ts: new Date(s.timestamp).getTime()
        }))
    ].sort((a, b) => a.ts - b.ts);

    const handleDelete = async () => {
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
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Box>
                    <Typography variant='h6' fontWeight='bold'>
                        {widget.name}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                        {t('1-Day Trend')} • {widget.dataSource}
                    </Typography>
                </Box>
                <IconButton onClick={handleDelete} size='small'>
                    <DeleteIcon fontSize='small' />
                </IconButton>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : merged.length > 0 ? (
                <List sx={{ py: 0, bgcolor: 'background.paper', borderRadius: 1 }}>
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
                                    borderColor: 'divider'
                                }}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {index > 0 && trendIcon}
                                        <Typography variant='body1' fontWeight='bold'>
                                            {item.value.toLocaleString()} AMD
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
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant='body2' color='textSecondary'>
                        {t('No data available yet. Data will appear after first snapshot.')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
