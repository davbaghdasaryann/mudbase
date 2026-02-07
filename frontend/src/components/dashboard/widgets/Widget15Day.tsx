'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, IconButton, CircularProgress, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

interface Props {
    widget: any;
    onUpdate: () => void;
}

export default function Widget15Day({ widget, onUpdate }: Props) {
    const [t] = useTranslation();
    const [analytics, setAnalytics] = useState<any>(null);
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
            setAnalytics(result.analytics);
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
            console.error('Failed to delete widget:', error);
        }
    };

    const chartData = analytics ? [
        { metric: t('Min'), value: analytics.min },
        { metric: t('Avg'), value: analytics.avg },
        { metric: t('Max'), value: analytics.max }
    ] : [];

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
                    {t('15-Day Analytics')} • {widget.dataSource}
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : analytics ? (
                    <>
                        <ResponsiveContainer width='100%' height={180}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='metric' />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey='value' fill='#00ABBE' />
                            </BarChart>
                        </ResponsiveContainer>

                        <Stack direction='row' spacing={2} sx={{ mt: 2, justifyContent: 'space-around' }}>
                            <Box>
                                <Typography variant='caption' color='textSecondary'>{t('Min')}</Typography>
                                <Typography variant='body2' fontWeight='bold'>{analytics.min.toFixed(2)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant='caption' color='textSecondary'>{t('Avg')}</Typography>
                                <Typography variant='body2' fontWeight='bold'>{analytics.avg.toFixed(2)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant='caption' color='textSecondary'>{t('Max')}</Typography>
                                <Typography variant='body2' fontWeight='bold'>{analytics.max.toFixed(2)}</Typography>
                            </Box>
                        </Stack>
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
