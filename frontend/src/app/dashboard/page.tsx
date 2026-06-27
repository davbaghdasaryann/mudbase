'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography, Grid } from '@mui/material';
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

// Subtle near-white cool gradient — matching reference aesthetic
const CARD_GRADIENTS = [
    'linear-gradient(145deg, #f8fcfe 0%, #e8f5f9 100%)',
    'linear-gradient(155deg, #f7fbfd 0%, #eaf6fa 100%)',
    'linear-gradient(135deg, #f8fdfe 0%, #e6f4f8 100%)',
    'linear-gradient(150deg, #f6fbfd 0%, #ebf7fa 100%)',
    'linear-gradient(140deg, #f7fcfe 0%, #e8f5f9 100%)',
    'linear-gradient(160deg, #f8fdfe 0%, #e9f6f9 100%)',
    'linear-gradient(130deg, #f6fbfd 0%, #eaf6f9 100%)',
];

function formatCount(val: string): string {
    const n = Number(val);
    if (isNaN(n)) return val;
    return n.toLocaleString('fr-FR'); // space as thousands separator: 4 493
}

export default function DashboardPage() {
    const mounted = useRef(false);
    const router = useRouter();
    const { permissionsSet } = usePermissions();
    const [dashboardData, setDashboardData] = useState<any | null>(null);
    const [dataRequested, setDataRequested] = useState(false);
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
                {/* Mesh gradient background — soft color blobs behind the cards */}
                <Box sx={{ position: 'relative', borderRadius: 4, overflow: 'hidden', p: { xs: 2, md: 3 } }}>

                    {/* Soft blobs — low-saturation logo colors */}
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                        <Box sx={{ position: 'absolute', width: 420, height: 340, borderRadius: '50%', top: -80, left: -60,  background: 'radial-gradient(ellipse, rgba(80,200,140,0.18) 0%, transparent 70%)', filter: 'blur(48px)' }} />
                        <Box sx={{ position: 'absolute', width: 360, height: 300, borderRadius: '50%', top: 20,  left: '28%', background: 'radial-gradient(ellipse, rgba(0,200,220,0.15) 0%, transparent 70%)', filter: 'blur(52px)' }} />
                        <Box sx={{ position: 'absolute', width: 380, height: 320, borderRadius: '50%', top: -40, right: -40,  background: 'radial-gradient(ellipse, rgba(30,160,220,0.14) 0%, transparent 70%)', filter: 'blur(56px)' }} />
                        <Box sx={{ position: 'absolute', width: 300, height: 260, borderRadius: '50%', bottom: -60, left: '15%',background: 'radial-gradient(ellipse, rgba(0,185,200,0.13) 0%, transparent 70%)', filter: 'blur(44px)' }} />
                        <Box sx={{ position: 'absolute', width: 280, height: 240, borderRadius: '50%', bottom: -40, right: '20%',background: 'radial-gradient(ellipse, rgba(40,170,210,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
                    </Box>

                    {/* Cards */}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* Row 1 — 4 cards */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {topRow.map((field, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex' }}>
                                    <StatCard {...field} gradient={CARD_GRADIENTS[index]} />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Row 2 — 3 cards centered */}
                        <Grid container spacing={3} justifyContent='center'>
                            {bottomRow.map((field, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex' }}>
                                    <StatCard {...field} gradient={CARD_GRADIENTS[4 + index]} />
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

function StatCard({ title, count, hasPending = false, gradient }: StatCardProps & { gradient?: string }) {
    const { t } = useTranslation();
    const icon = CARD_ICONS[title] ?? null;

    return (
        <Box
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
                background: gradient ?? CARD_GRADIENTS[0],
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                cursor: 'default',
                '&:hover': {
                    boxShadow: '0 10px 36px rgba(0,171,190,0.16), 0 3px 8px rgba(0,0,0,0.06)',
                    transform: 'translateY(-4px)',
                },
            }}
        >
            {icon && <Box sx={{ mb: 1.5 }}>{icon}</Box>}
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
