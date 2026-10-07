'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Divider } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { mainPrimaryColor } from '@/theme';

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
}

export default function EnthakajalsDialog({ open, onClose, laborRows }: Props) {
    const rows = laborRows.filter(r => !r.isGroupRow && Number(r.quantity ?? 0) > 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh', boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}>
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HandshakeOutlinedIcon sx={{ fontSize: 20, color: ACCENT }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Ենթակապալ</Typography>
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
                    <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', py: 4 }}>Աշխատանկներ չկան</Typography>
                )}

                {rows.map((row, idx) => (
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
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.laborOfferItemName || row.catalogName}
                            </Typography>
                        </Box>
                        <Typography sx={{ width: 80, textAlign: 'right', fontSize: '0.78rem', fontWeight: 600, color: '#333', flexShrink: 0 }}>
                            {Number(row.quantity).toLocaleString('hy-AM', { maximumFractionDigits: 3 })} {row.unitSymbol}
                        </Typography>
                        <IconButton
                            className="add-btn"
                            size="small"
                            sx={{ ml: 0.5, width: 28, height: 28, opacity: 0.4, color: mainPrimaryColor, transition: 'opacity 0.15s', flexShrink: 0 }}
                            onClick={() => {}}
                        >
                            <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                ))}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
