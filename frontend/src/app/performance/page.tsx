'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
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

    const loadRecords = useCallback(() => {
        setLoading(true);
        Api.requestSession<PerformanceActRecord[]>({ command: 'performance/fetch_all', args: {} })
            .then(data => setRecords(data ?? []))
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
        setSelected(created);
    }, []);

    const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'performance/delete', args: { id } });
        setRecords(prev => prev.filter(r => r._id !== id));
        if (selected?._id === id) setSelected(null);
    }, [selected]);

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
                        onClick={() => setSelected(null)}
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                        <SpeedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                            {t('No Performance Acts created yet')}
                        </Typography>
                        <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
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
                                    onClick={() => setSelected(rec)}
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
