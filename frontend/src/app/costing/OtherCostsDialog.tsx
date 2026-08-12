'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Divider,
} from '@mui/material';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';

interface ExpenseItem {
    key: string;
    label: string;
    percentage: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    totalActual: number;
    otherExpenses: ExpenseItem[];
    vatPercentage: number;
    vatDeduction: number;
    onDeductionChange: (val: number) => void;
}

const ACCENT = '#00A390';

function fmt(n: number) {
    return Math.round(n).toLocaleString('en-US') + ' AMD';
}

export default function OtherCostsDialog({ open, onClose, totalActual, otherExpenses, vatPercentage, vatDeduction, onDeductionChange }: Props) {
    const [deductionInput, setDeductionInput] = useState(String(vatDeduction || ''));

    useEffect(() => {
        if (open) setDeductionInput(String(vatDeduction || ''));
    }, [open]); // eslint-disable-line

    const expenseAmounts = otherExpenses.map(e => ({
        ...e,
        amount: Math.round(totalActual * e.percentage / 100),
    }));
    const expensesTotal = expenseAmounts.reduce((s, e) => s + e.amount, 0);
    const vatBase = totalActual + expensesTotal;
    const vatAmount = Math.round(vatBase * vatPercentage / 100);
    const deductionVal = parseFloat(deductionInput.replace(/,/g, '')) || 0;
    const finalVat = Math.max(0, vatAmount - deductionVal);

    const handleDeductionBlur = () => {
        const val = parseFloat(deductionInput.replace(/,/g, '')) || 0;
        onDeductionChange(val);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: ACCENT, pb: 1 }}>
                <AddCardOutlinedIcon sx={{ fontSize: 22 }} />
                {'Այլ ծախսեր'}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <Row label={'Ընդհանուր փաստացի ծախսեր'} value={fmt(totalActual)} bold />

                    {expenseAmounts.length > 0 && (
                        <Box sx={{ mt: 1, mb: 0.5 }}>
                            {expenseAmounts.map(e => (
                                <Row key={e.key} label={`${e.label} (${e.percentage}%)`} value={fmt(e.amount)} indent />
                            ))}
                            <Row label={'Ծախքեր ընդամենը'} value={fmt(expensesTotal)} />
                        </Box>
                    )}

                    <Divider sx={{ my: 1 }} />
                    <Row label={'ԱԱՀ հաշվարկային բազա'} value={fmt(vatBase)} />
                    <Row label={`ԱԱՀ ${vatPercentage}%`} value={fmt(vatAmount)} bold />

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
                        <Typography sx={{ fontSize: '0.92rem', color: 'text.secondary' }}>{'Նվազեցում'}</Typography>
                        <TextField
                            size='small'
                            value={deductionInput}
                            onChange={e => setDeductionInput(e.target.value)}
                            onBlur={handleDeductionBlur}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.92rem' } }}
                            placeholder='0'
                        />
                    </Box>

                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, bgcolor: `${ACCENT}11`, borderRadius: 2, px: 1.5 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: ACCENT }}>{'Փաստացի ԱԱՀ'}</Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: ACCENT }}>{fmt(finalVat)}</Typography>
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

function Row({ label, value, bold, indent }: { label: string; value: string; bold?: boolean; indent?: boolean }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, pl: indent ? 2 : 0 }}>
            <Typography sx={{ fontSize: '0.9rem', color: bold ? 'text.primary' : 'text.secondary', fontWeight: bold ? 600 : 400 }}>{label}</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: bold ? 600 : 400 }}>{value}</Typography>
        </Box>
    );
}
