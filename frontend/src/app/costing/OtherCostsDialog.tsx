'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Divider,
} from '@mui/material';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import { useTranslation } from 'react-i18next';

interface Props {
    open: boolean;
    onClose: () => void;
    vatActual: number;
    onVatActualChange: (val: number) => void;
    climateActual: number;
    onClimateActualChange: (val: number) => void;
}

const ACCENT = '#00A390';

const fmt = (n: number) => n > 0 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
const parse = (s: string) => parseFloat(s.replace(/[\s]/g, '').replace(',', '.')) || 0;

export default function OtherCostsDialog({ open, onClose, vatActual, onVatActualChange, climateActual, onClimateActualChange }: Props) {
    const { t } = useTranslation();
    const [vatInput, setVatInput] = useState(fmt(vatActual));
    const [climateInput, setClimateInput] = useState(fmt(climateActual));

    useEffect(() => {
        if (open) {
            setVatInput(fmt(vatActual));
            setClimateInput(fmt(climateActual));
        }
    }, [open]); // eslint-disable-line

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
                            onFocus={() => setVatInput(String(parse(vatInput) || ''))}
                            onBlur={() => { const val = parse(vatInput); setVatInput(fmt(val)); onVatActualChange(val); }}
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
                            onFocus={() => setClimateInput(String(parse(climateInput) || ''))}
                            onBlur={() => { const val = parse(climateInput); setClimateInput(fmt(val)); onClimateActualChange(val); }}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant='contained' sx={{ borderRadius: '20px', backgroundColor: ACCENT, '&:hover': { backgroundColor: '#008a79' } }}>
                    {t('Confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
