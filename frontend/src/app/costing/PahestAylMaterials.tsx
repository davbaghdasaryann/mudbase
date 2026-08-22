'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, IconButton, Tooltip, InputBase,
    Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

interface UnitOption { value: string; label: string; }

export interface AylHistoryRecord {
    quantity: number;
    costPerUnit: string;
    addedAt: Date;
}

export interface AylEntry {
    id: string;
    name: string;
    unit: string;
    mutq: number;
    tsakh: string;
    costPerUnit: string;
    history: AylHistoryRecord[];
}

interface HistoryEntryInput { workName: string; unit: string; quantity: number; unitPrice: number; total: number; aylEntryId?: string; }

interface Props {
    entries: AylEntry[];
    onChange: (entries: AylEntry[]) => void;
    onHistoryEntry?: (e: HistoryEntryInput) => void;
    onRemoveEntry?: (aylEntryId: string) => void;
    costedAylIds?: Set<string>;
}

const newRow = (): AylEntry => ({
    id: String(Date.now() + Math.random()),
    name: '',
    unit: '',
    mutq: 0,
    tsakh: '',
    costPerUnit: '',
    history: [],
});

const COLS = '1fr 90px 140px 120px 120px 120px 88px';

export default function PahestAylMaterials({ entries, onChange, onHistoryEntry, onRemoveEntry, costedAylIds }: Props) {
    const { t } = useTranslation();
    const [units, setUnits] = useState<UnitOption[]>([]);
    const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
    const historyEntry = historyEntryId ? (entries.find(e => e.id === historyEntryId) ?? null) : null;

    const [plusEntry, setPlusEntry] = useState<AylEntry | null>(null);
    const [plusQtyInput, setPlusQtyInput] = useState('');
    const [plusPriceInput, setPlusPriceInput] = useState('');

    useEffect(() => {
        Api.requestSession<any[]>({ command: 'measurement_unit/fetch' })
            .then(data => setUnits(data.map(u => ({ value: u.representationSymbol, label: u.representationSymbol }))))
            .catch(console.error);
    }, []);

    const addRow = () => onChange([...entries, newRow()]);

    const update = (id: string, field: keyof AylEntry, val: string) =>
        onChange(entries.map(e => e.id === id ? { ...e, [field]: val } : e));

    const remove = (id: string) => { onChange(entries.filter(e => e.id !== id)); onRemoveEntry?.(id); };

    const handlePlusConfirm = () => {
        if (!plusEntry) return;
        const qty = parseFloat(plusQtyInput.replace(',', '.')) || 0;
        const now = new Date();
        const priceForRecord = plusPriceInput.trim() || plusEntry.costPerUnit;
        onChange(entries.map(e => {
            if (e.id !== plusEntry.id) return e;
            const updates: Partial<AylEntry> & { history?: AylHistoryRecord[] } = {};
            if (qty > 0) {
                updates.mutq = e.mutq + qty;
                updates.history = [...e.history, { quantity: qty, costPerUnit: priceForRecord, addedAt: now }];
            }
            if (plusPriceInput.trim() !== '') updates.costPerUnit = plusPriceInput.trim();
            return { ...e, ...updates };
        }));
        if (qty > 0) {
            const price = parseFloat(priceForRecord) || 0;
            onHistoryEntry?.({ workName: plusEntry.name || '—', unit: plusEntry.unit, quantity: qty, unitPrice: price, total: qty * price, aylEntryId: plusEntry.id });
        }
        setPlusEntry(null);
        setPlusQtyInput('');
        setPlusPriceInput('');
    };

    const deleteHistoryRecord = (entryId: string, recIdx: number) => {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return;
        const rec = entry.history[recIdx];
        const newHistory = entry.history.filter((_, i) => i !== recIdx);
        if (newHistory.length === 0) {
            onChange(entries.filter(e => e.id !== entryId));
            onRemoveEntry?.(entryId);
            setHistoryEntryId(null);
        } else {
            onChange(entries.map(e => e.id === entryId
                ? { ...e, mutq: Math.max(0, e.mutq - rec.quantity), history: newHistory }
                : e
            ));
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={addRow}
                    sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)' } }}
                >
                    {t('Add')}
                </Button>
            </Box>

            {entries.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                    <Typography variant='body2' color='text.secondary'>{t('No materials added yet.')}</Typography>
                </Box>
            ) : (
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: COLS, bgcolor: '#edf9fb', px: 2, py: 1.5, columnGap: 2 }}>
                        {[t('Material'), t('Unit'), 'Միավորի արժեք', 'Մուտքագրված', 'Ծախսագրված', 'Մնացորդ', ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', textAlign: i === 0 ? 'left' : 'center' }}>{h}</Typography>
                        ))}
                    </Box>
                    {entries.map((e, idx) => (
                        <Box key={e.id} sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.5, columnGap: 2, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: idx % 2 === 0 ? '#fff' : '#fbfeff', '&:hover': { bgcolor: '#f2fcfd' } }}>
                            <InputBase
                                value={e.name}
                                onChange={ev => update(e.id, 'name', ev.target.value)}
                                placeholder={t('Material Name') + '...'}
                                sx={{ fontSize: '0.9rem', color: '#222', '& input': { p: 0, pr: 1 } }}
                            />
                            <Select
                                value={e.unit}
                                onChange={ev => update(e.id, 'unit', ev.target.value)}
                                displayEmpty
                                size='small'
                                variant='standard'
                                disableUnderline
                                sx={{ fontSize: '0.9rem', color: e.unit ? '#888' : '#bbb', width: '100%', textAlign: 'center', '& .MuiSelect-select': { p: 0, pr: '18px !important', textAlign: 'center' } }}
                            >
                                <MenuItem value='' disabled sx={{ fontSize: '0.9rem', color: '#bbb' }}>{t('Unit')}</MenuItem>
                                {units.map(u => (
                                    <MenuItem key={u.value} value={u.value} sx={{ fontSize: '0.9rem' }}>{u.label}</MenuItem>
                                ))}
                            </Select>
                            <Typography sx={{ fontSize: '0.9rem', color: e.costPerUnit ? '#555' : '#bbb', textAlign: 'center' }}>
                                {e.costPerUnit || '—'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: e.mutq > 0 ? mainPrimaryColor : '#bbb', textAlign: 'center' }}>
                                {e.mutq > 0 ? e.mutq.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: (parseFloat(e.tsakh || '0') > 0) ? 700 : 400, color: parseFloat(e.tsakh || '0') > 0 ? mainPrimaryColor : '#aaa', textAlign: 'center' }}>
                                {parseFloat(e.tsakh || '0') > 0 ? parseFloat(e.tsakh).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: (e.mutq - parseFloat(e.tsakh || '0')) !== 0 ? 700 : 400, color: (e.mutq - parseFloat(e.tsakh || '0')) < 0 ? '#e53935' : (e.mutq - parseFloat(e.tsakh || '0')) > 0 ? '#555' : '#aaa', textAlign: 'center' }}>
                                {(e.mutq - parseFloat(e.tsakh || '0')) !== 0 ? (e.mutq - parseFloat(e.tsakh || '0')).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title={t('Add')}>
                                    <IconButton size='small' onClick={() => { setPlusEntry(e); setPlusQtyInput(''); setPlusPriceInput(''); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('History')}>
                                    <IconButton size='small' onClick={() => setHistoryEntryId(e.id)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <HistoryIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                {(() => { const isCosted = costedAylIds?.has(e.id); return (
                                <Tooltip title={isCosted ? 'Նախ ջնջի ծախսագրումը / Delete cost history first' : t('Remove')}>
                                    <span><IconButton size='small' disabled={isCosted} onClick={() => remove(e.id)} sx={{ color: isCosted ? '#e0e0e0' : '#ccc', '&:hover': { color: isCosted ? '#e0e0e0' : '#e53935' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton></span>
                                </Tooltip>
                                ); })()}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Plus modal */}
            <Dialog open={!!plusEntry} onClose={() => setPlusEntry(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: '#111', pb: 1, fontSize: '0.95rem' }}>{plusEntry?.name || '—'}</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.78rem', color: '#999', mb: 0.5 }}>Մուտքագրված</Typography>
                        <InputBase
                            autoFocus
                            fullWidth
                            value={plusQtyInput}
                            onChange={ev => setPlusQtyInput(ev.target.value.replace(/[^0-9.]/g, ''))}
                            onKeyDown={ev => { if (ev.key === 'Enter') handlePlusConfirm(); }}
                            placeholder='0'
                            sx={{ border: `1px solid ${mainPrimaryColor}`, borderRadius: '6px', px: 1.5, py: 0.6, fontSize: '0.9rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.12)' } }}
                        />
                        {plusEntry && plusEntry.mutq > 0 && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.4 }}>
                                {t('Current')}: {plusEntry.mutq.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                            </Typography>
                        )}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.78rem', color: '#999', mb: 0.5 }}>Միավորի արժեք</Typography>
                        <InputBase
                            fullWidth
                            value={plusPriceInput}
                            onChange={ev => setPlusPriceInput(ev.target.value.replace(/[^0-9.]/g, ''))}
                            onKeyDown={ev => { if (ev.key === 'Enter') handlePlusConfirm(); }}
                            placeholder={plusEntry?.costPerUnit || '0'}
                            sx={{ border: '1px solid #e0f5f7', borderRadius: '6px', px: 1.5, py: 0.6, fontSize: '0.9rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.12)' } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setPlusEntry(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={handlePlusConfirm}
                        disabled={!plusQtyInput && !plusPriceInput}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                    >
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* History dialog */}
            <Dialog open={!!historyEntry} onClose={() => setHistoryEntryId(null)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <HistoryIcon sx={{ fontSize: 20, flexShrink: 0, mt: '2px' }} />
                    <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: '#000' }}>{historyEntry?.name || '—'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    {!historyEntry || historyEntry.history.length === 0 ? (
                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', py: 2 }}>{t('No history yet.')}</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {historyEntry.history.map((rec, i) => {
                                const cpu = parseFloat(rec.costPerUnit) || 0;
                                const total = rec.quantity * cpu;
                                return (
                                    <Box key={i} sx={{ border: '1px solid #e0f5f7', borderRadius: 2, p: 1.5, bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#999', width: 100 }}>Մուտքագրված</Typography>
                                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor }}>{rec.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#999', width: 100 }}>Միավորի արժեք</Typography>
                                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#555' }}>{rec.costPerUnit || '—'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#999', width: 100 }}>{t('Total')}</Typography>
                                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#333' }}>{total > 0 ? total.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</Typography>
                                                </Box>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.3 }}>
                                                    {(rec.addedAt instanceof Date ? rec.addedAt : new Date(rec.addedAt)).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                </Typography>
                                            </Box>
                                            <Tooltip title={t('Remove')}>
                                                <IconButton size='small' onClick={() => deleteHistoryRecord(historyEntry.id, i)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.3, alignSelf: 'flex-start' }}>
                                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setHistoryEntryId(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Close')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
