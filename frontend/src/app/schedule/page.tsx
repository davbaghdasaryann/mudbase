'use client';

import { useEffect, useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Divider, CircularProgress,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

interface ScheduleRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
    createdAt?: string;
}

interface LaborRow {
    _id: string;
    laborOfferItemName: string;
    quantity: number;
    unitSymbol?: string;
    sectionName?: string;
    subsectionName?: string;
}

export default function SchedulePage() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<ScheduleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ScheduleRecord | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [worksOpen, setWorksOpen] = useState(false);
    const [laborRows, setLaborRows] = useState<LaborRow[]>([]);
    const [laborLoading, setLaborLoading] = useState(false);

    useEffect(() => {
        Api.requestSession<ScheduleRecord[]>({ command: 'schedule/fetch_all', args: {} })
            .then(data => setRecords(data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        const created = await Api.requestSession<ScheduleRecord>({
            command: 'schedule/create',
            args: { estimateId: String(estimate._id), estimateName: estimate.name ?? '' },
        });
        if (created) setRecords(prev => [created, ...prev]);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'schedule/delete', args: { id } });
        setRecords(prev => prev.filter(r => r._id !== id));
    };

    const handleChooseWork = async () => {
        if (!selected) return;
        setWorksOpen(true);
        setLaborLoading(true);
        try {
            const rows = await Api.requestSession<LaborRow[]>({
                command: 'estimate/fetch_labor_for_analysis',
                args: { estimateId: selected.estimateId },
            });
            setLaborRows(rows ?? []);
        } catch {
            setLaborRows([]);
        } finally {
            setLaborLoading(false);
        }
    };

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    if (!selected) {
        return (
            <PageContents title='Schedule' sx={{ pb: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                    </Box>
                ) : records.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                        <CalendarMonthIcon sx={{ fontSize: 90, color: mainPrimaryColor, opacity: 0.25 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                            {t('No schedules created yet')}
                        </Typography>
                        <PageButton
                            variant='outlined'
                            label='Create'
                            size='large'
                            sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor } }}
                            onClick={() => setDialogOpen(true)}
                        />
                    </Box>
                ) : (
                    <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <PageButton variant='contained' label='Create' size='small' sx={{ borderRadius: '25px' }} onClick={() => setDialogOpen(true)} />
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
                                    cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                                    '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CalendarMonthIcon sx={{ color: mainPrimaryColor, opacity: 0.7, fontSize: 22 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>{rec.estimateName}</Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                            {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton size='small' onClick={e => handleDelete(rec._id, e)} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                    <DeleteOutlineIcon fontSize='small' />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                    </>
                )}

                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleCreate} />
            </PageContents>
        );
    }

    // ── DETAIL VIEW ───────────────────────────────────────────────────────────
    return (
        <PageContents title='Schedule' sx={{ pb: 1 }}>
            {/* Back + header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <IconButton size='small' onClick={() => setSelected(null)} sx={{ color: mainPrimaryColor }}>
                    <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{selected.estimateName}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                        {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : ''}
                    </Typography>
                </Box>
                <Button
                    variant='outlined'
                    startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                    onClick={handleChooseWork}
                    sx={{
                        borderRadius: '20px', textTransform: 'none', fontSize: '0.82rem', px: 2,
                        borderColor: mainPrimaryColor, color: mainPrimaryColor,
                        bgcolor: 'transparent',
                        '&:hover': { bgcolor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                        transition: 'background-color 0.2s, color 0.2s',
                    }}
                >
                    {t('Choose a work')}
                </Button>
            </Box>

            {/* Works modal */}
            <Dialog open={worksOpen} onClose={() => setWorksOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${mainPrimaryColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <WorkOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Choose a work')}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.1 }}>{selected.estimateName}</Typography>
                        </Box>
                        <IconButton size='small' onClick={() => setWorksOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

                <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
                    {laborLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                        </Box>
                    ) : laborRows.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <Typography variant='body2' color='text.secondary'>{t('No works found')}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {laborRows.map((row, index) => (
                                <Box
                                    key={row._id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.2,
                                        bgcolor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                                        borderRadius: 1.5,
                                        border: '1px solid transparent',
                                        '&:hover': { bgcolor: `${mainPrimaryColor}0d`, border: `1px solid ${mainPrimaryColor}33` },
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600, minWidth: 24 }}>{index + 1}</Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row.laborOfferItemName}
                                        </Typography>
                                        {(row.sectionName || row.subsectionName) && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {[row.sectionName, row.subsectionName].filter(Boolean).join(' › ')}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap' }}>
                                        {row.quantity} {row.unitSymbol}
                                    </Typography>
                                    <IconButton size='small' sx={{ color: mainPrimaryColor, '&:hover': { bgcolor: `${mainPrimaryColor}15` } }}>
                                        <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setWorksOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
