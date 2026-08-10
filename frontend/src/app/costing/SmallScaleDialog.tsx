'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Table, TableHead, TableBody,
    TableRow, TableCell, Radio, IconButton,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';
import * as EstimatesApi from '@/api/estimate';
import { formatDate } from '@/lib/format_date';
import CreateEstimateDialog from '../estimates/CreateEstimateDialog';
import EstimatePageDialog from '../estimates/EstimateDialog';

const ACCENT = '#1565c0';

interface Props {
    open: boolean;
    onClose: () => void;
    onEstimateSelected: (est: EstimatesApi.ApiEstimate) => void;
    activeEstimateId?: string;
}

export default function SmallScaleDialog({ open, onClose, onEstimateSelected, activeEstimateId }: Props) {
    const { t } = useTranslation();
    const [estimates, setEstimates] = useState<EstimatesApi.ApiEstimate[]>([]);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    useEffect(() => {
        if (!open) return;
        setSelectedEstimate(null);
    }, [open]);

    const handleConfirm = () => {
        if (!selectedEstimate) return;
        onEstimateSelected(selectedEstimate);
        onClose();
    };

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: ACCENT, pb: 1 }}>
                <BuildIcon sx={{ fontSize: 22 }} />
                Փոքրամասշտաբ
                <Button
                    size='small'
                    startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setCreateOpen(true)}
                    sx={{ ml: 'auto', borderRadius: '20px', textTransform: 'none', color: ACCENT, border: `1px solid ${ACCENT}`, px: 2, fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(21,101,192,0.06)' } }}
                >
                    {t('Create Estimate')}
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 0, pt: 1, pl: 3 }}>
                {estimates.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                        <Typography variant='body2' color='text.secondary'>{t('No estimations found')}</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: 60 }}>{t('No.')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                                <TableCell sx={{ width: 60 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {estimates.map((est, index) => {
                                const isActive = activeEstimateId && String(est._id) === activeEstimateId;
                                return (
                                <TableRow
                                    key={est._id}
                                    onClick={() => setSelectedEstimate(est)}
                                    hover
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: selectedEstimate?._id === est._id ? `${ACCENT}22` : index % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                        '&.MuiTableRow-hover:hover': { backgroundColor: `${ACCENT}15 !important` },
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {est.name}
                                        {isActive && <Typography component='span' sx={{ ml: 1, fontSize: '0.75rem', color: ACCENT, fontWeight: 600 }}>({t('Active')})</Typography>}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(est.createdAt)}</TableCell>
                                    <TableCell align='right' sx={{ pr: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            <IconButton
                                                size='small'
                                                onClick={e => { e.stopPropagation(); setEditingEstimate(est); }}
                                                sx={{ color: '#aaa', '&:hover': { color: ACCENT } }}
                                            >
                                                <EditOutlinedIcon fontSize='small' />
                                            </IconButton>
                                            <Radio
                                                checked={selectedEstimate?._id === est._id}
                                                size='small'
                                                sx={{ color: ACCENT, '&.Mui-checked': { color: ACCENT } }}
                                            />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                <Button variant='contained' disabled={!selectedEstimate} onClick={handleConfirm}
                    sx={{ borderRadius: '20px', backgroundColor: ACCENT, '&:hover': { backgroundColor: '#0d47a1' } }}>
                    {t('Select')}
                </Button>
            </DialogActions>
        </Dialog>

        {createOpen && (
            <CreateEstimateDialog
                onClose={() => setCreateOpen(false)}
                onConfirm={(est) => {
                    setCreateOpen(false);
                    if (est) setEstimates(prev => [...prev, est as EstimatesApi.ApiEstimate]);
                }}
            />
        )}

        {editingEstimate && (
            <EstimatePageDialog
                estimateId={String(editingEstimate._id)}
                estimateTitle={editingEstimate.name ?? ''}
                onClose={() => setEditingEstimate(null)}
            />
        )}
        </>
    );
}
