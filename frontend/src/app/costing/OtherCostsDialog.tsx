'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Button, Divider, Typography, IconButton, InputBase,
} from '@mui/material';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

interface Props {
    open: boolean;
    onClose: () => void;
    activeExpenseKeys?: string[];
    vatActual: number;
    onVatActualChange: (val: number) => void;
    climateActual: number;
    onClimateActualChange: (val: number) => void;
    temporaryStructuresActual: number;
    onTemporaryStructuresActualChange: (val: number) => void;
    transportationCostsActual: number;
    onTransportationCostsActualChange: (val: number) => void;
    commissioningCostsActual: number;
    onCommissioningCostsActualChange: (val: number) => void;
    stateFeesActual: number;
    onStateFeesActualChange: (val: number) => void;
}

const ACCENT = '#00A390';

const fmtNum = (n: number) => n > 0 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
const parseNum = (s: string) => parseInt(s.replace(/\s/g, ''), 10) || 0;

function applyFormat(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    elRef: React.RefObject<HTMLInputElement | null>,
    onUpdate?: (val: number) => void
) {
    const input = e.target;
    const raw = input.value.replace(/\s/g, '');
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    const digitsBeforeCursor = input.value.slice(0, input.selectionStart ?? 0).replace(/\s/g, '').length;
    const num = raw === '' ? 0 : parseInt(raw, 10);
    const formatted = num > 0 ? fmtNum(num) : '';
    setter(formatted);
    onUpdate?.(num);
    requestAnimationFrame(() => {
        const el = elRef.current;
        if (!el) return;
        let newPos = formatted.length;
        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (formatted[i] !== ' ') count++;
            if (count === digitsBeforeCursor) { newPos = i + 1; break; }
        }
        el.setSelectionRange(newPos, newPos);
    });
}

const inputSx = {
    border: '1px solid #e0e0e0',
    borderRadius: 2,
    px: 1.5,
    py: 0.6,
    fontSize: '0.9rem',
    bgcolor: '#fff',
    width: '100%',
    '& input': { textAlign: 'right' },
    '&:focus-within': { borderColor: ACCENT, boxShadow: `0 0 0 2px ${ACCENT}18` },
    transition: 'all 0.15s',
};

export default function OtherCostsDialog({ open, onClose, activeExpenseKeys, vatActual, onVatActualChange, climateActual, onClimateActualChange, temporaryStructuresActual, onTemporaryStructuresActualChange, transportationCostsActual, onTransportationCostsActualChange, commissioningCostsActual, onCommissioningCostsActualChange, stateFeesActual, onStateFeesActualChange }: Props) {
    const { t } = useTranslation();
    const [vatInput, setVatInput] = useState(fmtNum(vatActual));
    const [climateInput, setClimateInput] = useState(fmtNum(climateActual));
    const [temporaryStructuresInput, setTemporaryStructuresInput] = useState(fmtNum(temporaryStructuresActual));
    const [transportationCostsInput, setTransportationCostsInput] = useState(fmtNum(transportationCostsActual));
    const [commissioningCostsInput, setCommissioningCostsInput] = useState(fmtNum(commissioningCostsActual));
    const [stateFeesInput, setStateFeesInput] = useState(fmtNum(stateFeesActual));
    const vatRef = useRef<HTMLInputElement>(null);
    const climateRef = useRef<HTMLInputElement>(null);
    const temporaryStructuresRef = useRef<HTMLInputElement>(null);
    const transportationCostsRef = useRef<HTMLInputElement>(null);
    const commissioningCostsRef = useRef<HTMLInputElement>(null);
    const stateFeesRef = useRef<HTMLInputElement>(null);

    const show = (key: string) => !activeExpenseKeys || activeExpenseKeys.includes(key);

    useEffect(() => {
        if (open) {
            setVatInput(fmtNum(vatActual));
            setClimateInput(fmtNum(climateActual));
            setTemporaryStructuresInput(fmtNum(temporaryStructuresActual));
            setTransportationCostsInput(fmtNum(transportationCostsActual));
            setCommissioningCostsInput(fmtNum(commissioningCostsActual));
            setStateFeesInput(fmtNum(stateFeesActual));
        }
    }, [open]); // eslint-disable-line

    const rows: { key: string; label: string; input: string; setInput: React.Dispatch<React.SetStateAction<string>>; ref: React.RefObject<HTMLInputElement | null>; onUpdate: (v: number) => void; onBlur: () => void }[] = [
        { key: 'valueAddedTax',         label: 'Ավելացված արժեքի հարկ',      input: vatInput,                   setInput: setVatInput,                   ref: vatRef,                   onUpdate: onVatActualChange,                   onBlur: () => onVatActualChange(parseNum(vatInput)) },
        { key: 'climaticImpactCosts',   label: 'Կլիմայական ազդեցության ծախսեր', input: climateInput,          setInput: setClimateInput,               ref: climateRef,               onUpdate: onClimateActualChange,               onBlur: () => onClimateActualChange(parseNum(climateInput)) },
        { key: 'temporaryStructures',   label: 'Ժամանակավոր կառույցներ',      input: temporaryStructuresInput,   setInput: setTemporaryStructuresInput,   ref: temporaryStructuresRef,   onUpdate: onTemporaryStructuresActualChange,   onBlur: () => onTemporaryStructuresActualChange(parseNum(temporaryStructuresInput)) },
        { key: 'transportationCosts',   label: 'Տրանսպորտային ծախսեր',     input: transportationCostsInput,   setInput: setTransportationCostsInput,   ref: transportationCostsRef,   onUpdate: onTransportationCostsActualChange,   onBlur: () => onTransportationCostsActualChange(parseNum(transportationCostsInput)) },
        { key: 'operationHandoverCosts',label: 'Շահագործման հանձնման ծախսեր', input: commissioningCostsInput, setInput: setCommissioningCostsInput, ref: commissioningCostsRef,   onUpdate: onCommissioningCostsActualChange,    onBlur: () => onCommissioningCostsActualChange(parseNum(commissioningCostsInput)) },
        { key: 'stateDutiesAndFees',    label: 'Պետական տուրքեր և վճարներ',   input: stateFeesInput,             setInput: setStateFeesInput,             ref: stateFeesRef,             onUpdate: onStateFeesActualChange,             onBlur: () => onStateFeesActualChange(parseNum(stateFeesInput)) },
    ].filter(r => show(r.key));

    const grandTotal = rows.reduce((s, r) => s + parseNum(r.input), 0);

    const handleConfirm = () => {
        onVatActualChange(parseNum(vatInput));
        onClimateActualChange(parseNum(climateInput));
        onTemporaryStructuresActualChange(parseNum(temporaryStructuresInput));
        onTransportationCostsActualChange(parseNum(transportationCostsInput));
        onCommissioningCostsActualChange(parseNum(commissioningCostsInput));
        onStateFeesActualChange(parseNum(stateFeesInput));
        onClose();
    };

    const arLabels: Record<string, string> = {
        valueAddedTax: 'Ավելացված արժեքի հարկ',
        climaticImpactCosts: 'Կլիմայական ազդեցության ծախսեր',
        temporaryStructures: 'Ժամանակավոր կառույցներ',
        transportationCosts: 'Տրանսպորտային ծախսեր',
        operationHandoverCosts: 'Շահագործման հանձնման ծախսեր',
        stateDutiesAndFees: 'Պետական տուրքեր և վճարներ',
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh', boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}
        >
            {/* Header */}
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(229,57,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AddCardOutlinedIcon sx={{ fontSize: 20, color: '#e53935' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Այլ ծախսեր</Typography>
                    </Box>
                    <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                <Box sx={{ px: 3, py: 2 }}>
                    {/* Column headers */}
                    {rows.length > 0 && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 180px', gap: 1, px: 1.5, py: 0.75, bgcolor: '#f8f9fa', borderRadius: 1.5, mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>№</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Անուններ</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Գումար (AMD)</Typography>
                        </Box>
                    )}

                    {/* Rows */}
                    {rows.map((row, idx) => (
                        <Box
                            key={row.key}
                            sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 180px', gap: 1, alignItems: 'center', px: 1.5, py: 1.1, borderRadius: 1.5, bgcolor: idx % 2 !== 0 ? '#fafafa' : '#fff', '&:hover': { bgcolor: '#f0f7f6' }, transition: 'background 0.12s' }}
                        >
                            <Typography sx={{ fontSize: '0.78rem', color: '#bbb', fontWeight: 600 }}>{idx + 1}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#333' }}>{row.label}</Typography>
                            <InputBase
                                value={row.input}
                                inputRef={row.ref}
                                onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, row.setInput, row.ref, row.onUpdate)}
                                onBlur={row.onBlur}
                                placeholder='0'
                                sx={inputSx}
                            />
                        </Box>
                    ))}

                    {/* Footer total + confirm — same grid as rows for alignment */}
                    {rows.length > 0 && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 180px', gap: 1, alignItems: 'center', px: 1.5, pt: 1.5, mt: 1, borderTop: '2px solid #f0f0f0' }}>
                            <Box />
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#444' }}>Ընդամենը</Typography>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: ACCENT, textAlign: 'right' }}>
                                {grandTotal > 0 ? fmtNum(grandTotal) + ' AMD' : '—'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            {/* Confirm button aligned to amount column */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 180px', gap: 1, px: 3, pb: 2.5, pt: 1 }}>
                <Box /><Box />
                <Button
                    onClick={handleConfirm}
                    variant='contained'
                    fullWidth
                    sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: ACCENT, fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                >
                    {t('Confirm')}
                </Button>
            </Box>
        </Dialog>
    );
}
