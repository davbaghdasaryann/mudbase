'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { ApiEstimate } from '@/api/estimate';

const SEGMENTS = [
    {
        key: 'labor',
        labelKey: 'Labor',
        gradId: 'pie-grad-labor',
        inner: '#00CCDD',
        outer: '#00899B',
        dot: '#00899B',
    },
    {
        key: 'materials',
        labelKey: 'Materials',
        gradId: 'pie-grad-materials',
        inner: '#4EE89A',
        outer: '#1CA461',
        dot: '#1CA461',
    },
    {
        key: 'other',
        labelKey: 'Other Expenses',
        gradId: 'pie-grad-other',
        inner: '#A8DED9',
        outer: '#5CB8B0',
        dot: '#5CB8B0',
    },
];

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 140 }}>
            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{entry.name}</Typography>
            <Typography variant='body2' sx={{ color: '#00ABBE' }}>
                {Number(entry.value).toLocaleString()} AMD
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                {entry.payload.pct}%
            </Typography>
        </Paper>
    );
};

export default function CostBreakdownChart({ estimate, height = 260 }: { estimate: ApiEstimate; height?: number }) {
    const { t } = useTranslation();
    const chartHeight = Math.max(100, height - 72);

    const data = useMemo(() => {
        const labor = estimate.laborTotalCost ?? 0;
        const materials = estimate.materialTotalCost ?? 0;
        const base = estimate.totalCost ?? 0;
        const withOther = estimate.totalCostWithOtherExpenses ?? base;
        const other = Math.max(0, withOther - base);
        const total = labor + materials + other;
        if (total === 0) return [];

        return [
            { key: 'labor',     name: t('Labor'),          value: labor,     pct: ((labor / total) * 100).toFixed(1) },
            { key: 'materials', name: t('Materials'),       value: materials, pct: ((materials / total) * 100).toFixed(1) },
            { key: 'other',     name: t('Other Expenses'),  value: other,     pct: ((other / total) * 100).toFixed(1) },
        ].filter(d => d.value > 0);
    }, [estimate, t]);

    return (
        <Paper
            elevation={0}
            sx={{
                flex: 1,
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
                {t('Cost Breakdown')}
            </Typography>

            {data.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>—</Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ flex: 1, minHeight: chartHeight }}>
                    <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                            <defs>
                                {SEGMENTS.map(s => (
                                    <radialGradient key={s.gradId} id={s.gradId} cx='50%' cy='50%' r='50%'>
                                        <stop offset='0%' stopColor={s.inner} />
                                        <stop offset='100%' stopColor={s.outer} />
                                    </radialGradient>
                                ))}
                            </defs>
                            <Pie
                                data={data}
                                cx='50%'
                                cy='50%'
                                innerRadius={42}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey='value'
                                strokeWidth={0}
                            >
                                {data.map((entry) => {
                                    const seg = SEGMENTS.find(s => s.key === entry.key);
                                    return (
                                        <Cell
                                            key={entry.key}
                                            fill={seg ? `url(#${seg.gradId})` : '#ccc'}
                                            stroke={seg?.outer ?? '#ccc'}
                                            strokeWidth={0.5}
                                        />
                                    );
                                })}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                        {data.map(d => {
                            const seg = SEGMENTS.find(s => s.key === d.key);
                            return (
                                <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: seg?.dot ?? '#ccc', flexShrink: 0 }} />
                                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                        {d.name} {d.pct}%
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}
        </Paper>
    );
}
