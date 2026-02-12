'use client';

import React, { useEffect } from 'react';

import {useRouter} from 'next/navigation';

import {Box, Stack, Button, Typography, SxProps, Theme} from '@mui/material';

import {type Navigation} from '@toolpad/core';

import AppErrorAlert from './main/AppErrorAlert';
import AppLoadingState from './main/AppLoadingState';
import AppAccessDeniedtate from './main/AppAccessDeniedState';
import AppProviderWrapper from './main/AppProviderWrapper';
import {usePermissions} from '../api/auth';
import MainNavigationNoAppBar from './main/MainNavigationNoAppBar';
import AppHeaderNoAppBar from './main/AppHeaderNoAppBar';
import { MobileDrawerProvider } from './main/MobileDrawerContext';
import AppFooterCopyrightNotice from './main/AppFooterCopyrightNotice';
import AppCentralCompanyLogo from './main/AppCentralCompanyLogo';
import Env from '../env';
import {useTranslation} from 'react-i18next';

// 'form' |
export interface PageContentsProps {
    type?: 'data' | 'auth' | 'public' | 'dev'; // Contents type
    // contents?: ContentsType;

    title?: string;
    current?: string;

    navigation?: Navigation;
    // router?: Router;

    children: React.ReactNode;

    requiredPermission?: string;

    sx?: SxProps<Theme>;
}

export default function PageContents(props: PageContentsProps) {
    if (props.type === 'auth' || props.type === 'public') {
        return <PageContentsPublic {...props}>{props.children}</PageContentsPublic>;
    }

    return <PageContentsProtected {...props}>{props.children}</PageContentsProtected>;
}

function PageContentsPublic(props: PageContentsProps) {
    return (
        <AppProviderWrapper>
            <AppErrorAlert />
            {/* {Env.isDev && <AppHeader {...props} />} */}

            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    overflow: 'hidden',
                    height: '100vh',
                    width: '100vw',
                }}
            >
                <Box
                    component='main'
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        overflow: 'auto',
                    }}
                >
                    {props.children}
                </Box>
            </Box>

            <AppCentralCompanyLogo {...props} />

            <AppFooterCopyrightNotice {...props} />
        </AppProviderWrapper>
    );
}

function PageContentsProtected(props: PageContentsProps) {
    const {session, status, permissionsSet} = usePermissions();

    const router = useRouter();

    // useEffect(() => {
    //     console.log("PageContentsProtected");
    // }, []);

    useEffect(() => {
        if (status === 'unauthenticated' && props.type !== 'auth') {
            router.replace('/login');
        } else if (session && !session?.user.accountId) {
            router.replace('/login');
        } else if (props.requiredPermission === 'old_code') {
            //This I add manually for old not used pages
            router.replace('/account');
            return;
        }
    }, [session?.user.accountId, session, status, router]);

    if (status === 'loading') {
        return <AppLoadingState />;
    }

    if (status === 'unauthenticated') {
        return (
            <>
                {/* <AppAccessDeniedtate /> */}
                <></>
            </>
        );
    }

    // console.log('props.requiredPermission', props.requiredPermission, session);

    // if ((props.requiredPermission && session && !permissionsSet.has(props.requiredPermission)) || !session?.user.accountId) {
    if (props.requiredPermission && session && !permissionsSet.has(props.requiredPermission)) {
        return <AppLoadingState />;
    }

    if (props.type === 'dev' && !Env.isDev) {
        router.replace('/account');
        return <></>;
    }

    if (!session?.user.accountId) {
        return <AppLoadingState />;
    }

    return (
        <MobileDrawerProvider>
            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    overflow: 'hidden',
                    height: '100vh',
                    width: '100vw',
                }}
            >
                <AppErrorAlert />
                <MainNavigationNoAppBar {...props} />
                <PageContentsProtectedBody {...props} />
            </Box>
        </MobileDrawerProvider>
    );
}

function PageContentsProtectedBody(props: PageContentsProps) {
    const router = useRouter();
    const {t} = useTranslation();

    // useEffect(() => {
    //     console.log("PageContentsProtectedBody");
    // }, []);

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
            }}
        >
            <AppHeaderNoAppBar {...props} />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflow: 'auto',
                    pt: { xs: 7, md: 9 },
                    pb: 1,
                    px: { xs: 2, sm: 3, md: 4 },
                    ...props.sx,
                }}
            >
                {props.type === 'dev' && (
                    <Button
                        variant='outlined'
                        onClick={() => {
                            router.replace('/dev');
                        }}
                    >
                        Return to Developer Mode Main Page
                    </Button>
                )}

                <Stack direction='column' spacing={2} height='100%' justifyContent='flex-start'>
                    {props.children}
                </Stack>
            </Box>
        </Box>
    );
}
