'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import { formatCurrencyRounded } from '@/lib/format_currency';

const TEAL = '#00ABBE';
const GREEN = '#2e7d32';
const YELLOW = '#f57c00';
const RED = '#c62828';
const TRACK_GRAY = '#e8e8e8';

// Gauge spans 210°: from 195° (bottom-left) to -15° (bottom-right)
// 0% = 195°, RANGE_MAX% = -15°
const RANGE_MAX = 130; // gauge shows 0–130%
const START_DEG = 195;
const SWEEP_DEG = 210;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function pctToAngle(pct: number): number {
    const clamped = Math.max(0, Math.min(pct, RANGE_MAX));
    return START_DEG - (clamped / RANGE_MAX) * SWEEP_DEG;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    return {
        x: cx + r * Math.cos(toRad(angleDeg)),
        y: cy - r * Math.sin(toRad(angleDeg)),
    };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
    const s = polarToXY(cx, cy, r, startDeg);
    const e = polarToXY(cx, cy, r, endDeg);
    const sweep = endDeg < startDeg ? 0 : 1; // always sweep clockwise (decreasing angle)
    const deltaAbs = Math.abs(startDeg - endDeg);
    const large = deltaAbs > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

interface GaugeProps {
    currentPct: number;
    ceilingPct: number;
}

function Gauge({ currentPct, ceilingPct }: GaugeProps) {
    const W = 340, H = 220;
    const CX = W / 2, CY = 165;
    const R = 130, SW = 22;

    const baselineAngle = pctToAngle(100);
    const ceilingAngle  = pctToAngle(Math.min(ceilingPct, RANGE_MAX));
    const currentAngle  = pctToAngle(Math.min(currentPct, RANGE_MAX));
    const startAngle    = pctToAngle(0);
    const endAngle      = pctToAngle(RANGE_MAX);

    const isAlert = currentPct > ceilingPct;
    const fillColor = isAlert ? RED : currentPct > 100 ? YELLOW : TEAL;

    // Needle tip and base
    const needleTip  = polarToXY(CX, CY, R - 10, currentAngle);
    const needleBase = polarToXY(CX, CY, 18, currentAngle);

    // Tick marks at 0%, 50%, 100%, 130%
    const ticks = [0, 50, 100, 130];

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {/* Background track */}
            <path d={arcPath(CX, CY, R - SW/2, startAngle, endAngle)}
                fill='none' stroke={TRACK_GRAY} strokeWidth={SW} strokeLinecap='round' />

            {/* Green zone: 0–100% */}
            <path d={arcPath(CX, CY, R - SW/2, startAngle, baselineAngle)}
                fill='none' stroke={`${GREEN}35`} strokeWidth={SW} />

            {/* Yellow zone: 100–ceiling% */}
            {ceilingPct > 100 && ceilingPct <= RANGE_MAX && (
                <path d={arcPath(CX, CY, R - SW/2, baselineAngle, ceilingAngle)}
                    fill='none' stroke={`${YELLOW}50`} strokeWidth={SW} />
            )}

            {/* Red zone: ceiling–max% */}
            <path d={arcPath(CX, CY, R - SW/2, ceilingAngle, endAngle)}
                fill='none' stroke={`${RED}30`} strokeWidth={SW} />

            {/* Current fill */}
            {currentPct > 0 && (
                <path d={arcPath(CX, CY, R - SW/2, startAngle, currentAngle)}
                    fill='none' stroke={fillColor} strokeWidth={SW} strokeLinecap='round' />
            )}

            {/* Tick marks */}
            {ticks.map(pct => {
                const ang = pctToAngle(pct);
                const outer = polarToXY(CX, CY, R + 6, ang);
                const inner = polarToXY(CX, CY, R - SW - 4, ang);
                const label = polarToXY(CX, CY, R + 18, ang);
                return (
                    <g key={pct}>
                        <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                            stroke='#999' strokeWidth={1.5} strokeLinecap='round' />
                        <text x={label.x} y={label.y} textAnchor='middle' dominantBaseline='middle'
                            fontSize='10' fill='#888'>{pct}%</text>
                    </g>
                );
            })}

            {/* Baseline marker at 100% */}
            {(() => {
                const outer = polarToXY(CX, CY, R + 4, baselineAngle);
                const inner = polarToXY(CX, CY, R - SW - 2, baselineAngle);
                return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                    stroke='#333' strokeWidth={2.5} strokeLinecap='round' />;
            })()}

            {/* Ceiling marker */}
            {ceilingPct <= RANGE_MAX && (() => {
                const outer = polarToXY(CX, CY, R + 4, ceilingAngle);
                const inner = polarToXY(CX, CY, R - SW - 2, ceilingAngle);
                return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                    stroke={RED} strokeWidth={2.5} strokeLinecap='round' />;
            })()}

            {/* Needle */}
            <line x1={needleBase.x} y1={needleBase.y} x2={needleTip.x} y2={needleTip.y}
                stroke={fillColor} strokeWidth={3} strokeLinecap='round' />
            <circle cx={CX} cy={CY} r={8} fill={fillColor} stroke='white' strokeWidth={2} />

            {/* Center value */}
            <text x={CX} y={CY + 30} textAnchor='middle' fontSize='28' fontWeight='700'
                fill={isAlert ? RED : '#111'}>{currentPct.toFixed(0)}%</text>
            <text x={CX} y={CY + 48} textAnchor='middle' fontSize='10' fill='#aaa'>of baseline</text>
        </svg>
    );
}

interface Props {
    config: RiskMonitorConfig;
    currentPrice: number;
}

export default function RiskGaugeWidget({ config, currentPrice }: Props) {
    const { baselinePrice, budget, groupName, dataSourceLabel, selectedItem } = config;

    const currentPct = baselinePrice > 0 ? (currentPrice / baselinePrice) * 100 : 0;
    const ceilingPct = baselinePrice > 0 ? (budget / baselinePrice) * 100 : 110;
    const isAlert = currentPct > ceilingPct;

    const itemLabel = selectedItem?.name ?? selectedItem?.estimateNumber ?? selectedItem?.title ?? '—';

    return (
        <Box sx={{
            background: isAlert
                ? 'linear-gradient(135deg, rgba(198,40,40,0.06) 0%, rgba(255,255,255,0.9) 100%)'
                : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 3,
            border: isAlert ? '1px solid rgba(198,40,40,0.35)' : '1px solid rgba(0,171,190,0.18)',
            boxShadow: isAlert
                ? '0 4px 24px rgba(198,40,40,0.12)'
                : '0 4px 24px rgba(0,171,190,0.08)',
            p: 3,
            transition: 'border 0.4s, box-shadow 0.4s, background 0.4s',
        }}>
            {/* Header */}
            <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: 1 }}>
                <Box>
                    <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.3 }}>
                        {isAlert
                            ? <WarningAmberIcon sx={{ color: RED, fontSize: '1.1rem' }} />
                            : <MonitorHeartOutlinedIcon sx={{ color: TEAL, fontSize: '1.1rem' }} />
                        }
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isAlert ? RED : '#111' }}>
                            {groupName}
                        </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>{dataSourceLabel}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#555', mt: 0.2, fontWeight: 500 }}>{itemLabel}</Typography>
                </Box>
                {isAlert && (
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.3)' }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: RED, letterSpacing: '0.05em' }}>OVERRUN</Typography>
                    </Box>
                )}
            </Stack>

            {/* Gauge SVG */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Gauge currentPct={parseFloat(currentPct.toFixed(1))} ceilingPct={parseFloat(ceilingPct.toFixed(1))} />
            </Box>

            {/* Legend */}
            <Stack direction='row' justifyContent='space-between' sx={{ pt: 1.5, borderTop: '1px solid #f0f0f0', mt: 0.5 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Market Baseline (100%)</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: TEAL }}>
                        {formatCurrencyRounded(baselinePrice)} AMD
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Current Price</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: isAlert ? RED : '#111' }}>
                        {formatCurrencyRounded(currentPrice)} AMD
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Budget Ceiling ({ceilingPct.toFixed(0)}%)</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: RED }}>
                        {formatCurrencyRounded(budget)} AMD
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}
