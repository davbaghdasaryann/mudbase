'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography, Button, Grid, Alert, Snackbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
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
    const [capturingSnapshot, setCapturingSnapshot] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [liveSnapshots, setLiveSnapshots] = useState<Array<{ widgetId: string; timestamp: string; value: number }>>([]);
    const { t } = useTranslation();

    // Redirect superadmin to old dashboard
    useEffect(() => {
        const isSuperAdmin = permissionsSet?.has('ALL') ||
                           permissionsSet?.has('USR_FCH_ALL') ||
                           permissionsSet?.has('ACC_FCH');
        if (isSuperAdmin) {
            router.push('/dashboard');
        }
    }, [permissionsSet, router]);

    useEffect(() => {
        mounted.current = true;
        fetchGroups();
        return () => {
            mounted.current = false;
        };
    }, []);

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
        fetchGroups();
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
            if (result.captured && result.captured.length > 0) {
                setLiveSnapshots(result.captured);
            }
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

    const clearLiveSnapshotForWidget = (widgetId: string) => {
        setLiveSnapshots((prev) => prev.filter((s) => s.widgetId !== widgetId));
    };

    return (
        <PageContents title={t('Dashboard Builder')}>
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                        {t('My Dashboard Widgets')}
                    </Typography>
                    <Stack direction='row' spacing={2}>
                        <Button
                            variant='outlined'
                            startIcon={<CameraAltIcon />}
                            onClick={handleCaptureSnapshot}
                            disabled={capturingSnapshot}
                        >
                            {capturingSnapshot ? t('Capturing...') : t('Snapshot Now')}
                        </Button>
                        <Button
                            variant='contained'
                            startIcon={<AddIcon />}
                            onClick={() => setShowBuilderDialog(true)}
                        >
                            {t('Create Widget')}
                        </Button>
                    </Stack>
                </Box>

                {loading ? (
                    <Typography>{t('Loading...')}</Typography>
                ) : groups.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant='h6' color='textSecondary'>
                            {t('No widgets yet. Create your first widget to get started!')}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {groups.map((group) => (
                            <WidgetGroupCard
                                key={group._id}
                                group={group}
                                onUpdate={fetchGroups}
                                liveSnapshots={liveSnapshots}
                                onClearLiveSnapshot={clearLiveSnapshotForWidget}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>

            {showBuilderDialog && (
                <WidgetBuilderDialog
                    onClose={() => setShowBuilderDialog(false)}
                    onSuccess={handleWidgetCreated}
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
