'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Stack, Typography, useTheme, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import PageContents from '@/components/PageContents';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';
import { Textfit } from 'react-textfit';


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
            Api.requestSession<any>({
                command: 'dashboard/fetch_data',
            }).then((data) => {
                if (mounted.current) {
                    setDashboardData(data);
                }
            });

            setDataRequested(true);
            return;
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);

    const cards: StatCardProps[] = dashboardData?.dashboard ?? [];
    const topRow = cards.slice(0, 4);
    const bottomRow = cards.slice(4);

    return (
        <PageContents requiredPermission='DASH_USE' title='Dashboard'>
            {!dashboardData ? (
                <Typography variant='h6'>{t('Loading...')}</Typography>
            ) : (
                <Box sx={{ position: 'relative', p: { xs: 2, md: 4 }, borderRadius: 4, overflow: 'hidden' }}>

                    {/* Decorative blobs — source for the blur to work against */}
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                        <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', top: -160, left: -80, background: 'radial-gradient(circle, rgba(0,171,190,0.32) 0%, transparent 70%)', filter: 'blur(64px)' }} />
                        <Box sx={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', bottom: -100, right: 60, background: 'radial-gradient(circle, rgba(0,200,220,0.22) 0%, transparent 70%)', filter: 'blur(56px)' }} />
                        <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', top: 40, right: -60, background: 'radial-gradient(circle, rgba(0,130,160,0.18) 0%, transparent 70%)', filter: 'blur(72px)' }} />
                        <Box sx={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', bottom: 20, left: '35%', background: 'radial-gradient(circle, rgba(100,220,230,0.16) 0%, transparent 70%)', filter: 'blur(48px)' }} />
                    </Box>

                    {/* Cards */}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
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
    const translatedTitle = t(title);

    useEffect(() => {
        window.dispatchEvent(new Event('resize'));
    }, [translatedTitle]);

    return (
        <Card
            sx={{
                width: '100%',
                p: 3,
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.52)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                '&:hover': {
                    boxShadow: '0 16px 48px rgba(0,171,190,0.15), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
                    transform: 'translateY(-5px)',
                },
            }}
        >
            <CardContent sx={{ width: '100%', pb: '16px !important' }}>
                <Typography variant='h5' fontWeight='bold' color='textSecondary' gutterBottom>
                    <Textfit key={translatedTitle} min={12} max={24}>
                        {translatedTitle}
                    </Textfit>
                </Typography>
                <Stack direction='row' justifyContent='center' alignItems='center'>
                    <Typography
                        variant='h4'
                        sx={{
                            color: hasPending ? 'error.main' : '#00ABBE',
                            fontWeight: 'bold',
                        }}
                    >
                        {count}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

export type StatCardProps = {
    title: string;
    count: string;
    hasPending?: boolean;
};
