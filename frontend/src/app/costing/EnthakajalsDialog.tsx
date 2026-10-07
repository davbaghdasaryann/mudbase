'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Divider, Chip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CloseIcon from '@mui/icons-material/Close';
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
}

export default function EnthakajalsDialog({ open, onClose, laborRows, costHistory = [] }: Props) {
    const rows = laborRows.filter(r => !r.isGroupRow && Number(r.quantity ?? 0) > 0);

    const costedIds = new Set(
        costHistory
            .filter(e => (e.isSubcontractor || e.paymentMethod === 'subcontractor') && e.laborItemId)
            .map(e => e.laborItemId!)
    );
    const costedCount = rows.filter(r => costedIds.has(r._id)).length;

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
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, mb: 0.5 }}>
                    <Typography sx={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Աշխատանք</Typography>
                    <Typography sx={{ width: 80, textAlign: 'right', fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Քանակ</Typography>
                    <Box sx={{ width: 36 }} />
                </Box>
                <Divider sx={{ mb: 0.5, borderColor: '#e5f9fa' }} />

                {rows.length === 0 && (
                    <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', py: 4 }}>Աշխատանկներ Չկան</Typography>
                )}

                {rows.map((row, idx) => {
                    const isCosted = costedIds.has(row._id);
                    return (
                        <Box
                            key={row._id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                bgcolor: idx % 2 === 0 ? '#f9fefe' : '#ffffff',
                                '&:hover': { bgcolor: 'rgba(0,171,190,0.05)', '& .add-btn': { opacity: 1 } },
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
                            <IconButton
                                className="add-btn"
                                size="small"
                                sx={{ ml: 0.5, width: 28, height: 28, opacity: isCosted ? 0.25 : 0.4, color: mainPrimaryColor, transition: 'opacity 0.15s', flexShrink: 0 }}
                                onClick={() => {}}
                            >
                                <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    );
                })}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
