'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Divider, Chip, Collapse, TextField, Checkbox, FormControlLabel, Button } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    sectionName?: string;
    subsectionName?: string;
    isGroupRow?: boolean;
    children?: LaborRow[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    laborRows: LaborRow[];
    costHistory?: CostHistoryEntry[];
    actualData?: Record<string, { quantity: string; unitPrice: string; spent?: string; withoutMaterials?: boolean }>;
    onSaveLaborPrice?: (rowId: string, unitPrice: string, withoutMaterials: boolean, quantity: string) => void;
}

export default function EnthakajalsDialog({ open, onClose, laborRows, costHistory = [], actualData = {}, onSaveLaborPrice }: Props) {
    const { t } = useTranslation();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [inputPrice, setInputPrice] = useState('');
    const [inputQty, setInputQty] = useState('');
    const [withoutMaterials, setWithoutMaterials] = useState(false);
    const [openedSecs, setOpenedSecs] = useState<Set<string>>(new Set());
    const [openedSubs, setOpenedSubs] = useState<Set<string>>(new Set());

    const toggleSec = (id: string) => setOpenedSecs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleSub = (id: string) => setOpenedSubs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    // Flatten: skip group rows, include their children (and top-level non-group rows)
    const flatten = (rs: LaborRow[]): LaborRow[] =>
        rs.flatMap(r => r.isGroupRow ? (r.children ?? []) : [r]);

    const rows = flatten(laborRows).filter(r => Number(r.quantity ?? 0) > 0);

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
        const savedQty = actualData[rowId]?.quantity;
        setInputQty(savedQty && parseFloat(savedQty.replace(',', '.')) > 0 ? savedQty : '');
        setWithoutMaterials(actualData[rowId]?.withoutMaterials ?? false);
        setExpandedRowId(prev => prev === row._id ? null : row._id);
    };

    const handleSave = (rowId: string) => {
        onSaveLaborPrice?.(rowId, inputPrice, withoutMaterials, inputQty);
        setExpandedRowId(null);
    };

    // Derive ordered section/subsection lists preserving snapshot order
    const sections: string[] = [];
    for (const r of rows) {
        const sec = r.sectionName || '—';
        if (!sections.includes(sec)) sections.push(sec);
    }

    const renderRow = (row: LaborRow, idx: number) => {
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
                        borderRadius: isExpanded ? '8px 8px 0 0' : 0,
                        bgcolor: isExpanded ? `${ACCENT}08` : idx % 2 === 0 ? '#f9fefe' : '#ffffff',
                        borderTop: '1px solid #f0fbfc',
                        '&:hover': { bgcolor: isExpanded ? `${ACCENT}08` : 'rgba(0,171,190,0.05)', '& .add-btn': { opacity: 1 } },
                        transition: 'background-color 0.15s',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
                        {isCosted && <CheckCircleIcon sx={{ fontSize: 14, color: ACCENT, flexShrink: 0 }} />}
                        <Typography sx={{ fontSize: '0.8425rem', fontWeight: 600, color: isCosted ? ACCENT : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.laborOfferItemName || row.catalogName}
                        </Typography>
                    </Box>
                    <Typography sx={{ width: 80, textAlign: 'right', fontSize: '0.8425rem', fontWeight: 600, color: '#333', flexShrink: 0 }}>
                        {Number(row.quantity).toLocaleString('hy-AM', { maximumFractionDigits: 3 })} {row.unitSymbol}
                    </Typography>
                    <Typography sx={{ width: 90, textAlign: 'right', fontSize: '0.8425rem', fontWeight: isCosted ? 600 : 400, color: isCosted ? ACCENT : '#bbb', flexShrink: 0 }}>
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
                        {parseFloat((inputQty || '0').replace(',', '.')) > 0 && (
                            <Box sx={{ mb: 1.25, pl: 0.5 }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>'Մնացորդ'</Typography>
                                <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: (Number(row.quantity) - (parseFloat(inputQty.replace(',', '.')) || 0)) < 0 ? '#c62828' : ACCENT }}>
                                    {(Number(row.quantity) - (parseFloat(inputQty.replace(',', '.')) || 0)).toLocaleString('hy-AM', { maximumFractionDigits: 3 })} {row.unitSymbol}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                label={t('Quantity')}
                                value={inputQty}
                                onChange={e => setInputQty(e.target.value)}
                                inputProps={{ inputMode: 'decimal' }}
                                error={(parseFloat((inputQty || '0').replace(',', '.')) || 0) > Number(row.quantity)}
                                sx={{ width: 120, '& .MuiInputBase-root': { bgcolor: '#fff' }, '& .MuiInputLabel-root': { fontSize: '0.78rem', color: '#bbb' }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }}
                                onKeyDown={e => { if (e.key === 'Enter') handleSave(rowId); if (e.key === 'Escape') setExpandedRowId(null); }}
                            />
                            <TextField
                                size="small"
                                label={t('Unit Price')}
                                value={inputPrice}
                                onChange={e => setInputPrice(e.target.value)}
                                inputProps={{ inputMode: 'decimal' }}
                                sx={{ width: 140, '& .MuiInputBase-root': { bgcolor: '#fff' }, '& .MuiInputLabel-root': { fontSize: '0.78rem', color: '#bbb' }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }}
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
                                label={<Typography sx={{ fontSize: '0.8625rem' }}>{t('Without Material')}</Typography>}
                            />
                            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                <Button size="small" variant="text" onClick={() => setExpandedRowId(null)}
                                    sx={{ color: '#888', fontSize: '0.8125rem', textTransform: 'none' }}>
                                    {t('Cancel')}
                                </Button>
                                <Button size="small" variant="contained" onClick={() => handleSave(rowId)}
                                    sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#00695c' }, fontSize: '0.8125rem', textTransform: 'none', boxShadow: 'none' }}>
                                    {t('Save')}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, minHeight: '62vh', maxHeight: '82vh', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}>
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
                                    fontSize: '0.7625rem',
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

                {rows.length === 0 && (
                    <Typography sx={{ fontSize: '0.8625rem', color: '#9ca3af', textAlign: 'center', py: 4 }}>Աշխատանկներ Չկան</Typography>
                )}

                {sections.map(secName => {
                    const secRows = rows.filter(r => (r.sectionName || '—') === secName);
                    const subsecNames: string[] = [];
                    for (const r of secRows) {
                        const sub = r.subsectionName || '—';
                        if (!subsecNames.includes(sub)) subsecNames.push(sub);
                    }
                    const realSubs = subsecNames.filter(s => s !== '—');
                    const hasMultipleSubs = realSubs.length > 1;

                    return (
                        <Box key={secName} sx={{ mb: 1.5, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                            <Box
                                onClick={() => toggleSec(secName)}
                                sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', px: 2, py: 1, borderLeft: `3px solid ${ACCENT}`, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#efefef' } }}
                            >
                                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#333', flex: 1 }}>{secName}</Typography>
                                <ExpandMoreIcon sx={{ fontSize: 17, color: '#999', transition: 'transform 0.2s', transform: openedSecs.has(secName) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                            </Box>
                            <Collapse in={openedSecs.has(secName)}>
                                {subsecNames.map(subName => {
                                    const subKey = secName + '|' + subName;
                                    const subRows = secRows.filter(r => (r.subsectionName || '—') === subName);
                                    return (
                                        <Box key={subName} sx={{ borderTop: '1px solid #f0f0f0' }}>
                                            {hasMultipleSubs && subName !== '—' && (
                                                <Box onClick={() => toggleSub(subKey)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.7, bgcolor: '#fafafa', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#f3f3f3' } }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.8625rem', color: '#555', flex: 1 }}>{subName}</Typography>
                                                    <ExpandMoreIcon sx={{ fontSize: 15, color: '#bbb', transition: 'transform 0.2s', transform: openedSubs.has(subKey) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                                </Box>
                                            )}
                                            <Collapse in={!hasMultipleSubs || subName === '—' || openedSubs.has(subKey)}>
                                                <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#f0fbfc', borderTop: '1px solid #e0f5f7', display: 'grid', gridTemplateColumns: '1fr 80px 90px 36px' }}>
                                                    <Typography sx={{ fontSize: '0.7425rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Աշխատանք</Typography>
                                                    <Typography sx={{ fontSize: '0.7425rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Քանակ</Typography>
                                                    <Typography sx={{ fontSize: '0.7425rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Արժեք</Typography>
                                                    <Box />
                                                </Box>
                                                {subRows.map((row, idx) => renderRow(row, idx))}
                                            </Collapse>
                                        </Box>
                                    );
                                })}
                            </Collapse>
                        </Box>
                    );
                })}

                </Box>
            </DialogContent>
        </Dialog>
    );
}
