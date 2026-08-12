'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    elRef: React.RefObject<HTMLInputElement | null>
) {
    const input = e.target;
    const raw = input.value.replace(/\s/g, '');
    if (raw !== '' && !/^\d+$/.test(raw)) return;

    const digitsBeforeCursor = input.value.slice(0, input.selectionStart ?? 0).replace(/\s/g, '').length;
    const num = raw === '' ? 0 : parseInt(raw, 10);
    const formatted = num > 0 ? fmtNum(num) : '';

    setter(formatted);

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

export default function OtherCostsDialog({ open, onClose, vatActual, onVatActualChange, climateActual, onClimateActualChange, temporaryStructuresActual, onTemporaryStructuresActualChange, transportationCostsActual, onTransportationCostsActualChange, commissioningCostsActual, onCommissioningCostsActualChange, stateFeesActual, onStateFeesActualChange }: Props) {
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
                            inputRef={vatRef}
                            onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, setVatInput, vatRef)}
                            onBlur={() => onVatActualChange(parseNum(vatInput))}
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
                            inputRef={climateRef}
                            onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, setClimateInput, climateRef)}
                            onBlur={() => onClimateActualChange(parseNum(climateInput))}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>{'Ժamаnаkаvor kаrruytcner'}</Typography>
                        <TextField
                            size='small'
                            value={temporaryStructuresInput}
                            inputRef={temporaryStructuresRef}
                            onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, setTemporaryStructuresInput, temporaryStructuresRef)}
                            onBlur={() => onTemporaryStructuresActualChange(parseNum(temporaryStructuresInput))}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>{'Тrансpортаyin ծахserer'}</Typography>
                        <TextField
                            size='small'
                            value={transportationCostsInput}
                            inputRef={transportationCostsRef}
                            onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, setTransportationCostsInput, transportationCostsRef)}
                            onBlur={() => onTransportationCostsActualChange(parseNum(transportationCostsInput))}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>{'Шаhаgortsмаn hаndnмаn ծахserer'}</Typography>
                        <TextField
                            size='small'
                            value={commissioningCostsInput}
                            inputRef={commissioningCostsRef}
                            onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, setCommissioningCostsInput, commissioningCostsRef)}
                            onBlur={() => onCommissioningCostsActualChange(parseNum(commissioningCostsInput))}
                            inputProps={{ style: { textAlign: 'right', width: 140 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            placeholder='0'
                        />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', flex: 1 }}>{'Pетаkаn turkker ev vchаrner'}</Typography>
                        <TextField
                            size='small'
                            value={stateFeesInput}
                            inputRef={stateFeesRef}
                            onChange={e => applyFormat(e as React.ChangeEvent<HTMLInputElement>, setStateFeesInput, stateFeesRef)}
                            onBlur={() => onStateFeesActualChange(parseNum(stateFeesInput))}
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
