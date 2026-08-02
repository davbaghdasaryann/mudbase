'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Table, TableHead, TableBody,
    TableRow, TableCell, Radio, CircularProgress, IconButton,
} from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatDate } from '@/lib/format_date';
import CreateEstimateDialog from '../estimates/CreateEstimateDialog';
import EstimatePageDialog from '../estimates/EstimateDialog';

interface Props {
    open: boolean;
    onClose: () => void;
    onEstimateSelected: (est: EstimatesApi.ApiEstimate) => void;
    activeEstimateId?: string;
}

export default function UnforeseenDialog({ open, onClose, onEstimateSelected, activeEstimateId }: Props) {
    const { t } = useTranslation();
    const [estimates, setEstimates] = useState<EstimatesApi.ApiEstimate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    const fetchEstimates = () => {
        setLoading(true);
        Promise.all([
            Api.requestSession<EstimatesApi.ApiEstimate[]>({ command: 'estimates/fetch', args: { searchVal: 'empty' } }),
            Api.requestSession<EstimatesApi.ApiEstimate[]>({ command: 'estimates/fetch', args: { searchVal: 'empty', includeUnforeseenOnly: 'true' } }),
        ]).then(([regular, all]) => {
            const regularWithUnforeseen = (regular ?? []).filter(e =>
                Array.isArray(e.otherExpenses) &&
                e.otherExpenses.some(exp => 'unforeseenWorks' in exp && (exp as any).unforeseenWorks > 0)
            );
            const unforeseenOnly = (all ?? []).filter(e => (e as any).isUnforeseenOnly === true);
            const seen = new Set<string>();
            const combined = [...regularWithUnforeseen, ...unforeseenOnly].filter(e => {
                const id = String(e._id);
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
            setEstimates(combined);
        }).catch(() => setEstimates([])).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!open) return;
        setSelectedEstimate(null);
        fetchEstimates();
    }, [open]);

    const handleDelete = async (est: EstimatesApi.ApiEstimate, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t('Delete this estimate?'))) return;
        await Api.requestSession({ command: 'estimate/delete', args: { estimateId: String(est._id) } });
        setEstimates(prev => prev.filter(e => String(e._id) !== String(est._id)));
        if (selectedEstimate?._id === est._id) setSelectedEstimate(null);
    };

    const handleConfirm = () => {
        if (!selectedEstimate) return;
        onEstimateSelected(selectedEstimate);
        onClose();
    };

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                <ReportProblemOutlinedIcon sx={{ fontSize: 22 }} />
                {t('Unforeseen Works')}
                <Button
                    size='small'
                    startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setCreateOpen(true)}
                    sx={{ ml: 'auto', borderRadius: '20px', textTransform: 'none', color: mainPrimaryColor, border: `1px solid ${mainPrimaryColor}`, px: 2, fontSize: '0.82rem', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)' } }}
                >
                    {t('Create Estimate')}
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 0, pt: 1, pl: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
                    </Box>
                ) : estimates.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                        <Typography variant='body2' color='text.secondary'>{t('No estimations with unforeseen works')}</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: 60 }}>{t('No.')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                                <TableCell sx={{ width: 80 }} />
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
                                        backgroundColor: selectedEstimate?._id === est._id ? `${mainPrimaryColor}22` : index % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                        '&.MuiTableRow-hover:hover': { backgroundColor: `${mainPrimaryColor}15 !important` },
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {est.name}
                                        {isActive && <Typography component='span' sx={{ ml: 1, fontSize: '0.75rem', color: '#e65100', fontWeight: 600 }}>({t('Active')})</Typography>}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(est.createdAt)}</TableCell>
                                    <TableCell align='right' sx={{ pr: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            <IconButton
                                                size='small'
                                                onClick={e => { e.stopPropagation(); setEditingEstimate(est); }}
                                                sx={{ color: '#aaa', '&:hover': { color: mainPrimaryColor } }}
                                            >
                                                <EditOutlinedIcon fontSize='small' />
                                            </IconButton>
                                            <IconButton
                                                size='small'
                                                disabled={!(est as any).isUnforeseenOnly}
                                                onClick={e => handleDelete(est, e)}
                                                sx={{ color: '#aaa', '&:hover': { color: '#e53935' }, '&.Mui-disabled': { opacity: 0.25 } }}
                                            >
                                                <DeleteOutlineIcon fontSize='small' />
                                            </IconButton>
                                            <Radio
                                                checked={selectedEstimate?._id === est._id}
                                                size='small'
                                                sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
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
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                    {t('Select')}
                </Button>
            </DialogActions>
        </Dialog>

        {createOpen && (
            <CreateEstimateDialog
                isUnforeseenOnly={true}
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
