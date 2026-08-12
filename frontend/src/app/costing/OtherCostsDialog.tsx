'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Divider,
} from '@mui/material';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';

interface Props {
    open: boolean;
    onClose: () => void;
    vatActual: number;
    onVatActualChange: (val: number) => void;
    climateActual: number;
    onClimateActualChange: (val: number) => void;
}

const ACCENT = '#00A390';

export default function OtherCostsDialog({ open, onClose, vatActual, onVatActualChange, climateActual, onClimateActualChange }: Props) {
    const [vatInput, setVatInput] = useState(String(vatActual || ''));
    const [climateInput, setClimateInput] = useState(String(climateActual || ''));

    useEffect(() => {
        if (open) {
            setVatInput(String(vatActual || ''));
            setClimateInput(String(climateActual || ''));
        }
    }, [open]); // eslint-disable-line

    return (
        <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: ACCENT, pb: 1 }}>
                <AddCardOutlinedIcon sx={{ fontSize: 22 }} />
                {'Այլ ծախսեր'}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>{'Ավելացված արժեքի հարկ'}</Typography>
                        <TextField
                            size='small'
                            value={vatInput}
                            onChange={e => setVatInput(e.target.value)}
                            onBlur={() => onVatActualChange(parseFloat(vatInput.replace(/,/g, '')) || 0)}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>{'Կլիմայական ազդեցության ծախսեր'}</Typography>
                        <TextField
                            size='small'
                            value={climateInput}
                            onChange={e => setClimateInput(e.target.value)}
                            onBlur={() => onClimateActualChange(parseFloat(climateInput.replace(/,/g, '')) || 0)}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant='contained' sx={{ borderRadius: '20px', backgroundColor: ACCENT, '&:hover': { backgroundColor: '#008a79' } }}>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}
