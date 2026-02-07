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

    // Redirect regular users to widget builder
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
            })
                .then((data) => {
                    if (mounted.current) {
                        console.log('Dashboard data:', data);
                        setDashboardData(data);
                    }
                })


            setDataRequested(true);
            return;
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);



    return (
        <PageContents requiredPermission='DASH_USE' title='Dashboard'>
            {/* <Box sx={{display: 'flex'}}>
                <Stack
                    spacing={2}
                    sx={{
                        alignItems: 'center',
                        mx: 3,
                        pb: 5,
                        mt: {xs: 8, md: 0},
                        width: 1,
                        height: 1,
                    }}
                >
                    <Box sx={{width: '100%', maxWidth: {sm: '100%', md: '1700px'}}}> */}
            {/* Overview Header */}
            <Typography variant='h4' sx={{ mb: 2, fontWeight: 'bold' }}>
                {t("Dashboard")}
            </Typography>

            {/* <Grid key={index} size={3}> */}
            {/* Cards Grid */}
            <Grid container spacing={4} sx={{ mb: 2 }}>
                {dashboardData ? (
                    dashboardData.dashboard.map((field, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} sx={{ display: 'flex', width: '100%' }} key={index}>
                            <StatCard {...field} />
                        </Grid>
                    ))
                ) : (
                    <Typography variant='h6'>{t('Loading...')}</Typography>
                )}
            </Grid>
            {/* </Box>
                </Stack>
            </Box> */}
        </PageContents>
    );
}

function StatCard({ title, count, hasPending = false }: StatCardProps) {
    const theme = useTheme();

    const { t } = useTranslation();
    const translatedTitle = t(title);

    useEffect(() => {
        window.dispatchEvent(new Event('resize'));
    }, [translatedTitle]);

    // const trendColors = {
    //     up: theme.palette.mode === 'light' ? theme.palette.success.main : theme.palette.success.dark,
    //     down: theme.palette.mode === 'light' ? theme.palette.error.main : theme.palette.error.dark,
    //     neutral: theme.palette.mode === 'light' ? theme.palette.grey[400] : theme.palette.grey[700],
    // };

    // const labelColors = {
    //     up: 'success' as const,
    //     down: 'error' as const,
    //     neutral: 'default' as const,
    // };

    return (
        <Card
            variant='outlined'
            sx={{
                width: '100%',
                p: 3,
                borderRadius: 3,
                // height: 180, // Ensuring square shape
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                // boxShadow: 3,
                // background: theme.palette.mode === 'light' ? '#f0f0f0' : 'linear-gradient(to bottom, #242424, #2e2e2e)',
                // border: theme.palette.mode === 'light' ? '2px solid #333333' : '2px solid #888888',
            }}
        >
            <CardContent sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="bold" color="textSecondary" gutterBottom>
                    {/* Provide a key that depends on the translated title */}
                    <Textfit key={translatedTitle} min={12} max={24}>
                        {translatedTitle}
                    </Textfit>
                </Typography>
                <Stack direction="row" justifyContent="center" alignItems="center">
                    <Typography
                        variant="h4"
                        sx={{
                            color: hasPending ? 'red' : 'inherit',
                            fontWeight: 'bold',
                        }}
                    >
                        {count}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>

        // <Card variant='outlined' sx={{ height: '100%', flexGrow: 1, padding: 2}}>
        //     <CardContent>
        //         <Typography component='h2' variant='subtitle2' gutterBottom>
        //             {title}
        //         </Typography>
        //         <Stack direction='column' sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}>
        //             <Stack sx={{ justifyContent: 'space-between' }}>
        //                 <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        //                     <Typography style={{ color: hasPending ? 'red' : 'white'}} variant='h4' component='p' color='Danger'>
        //                         {count}
        //                     </Typography>
        //                 </Stack>
        //             </Stack>
        //         </Stack>
        //     </CardContent>
        // </Card>
    );
}

export type StatCardProps = {
    title: string;
    count: string;
    hasPending?: boolean;
};
