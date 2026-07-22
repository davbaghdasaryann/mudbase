'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, InputBase, Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { mainPrimaryColor } from '@/theme';
import { type CostHistoryEntry } from './page';

type SalaryType = 'druqayin' | 'gorcarqayin' | 'miavorzham';

interface Props {
    open: boolean;
    onClose: () => void;
    onEntryAdded: (entry: CostHistoryEntry) => void;
}

const INPUT_SX = { border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 };

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <Box sx={INPUT_SX}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InputBase
                    value={value}
                    onChange={ev => onChange(ev.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder='0'
                    inputProps={{ style: { textAlign: 'right', width: 110, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
                />
                <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>AMD</Typography>
            </Box>
        </Box>
    );
}

export default function SalaryDialog({ open, onClose, onEntryAdded }: Props) {
    const [type, setType] = useState<SalaryType>('druqayin');
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');

    useEffect(() => { if (open) { setType('druqayin'); setVal1(''); setVal2(''); } }, [open]);

    const n1 = parseFloat(val1.replace(',', '.')) || 0;
    const n2 = parseFloat(val2.replace(',', '.')) || 0;
    const total = type === 'druqayin' ? n1 : n1 * n2;
    const canAdd = total > 0;

    const handleAdd = () => {
        if (!canAdd) return;
        const entry: CostHistoryEntry = {
            id: String(Date.now() + Math.random()),
            workName: type === 'druqayin' ? 'Դրույքային' : type === 'gorcarqayin' ? 'Գործարքային' : 'Միավոր/ժամ',
            unit: type === 'druqayin' ? 'AMD' : type === 'gorcarqayin' ? '' : 'ժam',
            quantity: type === 'druqayin' ? 1 : n1,
            unitPrice: type === 'druqayin' ? n1 : n2,
            total,
            addedAt: new Date(),
            paymentMethod: 'salary_' + type,
        };
        onEntryAdded(entry);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 22 }} />
                Աշխատավարձի ծախսագրում
            </DialogTitle>
            <DialogContent sx={{ pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <RadioGroup row value={type} onChange={ev => { setType(ev.target.value as SalaryType); setVal1(''); setVal2(''); }}>
                    <FormControlLabel value='druqayin' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Դրույքային</Typography>} />
                    <FormControlLabel value='gorcarqayin' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Գործարքային</Typography>} />
                    <FormControlLabel value='miavorzham' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Միավոր/ժամ</Typography>} />
                </RadioGroup>
                {type === 'druqayin' && (
                    <NumInput label='Դրույքային' value={val1} onChange={setVal1} />
                )}
                {type === 'gorcarqayin' && (
                    <>
                        <NumInput label='Քանակ' value={val1} onChange={setVal1} />
                        <NumInput label='Միավորի արժեքը' value={val2} onChange={setVal2} />
                    </>
                )}
                {type === 'miavorzham' && (
                    <>
                        <NumInput label='1 ժamvа дрuyqачафа' value={val1} onChange={setVal1} />
                        <NumInput label='Жамери qаnaq' value={val2} onChange={setVal2} />
                    </>
                )}
                {canAdd && type !== 'druqayin' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 0.5 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#777' }}>Ընդհանուր: <strong style={{ color: mainPrimaryColor }}>{(n1 * n2).toLocaleString()} AMD</strong></Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>Չեղարկել</Button>
                <Button variant='contained' onClick={handleAdd} disabled={!canAdd}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                >Պահպանել</Button>
            </DialogActions>
        </Dialog>
    );
}
