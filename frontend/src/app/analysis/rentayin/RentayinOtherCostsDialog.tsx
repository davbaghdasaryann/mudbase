'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Button, Divider, Typography, IconButton, TextField,
} from '@mui/material';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const ACCENT = '#00A390';

export const OTHER_COST_TYPES: { key: string; label: string }[] = [
    { key: 'valueAddedTax',          label: 'Ավելացված արժեքի հարկ' },
    { key: 'climaticImpactCosts',    label: 'Կլիմայական ազդեցության ծախսեր' },
    { key: 'temporaryStructures',    label: 'Ժամանակավոր կառույցներ' },
    { key: 'transportationCosts',    label: 'Տրանսպորտային ծախսեր' },
    { key: 'operationHandoverCosts', label: 'Շահագործման հանձնման ծախսեր' },
    { key: 'stateDutiesAndFees',     label: 'Պետական տուրքեր և վճարներ' },
];

interface Props {
    open: boolean;
    onClose: () => void;
    percentages: Record<string, number>;
    totalActualCost: number;
    onSave: (percentages: Record<string, number>) => void;
}

export default function RentayinOtherCostsDialog({ open, onClose, percentages, totalActualCost, onSave }: Props) {
    const { t } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const init: Record<string, string> = {};
            for (const { key } of OTHER_COST_TYPES) {
                const pct = percentages[key] ?? 0;
                init[key] = pct > 0 ? String(pct) : '';
            }
            setValues(init);
        }
    }, [open]); // eslint-disable-line

    const parsed = (key: string) => {
        const v = parseFloat((values[key] ?? '').replace(',', '.'));
        return isNaN(v) || v < 0 ? 0 : Math.min(v, 100);
    };

    const fmtAMD = (n: number) => n > 0 ? Math.round(n).toLocaleString() + ' ֏' : '—';

    const grandTotal = OTHER_COST_TYPES.reduce((s, { key }) =>
        s + (totalActualCost > 0 ? (parsed(key) / 100) * totalActualCost : 0), 0);

    const handleSave = () => {
        const result: Record<string, number> = {};
        for (const { key } of OTHER_COST_TYPES) {
            const v = parsed(key);
            if (v > 0) result[key] = v;
        }
        onSave(result);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}>
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(229,57,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AddCardOutlinedIcon sx={{ fontSize: 20, color: '#e53935' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', flex: 1 }}>Այլ ծախսեր</Typography>
                    <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider sx={{ mx: 3, mt: 2 }} />

            <DialogContent sx={{ px: 3, py: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 140px', gap: 1, px: 1.5, py: 0.75, bgcolor: '#f8f9fa', borderRadius: 1.5, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>&#x23;</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Անուններ</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>%</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Գումար (AMD)</Typography>
                </Box>

                {OTHER_COST_TYPES.map(({ key, label }, idx) => {
                    const pct = parsed(key);
                    const amount = totalActualCost > 0 ? (pct / 100) * totalActualCost : 0;
                    return (
                        <Box key={key} sx={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 140px', gap: 1, alignItems: 'center', px: 1.5, py: 1, borderRadius: 1.5, bgcolor: idx % 2 !== 0 ? '#fafafa' : '#fff', '&:hover': { bgcolor: '#f0f7f6' }, transition: 'background 0.12s' }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#bbb', fontWeight: 600 }}>{idx + 1}</Typography>
                            <Typography sx={{ fontSize: '0.88rem', color: '#333' }}>{label}</Typography>
                            <TextField
                                size='small'
                                value={values[key] ?? ''}
                                onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || /^\d*\.?\d*$/.test(v)) setValues(prev => ({ ...prev, [key]: v }));
                                }}
                                placeholder='0'
                                inputProps={{ style: { textAlign: 'center', fontSize: '0.88rem', padding: '4px 8px' } }}
                                InputProps={{ endAdornment: <Typography sx={{ fontSize: '0.78rem', color: '#999', ml: 0.25 }}>%</Typography> }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, '&.Mui-focused fieldset': { borderColor: ACCENT } } }}
                            />
                            <Typography sx={{ fontSize: '0.88rem', color: pct > 0 ? '#333' : '#ccc', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                {fmtAMD(amount)}
                            </Typography>
                        </Box>
                    );
                })}

                <Box sx={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 140px', gap: 1, alignItems: 'center', px: 1.5, pt: 1.5, mt: 1, borderTop: '2px solid #f0f0f0' }}>
                    <Box />
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#444' }}>Ընդամենը</Typography>
                    <Box />
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: ACCENT, textAlign: 'right' }}>
                        {fmtAMD(grandTotal)}
                    </Typography>
                </Box>
            </DialogContent>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 3, pb: 2.5, pt: 1 }}>
                <Button onClick={handleSave} variant='contained' sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: ACCENT, fontWeight: 600, boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}>
                    {t('Confirm')}
                </Button>
            </Box>
        </Dialog>
    );
}
