'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, InputBase,
} from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { mainPrimaryColor } from '@/theme';
import { type CostHistoryEntry } from './page';

interface Props {
    open: boolean;
    onClose: () => void;
    onCostAdded: (entry: CostHistoryEntry) => void;
}

const INPUT_SX = { border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, cursor: 'text' };

function Field({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
    const ref = React.useRef<HTMLInputElement>(null);
    return (
        <Box sx={INPUT_SX} onClick={() => ref.current?.focus()}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <InputBase autoFocus={autoFocus} value={value} inputRef={ref}
                onChange={ev => onChange(ev.target.value)}
                placeholder='—'
                inputProps={{ style: { textAlign: 'right', width: 130, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
            />
        </Box>
    );
}

function NumField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
    const ref = React.useRef<HTMLInputElement>(null);
    return (
        <Box sx={INPUT_SX} onClick={() => ref.current?.focus()}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InputBase value={value} inputRef={ref}
                    onChange={ev => onChange(ev.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder='0'
                    inputProps={{ style: { textAlign: 'right', width: 110, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
                />
                {suffix && <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>{suffix}</Typography>}
            </Box>
        </Box>
    );
}

export default function UnforeseenDialog({ open, onClose, onCostAdded }: Props) {
    const [workName, setWorkName] = useState('');
    const [qty, setQty] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    const n_qty = parseFloat(qty.replace(',', '.')) || 0;
    const n_price = parseFloat(unitPrice.replace(',', '.')) || 0;
    const total = n_qty * n_price;
    const canAdd = workName.trim().length > 0 && total > 0;

    const handleClose = () => {
        setWorkName(''); setQty(''); setUnitPrice('');
        onClose();
    };

    const handleAdd = () => {
        if (!canAdd) return;
        onCostAdded({
            id: String(Date.now() + Math.random()),
            workName: workName.trim(),
            unit: '',
            quantity: n_qty,
            unitPrice: n_price,
            total,
            addedAt: new Date(),
            paymentMethod: 'unforeseen',
        });
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                <ReportProblemOutlinedIcon sx={{ fontSize: 22 }} />
                Չնախատեսված աշխատանքներ
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Field autoFocus label='Աշխատանքի անվանումը' value={workName} onChange={setWorkName} />
                    <NumField label='Քանակը' value={qty} onChange={setQty} />
                    <NumField label='Միավորի արժեք' value={unitPrice} onChange={setUnitPrice} suffix='AMD' />
                    {total > 0 && (
                        <Typography sx={{ fontSize: '0.8rem', color: '#555', px: 0.5 }}>
                            Ընդհանուր արժեք: <strong style={{ color: mainPrimaryColor }}>{total.toLocaleString(undefined, { maximumFractionDigits: 0 })} AMD</strong>
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={handleClose} sx={{ borderRadius: '20px', color: '#888' }}>Կնքել</Button>
                <Button variant='contained' onClick={handleAdd} disabled={!canAdd}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>
                    Ավելացնել
                </Button>
            </DialogActions>
        </Dialog>
    );
}
