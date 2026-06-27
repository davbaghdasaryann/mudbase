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
                <Box
                    sx={{
                        p: { xs: 2, md: 4 },
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(0,171,190,0.07) 0%, rgba(0,0,0,0.04) 100%)',
                    }}
                >
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
                background: 'rgba(255, 255, 255, 0.58)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.42)',
                boxShadow: '0 4px 28px rgba(0,0,0,0.07), 0 1px 6px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                '&:hover': {
                    boxShadow: '0 10px 40px rgba(0,171,190,0.18), 0 3px 10px rgba(0,0,0,0.08)',
                    transform: 'translateY(-4px)',
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
