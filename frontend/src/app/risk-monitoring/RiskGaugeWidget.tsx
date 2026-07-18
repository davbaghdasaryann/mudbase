'use client';

import React, { useState, useEffect } from 'react';
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
    const W = 360, H = 220;
    const CX = 180, CY = 165;
    const R = 130, SW = 22;
    const trackR = R - SW / 2; // 119

    const angStart   = pctToAngle(0);           // 195° — left endpoint
    const angEnd     = pctToAngle(RANGE_MAX);   // -15° — right endpoint
    const angBase    = pctToAngle(100);          // baseline (100%) marker
    const angCeiling = pctToAngle(Math.min(ceilingPct, RANGE_MAX));
    const angCurrent = pctToAngle(Math.min(currentPct, RANGE_MAX));

    const isAlert  = currentPct > ceilingPct;
    const fillColor = isAlert ? RED : currentPct > 100 ? AMBER : TEAL;

    const needleTip  = polarToXY(CX, CY, trackR - 8, angCurrent);
    const needleBase = polarToXY(CX, CY, 16, angCurrent);

    // Fixed tick labels: "0%" at left end, "100%" above-right, "130%" at right end
    const pos0   = polarToXY(CX, CY, R + 20, angStart);
    const pos100 = polarToXY(CX, CY, R + 20, angBase);
    const pos130 = polarToXY(CX, CY, R + 20, angEnd);

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow='visible'>
            {/* Gray background track */}
            <path d={arcPath(CX, CY, trackR, angStart, angEnd)}
                fill='none' stroke='#e5e5e5' strokeWidth={SW} strokeLinecap='round' />

            {/* Zone tints */}
            <path d={arcPath(CX, CY, trackR, angStart, angBase)}
                fill='none' stroke='#4caf5030' strokeWidth={SW} />
            {ceilingPct > 100 && ceilingPct <= RANGE_MAX && (
                <path d={arcPath(CX, CY, trackR, angBase, angCeiling)}
                    fill='none' stroke='#ff980030' strokeWidth={SW} />
            )}
            <path d={arcPath(CX, CY, trackR, angCeiling, angEnd)}
                fill='none' stroke='#f4433630' strokeWidth={SW} />

            {/* Solid fill up to current position */}
            {currentPct > 0 && (
                <path d={arcPath(CX, CY, trackR, angStart, angCurrent)}
                    fill='none' stroke={fillColor} strokeWidth={SW} strokeLinecap='round' />
            )}

            {/* Baseline tick (100%) */}
            {(() => {
                const o = polarToXY(CX, CY, trackR + SW / 2 + 4, angBase);
                const i = polarToXY(CX, CY, trackR - SW / 2 - 4, angBase);
                return <line x1={i.x.toFixed(2)} y1={i.y.toFixed(2)} x2={o.x.toFixed(2)} y2={o.y.toFixed(2)}
                    stroke='#333' strokeWidth={2.5} strokeLinecap='round' />;
            })()}

            {/* Ceiling tick */}
            {ceilingPct <= RANGE_MAX && (() => {
                const o = polarToXY(CX, CY, trackR + SW / 2 + 4, angCeiling);
                const i = polarToXY(CX, CY, trackR - SW / 2 - 4, angCeiling);
                return <line x1={i.x.toFixed(2)} y1={i.y.toFixed(2)} x2={o.x.toFixed(2)} y2={o.y.toFixed(2)}
                    stroke={RED} strokeWidth={2.5} strokeLinecap='round' />;
            })()}

            {/* Needle */}
            <line x1={needleBase.x.toFixed(2)} y1={needleBase.y.toFixed(2)}
                x2={needleTip.x.toFixed(2)} y2={needleTip.y.toFixed(2)}
                stroke={fillColor} strokeWidth={3} strokeLinecap='round' />
            <circle cx={CX} cy={CY} r={8} fill={fillColor} stroke='white' strokeWidth={2} />

            {/* Centre readout */}
            <text x={CX} y={CY + 26} textAnchor='middle' fontSize='26' fontWeight='700'
                fill={isAlert ? RED : '#111'}>{currentPct.toFixed(0)}%</text>
            <text x={CX} y={CY + 44} textAnchor='middle' fontSize='10' fill='#aaa'>of baseline</text>

            {/* Arc end labels */}
            <text x={pos0.x.toFixed(2)} y={pos0.y.toFixed(2)} textAnchor='end'
                fontSize='9' fill='#aaa'>0%</text>
            <text x={pos100.x.toFixed(2)} y={pos100.y.toFixed(2)} textAnchor='middle'
                fontSize='9' fill='#555'>100%</text>
            <text x={pos130.x.toFixed(2)} y={pos130.y.toFixed(2)} textAnchor='start'
                fontSize='9' fill='#aaa'>{RANGE_MAX}%</text>
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
            <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: 1 }}>
                <Box>
                    <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.3 }}>
                        {isAlert
                            ? <WarningAmberIcon sx={{ color: RED, fontSize: '1.1rem' }} />
                            : <MonitorHeartOutlinedIcon sx={{ color: TEAL, fontSize: '1.1rem' }} />}
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isAlert ? RED : '#111' }}>
                            {groupName}
                        </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>{dataSourceLabel}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#555', mt: 0.2, fontWeight: 500 }}>{itemLabel}</Typography>
                </Box>
                <Stack direction='row' spacing={0.5} alignItems='center'>
                    {isAlert && (
                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.3)' }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: RED, letterSpacing: '0.05em' }}>OVERRUN</Typography>
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
