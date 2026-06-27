'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Chip, CircularProgress } from '@mui/material';
import { keyframes } from '@emotion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, BarChart as RBarChart } from 'recharts';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { useRouter } from 'next/navigation';
import PageContents from '@/components/PageContents';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';

const NUMBER_COLOR = '#00717C';
const TEXT_DARK = '#424242';
const GRID_STROKE = 'rgba(0,0,0,0.05)';
const BAR_TOP = '#a8e6df';
const BAR_BOTTOM = '#007a6e';
const BAR_STROKE = '#005f56';
const BAR_LAST_TOP = '#e1bee7';
const BAR_LAST_BOTTOM = '#6a1b9a';
const BAR_LAST_STROKE = '#4a148c';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

const AM_MONTHS_SHORT = ['Հնվ','Փտվ','Մրտ','Ապр','Մայ','Հնс','Հলс','Օгс','Сеп','Հоկ','Ноյ','Դек'];
const fmtDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${AM_MONTHS_SHORT[d.getMonth()]}`;
};

const CARD_ICONS: Record<string, React.ReactNode> = {
    'Pending Users': <HourglassEmptyOutlinedIcon sx={{ fontSize: 36, color: '#00ABBE', opacity: 0.9 }} />,
    'Users':         <PeopleOutlinedIcon         sx={{ fontSize: 36, color: '#00ABBE', opacity: 0.9 }} />,
    'Accounts':      <BusinessOutlinedIcon       sx={{ fontSize: 36, color: '#00ABBE', opacity: 0.9 }} />,
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

// ── 30-Day Bar Chart — matches Widget30Day exactly ───────────────────────────
type TrendPoint = { day: string; value: number; timestamp: string };

function Offers30DayChart({ title, data, loading }: { title: string; data: TrendPoint[]; loading: boolean }) {
    const { t } = useTranslation();
    const gradId = title.replace(/\s+/g, '-');

    const chartData = data.map((p, i) => ({
        day: fmtDay(p.day),
        value: p.value,
        ts: new Date(p.timestamp).getTime(),
        isLast: i === data.length - 1,
    }));

    const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
    const prevValue    = chartData.length > 1 ? chartData[chartData.length - 2].value : currentValue;
    const pctChange    = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;

    const activeValues = chartData.map(d => d.value).filter(v => v > 0);
    const yMin = activeValues.length > 0 ? Math.min(...activeValues) : 0;
    const yMax = activeValues.length > 0 ? Math.max(...activeValues) : 0;
    const spread = yMax - yMin;
    const pad = spread > 0 ? spread * 0.15 : yMax * 0.02;
    const yDomain: [number, number] = activeValues.length > 1
        ? [Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]
        : [0, yMax > 0 ? yMax * 1.1 : 1];

    return (
        <Box sx={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 3,
            boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,171,190,0.14)',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 280,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            '&:hover': {
                borderColor: 'rgba(0,171,190,0.45)',
                boxShadow: '0 4px 24px rgba(0,171,190,0.14), 0 1px 6px rgba(0,0,0,0.06)',
            },
        }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 400, color: TEXT_DARK }}>
                    {t(title)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonthIcon sx={{ fontSize: 18, color: '#00A390' }} />
                    <Typography variant='body2' sx={{ fontSize: 14, color: TEXT_DARK }}>
                        {t('30 days')}
                    </Typography>
                </Box>
            </Box>

            {/* Current value + trend */}
            <Box sx={{ mb: 1 }}>
                <Typography component='span' sx={{ fontSize: 24, fontWeight: 600, color: '#212121' }}>
                    {Math.round(currentValue).toLocaleString()}
                </Typography>
                <Chip
                    size='small'
                    icon={pctChange >= 0
                        ? <TrendingUpIcon sx={{ fontSize: 14, color: BADGE_GREEN_TEXT }} />
                        : <TrendingDownIcon sx={{ fontSize: 14, color: '#c62828' }} />}
                    label={`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1).replace('.', ',')}%`}
                    sx={{
                        ml: 1.5, height: 22, fontSize: '0.75rem', fontWeight: 500,
                        bgcolor: pctChange >= 0 ? BADGE_GREEN_BG : 'rgba(244,67,54,0.15)',
                        color: pctChange >= 0 ? BADGE_GREEN_TEXT : '#c62828',
                        borderRadius: 1.5,
                        '& .MuiChip-icon': { color: 'inherit' },
                    }}
                />
            </Box>

            {/* Chart */}
            {loading ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={32} />
                </Box>
            ) : chartData.length > 0 ? (
                <ResponsiveContainer width='100%' height={162}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                        <defs>
                            <linearGradient id={`barBlue-${gradId}`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={BAR_TOP} />
                                <stop offset='100%' stopColor={BAR_BOTTOM} />
                            </linearGradient>
                            <linearGradient id={`barPurple-${gradId}`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={BAR_LAST_TOP} />
                                <stop offset='100%' stopColor={BAR_LAST_BOTTOM} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={GRID_STROKE} strokeWidth={0.8} vertical={false} />
                        <XAxis dataKey='day' tick={{ fontSize: 11, fill: TEXT_DARK }} axisLine={false} tickLine={false} />
                        <YAxis
                            tick={{ fontSize: 11, fill: TEXT_DARK }}
                            axisLine={false} tickLine={false}
                            domain={yDomain}
                            tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}k` : String(Math.round(v))}
                        />
                        <Tooltip
                            formatter={value => [value != null ? Math.round(Number(value)).toLocaleString() : '', '']}
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                        />
                        <Bar dataKey='value' radius={[3, 3, 0, 0]} maxBarSize={14}>
                            {chartData.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={entry.isLast ? `url(#barPurple-${gradId})` : `url(#barBlue-${gradId})`}
                                    stroke={entry.isLast ? BAR_LAST_STROKE : BAR_STROKE}
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

// ── Inventory & Catalogs bar chart ───────────────────────────────────────────
const BAR_GRADS = [
    { id: 'cat-labor',    top: '#00CCDD', bottom: '#00899B', stroke: '#006e7e' },
    { id: 'cat-material', top: '#4EE89A', bottom: '#1CA461', stroke: '#148048' },
];

const CatTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background: '#fff', border: '1px solid #e0f0f4', borderRadius: 2, p: 1.5, minWidth: 120, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
            <Typography variant='body2' sx={{ color: '#00ABBE' }}>{formatCount(payload[0].value)}</Typography>
        </Box>
    );
};

function CatalogsBar({ laborCatalog, materialCatalog }: { laborCatalog: number; materialCatalog: number }) {
    const { t } = useTranslation();
    const data = [
        { name: t('Labor Catalog'),     value: laborCatalog,    gradId: 'cat-labor' },
        { name: t('Materials Catalog'), value: materialCatalog, gradId: 'cat-material' },
    ];

    return (
        <Box sx={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 3,
            boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,171,190,0.14)',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 280,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            '&:hover': {
                borderColor: 'rgba(0,171,190,0.45)',
                boxShadow: '0 4px 24px rgba(0,171,190,0.14), 0 1px 6px rgba(0,0,0,0.06)',
            },
        }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1, fontSize: 14, color: TEXT_DARK }}>{t('Inventory & Catalogs')}</Typography>
            <Box sx={{ flex: 1, minHeight: 200 }}>
                <ResponsiveContainer width='100%' height='100%'>
                    <RBarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap='40%'>
                        <defs>
                            {BAR_GRADS.map(g => (
                                <linearGradient key={g.id} id={g.id} x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='0%' stopColor={g.top} />
                                    <stop offset='100%' stopColor={g.bottom} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                        <XAxis dataKey='name' tick={{ fontSize: 12, fill: TEXT_DARK }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={44} />
                        <Tooltip content={<CatTooltip />} cursor={{ fill: 'rgba(0,171,190,0.06)' }} />
                        <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={72}>
                            {data.map(d => {
                                const g = BAR_GRADS.find(gr => gr.id === d.gradId)!;
                                return <Cell key={d.name} fill={`url(#${d.gradId})`} stroke={g.stroke} strokeWidth={0.5} />;
                            })}
                        </Bar>
                    </RBarChart>
                </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1.5, flexWrap: 'wrap' }}>
                {data.map((d, i) => (
                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: BAR_GRADS[i].top, flexShrink: 0 }} />
                        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            {d.name} — {formatCount(d.value)}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
type StatCardProps = { title: string; count: string; hasPending?: boolean };
type StatCardExtProps = StatCardProps & { isActive: boolean; isDimmed: boolean; onHover: () => void; onLeave: () => void };

function StatCard({ title, count, hasPending = false, isActive, isDimmed, onHover, onLeave }: StatCardExtProps) {
    const { t } = useTranslation();
    const icon = CARD_ICONS[title] ?? null;
    const isHourglass = title === 'Pending Users';

    return (
        <Box
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            sx={{
                width: '100%',
                minHeight: 150,
                px: 3,
                py: 3,
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(0,171,190,0.14)',
                borderTop: '3px solid rgba(0,171,190,0.35)',
                boxShadow: isActive
                    ? '0 12px 40px rgba(0,171,190,0.18), 0 4px 12px rgba(0,0,0,0.07)'
                    : '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                opacity: isDimmed ? 0.5 : 1,
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                zIndex: isActive ? 2 : 1,
            }}
        >
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
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
                if (mounted.current) {
                    setDashboardData(main);
                    setTrendData(trend);
                    setTrendLoading(false);
                }
            });
            setDataRequested(true);
        }
        return () => { mounted.current = false; };
    }, [dataRequested]);

    const raw: StatCardProps[] = dashboardData?.dashboard ?? [];
    const byTitle = Object.fromEntries(raw.map(c => [c.title, c]));
    const statCards = ['Pending Users', 'Users', 'Accounts'].map(k => byTitle[k]).filter(Boolean);

    return (
        <PageContents requiredPermission='DASH_USE' title='Dashboard' sx={{ background: '#F5F9F9', minHeight: '100%' }}>
            {!dashboardData ? (
                <Typography variant='h6'>{t('Loading...')}</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Row 1 — Labor & Material Offers 30-day charts */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Offers30DayChart title='Labor Offers'    data={trendData?.laborOffers    ?? []} loading={trendLoading} />
                        <Offers30DayChart title='Material Offers' data={trendData?.materialOffers ?? []} loading={trendLoading} />
                    </Box>

                    {/* Row 2 — Labor & Material Catalog 30-day charts */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Offers30DayChart title='Labor Catalog'     data={trendData?.laborItems    ?? []} loading={trendLoading} />
                        <Offers30DayChart title='Materials Catalog' data={trendData?.materialItems ?? []} loading={trendLoading} />
                    </Box>

                    {/* Row 3 — 3 stat cards */}
                    <Grid container spacing={3}>
                        {statCards.map((card, index) => (
                            <Grid size={{ xs: 12, sm: 4 }} key={card.title} sx={{ display: 'flex' }}>
                                <StatCard
                                    {...card}
                                    isActive={hoveredIndex === index}
                                    isDimmed={hoveredIndex !== null && hoveredIndex !== index}
                                    onHover={() => setHoveredIndex(index)}
                                    onLeave={() => setHoveredIndex(null)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </PageContents>
    );
}
