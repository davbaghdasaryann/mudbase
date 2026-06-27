'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Chip, CircularProgress } from '@mui/material';
import { keyframes } from '@emotion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { useRouter } from 'next/navigation';
import PageContents from '@/components/PageContents';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';

const NUMBER_COLOR = '#00717C';
const TEXT_DARK = '#424242';
const GRID_STROKE = 'rgba(0,0,0,0.05)';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

const CARD_SX = (isActive: boolean, isDimmed: boolean) => ({
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 3,
    border: '1px solid rgba(0,171,190,0.14)',
    boxShadow: isActive
        ? '0 12px 40px rgba(0,171,190,0.18), 0 4px 12px rgba(0,0,0,0.07)'
        : '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
    opacity: isDimmed ? 0.5 : 1,
    transform: isActive ? 'scale(1.02)' : 'scale(1)',
    transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
    zIndex: isActive ? 2 : 1,
});

// Per-chart gradient palette
const CHART_PALETTE: Record<string, { top: string; bottom: string; stroke: string; lastTop: string; lastBottom: string; lastStroke: string }> = {
    'Labor Offers':      { top: '#a8e6df', bottom: '#007a6e', stroke: '#005f56', lastTop: '#e1bee7', lastBottom: '#6a1b9a', lastStroke: '#4a148c' },
    'Material Offers':   { top: '#b3e5fc', bottom: '#0277bd', stroke: '#01579b', lastTop: '#ffe0b2', lastBottom: '#e65100', lastStroke: '#bf360c' },
    'Labor Catalog':     { top: '#c8e6c9', bottom: '#2e7d32', stroke: '#1b5e20', lastTop: '#fff9c4', lastBottom: '#f57f17', lastStroke: '#e65100' },
    'Materials Catalog': { top: '#b2dfdb', bottom: '#00695c', stroke: '#004d40', lastTop: '#f8bbd0', lastBottom: '#880e4f', lastStroke: '#6a0036' },
};

const AM_MONTHS_SHORT = ['Հнв','Փтв','Мрт','Апр','Май','Хнс','Хлс','Өгс','Сеп','Хок','Ноя','Дек'];
const fmtDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${AM_MONTHS_SHORT[d.getMonth()]}`;
};

const floatUp = keyframes`
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

const hourglassFlip = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(180deg); }
`;

function formatCount(val: string | number): string {
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return n.toLocaleString('fr-FR');
}

// ── 30-Day Bar Chart ─────────────────────────────────────────────────────────
type TrendPoint = { day: string; value: number; timestamp: string };

function Chart30Day({ title, data, loading, isActive, isDimmed, onHover, onLeave }: {
    title: string; data: TrendPoint[]; loading: boolean;
    isActive: boolean; isDimmed: boolean; onHover: () => void; onLeave: () => void;
}) {
    const { t } = useTranslation();
    const gradId = title.replace(/\s+/g, '-');
    const pal = CHART_PALETTE[title] ?? CHART_PALETTE['Labor Offers'];

    const chartData = data.map((p, i) => ({
        day: fmtDay(p.day),
        value: p.value,
        isLast: i === data.length - 1,
    }));

    const currentValue = chartData.at(-1)?.value ?? 0;
    const prevValue    = chartData.at(-2)?.value ?? currentValue;
    const pctChange    = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;

    const vals = chartData.map(d => d.value).filter(v => v > 0);
    const yMin = vals.length ? Math.min(...vals) : 0;
    const yMax = vals.length ? Math.max(...vals) : 0;
    const spread = yMax - yMin;
    const pad = spread > 0 ? spread * 0.15 : yMax * 0.02;
    const yDomain: [number, number] = vals.length > 1
        ? [Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]
        : [0, yMax > 0 ? yMax * 1.1 : 1];

    return (
        <Box onMouseEnter={onHover} onMouseLeave={onLeave} sx={{ ...CARD_SX(isActive, isDimmed), p: 2, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 400, color: TEXT_DARK }}>{t(title)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonthIcon sx={{ fontSize: 18, color: '#00A390' }} />
                    <Typography variant='body2' sx={{ fontSize: 14, color: TEXT_DARK }}>{t('30 days')}</Typography>
                </Box>
            </Box>
            <Box sx={{ mb: 1 }}>
                <Typography component='span' sx={{ fontSize: 24, fontWeight: 600, color: '#212121' }}>
                    {Math.round(currentValue).toLocaleString()}
                </Typography>
                <Chip size='small'
                    icon={pctChange >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                    label={`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1).replace('.', ',')}%`}
                    sx={{
                        ml: 1.5, height: 22, fontSize: '0.75rem', fontWeight: 500, borderRadius: 1.5,
                        bgcolor: pctChange >= 0 ? BADGE_GREEN_BG : 'rgba(244,67,54,0.15)',
                        color: pctChange >= 0 ? BADGE_GREEN_TEXT : '#c62828',
                        '& .MuiChip-icon': { color: 'inherit' },
                    }}
                />
            </Box>
            {loading ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={32} />
                </Box>
            ) : chartData.length > 0 ? (
                <ResponsiveContainer width='100%' height={162}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                        <defs>
                            <linearGradient id={`bMain-${gradId}`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={pal.top} /><stop offset='100%' stopColor={pal.bottom} />
                            </linearGradient>
                            <linearGradient id={`bLast-${gradId}`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={pal.lastTop} /><stop offset='100%' stopColor={pal.lastBottom} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={GRID_STROKE} strokeWidth={0.8} vertical={false} />
                        <XAxis dataKey='day' tick={{ fontSize: 11, fill: TEXT_DARK }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: TEXT_DARK }} axisLine={false} tickLine={false} domain={yDomain}
                            tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}k` : String(Math.round(v))} />
                        <Tooltip formatter={v => [v != null ? Math.round(Number(v)).toLocaleString() : '', '']}
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
                        <Bar dataKey='value' radius={[3, 3, 0, 0]} maxBarSize={14}>
                            {chartData.map((entry, i) => (
                                <Cell key={i}
                                    fill={entry.isLast ? `url(#bLast-${gradId})` : `url(#bMain-${gradId})`}
                                    stroke={entry.isLast ? pal.lastStroke : pal.stroke}
                                    strokeWidth={0.5}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>{t('No data available yet.')}</Typography>
                </Box>
            )}
        </Box>
    );
}

// ── Accounts Donut ───────────────────────────────────────────────────────────
const DONUT_SEGS = [
    { key: 'active',   gradId: 'acc-active',   inner: '#00CCDD', outer: '#00899B', dot: '#00899B' },
    { key: 'inactive', gradId: 'acc-inactive',  inner: '#b2dfdb', outer: '#4db6ac', dot: '#4db6ac' },
];

const DonutTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background: '#fff', border: '1px solid #e0f0f4', borderRadius: 2, p: 1.5, minWidth: 120, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>{payload[0].name}</Typography>
            <Typography variant='body2' sx={{ color: '#00ABBE' }}>{formatCount(payload[0].value)}</Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>{payload[0].payload.pct}%</Typography>
        </Box>
    );
};

function AccountsDonut({ activeCount, inactiveCount, isActive, isDimmed, onHover, onLeave }: {
    activeCount: number; inactiveCount: number;
    isActive: boolean; isDimmed: boolean; onHover: () => void; onLeave: () => void;
}) {
    const { t } = useTranslation();
    const total = activeCount + inactiveCount;
    const data = total === 0 ? [] : [
        { key: 'active',   name: t('Active'),   value: activeCount,   pct: ((activeCount / total) * 100).toFixed(1) },
        { key: 'inactive', name: t('Inactive'), value: inactiveCount, pct: ((inactiveCount / total) * 100).toFixed(1) },
    ];

    return (
        <Box onMouseEnter={onHover} onMouseLeave={onLeave}
            sx={{ ...CARD_SX(isActive, isDimmed), width: '100%', minHeight: 150, px: 3, py: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <Typography variant='subtitle2' fontWeight={600} color='text.secondary' sx={{ mb: 1 }}>{t('Accounts')}</Typography>
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                        <defs>
                            {DONUT_SEGS.map(s => (
                                <radialGradient key={s.gradId} id={s.gradId} cx='50%' cy='50%' r='50%'>
                                    <stop offset='0%' stopColor={s.inner} />
                                    <stop offset='100%' stopColor={s.outer} />
                                </radialGradient>
                            ))}
                        </defs>
                        <Pie data={data.length ? data : [{ key: 'empty', name: '', value: 1, pct: '0' }]}
                            cx='50%' cy='50%' innerRadius={34} outerRadius={52} paddingAngle={data.length > 1 ? 2 : 0} dataKey='value' strokeWidth={0}>
                            {(data.length ? data : [{ key: 'empty' }]).map((entry: any) => {
                                const seg = DONUT_SEGS.find(s => s.key === entry.key);
                                return <Cell key={entry.key} fill={seg ? `url(#${seg.gradId})` : '#e0e0e0'} stroke={seg?.outer ?? '#ccc'} strokeWidth={0.5} />;
                            })}
                        </Pie>
                        {data.length > 0 && <Tooltip content={<DonutTip />} />}
                    </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <Typography sx={{ fontWeight: 700, color: NUMBER_COLOR, lineHeight: 1, fontSize: '1.1rem' }}>{formatCount(total)}</Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.map(d => {
                    const seg = DONUT_SEGS.find(s => s.key === d.key);
                    return (
                        <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: seg?.dot, flexShrink: 0 }} />
                            <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{d.name} {d.pct}%</Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
type StatCardProps = { title: string; count: string; hasPending?: boolean };

const STAT_ICONS: Record<string, React.ReactNode> = {
    'Pending Users': <HourglassEmptyOutlinedIcon sx={{ fontSize: 36, color: '#00ABBE', opacity: 0.9 }} />,
    'Users':         <PeopleOutlinedIcon         sx={{ fontSize: 36, color: '#00ABBE', opacity: 0.9 }} />,
};

function StatCard({ title, count, hasPending = false, isActive, isDimmed, onHover, onLeave }: StatCardProps & {
    isActive: boolean; isDimmed: boolean; onHover: () => void; onLeave: () => void;
}) {
    const { t } = useTranslation();
    const icon = STAT_ICONS[title] ?? null;
    const isHourglass = title === 'Pending Users';

    return (
        <Box onMouseEnter={onHover} onMouseLeave={onLeave}
            sx={{ ...CARD_SX(isActive, isDimmed), width: '100%', minHeight: 150, px: 3, py: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {icon && (
                <Box sx={{
                    mb: 1.5,
                    animation: isActive ? (isHourglass ? `${hourglassFlip} 0.65s ease forwards` : `${floatUp} 0.7s ease-in-out infinite`) : 'none',
                    transform: !isActive && isHourglass ? 'rotate(0deg)' : undefined,
                    transition: isHourglass ? 'transform 0.5s ease' : undefined,
                }}>
                    {icon}
                </Box>
            )}
            <Typography variant='subtitle1' fontWeight={600} color='text.secondary' sx={{ mb: 0.5, lineHeight: 1.3 }}>
                {t(title)}
            </Typography>
            <Typography variant='h4' fontWeight='bold' sx={{ color: hasPending ? 'error.main' : NUMBER_COLOR }}>
                {formatCount(count)}
            </Typography>
        </Box>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const mounted = useRef(false);
    const router = useRouter();
    const { permissionsSet } = usePermissions();
    const [dashboardData, setDashboardData] = useState<any | null>(null);
    const [trendData, setTrendData] = useState<{ laborOffers: TrendPoint[]; materialOffers: TrendPoint[]; laborItems: TrendPoint[]; materialItems: TrendPoint[] } | null>(null);
    const [trendLoading, setTrendLoading] = useState(true);
    const [dataRequested, setDataRequested] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const isSuperAdmin = permissionsSet?.has('ALL') || permissionsSet?.has('USR_FCH_ALL') || permissionsSet?.has('ACC_FCH');
        if (permissionsSet && !isSuperAdmin) router.push('/dashboard-builder');
    }, [permissionsSet, router]);

    useEffect(() => {
        mounted.current = true;
        if (!dataRequested) {
            Promise.all([
                Api.requestSession<any>({ command: 'dashboard/fetch_data' }),
                Api.requestSession<any>({ command: 'dashboard/fetch_offers_trend' }),
            ]).then(([main, trend]) => {
                if (mounted.current) { setDashboardData(main); setTrendData(trend); setTrendLoading(false); }
            });
            setDataRequested(true);
        }
        return () => { mounted.current = false; };
    }, [dataRequested]);

    const raw: StatCardProps[] = dashboardData?.dashboard ?? [];
    const byTitle = Object.fromEntries(raw.map(c => [c.title, c]));
    const hover = (id: string) => ({ isActive: hoveredId === id, isDimmed: hoveredId !== null && hoveredId !== id, onHover: () => setHoveredId(id), onLeave: () => setHoveredId(null) });

    const chartKeys: Array<{ key: string; title: string; data: TrendPoint[] }> = [
        { key: 'Labor Offers',      title: 'Labor Offers',      data: trendData?.laborOffers    ?? [] },
        { key: 'Material Offers',   title: 'Material Offers',   data: trendData?.materialOffers ?? [] },
        { key: 'Labor Catalog',     title: 'Labor Catalog',     data: trendData?.laborItems     ?? [] },
        { key: 'Materials Catalog', title: 'Materials Catalog', data: trendData?.materialItems  ?? [] },
    ];

    return (
        <PageContents requiredPermission='DASH_USE' title='Dashboard' sx={{ background: '#F5F9F9', minHeight: '100%' }}>
            {!dashboardData ? (
                <Typography variant='h6'>{t('Loading...')}</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Row 1 — Pending Users | Accounts Donut | Users */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
                            <StatCard {...byTitle['Pending Users']} {...hover('Pending Users')} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
                            <AccountsDonut
                                activeCount={dashboardData.activeAccounts ?? 0}
                                inactiveCount={dashboardData.inactiveAccounts ?? 0}
                                {...hover('Accounts')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
                            <StatCard {...byTitle['Users']} {...hover('Users')} />
                        </Grid>
                    </Grid>

                    {/* Row 2 — Labor Offers + Material Offers */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        {chartKeys.slice(0, 2).map(c => (
                            <Chart30Day key={c.key} title={c.title} data={c.data} loading={trendLoading} {...hover(c.key)} />
                        ))}
                    </Box>

                    {/* Row 3 — Labor Catalog + Materials Catalog */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        {chartKeys.slice(2).map(c => (
                            <Chart30Day key={c.key} title={c.title} data={c.data} loading={trendLoading} {...hover(c.key)} />
                        ))}
                    </Box>
                </Box>
            )}
        </PageContents>
    );
}
