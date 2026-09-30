'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import PerformanceActTable from './PerformanceActTable';
import { mainPrimaryColor } from '@/theme';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';

interface PerformanceActRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
    acts: number[];
    actsData: Record<string, { unitPrice: string; quantity: string }>[];
    createdAt: string;
}

const outlinedCreateSx = {
    borderRadius: '25px',
    height: '40px',
    mt: 1,
    '&:hover': {
        backgroundColor: mainPrimaryColor,
        color: '#ffffff',
        borderColor: mainPrimaryColor,
    },
};

export default function PerformancePage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [records, setRecords] = useState<PerformanceActRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<PerformanceActRecord | null>(null);
    const didRestoreRef = useRef(false);

    const selectRecord = useCallback((rec: PerformanceActRecord | null) => {
        setSelected(rec);
        if (typeof window !== 'undefined') {
            const url = rec ? `/performance?id=${rec._id}` : '/performance';
            window.history.pushState({}, '', url);
        }
    }, []);

    const loadRecords = useCallback(() => {
        setLoading(true);
        Api.requestSession<PerformanceActRecord[]>({ command: 'performance/fetch_all', args: {} })
            .then(data => {
                const list = data ?? [];
                setRecords(list);
                // Restore selected record from URL on first load
                if (!didRestoreRef.current && typeof window !== 'undefined') {
                    didRestoreRef.current = true;
                    const id = new URLSearchParams(window.location.search).get('id');
                    if (id) {
                        const found = list.find(r => r._id === id);
                        if (found) setSelected(found);
                    }
                }
            })
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadRecords(); }, [loadRecords]);

    const handleSelect = useCallback(async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        const created = await Api.requestSession<PerformanceActRecord>({
            command: 'performance/create',
            args: { estimateId: String(estimate._id), estimateName: estimate.name },
        });
        setRecords(prev => [created, ...prev]);
        selectRecord(created);
    }, [selectRecord]);

    const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'performance/delete', args: { id } });
        setRecords(prev => prev.filter(r => r._id !== id));
        if (selected?._id === id) selectRecord(null);
    }, [selected, selectRecord]);

    const handleRecordUpdate = useCallback((updated: PerformanceActRecord) => {
        setRecords(prev => prev.map(r => r._id === updated._id ? updated : r));
        setSelected(updated);
    }, []);

    if (selected) {
        return (
            <PageContents title='Performance'>
                <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Button
                        startIcon={<ArrowBackIcon fontSize='small' />}
                        size='small'
                        onClick={() => selectRecord(null)}
                        sx={{ color: 'text.secondary', pl: 0, mb: 1.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                    >
                        {t('Back')}
                    </Button>
                    <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', mb: 3 }}>
                        {selected.estimateName}
                    </Typography>
                    <PerformanceActTable
                        record={selected}
                        onUpdate={handleRecordUpdate}
                    />
                </Box>
            </PageContents>
        );
    }

    return (
        <PageContents title='Performance'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
                    </Box>
                )}

                {!loading && records.length === 0 && (
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
                                <SpeedIcon sx={{ fontSize: 40, color: mainPrimaryColor, opacity: 0.85 }} />
                            </Box>
                        </Box>
                        <Typography variant='h6' sx={{ fontWeight: 600, color: '#2d3748', mt: 1.5, animation: 'fadeSlideUp 0.5s 0.1s ease both' }}>
                            {t('No Performance Acts created yet')}
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#8a9ab0', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.6, animation: 'fadeSlideUp 0.5s 0.2s ease both' }}>
                            {t('Create a performance act to track your project progress')}
                        </Typography>
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => setDialogOpen(true)}
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
                            {t('Create')}
                        </Button>
                    </Box>
                )}

                {!loading && records.length > 0 && (
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <PageButton variant='outlined' label='Create' size='medium' sx={{ ...outlinedCreateSx, mt: 0 }} onClick={() => setDialogOpen(true)} />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {records.map(rec => (
                                <Box
                                    key={rec._id}
                                    onClick={() => selectRecord(rec)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        px: 2.5, py: 1.8, borderRadius: 2,
                                        border: '1px solid #e0f5f7', backgroundColor: '#fafeff',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.15s, border-color 0.15s',
                                        '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <SpeedIcon sx={{ color: mainPrimaryColor, opacity: 0.7, fontSize: 22 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>
                                                {rec.estimateName}
                                            </Typography>
                                            <Typography variant='caption' color='text.secondary'>
                                                {new Date(rec.createdAt).toLocaleDateString()} &nbsp;·&nbsp; {rec.acts?.length ?? 0} {t('ACT')}(s)
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton
                                        size='small'
                                        onClick={e => handleDelete(rec._id, e)}
                                        sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}
                                    >
                                        <DeleteOutlineIcon fontSize='small' />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

            </Box>

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}

