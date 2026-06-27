'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid } from '@mui/material';
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
            {/* Full-viewport gradient background — fixed so it spans the entire screen */}
            <Box sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                background: 'linear-gradient(to right, #E2F1E4, #E0F7FA)',
                pointerEvents: 'none',
            }} />

            {!dashboardData ? (
                <Typography variant='h6' sx={{ position: 'relative', zIndex: 1 }}>{t('Loading...')}</Typography>
            ) : (
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '70vh' }}>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        {/* Row 1 — 4 cards */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {topRow.map((field, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex' }}>
                                    <StatCard {...field} />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Row 2 — 3 cards centered */}
                        <Grid container spacing={3} justifyContent='center'>
                            {bottomRow.map((field, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index} sx={{ display: 'flex' }}>
                                    <StatCard {...field} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>
            )}
        </PageContents>
    );
}

function StatCard({ title, count, hasPending = false }: StatCardProps) {
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
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
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
