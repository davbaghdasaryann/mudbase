'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { ApiEstimate } from '@/api/estimate';

const DAY_W = 36;
const ITEM_ROW_H = 36;
const SEC_ROW_H = 40;
const NAME_COL_W = 220;

const SECTION_COLORS = [
    '#0d3b2e',
    '#1a4a6b',
    '#1c3a1c',
    '#2c2c5e',
    '#3b1f1f',
    '#1f3b3b',
];

const BAR_COLORS = [
    '#1DB954',
    '#00ABBE',
    '#2ECC71',
    '#0288D1',
    '#1CA461',
    '#26A69A',
];

interface GanttItem {
    name: string;
    quantity: number;
    laborHours: number;
}

interface GanttSection {
    name: string;
    items: GanttItem[];
}

interface GanttData {
    sections: GanttSection[];
}

interface FlatRow {
    type: 'section' | 'item';
    name: string;
    colorIndex: number;
    start?: number;
    duration?: number;
}

interface Props {
    estimate: ApiEstimate;
}

export default function GanttChart({ estimate }: Props) {
    const { t } = useTranslation();
    const [data, setData] = useState<GanttData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setData(null);
        Api.requestSession<GanttData>({
            command: 'estimate/fetch_gantt_data',
            args: { estimateId: estimate._id },
        })
            .then(d => setData(d ?? null))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [estimate._id]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
        </Box>
    );

    if (!data || data.sections.length === 0) return (
        <Typography variant='body2' color='text.disabled' sx={{ textAlign: 'center', py: 6 }}>
            {t('No labor items found')}
        </Typography>
    );

    // Build flat row list with sequential day tracking
    const rows: FlatRow[] = [];
    let currentDay = 1;

    data.sections.forEach((section, si) => {
        rows.push({ type: 'section', name: section.name, colorIndex: si });
        section.items.forEach(item => {
            const lh = item.laborHours ?? 0;
            const hours = lh > 0 ? (item.quantity ?? 0) / lh : 0;
            const duration = Math.max(1, Math.ceil(hours / 8));
            rows.push({ type: 'item', name: item.name, colorIndex: si, start: currentDay, duration });
            currentDay += duration;
        });
    });

    const totalDays = currentDay - 1;
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
        <Paper
            elevation={0}
            sx={{ border: '1px solid #e0f0f4', borderRadius: 3, overflow: 'hidden', mt: 3 }}
        >
            {/* Chart title */}
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e8e8e8', background: '#fafafa' }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                    {estimate.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                    {t('Total duration')}: {totalDays} {t('days')} ({t('8-hour workdays')})
                </Typography>
            </Box>

            {/* Scrollable Gantt area */}
            <Box sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520 }}>
                <Box sx={{ display: 'inline-flex', flexDirection: 'column', minWidth: NAME_COL_W + totalDays * DAY_W }}>

                    {/* Header row: days */}
                    <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: '#1a2e2a' }}>
                        <Box sx={{
                            width: NAME_COL_W,
                            flexShrink: 0,
                            px: 2,
                            py: 1,
                            position: 'sticky',
                            left: 0,
                            zIndex: 4,
                            background: '#1a2e2a',
                            borderRight: '2px solid #2d4a44',
                        }}>
                            <Typography variant='caption' sx={{ color: '#aaa', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                {t('Task')}
                            </Typography>
                        </Box>
                        {days.map(d => (
                            <Box key={d} sx={{
                                width: DAY_W,
                                flexShrink: 0,
                                textAlign: 'center',
                                py: 1,
                                borderRight: '1px solid #2d4a44',
                                color: '#aad4c8',
                                fontSize: '0.65rem',
                                fontWeight: d % 5 === 0 ? 700 : 400,
                            }}>
                                {d % 5 === 0 || d === 1 ? d : ''}
                            </Box>
                        ))}
                    </Box>

                    {/* Data rows */}
                    {rows.map((row, ri) => {
                        if (row.type === 'section') {
                            const bg = SECTION_COLORS[row.colorIndex % SECTION_COLORS.length];
                            return (
                                <Box key={ri} sx={{ display: 'flex', height: SEC_ROW_H, background: bg, alignItems: 'center' }}>
                                    <Box sx={{
                                        width: NAME_COL_W,
                                        flexShrink: 0,
                                        px: 2,
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 2,
                                        background: bg,
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRight: '2px solid rgba(255,255,255,0.1)',
                                    }}>
                                        <Typography variant='caption' sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em' }} noWrap>
                                            {row.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, height: '100%', borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
                                </Box>
                            );
                        }

                        // Item row
                        const barColor = BAR_COLORS[row.colorIndex % BAR_COLORS.length];
                        const startOffset = ((row.start ?? 1) - 1) * DAY_W;
                        const barWidth = (row.duration ?? 1) * DAY_W - 2;
                        const isEven = ri % 2 === 0;

                        return (
                            <Box key={ri} sx={{ display: 'flex', height: ITEM_ROW_H, background: isEven ? '#fff' : '#f8fffe', alignItems: 'center', '&:hover': { background: '#f0fbfa' } }}>
                                {/* Sticky name cell */}
                                <Box sx={{
                                    width: NAME_COL_W,
                                    flexShrink: 0,
                                    px: 2,
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 2,
                                    background: isEven ? '#fff' : '#f8fffe',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRight: '2px solid #e8f4f0',
                                }}>
                                    <Typography variant='caption' sx={{ color: '#333', fontSize: '0.73rem', lineHeight: 1.2 }} noWrap title={row.name}>
                                        {row.name}
                                    </Typography>
                                </Box>

                                {/* Bar area */}
                                <Box sx={{ position: 'relative', flex: 1, height: '100%', borderBottom: '1px solid #f0f0f0' }}>
                                    {/* Grid lines */}
                                    {days.filter(d => d % 5 === 0).map(d => (
                                        <Box key={d} sx={{
                                            position: 'absolute',
                                            left: (d - 1) * DAY_W,
                                            top: 0, bottom: 0,
                                            width: 1,
                                            background: '#e8e8e8',
                                        }} />
                                    ))}
                                    {/* Task bar */}
                                    <Box sx={{
                                        position: 'absolute',
                                        left: startOffset + 1,
                                        top: 5,
                                        height: ITEM_ROW_H - 10,
                                        width: barWidth,
                                        background: barColor,
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 0.8,
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                                    }}>
                                        <Typography sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {row.duration}d
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Paper>
    );
}
