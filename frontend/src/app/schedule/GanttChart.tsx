'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { ApiEstimate } from '@/api/estimate';

const DAY_W = 38;
const ITEM_ROW_H = 38;
const SEC_ROW_H = 44;
const NAME_COL_W = 300;
const TEAL = '#00ABBE';
const TEAL_DARK = '#007f8c';
const TEAL_LIGHT = 'rgba(0,171,190,0.12)';
const TEAL_MID = 'rgba(0,171,190,0.22)';

// Subtle bar color variants — teal palette
const BAR_COLORS = [
    '#00ABBE',
    '#0096a8',
    '#00c4d4',
    '#007f8c',
    '#00d4e8',
    '#006a78',
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress size={36} sx={{ color: TEAL }} />
        </Box>
    );

    if (!data || data.sections.length === 0) return (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 300,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,171,190,0.15)',
            borderRadius: 3,
        }}>
            <Typography variant='body2' color='text.disabled'>{t('No labor items found')}</Typography>
        </Box>
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
        <Box sx={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(0,171,190,0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 40px rgba(0,171,190,0.08), 0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
        }}>
            {/* Header bar */}
            <Box sx={{
                px: 3, py: 2,
                borderBottom: '1px solid rgba(0,171,190,0.12)',
                background: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 2,
            }}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {estimate.name}
                </Typography>
                <Typography variant='caption' sx={{ color: TEAL, fontWeight: 600 }}>
                    {totalDays} {t('days')} &nbsp;·&nbsp; 8h {t('workday')}
                </Typography>
            </Box>

            {/* Scrollable chart */}
            <Box sx={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                <Box sx={{ display: 'inline-flex', flexDirection: 'column', minWidth: NAME_COL_W + totalDays * DAY_W }}>

                    {/* Day header */}
                    <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderBottom: `2px solid ${TEAL}22` }}>
                        <Box sx={{
                            width: NAME_COL_W, flexShrink: 0,
                            px: 2.5, py: 1.2,
                            position: 'sticky', left: 0, zIndex: 4,
                            background: 'rgba(255,255,255,0.95)',
                            borderRight: `1px solid ${TEAL}22`,
                        }}>
                            <Typography variant='caption' sx={{ color: TEAL, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {t('Task')}
                            </Typography>
                        </Box>
                        {days.map(d => (
                            <Box key={d} sx={{
                                width: DAY_W, flexShrink: 0,
                                textAlign: 'center', py: 1.2,
                                borderRight: d % 5 === 0 ? `1px solid ${TEAL}33` : `1px solid rgba(0,0,0,0.04)`,
                                color: d % 5 === 0 ? TEAL : '#bbb',
                                fontSize: '0.63rem',
                                fontWeight: d % 5 === 0 ? 700 : 400,
                            }}>
                                {d % 5 === 0 || d === 1 ? d : ''}
                            </Box>
                        ))}
                    </Box>

                    {/* Rows */}
                    {rows.map((row, ri) => {
                        if (row.type === 'section') {
                            return (
                                <Box key={ri} sx={{ display: 'flex', height: SEC_ROW_H, alignItems: 'center', background: TEAL_LIGHT, borderBottom: `1px solid ${TEAL}20` }}>
                                    <Box sx={{
                                        width: NAME_COL_W, flexShrink: 0,
                                        px: 2.5,
                                        position: 'sticky', left: 0, zIndex: 2,
                                        background: TEAL_LIGHT,
                                        height: '100%',
                                        display: 'flex', alignItems: 'center',
                                        borderRight: `1px solid ${TEAL}25`,
                                    }}>
                                        <Box sx={{ width: 3, height: 18, borderRadius: 2, background: TEAL, mr: 1.2, flexShrink: 0 }} />
                                        <Typography variant='caption' sx={{ color: TEAL_DARK, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.03em' }}>
                                            {row.name}
                                        </Typography>
                                    </Box>
                                    {/* Full-width grid lines for section row */}
                                    <Box sx={{ flex: 1, height: '100%', display: 'flex' }}>
                                        {days.map(d => (
                                            <Box key={d} sx={{
                                                width: DAY_W, flexShrink: 0, height: '100%',
                                                borderRight: d % 5 === 0 ? `1px solid ${TEAL}20` : `1px solid rgba(0,0,0,0.03)`,
                                            }} />
                                        ))}
                                    </Box>
                                </Box>
                            );
                        }

                        // Item row
                        const barColor = BAR_COLORS[row.colorIndex % BAR_COLORS.length];
                        const startOffset = ((row.start ?? 1) - 1) * DAY_W;
                        const barWidth = (row.duration ?? 1) * DAY_W - 3;
                        const isEven = ri % 2 === 0;
                        const rowBg = isEven ? 'rgba(255,255,255,0.85)' : 'rgba(248,253,254,0.9)';

                        return (
                            <Box key={ri} sx={{
                                display: 'flex', height: ITEM_ROW_H, alignItems: 'center',
                                background: rowBg,
                                borderBottom: '1px solid rgba(0,171,190,0.06)',
                                '&:hover': { background: 'rgba(0,171,190,0.05)' },
                                transition: 'background 0.15s',
                            }}>
                                {/* Sticky name */}
                                <Box sx={{
                                    width: NAME_COL_W, flexShrink: 0,
                                    px: 2.5, pl: 4,
                                    position: 'sticky', left: 0, zIndex: 2,
                                    background: rowBg,
                                    height: '100%',
                                    display: 'flex', alignItems: 'center',
                                    borderRight: `1px solid ${TEAL}18`,
                                }}>
                                    <Typography variant='caption' sx={{ color: '#444', fontSize: '0.75rem', lineHeight: 1.3 }}>
                                        {row.name || '—'}
                                    </Typography>
                                </Box>

                                {/* Bar area with full-width grid lines */}
                                <Box sx={{ position: 'relative', flex: 1, height: '100%' }}>
                                    {days.map(d => (
                                        <Box key={d} sx={{
                                            position: 'absolute',
                                            left: (d - 1) * DAY_W,
                                            top: 0, bottom: 0, width: 1,
                                            background: d % 5 === 0 ? `${TEAL}25` : 'rgba(0,0,0,0.035)',
                                        }} />
                                    ))}
                                    {/* Task bar */}
                                    <Box sx={{
                                        position: 'absolute',
                                        left: startOffset + 2,
                                        top: 7, height: ITEM_ROW_H - 14,
                                        width: barWidth,
                                        background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                        borderRadius: '5px',
                                        display: 'flex', alignItems: 'center',
                                        px: 1,
                                        overflow: 'hidden',
                                        boxShadow: `0 2px 8px ${barColor}55`,
                                    }}>
                                        <Typography sx={{ color: '#fff', fontSize: '0.63rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
                                            {row.duration}d
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}
