'use client';

import React, { useState, useEffect, useId } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import { formatCurrencyRounded } from '@/lib/format_currency';
import * as Api from '@/api';

function useLivePrice(config: RiskMonitorConfig): number {
    const [price, setPrice] = useState(config.baselinePrice);
    useEffect(() => {
        setPrice(config.baselinePrice);
        const fetch = async () => {
            try {
                if (config.dataSource === 'labor' || config.dataSource === 'materials') {
                    const type = config.dataSource === 'labor' ? 'labor' : 'material';
                    const data = await Api.requestSession<any>({ command: `${type}/fetch_item_price`, args: { itemId: config.selectedItem._id } });
                    const p = data?.price ?? data?.averagePrice;
                    if (p) setPrice(p);
                } else {
                    const data = await Api.requestSession<any>({ command: 'estimate/get', args: { estimateId: config.selectedItem._id } });
                    const p = data?.totalCostWithOtherExpenses ?? data?.totalCost;
                    if (p) setPrice(p);
                }
            } catch { }
        };
        fetch();
    }, [config]);
    return price;
}

const TEAL  = '#00ABBE';
const RED   = '#c62828';
const AMBER = '#f57c00';

// Gauge: 210° arc from bottom-left (195°) over the top to bottom-right (-15°)
// 0% = 195°, 130% = -15°
const START_DEG  = 195;
const SWEEP_DEG  = 210;
const RANGE_MAX  = 130;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function pctToAngle(pct: number): number {
    return START_DEG - (Math.max(0, Math.min(pct, RANGE_MAX)) / RANGE_MAX) * SWEEP_DEG;
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
    return {
        x: cx + r * Math.cos(toRad(deg)),
        y: cy - r * Math.sin(toRad(deg)),
    };
}

// sweep=1 = clockwise on SVG screen = draws arc going OVER THE TOP (not underneath)
function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
    const s = polarToXY(cx, cy, r, fromDeg);
    const e = polarToXY(cx, cy, r, toDeg);
    const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// ─── SVG gauge ──────────────────────────────────────────────────────────────
function Gauge({ currentPct, ceilingPct }: { currentPct: number; ceilingPct: number }) {
    // Small delay so needle starts at left, then smoothly sweeps to target
    const [ready, setReady] = useState(false);
    useEffect(() => { const id = setTimeout(() => setReady(true), 80); return () => clearTimeout(id); }, []);

    const uid  = useId().replace(/:/g, '');
    const gT   = `gT${uid}`, gA = `gA${uid}`, gR = `gR${uid}`, gHub = `gHub${uid}`, gGlow = `gGl${uid}`;

    const W = 360, H = 220;
    const CX = 180, CY = 165;
    const R = 130, SW = 22;
    const trackR = R - SW / 2;

    const angStart   = pctToAngle(0);
    const angEnd     = pctToAngle(RANGE_MAX);
    const angBase    = pctToAngle(100);
    const angCeiling = pctToAngle(Math.min(ceilingPct, RANGE_MAX));
    const angCurrent = pctToAngle(Math.min(currentPct, RANGE_MAX));

    const isAlert     = currentPct > ceilingPct;
    const needleColor = isAlert ? RED : currentPct > 100 ? AMBER : TEAL;

    const p = (ang: number) => polarToXY(CX, CY, trackR, ang);
    const z1s = p(angStart), z1e = p(angBase);
    const z2s = z1e,         z2e = p(angCeiling);
    const z3s = z2e,         z3e = p(angEnd);
    const capLeft = p(angStart), capRight = p(angEnd);

    const sep = (ang: number) => {
        const o = polarToXY(CX, CY, trackR + SW / 2 + 2, ang);
        const i = polarToXY(CX, CY, trackR - SW / 2 - 2, ang);
        return <line key={ang} x1={i.x} y1={i.y} x2={o.x} y2={o.y}
            stroke='white' strokeWidth={3.5} strokeLinecap='round' />;
    };

    const pos0   = polarToXY(CX, CY, R + 22, angStart);
    const pos100 = polarToXY(CX, CY, R + 22, angBase);
    const pos130 = polarToXY(CX, CY, R + 22, angEnd);

    // Needle: vertical triangle pointing up, rotated via CSS
    const needleRot = ready ? 90 - angCurrent : 90 - angStart;
    const tipY  = CY - (trackR - 12);
    const baseY = CY + 10;
    const hw    = 4.5; // half-width at base

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow='visible'>
            <defs>
                <linearGradient id={gT} x1={z1s.x} y1={z1s.y} x2={z1e.x} y2={z1e.y} gradientUnits='userSpaceOnUse'>
                    <stop offset='0%'   stopColor='#00796B' />
                    <stop offset='100%' stopColor='#4DD0E1' />
                </linearGradient>
                <linearGradient id={gA} x1={z2s.x} y1={z2s.y} x2={z2e.x} y2={z2e.y} gradientUnits='userSpaceOnUse'>
                    <stop offset='0%'   stopColor='#E65100' />
                    <stop offset='100%' stopColor='#FFD54F' />
                </linearGradient>
                <linearGradient id={gR} x1={z3s.x} y1={z3s.y} x2={z3e.x} y2={z3e.y} gradientUnits='userSpaceOnUse'>
                    <stop offset='0%'   stopColor='#EF5350' />
                    <stop offset='100%' stopColor='#B71C1C' />
                </linearGradient>
                {/* Metallic hub */}
                <radialGradient id={gHub} cx='38%' cy='32%' r='65%'>
                    <stop offset='0%'   stopColor='#ffffff' />
                    <stop offset='50%'  stopColor='#e0e0e0' />
                    <stop offset='100%' stopColor='#9e9e9e' />
                </radialGradient>
                {/* Subtle glow on arcs */}
                <filter id={gGlow} x='-25%' y='-25%' width='150%' height='150%'>
                    <feGaussianBlur stdDeviation='2' result='blur' />
                    <feMerge><feMergeNode in='blur' /><feMergeNode in='SourceGraphic' /></feMerge>
                </filter>
            </defs>

            {/* Soft dial background */}
            <circle cx={CX} cy={CY} r={R + 2} fill='rgba(0,0,0,0.03)' />

            {/* Zone arcs — gradient + glow */}
            <path d={arcPath(CX, CY, trackR, angStart, angBase)}
                fill='none' stroke={`url(#${gT})`} strokeWidth={SW} strokeLinecap='butt' filter={`url(#${gGlow})`} />
            {ceilingPct > 100 && (
                <path d={arcPath(CX, CY, trackR, angBase, angCeiling)}
                    fill='none' stroke={`url(#${gA})`} strokeWidth={SW} strokeLinecap='butt' filter={`url(#${gGlow})`} />
            )}
            <path d={arcPath(CX, CY, trackR, angCeiling, angEnd)}
                fill='none' stroke={`url(#${gR})`} strokeWidth={SW} strokeLinecap='butt' filter={`url(#${gGlow})`} />

            {/* Terminal caps */}
            <circle cx={capLeft.x}  cy={capLeft.y}  r={SW / 2} fill='#00796B' />
            <circle cx={capRight.x} cy={capRight.y} r={SW / 2} fill='#B71C1C' />

            {/* Zone separators */}
            {sep(angBase)}
            {ceilingPct > 100 && ceilingPct <= RANGE_MAX && sep(angCeiling)}

            {/* Animated tapered needle — 2.8s slow sweep with gentle settle */}
            <g style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${needleRot}deg)`,
                transition: ready ? 'transform 2.8s cubic-bezier(0.34, 1.12, 0.64, 1)' : 'none',
            }}>
                {/* Drop shadow (offset polygon) */}
                <polygon
                    points={`${CX - hw},${baseY} ${CX + hw},${baseY} ${CX},${tipY}`}
                    fill='rgba(0,0,0,0.2)' transform='translate(2,3)' />
                {/* White halo for depth */}
                <polygon
                    points={`${CX - hw - 1},${baseY + 1} ${CX + hw + 1},${baseY + 1} ${CX},${tipY - 1}`}
                    fill='white' opacity={0.65} />
                {/* Needle body */}
                <polygon
                    points={`${CX - hw},${baseY} ${CX + hw},${baseY} ${CX},${tipY}`}
                    fill={needleColor} />
                {/* Specular highlight on left edge */}
                <line x1={CX - 1} y1={baseY - 2} x2={CX - 0.5} y2={tipY + 6}
                    stroke='rgba(255,255,255,0.4)' strokeWidth={1.2} strokeLinecap='round' />
            </g>

            {/* Metallic hub */}
            <circle cx={CX} cy={CY} r={15} fill='white' />
            <circle cx={CX} cy={CY} r={12} fill={`url(#${gHub})`} />
            <circle cx={CX - 4} cy={CY - 4} r={4} fill='rgba(255,255,255,0.6)' />

            {/* Centre readout */}
            <text x={CX} y={CY + 26} textAnchor='middle' fontSize='26' fontWeight='700'
                fill={isAlert ? RED : '#111'}>{currentPct.toFixed(0)}%</text>
            <text x={CX} y={CY + 44} textAnchor='middle' fontSize='10' fill='#aaa'>of baseline</text>

            {/* Labels */}
            <text x={pos0.x}   y={pos0.y}   textAnchor='end'    fontSize='9' fill='#aaa'>0%</text>
            <text x={pos100.x} y={pos100.y} textAnchor='middle' fontSize='9' fill='#777'>100%</text>
            <text x={pos130.x} y={pos130.y} textAnchor='start'  fontSize='9' fill='#aaa'>{RANGE_MAX}%</text>
        </svg>
    );
}

// ─── Card wrapper ────────────────────────────────────────────────────────────
interface Props { config: RiskMonitorConfig; onDelete?: () => void; }

export default function RiskGaugeWidget({ config, onDelete }: Props) {
    const { baselinePrice, budget, groupName, dataSourceLabel, selectedItem } = config;
    const currentPrice = useLivePrice(config);

    const currentPct = baselinePrice > 0 ? (currentPrice / baselinePrice) * 100 : 0;
    const ceilingPct = baselinePrice > 0 ? (budget   / baselinePrice) * 100 : 110;
    const isAlert    = currentPct > ceilingPct;

    const itemLabel = selectedItem?.name ?? selectedItem?.estimateNumber ?? selectedItem?.title ?? '—';

    return (
        <Box sx={{
            background: isAlert
                ? 'linear-gradient(135deg,rgba(198,40,40,0.06) 0%,rgba(255,255,255,0.92) 100%)'
                : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 3,
            border: isAlert ? '1px solid rgba(198,40,40,0.35)' : '1px solid rgba(0,171,190,0.18)',
            boxShadow: isAlert ? '0 4px 24px rgba(198,40,40,0.12)' : '0 4px 24px rgba(0,171,190,0.08)',
            p: 3,
            transition: 'all 0.4s',
        }}>
            {/* Header */}
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                <Stack direction='row' alignItems='center' spacing={1}>
                    {isAlert
                        ? <WarningAmberIcon sx={{ color: RED, fontSize: '1.15rem' }} />
                        : <MonitorHeartOutlinedIcon sx={{ color: TEAL, fontSize: '1.15rem' }} />}
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.2 }}>{dataSourceLabel}</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: '#333', fontWeight: 600, lineHeight: 1.3 }}>{itemLabel}</Typography>
                    </Box>
                </Stack>
                <Stack direction='row' spacing={0.5} alignItems='center'>
                    {isAlert && (
                        <Box sx={{ px: 1.2, py: 0.4, borderRadius: 2, bgcolor: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.3)' }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: RED, letterSpacing: '0.05em' }}>OVERRUN</Typography>
                        </Box>
                    )}
                    {onDelete && (
                        <Tooltip title='Remove monitor'>
                            <IconButton size='small' onClick={onDelete}
                                sx={{ color: '#d0d0d0', '&:hover': { color: RED } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Stack>

            {/* Gauge */}
            <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
                <Gauge currentPct={currentPct} ceilingPct={ceilingPct} />
            </Box>

            {/* Legend */}
            <Stack direction='row' justifyContent='space-between' sx={{ pt: 1.5, borderTop: '1px solid #f0f0f0', mt: 0.5 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Baseline (100%)</Typography>
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
