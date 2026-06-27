'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { keyframes } from '@emotion/react';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useRouter } from 'next/navigation';
import PageContents from '@/components/PageContents';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';

import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

const NUMBER_COLOR = '#00717C';

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

// ── Shared chart Paper container style matching Structural Analysis ──────────
const chartPaperSx = {
    border: '1px solid #e0f0f4',
    borderRadius: 3,
    p: 2.5,
    background: '#fff',
    height: '100%',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
};

// ── Donut: Offers Breakdown ──────────────────────────────────────────────────
const DONUT_SEGMENTS = [
    { key: 'labor',    label: 'Labor Offers',    gradId: 'pie-labor',    inner: '#00CCDD', outer: '#00899B', dot: '#00899B' },
    { key: 'material', label: 'Material Offers', gradId: 'pie-material', inner: '#4EE89A', outer: '#1CA461', dot: '#1CA461' },
];

const DonutTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 130 }}>
            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{payload[0].name}</Typography>
            <Typography variant='body2' sx={{ color: '#00ABBE' }}>{formatCount(payload[0].value)}</Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>{payload[0].payload.pct}%</Typography>
        </Paper>
    );
};

function OffersDonut({ laborOffers, materialOffers }: { laborOffers: number; materialOffers: number }) {
    const { t } = useTranslation();
    const total = laborOffers + materialOffers;
    const data = total === 0 ? [] : [
        { key: 'labor',    name: t('Labor Offers'),    value: laborOffers,    pct: ((laborOffers / total) * 100).toFixed(1) },
        { key: 'material', name: t('Material Offers'), value: materialOffers, pct: ((materialOffers / total) * 100).toFixed(1) },
    ];

    return (
        <Paper elevation={0} sx={chartPaperSx}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>{t('Offers Breakdown')}</Typography>
            {data.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>—</Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ flex: 1, minHeight: 160, position: 'relative' }}>
                        <ResponsiveContainer width='100%' height='100%'>
                            <PieChart>
                                <defs>
                                    {DONUT_SEGMENTS.map(s => (
                                        <radialGradient key={s.gradId} id={s.gradId} cx='50%' cy='50%' r='50%'>
                                            <stop offset='0%' stopColor={s.inner} />
                                            <stop offset='100%' stopColor={s.outer} />
                                        </radialGradient>
                                    ))}
                                </defs>
                                <Pie data={data} cx='50%' cy='50%' innerRadius={52} outerRadius={80} paddingAngle={2} dataKey='value' strokeWidth={0}>
                                    {data.map((entry) => {
                                        const seg = DONUT_SEGMENTS.find(s => s.key === entry.key);
                                        return <Cell key={entry.key} fill={seg ? `url(#${seg.gradId})` : '#ccc'} stroke={seg?.outer ?? '#ccc'} strokeWidth={0.5} />;
                                    })}
                                </Pie>
                                <RTooltip content={<DonutTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <Typography variant='h6' sx={{ fontWeight: 700, color: NUMBER_COLOR, lineHeight: 1 }}>{formatCount(total)}</Typography>
                            <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>total</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1.5, flexWrap: 'wrap' }}>
                        {data.map(d => {
                            const seg = DONUT_SEGMENTS.find(s => s.key === d.key);
                            return (
                                <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: seg?.dot, flexShrink: 0 }} />
                                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                        {d.name} — {formatCount(d.value)} ({d.pct}%)
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}
        </Paper>
    );
}

// ── Bar: Inventory & Catalogs ────────────────────────────────────────────────
const BAR_GRADS = [
    { id: 'bar-labor',    top: '#00CCDD', bottom: '#00899B', stroke: '#006e7e' },
    { id: 'bar-material', top: '#4EE89A', bottom: '#1CA461', stroke: '#148048' },
];

const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 130 }}>
            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
            <Typography variant='body2' sx={{ color: '#00ABBE' }}>{formatCount(payload[0].value)}</Typography>
        </Paper>
    );
};

function CatalogsBar({ laborCatalog, materialCatalog }: { laborCatalog: number; materialCatalog: number }) {
    const { t } = useTranslation();
    const data = [
        { name: t('Labor Catalog'),    value: laborCatalog,    gradId: 'bar-labor' },
        { name: t('Materials Catalog'), value: materialCatalog, gradId: 'bar-material' },
    ];

    return (
        <Paper elevation={0} sx={chartPaperSx}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>{t('Inventory & Catalogs')}</Typography>
            <Box sx={{ flex: 1, minHeight: 160 }}>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap='40%'>
                        <defs>
                            {BAR_GRADS.map(g => (
                                <linearGradient key={g.id} id={g.id} x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='0%' stopColor={g.top} />
                                    <stop offset='100%' stopColor={g.bottom} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                        <XAxis dataKey='name' tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={44} />
                        <RTooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,171,190,0.06)' }} />
                        <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={72}>
                            {data.map(d => {
                                const g = BAR_GRADS.find(gr => gr.id === d.gradId)!;
                                return <Cell key={d.name} fill={`url(#${d.gradId})`} stroke={g.stroke} strokeWidth={0.5} />;
                            })}
                        </Bar>
                    </BarChart>
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
        </Paper>
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
                borderTop: '3px solid rgba(0,171,190,0.35)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(0,171,190,0.14)',
                borderTopColor: 'rgba(0,171,190,0.35)',
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
            Api.requestSession<any>({ command: 'dashboard/fetch_data' }).then((data) => {
                if (mounted.current) setDashboardData(data);
            });
            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false; };
    }, [dataRequested]);

    const raw: StatCardProps[] = dashboardData?.dashboard ?? [];
    const byTitle = Object.fromEntries(raw.map(c => [c.title, c]));

    const statCards = ['Pending Users', 'Users', 'Accounts'].map(k => byTitle[k]).filter(Boolean);
    const laborOffers   = Number(byTitle['Labor Offers']?.count ?? 0);
    const materialOffers = Number(byTitle['Material Offers']?.count ?? 0);
    const laborCatalog  = Number(byTitle['Labor Catalog']?.count ?? 0);
    const materialCatalog = Number(byTitle['Materials Catalog']?.count ?? 0);

    return (
        <PageContents requiredPermission='DASH_USE' title='Dashboard' sx={{ background: '#F5F9F9', minHeight: '100%' }}>
            {!dashboardData ? (
                <Typography variant='h6'>{t('Loading...')}</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Top row — two charts */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, minHeight: 300 }}>
                        <OffersDonut laborOffers={laborOffers} materialOffers={materialOffers} />
                        <CatalogsBar laborCatalog={laborCatalog} materialCatalog={materialCatalog} />
                    </Box>

                    {/* Bottom row — 3 stat cards */}
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
