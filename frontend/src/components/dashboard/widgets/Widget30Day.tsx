'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import type { LiveSnapshot } from '../WidgetGroupCard';

interface Props {
    widget: any;
    onUpdate: () => void;
    liveSnapshots?: LiveSnapshot[];
    onClearLiveSnapshot?: (widgetId: string) => void;
}

export default function Widget30Day({ widget, onUpdate, liveSnapshots = [], onClearLiveSnapshot }: Props) {
    const [t] = useTranslation();
    const [data, setData] = useState<Array<{ date: string; value: number; ts: number }>>([]);
    const [avgValue, setAvgValue] = useState<number>(0);
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

            const chartData = result.snapshots.map((s: any) => {
                const ts = new Date(s.timestamp).getTime();
                return {
                    date: new Date(s.timestamp).toLocaleDateString(),
                    value: s.value,
                    ts
                };
            });
            setData(chartData);
            onClearLiveSnapshot?.(widget._id);

            if (result.analytics) {
                setAvgValue(result.analytics.avg);
            }
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
            return {
                date: d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                value: s.value,
                ts: d.getTime()
            };
        })
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
        <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='subtitle1' fontWeight='bold'>
                        {widget.name}
                    </Typography>
                    <IconButton onClick={handleDelete} size='small'>
                        <DeleteIcon fontSize='small' />
                    </IconButton>
                </Box>

                <Typography variant='caption' color='textSecondary' gutterBottom>
                    {t('30-Day Average')} • {widget.dataSource}
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : merged.length > 0 ? (
                    <>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant='h4' color='primary'>
                                {avgValue.toFixed(2)}
                            </Typography>
                            <Typography variant='caption' color='textSecondary'>
                                {t('Average Value')}
                            </Typography>
                        </Box>

                        <ResponsiveContainer width='100%' height={150}>
                            <AreaChart data={merged}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='date' />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type='monotone'
                                    dataKey='value'
                                    stroke='#00ABBE'
                                    fill='rgba(0, 171, 190, 0.2)'
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant='body2' color='textSecondary'>
                            {t('No data available yet. Data will appear after first snapshot.')}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
