'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { ApiEstimate } from '@/api/estimate';
import { type AylEntry } from '@/app/costing/PahestAylMaterials';

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

const ACTUAL_GRADIENTS = [
    { top: '#FF8A65', bottom: '#E64A19', stroke: '#bf360c' },
    { top: '#FFB74D', bottom: '#F57C00', stroke: '#e65100' },
    { top: '#F48FB1', bottom: '#C2185B', stroke: '#880e4f' },
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
    aylEntries?: AylEntry[];
}

export default function OtherExpensesChart({ estimate, height = 260, aylEntries }: Props) {
    const { t } = useTranslation();

    const estimateData = useMemo(() => {
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

    const actualData = useMemo(() => {
        if (!aylEntries) return [];
        const total = aylEntries.reduce((sum, e) => {
            const tsakh = parseFloat(e.tsakh || '0') || 0;
            const cpu = parseFloat(e.costPerUnit || '0') || 0;
            return sum + tsakh * cpu;
        }, 0);
        if (total <= 0) return [];
        const grad = ACTUAL_GRADIENTS[0];
        return [{
            name: 'Փոքրածավալ շիննյութեր',
            value: Math.round(total),
            gradId: 'actual-grad-0',
            dotColor: grad.top,
            stroke: grad.stroke,
        }];
    }, [aylEntries]);

    const hasEstimate = estimateData.length > 0;
    const hasActual = actualData.length > 0;

    if (!hasEstimate && !aylEntries) return null;

    const chartHeight = Math.max(80, height - 100);

    const renderChart = (data: { name: string; value: number; gradId: string; dotColor: string; stroke: string }[], gradPrefix: string) => (
        <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap='30%'>
                <defs>
                    {BAR_GRADIENTS.map((g, i) => (
                        <linearGradient key={i} id={`${gradPrefix}-grad-${i}`} x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor={g.top} />
                            <stop offset='100%' stopColor={g.bottom} />
                        </linearGradient>
                    ))}
                    {ACTUAL_GRADIENTS.map((g, i) => (
                        <linearGradient key={i} id={`actual-grad-${i}`} x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor={g.top} />
                            <stop offset='100%' stopColor={g.bottom} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis dataKey='name' tick={false} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={38} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,171,190,0.06)' }} />
                <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={56}>
                    {data.map((d) => (
                        <Cell key={d.name} fill={`url(#${d.gradId})`} stroke={d.stroke} strokeWidth={0.5} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );

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
            <Box sx={{ flex: 1, display: 'flex', gap: 1.5, minHeight: 0 }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textAlign: 'center', mb: 0.5 }}>Նախահաշիվ</Typography>
                    {hasEstimate ? (
                        <>
                            <Box sx={{ flex: 1, minHeight: chartHeight }}>
                                {renderChart(estimateData, 'bar')}
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}>
                                {estimateData.map(d => (
                                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: d.dotColor, flexShrink: 0 }} />
                                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{d.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: chartHeight }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#bbb' }}>—</Typography>
                        </Box>
                    )}
                </Box>
                {aylEntries && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textAlign: 'center', mb: 0.5 }}>Փաստացի</Typography>
                        {hasActual ? (
                            <>
                                <Box sx={{ flex: 1, minHeight: chartHeight }}>
                                    {renderChart(actualData, 'abar')}
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}>
                                    {actualData.map(d => (
                                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: d.dotColor, flexShrink: 0 }} />
                                            <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{d.name}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: chartHeight }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#bbb' }}>—</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
