'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, IconButton, Divider, CircularProgress,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { useTranslation } from 'react-i18next';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api/api';
import CreateEstimateDialog from '../estimates/CreateEstimateDialog';
import EstimatePageDialog from '../estimates/EstimateDialog';

const ACCENT = '#1565c0';

interface LaborRow {
    _id: string;
    laborOfferItemName: string;
    quantity: number;
    unitSymbol?: string;
    sectionName?: string;
    subsectionName?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onEstimateSelected: (est: EstimatesApi.ApiEstimate) => void;
    activeEstimateId?: string;
}

export default function SmallScaleDialog({ open, onClose, onEstimateSelected, activeEstimateId }: Props) {
    const { t } = useTranslation();
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [worksOpen, setWorksOpen] = useState(false);
    const [laborRows, setLaborRows] = useState<LaborRow[]>([]);
    const [laborLoading, setLaborLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setSelectedEstimate(null);
            setLaborRows([]);
            return;
        }
        if (!activeEstimateId) return;
        Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: activeEstimateId } })
            .then(est => { if (est) setSelectedEstimate(est); })
            .catch(() => {});
    }, [open]); // eslint-disable-line

    const handleChooseWork = async () => {
        if (!selectedEstimate) return;
        setWorksOpen(true);
        setLaborLoading(true);
        try {
            const rows = await Api.requestSession<LaborRow[]>({
                command: 'estimate/fetch_labor_for_analysis',
                args: { estimateId: String(selectedEstimate._id) },
            });
            setLaborRows(rows ?? []);
        } catch {
            setLaborRows([]);
        } finally {
            setLaborLoading(false);
        }
    };

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(76,175,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BuildIcon sx={{ fontSize: 20, color: '#4caf50' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Փոքրածավալ շինարարական աշխատանքներ</Typography>
                    </Box>
                    <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

            <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                {/* Create Estimate button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        size='small'
                        startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setCreateOpen(true)}
                        sx={{ borderRadius: '20px', textTransform: 'none', color: ACCENT, border: `1px solid ${ACCENT}`, px: 2, fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(21,101,192,0.06)' } }}
                    >
                        {t('Create Estimate')}
                    </Button>
                </Box>

                {/* Estimation header row */}
                {selectedEstimate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedEstimate.name}
                            </Typography>
                            {activeEstimateId && String(selectedEstimate._id) === activeEstimateId && (
                                <Typography sx={{ fontSize: '0.72rem', color: ACCENT, fontWeight: 600, mt: 0.2 }}>({t('Active')})</Typography>
                            )}
                        </Box>
                        <Button
                            size='small'
                            startIcon={<WorkOutlineIcon sx={{ fontSize: 16 }} />}
                            onClick={handleChooseWork}
                            variant='contained'
                            sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: ACCENT, '&:hover': { bgcolor: '#0d47a1' }, px: 2, fontSize: '0.82rem', flexShrink: 0 }}
                        >
                            {t('Choose a work')}
                        </Button>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
            </DialogActions>
        </Dialog>

        {/* Works modal */}
        <Dialog open={worksOpen} onClose={() => setWorksOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${ACCENT}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <WorkOutlineIcon sx={{ fontSize: 20, color: ACCENT }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Choose a work')}</Typography>
                        {selectedEstimate && <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.1 }}>{selectedEstimate.name}</Typography>}
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
                        <CircularProgress size={32} sx={{ color: ACCENT }} />
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
                                    borderRadius: 1.5, cursor: 'pointer',
                                    border: '1px solid transparent',
                                    '&:hover': { bgcolor: `${ACCENT}0d`, border: `1px solid ${ACCENT}33` },
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
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setWorksOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
            </DialogActions>
        </Dialog>

        {createOpen && (
            <CreateEstimateDialog
                onClose={() => setCreateOpen(false)}
                onConfirm={(est) => {
                    setCreateOpen(false);
                    if (est) setSelectedEstimate(est as EstimatesApi.ApiEstimate);
                }}
            />
        )}

        {editingEstimate && (
            <EstimatePageDialog
                estimateId={String(editingEstimate._id)}
                estimateTitle={editingEstimate.name ?? ''}
                onClose={() => {
                    const id = String(editingEstimate._id);
                    setEditingEstimate(null);
                    Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: id } })
                        .then(updated => { if (updated) setSelectedEstimate(updated); })
                        .catch(() => {});
                }}
            />
        )}
        </>
    );
}
