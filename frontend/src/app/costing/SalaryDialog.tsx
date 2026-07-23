'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, Radio, RadioGroup,
    FormControlLabel, InputBase, IconButton,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';
import { type CostHistoryEntry } from './page';

type SalaryType = 'druqayin' | 'gorcarqayin' | 'miavorzham';

interface LaborRow {
    _id: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    sectionName: string;
}

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    if (typeof v === 'object' && '$oid' in (v as any)) return (v as any)['$oid'];
    return String(v);
}

interface Props {
    open: boolean;
    onClose: () => void;
    estimate: EstimatesApi.ApiEstimate;
    onEntryAdded: (entry: CostHistoryEntry) => void;
    actualData?: Record<string, { quantity: string; unitPrice: string }>;
}

const INPUT_SX = { border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 };

function NumInput({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
    return (
        <Box sx={INPUT_SX}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InputBase autoFocus={autoFocus} value={value}
                    onChange={ev => onChange(ev.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder='0'
                    inputProps={{ style: { textAlign: 'right', width: 110, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
                />
                <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>AMD</Typography>
            </Box>
        </Box>
    );
}

export default function SalaryDialog({ open, onClose, estimate, onEntryAdded, actualData }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<LaborRow | null>(null);
    const [type, setType] = useState<SalaryType>('druqayin');
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');

    useEffect(() => {
        if (!open) {
            setSelectedRow(null);
            return;
        }
        setSelectedRow(null);
        setType('druqayin');
        setVal1('');
        setVal2('');
        const estimateId = toId(estimate?._id);
        if (!estimateId) return;
        setLoading(true);
        Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } })
            .then(data => setRows(data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open, estimate]);

    const handleClose = () => { setSelectedRow(null); onClose(); };
    const n1 = parseFloat(val1.replace(',', '.')) || 0;
    const n2 = parseFloat(val2.replace(',', '.')) || 0;
    const computedTotal = type === 'druqayin' ? n1 : n1 * n2;
    const canAdd = computedTotal > 0;

    const handleAdd = () => {
        if (!canAdd || !selectedRow) return;
        const entry: CostHistoryEntry = {
            id: String(Date.now() + Math.random()),
            workName: selectedRow.laborOfferItemName || selectedRow.catalogName || '—',
            unit: type === 'druqayin' ? 'AMD' : type === 'gorcarqayin' ? selectedRow.unitSymbol || '' : 'ժամ',
            quantity: type === 'druqayin' ? 1 : n1,
            unitPrice: type === 'druqayin' ? n1 : n2,
            total: computedTotal,
            addedAt: new Date(),
            paymentMethod: 'salary_' + type,
            note: type === 'druqayin' ? 'Դրույքային' : type === 'gorcarqayin' ? 'Գործարքային' : 'Միավոր/ժամ',
        };
        onEntryAdded(entry);
        handleClose();
    };

    // Only show rows that have a value in Ծavalneri grancum (actualData)
    const filteredRows = actualData
        ? rows.filter(r => {
            const entry = actualData[r._id];
            return entry && (parseFloat(entry.quantity) > 0 || parseFloat(entry.unitPrice) > 0);
        })
        : rows;
    const sections = Array.from(new Set(filteredRows.map(r => r.sectionName || '—')));

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1, flexShrink: 0 }}>
                {selectedRow ? (
                    <>
                        <IconButton size='small' onClick={() => setSelectedRow(null)} sx={{ color: mainPrimaryColor, mr: 0.5 }}>
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: mainPrimaryColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedRow.laborOfferItemName || selectedRow.catalogName}
                        </Typography>
                    </>
                ) : (
                    <>
                        <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 22, flexShrink: 0 }} />
                        Աշխատավարձի ծախսագրում
                    </>
                )}
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selectedRow ? (
                    /* STEP 1: pick a work */
                    <Box sx={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                            </Box>
                        ) : filteredRows.length === 0 ? (
                            <Typography sx={{ color: '#aaa', py: 4, textAlign: 'center', px: 2 }}>{t('No sections found')}</Typography>
                        ) : sections.map(secName => (
                            <Box key={secName} sx={{ mb: 1 }}>
                                <Box sx={{ bgcolor: '#e6f7f9', px: 2, py: 1, borderLeft: `4px solid ${mainPrimaryColor}` }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: mainPrimaryColor }}>{secName}</Typography>
                                </Box>
                                {filteredRows.filter(r => (r.sectionName || '—') === secName).map(row => (
                                    <Box key={String(row._id)} onClick={() => { setSelectedRow(row); setType('druqayin'); setVal1(''); setVal2(''); }}
                                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', borderTop: '1px solid #f0fbfc', '&:hover': { bgcolor: '#f2fcfd' } }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: '0.83rem', color: '#222', fontWeight: 500 }}>
                                                {row.laborOfferItemName || row.catalogName || '—'}
                                            </Typography>
                                            {row.unitSymbol ? <Typography sx={{ fontSize: '0.74rem', color: '#888', mt: 0.2 }}>{row.unitSymbol}</Typography> : null}
                                        </Box>
                                        <ChevronRightIcon sx={{ fontSize: 18, color: '#ccc' }} />
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                ) : (
                    /* STEP 2: choose type and enter values */
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
                        <RadioGroup row value={type} onChange={ev => { setType(ev.target.value as SalaryType); setVal1(''); setVal2(''); }}>
                            <FormControlLabel value='druqayin' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Դրույքային</Typography>} />
                            <FormControlLabel value='gorcarqayin' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Գործարքային</Typography>} />
                            <FormControlLabel value='miavorzham' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Միավոր/ժամ</Typography>} />
                        </RadioGroup>
                        {type === 'druqayin' && <NumInput autoFocus label='Դրույքային' value={val1} onChange={setVal1} />}
                        {type === 'gorcarqayin' && <>
                            <NumInput autoFocus label='Քանակ' value={val1} onChange={setVal1} />
                            <NumInput label='Միավորի արժեքը' value={val2} onChange={setVal2} />
                        </>}
                        {type === 'miavorzham' && <>
                            <NumInput autoFocus label='1 ժamvа дрuyqачафа' value={val1} onChange={setVal1} />
                            <NumInput label='Жамери qаnaq' value={val2} onChange={setVal2} />
                        </>}
                        {canAdd && type !== 'druqayin' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Typography sx={{ fontSize: '0.82rem', color: '#777' }}>
                                    Ընդհանուր: <strong style={{ color: mainPrimaryColor }}>{(n1 * n2).toLocaleString()} AMD</strong>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, flexShrink: 0, gap: 1 }}>
                <Button onClick={handleClose} sx={{ borderRadius: '20px', color: '#888' }}>Չեղարկել</Button>
                {selectedRow && (
                    <Button variant='contained' onClick={handleAdd} disabled={!canAdd}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                    >Պահպանել</Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
