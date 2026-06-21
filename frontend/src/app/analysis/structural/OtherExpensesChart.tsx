'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { ApiEstimate } from '@/api/estimate';

const BAR_GRADIENTS = [
    { top: '#00CCDD', bottom: '#00899B', stroke: '#006e7e' },
    { top: '#4EE89A', bottom: '#1CA461', stroke: '#148048' },
    { top: '#A8DED9', bottom: '#5CB8B0', stroke: '#44908a' },
    { top: '#27C97A', bottom: '#00855A', stroke: '#006644' },
    { top: '#6FE0D8', bottom: '#2BADA6', stroke: '#1e8880' },
    { top: '#00B28F', bottom: '#007060', stroke: '#005548' },
    { top: '#C5E8C6', bottom: '#7DB87E', stroke: '#5e9660' },
    { top: '#3DC9BF', bottom: '#1A8A84', stroke: '#116b66' },
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
            <Typography variant='body2' sx={{ color: '#00ABBE' }}>
                {Number(payload[0].value).toLocaleString()} AMD
            </Typography>
        </Paper>
    );
};

interface Props {
    estimate: ApiEstimate;
    height?: number;
}

export default function OtherExpensesChart({ estimate, height = 260 }: Props) {
    const { t } = useTranslation();

    const data = useMemo(() => {
        const expenses = estimate.otherExpenses ?? [];
        const base = estimate.totalCost ?? 0;
        return expenses.map((exp, i) => {
            const key = Object.keys(exp)[0] ?? '';
            const pct = exp[key] ?? 0;
            const grad = BAR_GRADIENTS[i % BAR_GRADIENTS.length];
            return {
                name: t(key) !== key ? t(key) : key,
                value: Math.round(base * pct / 100),
                gradId: `bar-grad-${i % BAR_GRADIENTS.length}`,
                dotColor: grad.top,
                stroke: grad.stroke,
            };
        }).filter(d => d.value > 0);
    }, [estimate, t]);

    if (data.length === 0) return null;

    const chartHeight = Math.max(100, height - 72);

    return (
        <Paper
            elevation={0}
            sx={{
                border: '1px solid #e0f0f4',
                borderRadius: 3,
                p: 2.5,
                background: '#fff',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
                {t('Other Expenses')}
            </Typography>
            <Box sx={{ flex: 1, minHeight: chartHeight }}>
            <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={data} margin={{ top: 4, right: 12, left: 4, bottom: 0 }} barCategoryGap='30%'>
                    <defs>
                        {BAR_GRADIENTS.map((g, i) => (
                            <linearGradient key={i} id={`bar-grad-${i}`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={g.top} />
                                <stop offset='100%' stopColor={g.bottom} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis dataKey='name' tick={false} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,171,190,0.06)' }} />
                    <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={64}>
                        {data.map((d) => (
                            <Cell key={d.name} fill={`url(#${d.gradId})`} stroke={d.stroke} strokeWidth={0.5} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                {data.map(d => (
                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: d.dotColor, flexShrink: 0 }} />
                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{d.name}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
