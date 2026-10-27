'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography, Button, Grid, Alert, Snackbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import { mainPrimaryColor } from '@/theme';
import { useRouter } from 'next/navigation';
import PageContents from '@/components/PageContents';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';
import WidgetBuilderDialog from '@/components/dashboard/WidgetBuilderDialog';
import WidgetGroupCard from '@/components/dashboard/WidgetGroupCard';

interface WidgetGroup {
    _id: string;
    name: string;
    displayIndex: number;
    widgets: Widget[];
}

interface Widget {
    _id: string;
    name: string;
    widgetType: '1-day' | '15-day' | '30-day';
    dataSource: string;
    displayIndex: number;
}

export default function DashboardBuilderPage() {
    const mounted = useRef(false);
    const router = useRouter();
    const { permissionsSet } = usePermissions();
    const [groups, setGroups] = useState<WidgetGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuilderDialog, setShowBuilderDialog] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string | undefined>(undefined);
    const [capturingSnapshot, setCapturingSnapshot] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    // Wait for permissions before acting — redirect superadmin, fetch for regular users
    useEffect(() => {
        if (!permissionsSet) return;
        const isSuperAdmin = permissionsSet.has('ALL') ||
                             permissionsSet.has('USR_FCH_ALL') ||
                             permissionsSet.has('ACC_FCH');
        if (isSuperAdmin) {
            router.push('/dashboard');
            return;
        }
        fetchGroups();
    }, [permissionsSet]);

    const fetchGroups = async () => {
        try {
            const data = await Api.requestSession<WidgetGroup[]>({
                command: 'dashboard/widgets/widgets_fetch'
            });
            if (mounted.current) {
                setGroups(data);
            }
        } catch (error) {
            console.error('Failed to fetch widget groups:', error);
        } finally {
            if (mounted.current) {
                setLoading(false);
            }
        }
    };

    const handleWidgetCreated = () => {
        setShowBuilderDialog(false);
        setActiveGroupId(undefined);
        fetchGroups();
    };

    const handleAddWidgetToGroup = (groupId: string) => {
        setActiveGroupId(groupId);
        setShowBuilderDialog(true);
    };

    const handleCaptureSnapshot = async () => {
        setCapturingSnapshot(true);
        try {
            const result = await Api.requestSession<{
                ok: boolean;
                captured?: Array<{ widgetId: string; timestamp: string; value: number }>;
            }>({
                command: 'dashboard/snapshot/snapshot_capture'
            });
            setSnackbarMessage('Snapshot captured successfully!');
            setSnackbarSeverity('success');
            setShowSnackbar(true);
            setRefreshKey(k => k + 1);
            fetchGroups();
        } catch (error) {
            console.error('Failed to capture snapshot:', error);
            setSnackbarMessage('Failed to capture snapshot');
            setSnackbarSeverity('error');
            setShowSnackbar(true);
        } finally {
            setCapturingSnapshot(false);
        }
    };

    return (
        <PageContents title={t('Dashboard')} sx={{ background: '#F5F9F9', minHeight: '100%' }}>
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Stack direction='row' spacing={2}>
                        <Button
                            variant='outlined'
                            startIcon={<CameraAltIcon />}
                            onClick={handleCaptureSnapshot}
                            disabled={capturingSnapshot || loading || groups.length === 0}
                            sx={{ borderRadius: '25px', height: '40px', borderColor: '#00A390', color: '#00A390', '&:hover': { backgroundColor: '#00A390', color: '#fff', borderColor: '#00A390' } }}
                        >
                            {t('Snapshot Now')}
                        </Button>
                        <Button
                            variant='contained'
                            startIcon={<AddIcon />}
                            onClick={() => { setActiveGroupId(undefined); setShowBuilderDialog(true); }}
                            sx={{ borderRadius: '25px', height: '40px', backgroundColor: '#00A390', '&:hover': { backgroundColor: '#007a6e' } }}
                        >
                            {t('Create Widget')}
                        </Button>
                    </Stack>
                </Box>

                {loading ? (
                    <Typography>{t('Loading...')}</Typography>
                ) : groups.length === 0 ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        minHeight: '65vh', gap: 2, position: 'relative', overflow: 'hidden',
                        background: 'radial-gradient(ellipse 55% 45% at 50% 48%, rgba(0,171,190,0.06) 0%, transparent 100%)',
                        animation: 'fadeSlideUp 0.5s ease both',
                        '@keyframes fadeSlideUp': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                    }}>
                        {[
                            { top: '12%', left: '18%', size: 6, delay: '0s', opacity: 0.18 },
                            { top: '20%', right: '14%', size: 4, delay: '0.3s', opacity: 0.13 },
                            { bottom: '22%', left: '12%', size: 5, delay: '0.6s', opacity: 0.15 },
                            { bottom: '15%', right: '20%', size: 7, delay: '0.2s', opacity: 0.12 },
                            { top: '38%', left: '6%', size: 3, delay: '0.5s', opacity: 0.1 },
                            { top: '35%', right: '7%', size: 4, delay: '0.4s', opacity: 0.1 },
                        ].map((dot, i) => (
                            <Box key={i} sx={{
                                position: 'absolute', borderRadius: '50%', bgcolor: mainPrimaryColor,
                                width: dot.size, height: dot.size, opacity: dot.opacity,
                                top: dot.top, left: (dot as any).left, right: (dot as any).right, bottom: (dot as any).bottom,
                                animation: `floatDot 4s ease-in-out ${dot.delay} infinite alternate`,
                                '@keyframes floatDot': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-8px)' } },
                            }} />
                        ))}
                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            {[1, 2, 3].map(i => (
                                <Box key={i} sx={{
                                    position: 'absolute', borderRadius: '50%',
                                    border: `1.5px solid ${mainPrimaryColor}`,
                                    width: 72 + i * 36, height: 72 + i * 36,
                                    opacity: 0,
                                    animation: `pulseRing 2.8s ease-out ${i * 0.7}s infinite`,
                                    '@keyframes pulseRing': {
                                        '0%': { transform: 'scale(0.82)', opacity: 0.28 },
                                        '100%': { transform: 'scale(1.18)', opacity: 0 },
                                    },
                                }} />
                            ))}
                            <Box sx={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: `radial-gradient(circle, rgba(0,171,190,0.12) 0%, rgba(0,171,190,0.04) 70%)`,
                                border: `1.5px solid rgba(0,171,190,0.2)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                animation: 'iconFloat 3.5s ease-in-out infinite',
                                '@keyframes iconFloat': {
                                    '0%, 100%': { transform: 'translateY(0)' },
                                    '50%': { transform: 'translateY(-7px)' },
                                },
                            }}>
                                <SpaceDashboardOutlinedIcon sx={{ fontSize: 40, color: mainPrimaryColor, opacity: 0.85 }} />
                            </Box>
                        </Box>
                        <Typography variant='h6' sx={{ fontWeight: 600, color: '#2d3748', mt: 1.5, animation: 'fadeSlideUp 0.5s 0.1s ease both' }}>
                            {t('No widgets yet. Create your first widget to get started!')}
                        </Typography>
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => { setActiveGroupId(undefined); setShowBuilderDialog(true); }}
                            sx={{
                                borderRadius: '25px', height: '40px', mt: 1,
                                borderColor: mainPrimaryColor, color: mainPrimaryColor,
                                '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                                animation: 'popIn 0.45s 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                                '@keyframes popIn': {
                                    '0%': { opacity: 0, transform: 'scale(0.82)' },
                                    '100%': { opacity: 1, transform: 'scale(1)' },
                                },
                            }}
                        >
                            {t('Create Widget')}
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {groups.map((group) => (
                            <WidgetGroupCard
                                key={group._id}
                                group={group}
                                onUpdate={fetchGroups}
                                onAddWidget={handleAddWidgetToGroup}
                                refreshKey={refreshKey}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>

            {showBuilderDialog && (
                <WidgetBuilderDialog
                    onClose={() => { setShowBuilderDialog(false); setActiveGroupId(undefined); }}
                    onSuccess={handleWidgetCreated}
                    defaultGroupId={activeGroupId}
                />
            )}

            <Snackbar
                open={showSnackbar}
                autoHideDuration={4000}
                onClose={() => setShowSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setShowSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </PageContents>
    );
}
