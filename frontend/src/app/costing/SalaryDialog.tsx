'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, InputBase,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { mainPrimaryColor } from '@/theme';

export interface SalaryData {
    druqayin: number;
    gorcarqayin: number;
    miavorZham: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    salaryData: SalaryData;
    onSave: (data: SalaryData) => void;
}

const FIELD_ROW_SX = {
    border: '1px solid #e0f5f7',
    borderRadius: 1.5,
    px: 1.5,
    py: 0.8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
};

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    const [raw, setRaw] = useState(value > 0 ? String(value) : '');

    useEffect(() => {
        setRaw(value > 0 ? String(value) : '');
    }, [value]);

    return (
        <Box sx={FIELD_ROW_SX}>
            <Typography sx={{ fontSize: '0.88rem', color: '#555', flex: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InputBase
                    value={raw}
                    onChange={ev => {
                        const v = ev.target.value.replace(/[^0-9.]/g, '');
                        setRaw(v);
                        onChange(parseFloat(v.replace(',', '.')) || 0);
                    }}
                    placeholder='0'
                    inputProps={{ style: { textAlign: 'right', width: 110, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
                />
                <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>AMD</Typography>
            </Box>
        </Box>
    );
}

export default function SalaryDialog({ open, onClose, salaryData, onSave }: Props) {
    const [draft, setDraft] = useState<SalaryData>(salaryData);

    useEffect(() => {
        if (open) setDraft(salaryData);
    }, [open, salaryData]);

    const handleSave = () => {
        onSave(draft);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 22 }} />
                Աշխատավարձի ծախսագրում
            </DialogTitle>
            <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <NumField label='Դրույքային' value={draft.druqayin} onChange={v => setDraft(prev => ({ ...prev, druqayin: v }))} />
                <NumField label='Գործարքային' value={draft.gorcarqayin} onChange={v => setDraft(prev => ({ ...prev, gorcarqayin: v }))} />
                <NumField label='Միավոր/ժամ' value={draft.miavorZham} onChange={v => setDraft(prev => ({ ...prev, miavorZham: v }))} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>Չեղարկել</Button>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                >Պահպանել</Button>
            </DialogActions>
        </Dialog>
    );
}
