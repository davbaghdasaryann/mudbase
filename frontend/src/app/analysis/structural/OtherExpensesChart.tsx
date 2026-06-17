'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { ApiEstimate } from '@/api/estimate';

const BAR_COLORS = [
    '#00ABBE',
    '#2ECC71',
    '#80CBC4',
    '#1CA461',
    '#4DD0C4',
    '#00897B',
    '#A5D6A7',
    '#26A69A',
];

const formatYAxis = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return String(Math.round(value));
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 140 }}>
            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
            <Typography variant='body2' sx={{ color: payload[0].fill }}>
                AMD {Number(payload[0].value).toLocaleString()}
            </Typography>
        </Paper>
    );
};

interface Props {
    estimate: ApiEstimate;
}

export default function OtherExpensesChart({ estimate }: Props) {
    const { t } = useTranslation();

    const data = useMemo(() => {
        const expenses = estimate.otherExpenses ?? [];
        const base = estimate.totalCost ?? 0;
        return expenses.map((exp, i) => {
            const name = Object.keys(exp)[0] ?? '';
            const pct = exp[name] ?? 0;
            return {
                name,
                value: Math.round(base * pct / 100),
                color: BAR_COLORS[i % BAR_COLORS.length],
            };
        }).filter(d => d.name);
    }, [estimate]);

    if (data.length === 0) return null;

    const renderLegend = () => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 1 }}>
            {data.map(d => (
                <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <Typography variant='caption' sx={{ color: 'text.secondary' }}>{d.name}</Typography>
                </Box>
            ))}
        </Box>
    );

    return (
        <Paper
            elevation={0}
            sx={{
                border: '1px solid #e0f0f4',
                borderRadius: 3,
                p: 2.5,
                mt: 2,
                background: '#fff',
            }}
        >
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 2 }}>
                {t('Other Expenses')}
            </Typography>
            <ResponsiveContainer width='100%' height={260}>
                <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap='30%'>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis dataKey='name' tick={false} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,171,190,0.06)' }} />
                    <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={80}>
                        {data.map((d, i) => (
                            <Cell key={d.name} fill={d.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            {renderLegend()}
        </Paper>
    );
}
