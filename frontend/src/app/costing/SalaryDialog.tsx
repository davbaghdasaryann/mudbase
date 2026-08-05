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

type SalaryType = 'gorcarqayin' | 'miavorzham';

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

type SnapshotData = { laborRows: LaborRow[] };

interface Props {
    open: boolean;
    onClose: () => void;
    estimate: EstimatesApi.ApiEstimate;
    estimateSnapshot?: SnapshotData | null;
    unforeseenEstimate?: EstimatesApi.ApiEstimate | null;
    unforeseenSnapshot?: SnapshotData | null;
    onEntrySaved: (entry: CostHistoryEntry, replaceId?: string) => void;
    actualData?: Record<string, { quantity: string; unitPrice: string }>;
    costHistory?: CostHistoryEntry[];
}

const INPUT_SX = { border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, cursor: 'text', transition: 'border-color 0.15s', '&:focus-within': { borderColor: '#00ABBE' } };

function NumInput({ label, value, onChange, autoFocus, unit = 'AMD' }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean; unit?: string }) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    return (
        <Box sx={INPUT_SX} onClick={() => inputRef.current?.focus()}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', flex: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InputBase autoFocus={autoFocus} value={value} inputRef={inputRef}
                    onChange={ev => onChange(ev.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder='0'
                    inputProps={{ style: { textAlign: 'right', width: 110, padding: 0, fontSize: '0.92rem', fontWeight: 600, color: '#333' } }}
                />
                {unit && <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>{unit}</Typography>}
            </Box>
        </Box>
    );
}
export default function SalaryDialog({ open, onClose, estimate, estimateSnapshot, unforeseenEstimate, unforeseenSnapshot, onEntrySaved, actualData, costHistory }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [ufRows, setUfRows] = useState<LaborRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<LaborRow | null>(null);
    const [type, setType] = useState<SalaryType>('gorcarqayin');
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [notes, setNotes] = useState('');
    const [workVolume, setWorkVolume] = useState('');

    useEffect(() => {
        if (!open) { setSelectedRow(null); return; }
        setSelectedRow(null); setType('gorcarqayin'); setVal1(''); setVal2(''); setNotes(''); setWorkVolume('');
        const ufId = unforeseenEstimate ? toId(unforeseenEstimate._id) : '';
        if (estimateSnapshot) {
            setRows(estimateSnapshot.laborRows);
            if (unforeseenSnapshot) {
                setUfRows(unforeseenSnapshot.laborRows ?? []);
            } else if (ufId) {
                Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId: ufId } })
                    .then(data => setUfRows(data ?? [])).catch(console.error);
            } else {
                setUfRows([]);
            }
            return;
        }
        const estimateId = toId(estimate?._id);
        if (!estimateId) return;
        setLoading(true);
        const fetches: Promise<void>[] = [
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } })
                .then(data => setRows(data ?? [])).catch(console.error),
        ];
        if (ufId) {
            fetches.push(
                Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId: ufId } })
                    .then(data => setUfRows(data ?? [])).catch(console.error)
            );
        } else {
            setUfRows([]);
        }
        Promise.all(fetches).finally(() => setLoading(false));
    }, [open, estimate, estimateSnapshot, unforeseenEstimate, unforeseenSnapshot]);

    const handleClose = () => { setSelectedRow(null); onClose(); };
    const n1 = parseFloat(val1.replace(',', '.')) || 0;
    const n2 = parseFloat(val2.replace(',', '.')) || 0;
    const computedTotal = n1 * n2;
    const canAdd = computedTotal > 0;

    const getSalaryCoveredQty = (rowId: string) =>
        (costHistory ?? []).filter(e => e.laborItemId === rowId && e.paymentMethod === 'salary_gorcarqayin').reduce((s, e) => s + e.quantity, 0);

    const handleAdd = () => {
        if (!canAdd || !selectedRow) return;
        const entry: CostHistoryEntry = {
            id: String(Date.now() + Math.random()),
            workName: selectedRow.laborOfferItemName || selectedRow.catalogName || '—',
            laborItemId: selectedRow._id,
            unit: selectedRow.unitSymbol || '',
            quantity: n1,
            unitPrice: n2,
            total: computedTotal,
            addedAt: new Date(),
            paymentMethod: 'salary_' + type,
            note: notes.trim() || undefined,
            workVolume: type === 'miavorzham' && parseFloat(workVolume.replace(',', '.')) > 0 ? parseFloat(workVolume.replace(',', '.')) : undefined,
        };
        onEntrySaved(entry);
        handleClose();
    };

    const filteredRows = actualData
        ? rows.filter(r => { const e = actualData[r._id]; return e && parseFloat(e.quantity) > 0; })
        : rows;
    const filteredUfRows = actualData
        ? ufRows.filter(r => { const e = actualData[r._id]; return e && parseFloat(e.quantity) > 0; })
        : ufRows;
    const sections = Array.from(new Set(filteredRows.map(r => r.sectionName || '—')));

    const selectedCovered = selectedRow ? getSalaryCoveredQty(selectedRow._id) : 0;
    const selectedPlanned = selectedRow ? parseFloat(actualData?.[selectedRow._id]?.quantity || '0') || 0 : 0;
    const selectedRemaining = Math.max(0, selectedPlanned - selectedCovered);

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
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: mainPrimaryColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedRow.laborOfferItemName || selectedRow.catalogName}
                            </Typography>
                            {(selectedCovered > 0 || selectedPlanned > 0) && (
                                <Box sx={{ display: 'flex', gap: 2, mt: 0.3 }}>
                                    {selectedCovered > 0 && <Typography sx={{ fontSize: '0.72rem', color: mainPrimaryColor }}>Ծախսագրված: {selectedCovered.toLocaleString()} {selectedRow.unitSymbol}</Typography>}
                                    {selectedPlanned > 0 && selectedRemaining > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#e65100' }}>Մնացորդ: {selectedRemaining.toLocaleString()} {selectedRow.unitSymbol}</Typography>}
                                    {selectedPlanned > 0 && selectedRemaining <= 0 && <Typography sx={{ fontSize: '0.72rem', color: '#43a047' }}>✓ {t('Completed')}</Typography>}
                                </Box>
                            )}
                        </Box>
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
                    <Box sx={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                            </Box>
                        ) : filteredRows.length === 0 ? (
                            <Typography sx={{ color: '#aaa', py: 4, textAlign: 'center', px: 2 }}>{t('No sections found')}</Typography>
                        ) : (
                            <Box>
                                {sections.map(secName => (
                                    <Box key={secName} sx={{ mb: 1 }}>
                                        <Box sx={{ bgcolor: '#e6f7f9', px: 2, py: 1, borderLeft: `4px solid ${mainPrimaryColor}` }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: mainPrimaryColor }}>{secName}</Typography>
                                        </Box>
                                        {filteredRows.filter(r => (r.sectionName || '—') === secName).map(row => {
                                            const planned = parseFloat(actualData?.[row._id]?.quantity || '0') || 0;
                                            const covered = getSalaryCoveredQty(row._id);
                                            const remaining = Math.max(0, planned - covered);
                                            const done = planned > 0 && remaining <= 0;
                                            return (
                                                <Box key={String(row._id)} onClick={() => { setSelectedRow(row); setType('gorcarqayin'); setVal1(''); setVal2(''); setNotes(''); setWorkVolume(''); }}
                                                    sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', borderTop: '1px solid #f0fbfc', '&:hover': { bgcolor: '#f2fcfd' } }}
                                                >
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontSize: '0.83rem', color: done ? '#43a047' : '#222', fontWeight: 500 }}>
                                                            {row.laborOfferItemName || row.catalogName || '—'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.3, flexWrap: 'wrap' }}>
                                                            {planned > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>Չափագրված: {planned.toLocaleString()} {row.unitSymbol}</Typography>}
                                                            {covered > 0 && <Typography sx={{ fontSize: '0.72rem', color: mainPrimaryColor }}>Ծախսագրված: {covered.toLocaleString()} {row.unitSymbol}</Typography>}
                                                            {planned > 0 && remaining > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#e65100' }}>Մնացորդ: {remaining.toLocaleString()} {row.unitSymbol}</Typography>}
                                                        </Box>
                                                    </Box>
                                                    <ChevronRightIcon sx={{ fontSize: 18, color: done ? '#43a047' : '#ccc' }} />
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ))}
                                {filteredUfRows.length > 0 && (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, mb: 1, px: 1 }}>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e65100', whiteSpace: 'nowrap' }}>Չնախատեսված աշխատանքներ</Typography>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                        </Box>
                                        {Array.from(new Set(filteredUfRows.map(r => r.sectionName || '—'))).map(secName => (
                                            <Box key={'uf-' + secName} sx={{ mb: 1 }}>
                                                <Box sx={{ bgcolor: '#fff3ee', px: 2, py: 1, borderLeft: '4px solid #e65100' }}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#e65100' }}>{secName}</Typography>
                                                </Box>
                                                {filteredUfRows.filter(r => (r.sectionName || '—') === secName).map(row => {
                                                    const planned = parseFloat(actualData?.[row._id]?.quantity || '0') || 0;
                                                    const covered = getSalaryCoveredQty(row._id);
                                                    const remaining = Math.max(0, planned - covered);
                                                    const done = planned > 0 && remaining <= 0;
                                                    return (
                                                    <Box key={String(row._id)} onClick={() => { setSelectedRow(row); setType('gorcarqayin'); setVal1(''); setVal2(''); setNotes(''); setWorkVolume(''); }}
                                                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', borderTop: '1px solid #f0fbfc', '&:hover': { bgcolor: '#fff8f4' } }}
                                                    >
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography sx={{ fontSize: '0.83rem', color: done ? '#43a047' : '#222', fontWeight: 500 }}>
                                                                {row.laborOfferItemName || row.catalogName || '—'}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.3, flexWrap: 'wrap' }}>
                                                                {planned > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>Չափագրված: {planned.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                {covered > 0 && <Typography sx={{ fontSize: '0.72rem', color: mainPrimaryColor }}>Ծախսագրված: {covered.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                {planned > 0 && remaining > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#e65100' }}>Մնացորդ: {remaining.toLocaleString()} {row.unitSymbol}</Typography>}
                                                            </Box>
                                                        </Box>
                                                        <ChevronRightIcon sx={{ fontSize: 18, color: done ? '#43a047' : '#ccc' }} />
                                                    </Box>
                                                    );
                                                })}
                                            </Box>
                                        ))}
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
                        <RadioGroup row value={type} onChange={ev => { setType(ev.target.value as SalaryType); setVal1(''); setVal2(''); }}>
                            <FormControlLabel value='gorcarqayin' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>Գործարքային</Typography>} />
                            <FormControlLabel value='miavorzham' control={<Radio size='small' sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }} />} label={<Typography sx={{ fontSize: '0.82rem' }}>ժամավճարային</Typography>} />
                        </RadioGroup>
                        {type === 'gorcarqayin' && <>
                            <NumInput autoFocus label='Քանակը' value={val1} onChange={setVal1} unit={selectedRow?.unitSymbol || ''} />
                            <NumInput label='Միավորի արժեքը' value={val2} onChange={setVal2} />
                        </>}
                        {type === 'miavorzham' && <>
                            <NumInput autoFocus label='1 ժամվա դրույքաչափ' value={val1} onChange={setVal1} />
                            <NumInput label='ժամերի քանակը' value={val2} onChange={setVal2} />
                        </>}
                        {type === 'miavorzham' && <NumInput label='Աշխատանքային ծավալ' value={workVolume} onChange={setWorkVolume} unit={selectedRow?.unitSymbol || ''} />}
                        <Box sx={{ ...INPUT_SX, alignItems: 'flex-start', flexDirection: 'column', gap: 0.5 }} onClick={() => document.getElementById('salary-notes-input')?.focus()}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#999', fontWeight: 600 }}>Նշումներ</Typography>
                            <InputBase
                                id='salary-notes-input'
                                value={notes}
                                onChange={ev => setNotes(ev.target.value)}
                                placeholder='...'
                                multiline
                                minRows={2}
                                maxRows={5}
                                fullWidth
                                inputProps={{ style: { fontSize: '0.88rem', color: '#333', padding: 0, lineHeight: 1.5 } }}
                            />
                        </Box>
        {canAdd && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Typography sx={{ fontSize: '0.82rem', color: '#777' }}>
                                    {t('Total')}: <strong style={{ color: mainPrimaryColor }}>{(n1 * n2).toLocaleString()} AMD</strong>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, flexShrink: 0, gap: 1 }}>
                <Button onClick={handleClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                {selectedRow && (
                    <Button variant='contained' onClick={handleAdd} disabled={!canAdd}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}>{t('Save')}</Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
