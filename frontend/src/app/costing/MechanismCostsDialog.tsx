'use client';

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, IconButton, Typography, Divider,
} from '@mui/material';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
    open: boolean;
    onClose: () => void;
}

const ACCENT = '#795548';

export default function MechanismCostsDialog({ open, onClose }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh', boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}
        >
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 20, color: ACCENT }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Մեխանիզմի ծախսագրում</Typography>
                    </Box>
                    <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
                    <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 40, color: '#e0e0e0' }} />
                    <Typography sx={{ color: '#bbb', fontSize: '0.88rem' }}>ծախսեր դեռ չեն ավելացվել</Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
