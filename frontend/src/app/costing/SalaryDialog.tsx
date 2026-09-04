'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, Radio, RadioGroup,
    FormControlLabel, InputBase, IconButton, Collapse, Divider,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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
    subsectionName?: string;
    isGroupRow?: boolean;
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
    const [parentGroupRow, setParentGroupRow] = useState<LaborRow | null>(null);
    const [type, setType] = useState<SalaryType>('gorcarqayin');
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [notes, setNotes] = useState('');
    const [workVolume, setWorkVolume] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
    const [groupChildren, setGroupChildren] = useState<Record<string, LaborRow[]>>({});
    const [openedSecs, setOpenedSecs] = useState<Set<string>>(new Set());
    const [openedSubs, setOpenedSubs] = useState<Set<string>>(new Set());
    const toggleSec = (id: string) => setOpenedSecs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleSub = (id: string) => setOpenedSubs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const handleGroupToggle = async (e: React.MouseEvent, gid: string, row: LaborRow) => {
        e.stopPropagation();
        if (expandedGroups.has(gid)) {
            setExpandedGroups(prev => { const s = new Set(prev); s.delete(gid); return s; });
            return;
        }
        setExpandedGroups(prev => new Set([...prev, gid]));
        if (groupChildren[gid]) return;
        setLoadingGroups(prev => new Set([...prev, gid]));
        try {
            const children = await Api.requestSession<any[]>({ command: 'estimate/fetch_group_works', args: { parentGroupRowId: gid } });
            const mapped: LaborRow[] = (children ?? []).map(c => ({
                _id: typeof c._id === 'object' && (c._id as any).$oid ? (c._id as any).$oid : String(c._id),
                catalogName: '',
                laborOfferItemName: c.laborOfferItemName || c.catalogName || '',
                unitSymbol: c.itemMeasurementUnit || '',
                quantity: c.quantity || 0,
                sectionName: row.sectionName,
                subsectionName: row.subsectionName,
            }));
            setGroupChildren(prev => ({ ...prev, [gid]: mapped }));
        } finally {
            setLoadingGroups(prev => { const s = new Set(prev); s.delete(gid); return s; });
        }
    };

    useEffect(() => {
        if (!open) { setSelectedRow(null); setParentGroupRow(null); return; }
        setSelectedRow(null); setParentGroupRow(null); setType('gorcarqayin'); setVal1(''); setVal2(''); setNotes(''); setWorkVolume('');
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


    const handleClose = () => { setSelectedRow(null); setParentGroupRow(null); onClose(); };
    const n1 = parseFloat(val1.replace(',', '.')) || 0;
    const n2 = parseFloat(val2.replace(',', '.')) || 0;
    const computedTotal = n1 * n2;
    const canAdd = computedTotal > 0;

    const getSalaryCoveredQty = (rowId: string) =>
        (costHistory ?? []).filter(e => e.laborItemId === rowId && e.paymentMethod === 'salary_gorcarqayin').reduce((s, e) => s + e.quantity, 0);

    const handleAdd = () => {
        if (!canAdd || !selectedRow) return;
        const billingRow = parentGroupRow ?? selectedRow;
        const entry: CostHistoryEntry = {
            id: String(Date.now() + Math.random()),
            workName: selectedRow.laborOfferItemName || selectedRow.catalogName || billingRow.laborOfferItemName || billingRow.catalogName || '—',
            laborItemId: billingRow._id,
            groupName: parentGroupRow ? (parentGroupRow.laborOfferItemName || parentGroupRow.catalogName || undefined) : undefined,
            unit: billingRow.unitSymbol || '',
            quantity: n1,
            unitPrice: n2,
            total: computedTotal,
            addedAt: new Date(),
            paymentMethod: 'salary_' + type,
            note: notes.trim() || undefined,
            workVolume: type === 'miavorzham' && parseFloat(workVolume.replace(',', '.')) > 0 ? parseFloat(workVolume.replace(',', '.')) : undefined,
        };
        onEntrySaved(entry);
        // Return to list instead of closing, so user can add more entries
        setSelectedRow(null); setParentGroupRow(null); setType('gorcarqayin'); setVal1(''); setVal2(''); setNotes(''); setWorkVolume('');
    };

    const allRows = rows;
    const allUfRows = ufRows;
    const filteredRows = actualData
        ? allRows.filter(r => { const e = actualData[r._id]; return e && parseFloat(e.quantity) > 0; })
        : allRows;
    const filteredUfRows = actualData
        ? allUfRows.filter(r => { const e = actualData[r._id]; return e && parseFloat(e.quantity) > 0; })
        : allUfRows;
    const sections = Array.from(new Set(filteredRows.map(r => r.sectionName || '—')));

    const billingRow = parentGroupRow ?? selectedRow;
    const selectedCovered = billingRow ? getSalaryCoveredQty(billingRow._id) : 0;
    const selectedPlanned = billingRow ? parseFloat(actualData?.[billingRow._id]?.quantity || '0') || 0 : 0;
    const selectedRemaining = Math.max(0, selectedPlanned - selectedCovered);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh' } }}
        >
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0, flexShrink: 0 }}>
                {selectedRow ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size='small' onClick={() => { setSelectedRow(null); setParentGroupRow(null); }} sx={{ color: mainPrimaryColor, mr: 0.5 }}>
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <IconButton size='small' onClick={handleClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(21,101,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20, color: '#1565c0' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Աշխատավարձի ծախսագրում</Typography>
                        </Box>
                        <IconButton size='small' onClick={handleClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                )}
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

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
                                {sections.map(secName => {
                                    const secRows = filteredRows.filter(r => (r.sectionName || '—') === secName);
                                    const subsecNames = Array.from(new Set(secRows.map(r => r.subsectionName || '—')));
                                    const hasMultipleSubs = subsecNames.length > 1 || (subsecNames.length === 1 && subsecNames[0] !== '—');
                                    return (
                                    <Box key={secName} sx={{ mb: 1, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                                        <Box onClick={() => toggleSec(secName)} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', px: 2, py: 1, borderLeft: `3px solid ${mainPrimaryColor}`, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#efefef' } }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#333', flex: 1 }}>{secName}</Typography>
                                            <ExpandMoreIcon sx={{ fontSize: 17, color: '#999', transition: 'transform 0.2s', transform: openedSecs.has(secName) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                        </Box>
                                        <Collapse in={openedSecs.has(secName)}>
                                        {subsecNames.map(subName => {
                                            const subKey = secName + '|' + subName;
                                            return (
                                            <Box key={subName} sx={{ borderTop: '1px solid #f0f0f0' }}>
                                                {hasMultipleSubs && (
                                                    <Box onClick={() => toggleSub(subKey)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.7, bgcolor: '#fafafa', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#f3f3f3' } }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#555', flex: 1 }}>{subName}</Typography>
                                                        <ExpandMoreIcon sx={{ fontSize: 15, color: '#bbb', transition: 'transform 0.2s', transform: openedSubs.has(subKey) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                                    </Box>
                                                )}
                                                <Collapse in={!hasMultipleSubs || openedSubs.has(subKey)}>
                                                {secRows.filter(r => (r.subsectionName || '—') === subName).map(row => {
                                                    const gid = toId(row._id);
                                                    const planned = parseFloat(actualData?.[gid]?.quantity || '0') || 0;
                                                    const covered = getSalaryCoveredQty(gid);
                                                    const remaining = Math.max(0, planned - covered);
                                                    const isExpanded = row.isGroupRow && expandedGroups.has(gid);
                                                    const isLoadingG = row.isGroupRow && loadingGroups.has(gid);
                                                    const children = row.isGroupRow ? (groupChildren[gid] ?? []) : [];
                                                    const selectRow = (r: LaborRow, parent?: LaborRow) => { setSelectedRow(r); setParentGroupRow(parent ?? null); setType('gorcarqayin'); setVal1(''); setVal2(''); setNotes(''); setWorkVolume(''); };
                                                    return (
                                                        <React.Fragment key={gid}>
                                                        <Box
                                                            onClick={row.isGroupRow ? (e) => handleGroupToggle(e, gid, row) : () => selectRow(row)}
                                                            sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', borderTop: '1px solid #f0fbfc', '&:hover': { bgcolor: '#f2fcfd' } }}
                                                        >
                                                            {row.isGroupRow && (
                                                                <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                                                                    {isLoadingG ? <CircularProgress size={12} sx={{ color: mainPrimaryColor }} /> : isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16, color: mainPrimaryColor }} /> : <ChevronRightIcon sx={{ fontSize: 16, color: mainPrimaryColor }} />}
                                                                </Box>
                                                            )}
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography sx={{ fontSize: '0.83rem', color: '#222', fontWeight: row.isGroupRow ? 600 : 500 }}>
                                                                    {row.laborOfferItemName || row.catalogName || '—'}
                                                                </Typography>
                                                                {!row.isGroupRow && (
                                                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.3, flexWrap: 'wrap' }}>
                                                                        {planned > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>Չափագրված: {planned.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                        {covered > 0 && <Typography sx={{ fontSize: '0.72rem', color: mainPrimaryColor }}>Ծախսագրված: {covered.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                        {planned > 0 && remaining > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#e65100' }}>Մնացորդ: {remaining.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                            {!row.isGroupRow && (
                                                                <IconButton size='small' sx={{ p: 0.3, color: '#ccc', '&:hover': { color: mainPrimaryColor } }} onClick={e => { e.stopPropagation(); selectRow(row); }}>
                                                                    <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                        {isExpanded && children.map((child, ci) => (
                                                            <Box key={toId(child._id)} onClick={() => selectRow(child, row)}
                                                                sx={{ display: 'flex', alignItems: 'center', pl: 4, pr: 2, py: 0.8, borderTop: '1px solid #f0fbfc', bgcolor: ci % 2 === 0 ? '#f8feff' : '#f3fbfc', borderLeft: `3px solid ${mainPrimaryColor}22`, cursor: 'pointer', '&:hover': { bgcolor: '#eef9fb' } }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>{child.laborOfferItemName || child.catalogName || '—'}</Typography>
                                                                    {child.quantity > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#aaa' }}>{child.quantity.toLocaleString()} {child.unitSymbol}</Typography>}
                                                                </Box>
                                                                <IconButton size='small' sx={{ p: 0.3, color: '#ccc', '&:hover': { color: mainPrimaryColor } }} onClick={e => { e.stopPropagation(); selectRow(child, row); }}>
                                                                    <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                </Collapse>
                                            </Box>
                                            );
                                        })}
                                        </Collapse>
                                    </Box>
                                    );
                                })}
                                {filteredUfRows.length > 0 && (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, mb: 1, px: 1 }}>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e65100', whiteSpace: 'nowrap' }}>Չնախատեսված աշխատանքներ</Typography>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                        </Box>
                                        {Array.from(new Set(filteredUfRows.map(r => r.sectionName || '—'))).map(secName => (
                                            <Box key={'uf-' + secName} sx={{ mb: 1, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                                                <Box onClick={() => toggleSec('uf-' + secName)} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', px: 2, py: 1, borderLeft: '3px solid #e65100', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#efefef' } }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#333', flex: 1 }}>{secName}</Typography>
                                                    <ExpandMoreIcon sx={{ fontSize: 17, color: '#999', transition: 'transform 0.2s', transform: openedSecs.has('uf-' + secName) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                                </Box>
                                                <Collapse in={openedSecs.has('uf-' + secName)}>
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
                                                            <Typography sx={{ fontSize: '0.83rem', color: '#222', fontWeight: 500 }}>
                                                                {row.laborOfferItemName || row.catalogName || '—'}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.3, flexWrap: 'wrap' }}>
                                                                {planned > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>Չափագրված: {planned.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                {covered > 0 && <Typography sx={{ fontSize: '0.72rem', color: mainPrimaryColor }}>Ծախսագրված: {covered.toLocaleString()} {row.unitSymbol}</Typography>}
                                                                {planned > 0 && remaining > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#e65100' }}>Մնացորդ: {remaining.toLocaleString()} {row.unitSymbol}</Typography>}
                                                            </Box>
                                                        </Box>
                                                        <IconButton size='small' sx={{ p: 0.3, color: '#ccc', '&:hover': { color: '#e65100' } }} onClick={e => e.stopPropagation()}>
                                                            <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                                        </IconButton>
                                                    </Box>
                                                    );
                                                })}
                                                </Collapse>
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
