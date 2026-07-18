'use client';

import React, { useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import { formatCurrencyRounded } from '@/lib/format_currency';

const TEAL = '#00ABBE';
const GREEN = '#43a047';
const YELLOW = '#fb8c00';
const RED = '#e53935';

// Semi-circular SVG gauge — 180° arc
function Gauge({ currentPct, ceilingPct }: { currentPct: number; ceilingPct: number }) {
    const CX = 160, CY = 140, R = 110;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    // arc starts at 180° (left), ends at 0° (right), sweeps 180°
    const pctToAngle = (pct: number) => 180 - Math.min(pct, 200) * (180 / 200); // 0–200% maps to 180°–0°

    const arcPath = (startDeg: number, endDeg: number, r: number) => {
        const s = { x: CX + r * Math.cos(toRad(startDeg)), y: CY - r * Math.sin(toRad(startDeg)) };
        const e = { x: CX + r * Math.cos(toRad(endDeg)), y: CY - r * Math.sin(toRad(endDeg)) };
        const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
    };

    const markerPos = (angleDeg: number, rr: number) => ({
        x: CX + rr * Math.cos(toRad(angleDeg)),
        y: CY - rr * Math.sin(toRad(angleDeg)),
    });

    const currentAngle = pctToAngle(currentPct);
    const ceilingAngle = pctToAngle(ceilingPct);
    const baselineAngle = pctToAngle(100); // always at 100%

    const isAlert = currentPct > ceilingPct;
    const fillColor = isAlert ? RED : currentPct > 100 ? YELLOW : TEAL;

    const needle = markerPos(currentAngle, R - 12);
    const ceilPt = markerPos(ceilingAngle, R + 8);
    const ceilPtInner = markerPos(ceilingAngle, R - 28);

    return (
        <svg width='320' height='160' viewBox='0 0 320 160'>
            {/* Background arc */}
            <path d={arcPath(180, 0, R)} fill='none' stroke='#e0e0e0' strokeWidth={18} strokeLinecap='round' />

            {/* Green zone: 0–100% */}
            <path d={arcPath(180, baselineAngle, R)} fill='none' stroke={`${GREEN}40`} strokeWidth={18} />

            {/* Yellow zone: 100–ceiling% */}
            {ceilingPct > 100 && (
                <path d={arcPath(baselineAngle, ceilingAngle, R)} fill='none' stroke={`${YELLOW}50`} strokeWidth={18} />
            )}

            {/* Red zone: ceiling–200% */}
            <path d={arcPath(ceilingAngle, 0, R)} fill='none' stroke={`${RED}30`} strokeWidth={18} />

            {/* Current value fill */}
            {currentPct > 0 && (
                <path d={arcPath(180, currentAngle, R)} fill='none' stroke={fillColor} strokeWidth={18} strokeLinecap='round' />
            )}

            {/* Baseline marker at 100% */}
            <line
                x1={markerPos(baselineAngle, R - 20).x} y1={markerPos(baselineAngle, R - 20).y}
                x2={markerPos(baselineAngle, R + 8).x} y2={markerPos(baselineAngle, R + 8).y}
                stroke='#111' strokeWidth={2.5} strokeLinecap='round'
            />
            <text x={markerPos(baselineAngle, R + 18).x} y={markerPos(baselineAngle, R + 18).y}
                textAnchor='middle' fontSize='10' fill='#555' fontWeight='600'>100%</text>

            {/* Ceiling marker */}
            <line
                x1={ceilPtInner.x} y1={ceilPtInner.y}
                x2={ceilPt.x} y2={ceilPt.y}
                stroke={RED} strokeWidth={2.5} strokeLinecap='round'
            />
            <text x={markerPos(ceilingAngle, R + 22).x} y={markerPos(ceilingAngle, R + 22).y}
                textAnchor='middle' fontSize='10' fill={RED} fontWeight='700'>{ceilingPct}%</text>

            {/* Current needle dot */}
            <circle cx={needle.x} cy={needle.y} r={7} fill={fillColor} stroke='white' strokeWidth={2} />

            {/* Center value text */}
            <text x={CX} y={CY + 10} textAnchor='middle' fontSize='22' fontWeight='700'
                fill={isAlert ? RED : '#111'}>{currentPct}%</text>
            <text x={CX} y={CY + 28} textAnchor='middle' fontSize='10' fill='#888'>of baseline</text>
        </svg>
    );
}

interface Props {
    config: RiskMonitorConfig;
    currentPrice: number; // live price from catalog
}

export default function RiskGaugeWidget({ config, currentPrice }: Props) {
    const { baselinePrice, budget, groupName, dataSourceLabel, selectedItem } = config;

    const currentPct = baselinePrice > 0
        ? Math.round((currentPrice / baselinePrice) * 100)
        : 0;

    const ceilingPct = baselinePrice > 0
        ? Math.round((budget / baselinePrice) * 100)
        : 100;

    const isAlert = currentPct > ceilingPct;
    const itemLabel = selectedItem?.name ?? selectedItem?.estimateNumber ?? selectedItem?.title ?? '—';

    const cardBg = isAlert
        ? 'linear-gradient(135deg, rgba(229,57,53,0.06) 0%, rgba(255,255,255,0.9) 100%)'
        : 'rgba(255,255,255,0.82)';
    const cardBorder = isAlert ? `1px solid rgba(229,57,53,0.35)` : '1px solid rgba(0,171,190,0.18)';

    return (
        <Box sx={{
            background: cardBg,
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 3,
            border: cardBorder,
            boxShadow: isAlert
                ? '0 4px 24px rgba(229,57,53,0.12), 0 1px 4px rgba(0,0,0,0.04)'
                : '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            p: 3,
            transition: 'border 0.4s, box-shadow 0.4s',
        }}>
            {/* Card header */}
            <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: 2 }}>
                <Box>
                    <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.4 }}>
                        {isAlert
                            ? <WarningAmberIcon sx={{ color: RED, fontSize: '1.1rem' }} />
                            : <MonitorHeartOutlinedIcon sx={{ color: TEAL, fontSize: '1.1rem' }} />
                        }
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isAlert ? RED : '#111' }}>
                            {groupName}
                        </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{dataSourceLabel}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#555', mt: 0.3, fontWeight: 500 }}>{itemLabel}</Typography>
                </Box>
                {isAlert && (
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: RED }}>OVERRUN</Typography>
                    </Box>
                )}
            </Stack>

            {/* Gauge */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Gauge currentPct={currentPct} ceilingPct={ceilingPct} />
            </Box>

            {/* Legend row */}
            <Stack direction='row' justifyContent='space-between' sx={{ px: 1, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#888', mb: 0.3 }}>Market Baseline</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: TEAL }}>
                        {formatCurrencyRounded(baselinePrice)} AMD
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#888', mb: 0.3 }}>Current Price</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isAlert ? RED : '#111' }}>
                        {formatCurrencyRounded(currentPrice)} AMD
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#888', mb: 0.3 }}>Budget Ceiling</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: RED }}>
                        {formatCurrencyRounded(budget)} AMD
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}
