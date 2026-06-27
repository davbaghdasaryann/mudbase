'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useRouter } from 'next/navigation';
import PageContents from '@/components/PageContents';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';

import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

const ICON_COLOR = '#00717C';
const NUMBER_COLOR = '#00717C';
const ICON_SX = { fontSize: 38, color: ICON_COLOR, opacity: 0.85 };

const CARD_ICONS: Record<string, React.ReactNode> = {
    'Pending Users':      <HourglassEmptyOutlinedIcon sx={ICON_SX} />,
    'Users':              <PeopleOutlinedIcon sx={ICON_SX} />,
    'Accounts':           <BusinessOutlinedIcon sx={ICON_SX} />,
    'Labor Offers':       <WorkOutlinedIcon sx={ICON_SX} />,
    'Material Offers':    <Inventory2OutlinedIcon sx={ICON_SX} />,
    'Labor Catalog':      <MenuBookOutlinedIcon sx={ICON_SX} />,
    'Materials Catalog':  <CategoryOutlinedIcon sx={ICON_SX} />,
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

function formatCount(val: string): string {
    const n = Number(val);
    if (isNaN(n)) return val;
    return n.toLocaleString('fr-FR');
}

export default function DashboardPage() {
    const mounted = useRef(false);
    const router = useRouter();
    const { permissionsSet } = usePermissions();
    const [dashboardData, setDashboardData] = useState<any | null>(null);
    const [dataRequested, setDataRequested] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const isSuperAdmin = permissionsSet?.has('ALL') ||
                           permissionsSet?.has('USR_FCH_ALL') ||
                           permissionsSet?.has('ACC_FCH');
        if (permissionsSet && !isSuperAdmin) {
            router.push('/dashboard-builder');
        }
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

    const cards: StatCardProps[] = dashboardData?.dashboard ?? [];
    const topRow = cards.slice(0, 4);
    const bottomRow = cards.slice(4);

    return (
        <PageContents requiredPermission='DASH_USE' title='Dashboard'>
            {!dashboardData ? (
                <Typography variant='h6'>{t('Loading...')}</Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '70vh' }}>
                    <Box sx={{ position: 'relative', p: { xs: 2, md: 3 } }}>
                        {/* Soft mesh blobs — localized to the card area only */}
                        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 4 }}>
                            <Box sx={{ position: 'absolute', width: 480, height: '140%', borderRadius: '50%', top: '-20%', left: '-60px', background: 'radial-gradient(ellipse, rgba(178,220,186,0.52) 0%, transparent 65%)', filter: 'blur(64px)' }} />
                            <Box sx={{ position: 'absolute', width: 480, height: '140%', borderRadius: '50%', top: '-20%', right: '-60px', background: 'radial-gradient(ellipse, rgba(178,232,242,0.48) 0%, transparent 65%)', filter: 'blur(64px)' }} />
                        </Box>

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            {/* Row 1 — 4 cards */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                {topRow.map((field, index) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex' }}>
                                        <StatCard
                                            {...field}
                                            isActive={hoveredIndex === index}
                                            isDimmed={hoveredIndex !== null && hoveredIndex !== index}
                                            onHover={() => setHoveredIndex(index)}
                                            onLeave={() => setHoveredIndex(null)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Row 2 — 3 cards centered */}
                            <Grid container spacing={3} justifyContent='center'>
                                {bottomRow.map((field, index) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex' }}>
                                        <StatCard
                                            {...field}
                                            isActive={hoveredIndex === 4 + index}
                                            isDimmed={hoveredIndex !== null && hoveredIndex !== 4 + index}
                                            onHover={() => setHoveredIndex(4 + index)}
                                            onLeave={() => setHoveredIndex(null)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                </Box>
            )}
        </PageContents>
    );
}

type StatCardExtProps = StatCardProps & {
    isActive: boolean;
    isDimmed: boolean;
    onHover: () => void;
    onLeave: () => void;
};

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
                minHeight: 170,
                px: 3,
                py: 3.5,
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isActive
                    ? '0 20px 56px rgba(0,171,190,0.20), 0 6px 18px rgba(0,0,0,0.08)'
                    : '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
                opacity: isDimmed ? 0.5 : 1,
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                zIndex: isActive ? 2 : 1,
            }}
        >
            {icon && (
                <Box
                    sx={{
                        mb: 1.5,
                        animation: isActive
                            ? (isHourglass
                                ? `${hourglassFlip} 0.65s ease forwards`
                                : `${floatUp} 0.7s ease-in-out infinite`)
                            : 'none',
                        // Smoothly rotate back when hover ends on hourglass
                        transform: !isActive && isHourglass ? 'rotate(0deg)' : undefined,
                        transition: isHourglass ? 'transform 0.5s ease' : undefined,
                    }}
                >
                    {icon}
                </Box>
            )}
            <Typography variant='subtitle1' fontWeight={600} color='text.secondary' sx={{ mb: 0.5, lineHeight: 1.3 }}>
                {t(title)}
            </Typography>
            <Typography
                variant='h4'
                fontWeight='bold'
                sx={{ color: hasPending ? 'error.main' : NUMBER_COLOR }}
            >
                {formatCount(count)}
            </Typography>
        </Box>
    );
}

export type StatCardProps = {
    title: string;
    count: string;
    hasPending?: boolean;
};
