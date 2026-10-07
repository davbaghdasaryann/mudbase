'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Divider, Chip, Collapse, TextField, Checkbox, FormControlLabel, Button } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';
import type { CostHistoryEntry } from './page';

const ACCENT = '#00796b';

interface LaborRow {
    _id: string;
    laborOfferItemName: string;
    catalogName: string;
    unitSymbol: string;
    quantity: number;
    isGroupRow?: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    laborRows: LaborRow[];
    costHistory?: CostHistoryEntry[];
    actualData?: Record<string, { quantity: string; unitPrice: string; spent?: string; withoutMaterials?: boolean }>;
    onSaveLaborPrice?: (rowId: string, unitPrice: string, withoutMaterials: boolean) => void;
}

export default function EnthakajalsDialog({ open, onClose, laborRows, costHistory = [], actualData = {}, onSaveLaborPrice }: Props) {
    const { t } = useTranslation();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [inputPrice, setInputPrice] = useState('');
    const [withoutMaterials, setWithoutMaterials] = useState(false);

    const rows = laborRows.filter(r => !r.isGroupRow && Number(r.quantity ?? 0) > 0);

    const toRowId = (id: unknown): string => {
        if (!id) return '';
        if (typeof id === 'string') return id;
        if (typeof id === 'object') {
            if ('oid' in (id as any)) return (id as any).oid;
            if ('$oid' in (id as any)) return (id as any).$oid;
        }
        return String(id ?? '');
    };

    const getUnitPrice = (rowId: string): number => {
        const direct = parseFloat((actualData[rowId]?.unitPrice ?? '').replace(',', '.')) || 0;
        if (direct > 0) return direct;
        // fallback: average from costHistory entries
        const entries = (costHistory ?? []).filter(e =>
            e.laborItemId === rowId &&
            !e.paymentMethod?.startsWith('pahest_') &&
            e.paymentMethod !== 'nyuth_tsakhsagrum'
        );
        const totalAmt = entries.reduce((s, e) => s + e.total, 0);
        const totalQty = entries.reduce((s, e) => s + e.quantity, 0);
        return totalQty > 0 ? totalAmt / totalQty : 0;
    };

    const costedCount = rows.filter(r => getUnitPrice(toRowId(r._id)) > 0).length;

    const handleOpenForm = (row: LaborRow) => {
        const rowId = toRowId(row._id);
        const price = getUnitPrice(rowId);
        setInputPrice(price > 0 ? String(Math.round(price)) : '');
        setWithoutMaterials(actualData[rowId]?.withoutMaterials ?? false);
        setExpandedRowId(prev => prev === row._id ? null : row._id);
    };

    const handleSave = (rowId: string) => {
        onSaveLaborPrice?.(rowId, inputPrice, withoutMaterials);
        setExpandedRowId(null);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh', boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}>
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HandshakeOutlinedIcon sx={{ fontSize: 20, color: ACCENT }} />
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Ենթակապալ</Typography>
                        {rows.length > 0 && (
                            <Chip
                                label={`${costedCount} / ${rows.length}`}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    bgcolor: costedCount === rows.length ? `${ACCENT}20` : 'rgba(0,0,0,0.06)',
                                    color: costedCount === rows.length ? ACCENT : '#666',
                                    borderRadius: '10px',
                                    '& .MuiChip-label': { px: 1 },
                                }}
                            />
                        )}
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                <Box sx={{ px: 3, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, mb: 0.5 }}>
                    <Typography sx={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Աշխատանք</Typography>
                    <Typography sx={{ width: 80, textAlign: 'right', fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Քանակ</Typography>
                    <Typography sx={{ width: 90, textAlign: 'right', fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Արժ.</Typography>
                    <Box sx={{ width: 36 }} />
                </Box>
                <Divider sx={{ mb: 0.5, borderColor: '#e5f9fa' }} />

                {rows.length === 0 && (
                    <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', py: 4 }}>Աշխատանկներ Չկան</Typography>
                )}

                {rows.map((row, idx) => {
                    const rowId = toRowId(row._id);
                    const unitPrice = getUnitPrice(rowId);
                    const isCosted = unitPrice > 0;
                    const isExpanded = expandedRowId === row._id;

                    return (
                        <Box key={String(row._id)}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: isExpanded ? '8px 8px 0 0' : 2,
                                    bgcolor: isExpanded ? `${ACCENT}08` : idx % 2 === 0 ? '#f9fefe' : '#ffffff',
                                    '&:hover': { bgcolor: isExpanded ? `${ACCENT}08` : 'rgba(0,171,190,0.05)', '& .add-btn': { opacity: 1 } },
                                    transition: 'background-color 0.15s',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
                                    {isCosted && (
                                        <CheckCircleIcon sx={{ fontSize: 14, color: ACCENT, flexShrink: 0 }} />
                                    )}
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: isCosted ? ACCENT : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {row.laborOfferItemName || row.catalogName}
                                    </Typography>
                                </Box>
                                <Typography sx={{ width: 80, textAlign: 'right', fontSize: '0.78rem', fontWeight: 600, color: '#333', flexShrink: 0 }}>
                                    {Number(row.quantity).toLocaleString('hy-AM', { maximumFractionDigits: 3 })} {row.unitSymbol}
                                </Typography>
                                <Typography sx={{ width: 90, textAlign: 'right', fontSize: '0.78rem', fontWeight: isCosted ? 600 : 400, color: isCosted ? ACCENT : '#bbb', flexShrink: 0 }}>
                                    {isCosted ? unitPrice.toLocaleString('hy-AM', { maximumFractionDigits: 0 }) : '—'}
                                </Typography>
                                <IconButton
                                    className="add-btn"
                                    size="small"
                                    sx={{ ml: 0.5, width: 28, height: 28, opacity: isExpanded ? 1 : 0.4, color: isExpanded ? ACCENT : mainPrimaryColor, transition: 'opacity 0.15s, color 0.15s', flexShrink: 0 }}
                                    onClick={() => handleOpenForm(row)}
                                >
                                    <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>

                            <Collapse in={isExpanded}>
                                <Box sx={{
                                    px: 2, py: 1.5,
                                    bgcolor: `${ACCENT}05`,
                                    border: `1px solid ${ACCENT}20`,
                                    borderTop: 'none',
                                    borderRadius: '0 0 8px 8px',
                                    mb: 0.5,
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <TextField
                                            size="small"
                                            label={t('Unit Price')}
                                            value={inputPrice}
                                            onChange={e => setInputPrice(e.target.value)}
                                            inputProps={{ inputMode: 'decimal' }}
                                            sx={{ width: 160, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSave(rowId); if (e.key === 'Escape') setExpandedRowId(null); }}
                                            autoFocus
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={withoutMaterials}
                                                    onChange={e => setWithoutMaterials(e.target.checked)}
                                                    sx={{ color: ACCENT, '&.Mui-checked': { color: ACCENT } }}
                                                />
                                            }
                                            label={<Typography sx={{ fontSize: '0.8rem' }}>{t('Without Material')}</Typography>}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                            <Button size="small" variant="text" onClick={() => setExpandedRowId(null)}
                                                sx={{ color: '#888', fontSize: '0.75rem', textTransform: 'none' }}>
                                                {t('Cancel')}
                                            </Button>
                                            <Button size="small" variant="contained" onClick={() => handleSave(rowId)}
                                                sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#00695c' }, fontSize: '0.75rem', textTransform: 'none', boxShadow: 'none' }}>
                                                {t('Save')}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
