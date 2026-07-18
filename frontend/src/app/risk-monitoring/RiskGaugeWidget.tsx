'use client';

import React, { useState, useEffect, useId } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import { formatCurrencyRounded } from '@/lib/format_currency';
import * as Api from '@/api';

// ─── Live prices hook ────────────────────────────────────────────────────────
function usePrices(config: RiskMonitorConfig): { currentPrice: number; minPrice: number | null } {
    const [currentPrice, setCurrentPrice] = useState(config.baselinePrice);
    const [minPrice, setMinPrice] = useState<number | null>(
        // check if the stored item already has a min price field
        config.selectedItem?.minAveragePrice
        ?? config.selectedItem?.minPrice
        ?? config.selectedItem?.minimumPrice
        ?? null
    );

    useEffect(() => {
        setCurrentPrice(config.baselinePrice);
        const run = async () => {
            try {
                if (config.dataSource === 'labor' || config.dataSource === 'materials') {
                    const type = config.dataSource === 'labor' ? 'labor' : 'material';
                    const data = await Api.requestSession<any>({
                        command: `${type}/fetch_item_price`,
                        args: { itemId: config.selectedItem._id },
                    });
                    const p = data?.price ?? data?.averagePrice;
                    if (p) setCurrentPrice(p);
                    const m = data?.minAveragePrice ?? data?.minPrice ?? data?.minimumPrice ?? null;
                    if (m && m > 0) setMinPrice(m);
                } else {
                    const data = await Api.requestSession<any>({
                        command: 'estimate/get',
                        args: { estimateId: config.selectedItem._id },
                    });
                    const p = data?.totalCostWithOtherExpenses ?? data?.totalCost;
                    if (p) setCurrentPrice(p);
                    const m = data?.minCost ?? data?.minimumCost ?? null;
                    if (m && m > 0) setMinPrice(m);
                }
            } catch { }
        };
        run();
    }, [config]);

    return { currentPrice, minPrice };
}

// ─── Constants & helpers ─────────────────────────────────────────────────────
const TEAL  = '#00ABBE';
const RED   = '#c62828';
const AMBER = '#f57c00';

const START_DEG  = 195;  // left endpoint
const SWEEP_DEG  = 210;  // total arc
const RANGE_MIN  = 70;   // 70%  = far left  (below baseline = safe)
const RANGE_MAX  = 130;  // 130% = far right (well above baseline)
const RANGE_SPAN = RANGE_MAX - RANGE_MIN; // 60

// 100% (baseline) lands exactly at 90° = 12 o'clock, giving teal and red equal visual weight
function toRad(deg: number) { return (deg * Math.PI) / 180; }

function pctToAngle(pct: number): number {
    const c = Math.max(RANGE_MIN, Math.min(pct, RANGE_MAX));
    return START_DEG - ((c - RANGE_MIN) / RANGE_SPAN) * SWEEP_DEG;
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
    return { x: cx + r * Math.cos(toRad(deg)), y: cy - r * Math.sin(toRad(deg)) };
}

// sweep=1 → clockwise on screen → arc goes over the top
function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
    const s = polarToXY(cx, cy, r, fromDeg);
    const e = polarToXY(cx, cy, r, toDeg);
    const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// ─── SVG gauge ───────────────────────────────────────────────────────────────
interface GaugeProps {
    currentPct: number;
    ceilingPct: number;
    minPct?: number | null;   // optional minimum market price marker
}

function Gauge({ currentPct, ceilingPct, minPct }: GaugeProps) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const id = setTimeout(() => setReady(true), 80);
        return () => clearTimeout(id);
    }, []);

    const uid  = useId().replace(/:/g, '');
    const gT   = `gT${uid}`, gA = `gA${uid}`, gR = `gR${uid}`;
    const gHub = `gHub${uid}`;

    const W = 360, H = 220;
    const CX = 180, CY = 165;
    const R = 130, SW = 22;
    const trackR  = R - SW / 2;       // 119 — centre-line of track
    const innerR  = trackR - SW / 2;  // 108 — inner edge
    const outerR  = trackR + SW / 2;  // 130 — outer edge

    const angStart   = pctToAngle(RANGE_MIN);
    const angEnd     = pctToAngle(RANGE_MAX);
    const angBase    = pctToAngle(100);   // exactly 90° = 12 o'clock
    const angCeiling = pctToAngle(Math.min(ceilingPct, RANGE_MAX));
    const angCurrent = pctToAngle(Math.min(Math.max(currentPct, RANGE_MIN), RANGE_MAX));

    const isAlert     = currentPct > ceilingPct;
    const needleColor = isAlert ? RED : currentPct > 100 ? AMBER : TEAL;

    const p        = (ang: number) => polarToXY(CX, CY, trackR, ang);
    const capLeft  = p(angStart);
    const capRight = p(angEnd);

    // Zone separator: white slash across full track width
    const sep = (ang: number) => {
        const o = polarToXY(CX, CY, outerR + 2, ang);
        const i = polarToXY(CX, CY, innerR - 2, ang);
        return (
            <line key={ang} x1={i.x} y1={i.y} x2={o.x} y2={o.y}
                stroke='white' strokeWidth={3.5} strokeLinecap='round' />
        );
    };

    // Tick mark (narrower, for baseline / min markers)
    const tick = (ang: number, color: string, widthExtra = 0) => {
        const o = polarToXY(CX, CY, outerR + 2 + widthExtra, ang);
        const i = polarToXY(CX, CY, innerR - 2 - widthExtra, ang);
        return <line x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke={color} strokeWidth={2.5} strokeLinecap='round' />;
    };

    const pos0   = polarToXY(CX, CY, outerR + 18, angStart);
    const pos100 = polarToXY(CX, CY, outerR + 18, angBase);
    const pos130 = polarToXY(CX, CY, outerR + 18, angEnd);

    // Needle rotation: vertical line at 90° rotated to target angle
    const needleRot = ready ? 90 - angCurrent : 90 - angStart;
    const tipY  = CY - (trackR - 12);
    const baseY = CY + 10;
    const hw    = 4.5;

    // Radial gradient stop for inner edge (as % of outerR)
    const innerPct = `${(innerR / outerR * 100).toFixed(1)}%`;

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow='visible'>
            <defs>
                {/*
                    Radial gradients centered at gauge origin (CX, CY).
                    This correctly follows the arc curvature for ANY zone length
                    — unlike linear gradients which fail on small arcs.
                    Gradient: dark at inner edge → bright at outer edge (neon glow look).
                */}
                <radialGradient id={gT} cx={CX} cy={CY} r={outerR} gradientUnits='userSpaceOnUse'>
                    <stop offset={innerPct}  stopColor='#00695C' />  {/* inner — dark teal */}
                    <stop offset='100%'      stopColor='#80DEEA' />  {/* outer — bright cyan */}
                </radialGradient>
                <radialGradient id={gA} cx={CX} cy={CY} r={outerR} gradientUnits='userSpaceOnUse'>
                    <stop offset={innerPct}  stopColor='#FF6D00' />  {/* inner — vivid orange */}
                    <stop offset='100%'      stopColor='#FFE082' />  {/* outer — warm gold */}
                </radialGradient>
                <radialGradient id={gR} cx={CX} cy={CY} r={outerR} gradientUnits='userSpaceOnUse'>
                    <stop offset={innerPct}  stopColor='#C62828' />  {/* inner — clear red */}
                    <stop offset='100%'      stopColor='#EF9A9A' />  {/* outer — soft pink-red */}
                </radialGradient>

                {/* Metallic hub */}
                <radialGradient id={gHub} cx='38%' cy='32%' r='65%'>
                    <stop offset='0%'   stopColor='#ffffff' />
                    <stop offset='50%'  stopColor='#e0e0e0' />
                    <stop offset='100%' stopColor='#9e9e9e' />
                </radialGradient>
            </defs>

            {/* Soft dial plate */}
            <circle cx={CX} cy={CY} r={R + 2} fill='rgba(0,0,0,0.03)' />

            {/* Zone 1 — Teal: 0% → 100% */}
            <path d={arcPath(CX, CY, trackR, angStart, angBase)}
                fill='none' stroke={`url(#${gT})`} strokeWidth={SW} strokeLinecap='butt'
                />


            {/* Zone 2 — Amber: 100% → ceiling% */}
            {ceilingPct > 100 && (
                <path d={arcPath(CX, CY, trackR, angBase, angCeiling)}
                    fill='none' stroke={`url(#${gA})`} strokeWidth={SW} strokeLinecap='butt'
                    />

            )}

            {/* Zone 3 — Red: ceiling% → 130% */}
            <path d={arcPath(CX, CY, trackR, angCeiling, angEnd)}
                fill='none' stroke={`url(#${gR})`} strokeWidth={SW} strokeLinecap='butt'
                />


            {/* Rounded terminal caps */}
            <circle cx={capLeft.x}  cy={capLeft.y}  r={SW / 2} fill='#00695C' />
            <circle cx={capRight.x} cy={capRight.y} r={SW / 2} fill='#C62828' />

            {/* Zone separators */}
            {sep(angBase)}
            {ceilingPct > 100 && ceilingPct <= RANGE_MAX && sep(angCeiling)}

            {/* Minimum market price marker (static, inside teal zone) */}
            {minPct != null && minPct > 0 && minPct < 100 && (() => {
                const ang    = pctToAngle(minPct);
                const label  = polarToXY(CX, CY, outerR + 14, ang);
                return (
                    <>
                        {tick(ang, 'white', 2)}
                        {tick(ang, '#004D40')}
                        <text x={label.x.toFixed(1)} y={label.y.toFixed(1)}
                            textAnchor='middle' dominantBaseline='middle'
                            fontSize='8' fontWeight='700' fill='#004D40'>MIN</text>
                    </>
                );
            })()}

            {/* Baseline tick at 100% */}
            {tick(angBase, '#333')}

            {/* Ceiling tick */}
            {ceilingPct <= RANGE_MAX && tick(angCeiling, RED)}

            {/* Animated needle */}
            <g style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${needleRot}deg)`,
                transition: ready ? 'transform 2.8s cubic-bezier(0.34, 1.12, 0.64, 1)' : 'none',
            }}>
                <polygon points={`${CX - hw},${baseY} ${CX + hw},${baseY} ${CX},${tipY}`}
                    fill='rgba(0,0,0,0.2)' transform='translate(2,3)' />
                <polygon points={`${CX - hw - 1},${baseY + 1} ${CX + hw + 1},${baseY + 1} ${CX},${tipY - 1}`}
                    fill='white' opacity={0.65} />
                <polygon points={`${CX - hw},${baseY} ${CX + hw},${baseY} ${CX},${tipY}`}
                    fill={needleColor} />
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

            {/* Arc end labels */}
            <text x={pos0.x}   y={pos0.y}   textAnchor='end'    fontSize='9' fill='#aaa'>{RANGE_MIN}%</text>
            <text x={pos100.x} y={pos100.y} textAnchor='middle' fontSize='9' fill='#777'>100%</text>
            <text x={pos130.x} y={pos130.y} textAnchor='start'  fontSize='9' fill='#aaa'>{RANGE_MAX}%</text>
        </svg>
    );
}

// ─── Card wrapper ────────────────────────────────────────────────────────────
interface Props { config: RiskMonitorConfig; onDelete?: () => void; }

export default function RiskGaugeWidget({ config, onDelete }: Props) {
    const { baselinePrice, budget, dataSourceLabel, selectedItem } = config;
    const { currentPrice, minPrice } = usePrices(config);

    const currentPct = baselinePrice > 0 ? (currentPrice / baselinePrice) * 100 : 0;
    const ceilingPct = baselinePrice > 0 ? (budget      / baselinePrice) * 100 : 110;
    const minPct     = minPrice && baselinePrice > 0 ? (minPrice / baselinePrice) * 100 : null;
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
                <Gauge currentPct={currentPct} ceilingPct={ceilingPct} minPct={minPct} />
            </Box>

            {/* Legend */}
            <Stack direction='row' justifyContent='space-between' sx={{ pt: 1.5, borderTop: '1px solid #f0f0f0', mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
                {minPrice != null && (
                    <Box>
                        <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Min Market Price</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#004D40' }}>
                            {formatCurrencyRounded(minPrice)} AMD
                        </Typography>
                    </Box>
                )}
                <Box>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Baseline (100%)</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: TEAL }}>
                        {formatCurrencyRounded(baselinePrice)} AMD
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Current Price</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isAlert ? RED : '#111' }}>
                        {formatCurrencyRounded(currentPrice)} AMD
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.3 }}>Budget Ceiling ({ceilingPct.toFixed(0)}%)</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: RED }}>
                        {formatCurrencyRounded(budget)} AMD
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}
