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

interface Props {
    entries: AylEntry[];
    onChange: (entries: AylEntry[]) => void;
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

const COLS = '1fr 90px 140px 120px 120px 88px';

export default function PahestAylMaterials({ entries, onChange }: Props) {
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

    const remove = (id: string) => onChange(entries.filter(e => e.id !== id));

    const handlePlusConfirm = () => {
        if (!plusEntry) return;
        const qty = parseFloat(plusQtyInput.replace(',', '.')) || 0;
        const now = new Date();
        onChange(entries.map(e => {
            if (e.id !== plusEntry.id) return e;
            const updates: Partial<AylEntry> & { history?: AylHistoryRecord[] } = {};
            if (qty > 0) {
                updates.mutq = e.mutq + qty;
                updates.history = [...e.history, { quantity: qty, addedAt: now }];
            }
            if (plusPriceInput.trim() !== '') updates.costPerUnit = plusPriceInput.trim();
            return { ...e, ...updates };
        }));
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
                        {[t('Material'), t('Unit'), 'Միավորի արժեք', 'Մուտքագրված', 'Ծախսագրված', ''].map((h, i) => (
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
                            <InputBase
                                value={e.tsakh}
                                onChange={ev => update(e.id, 'tsakh', ev.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                inputProps={{ style: { textAlign: 'center', padding: 0 } }}
                                sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#555' }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title={t('Add')}>
                                    <IconButton size='small' onClick={() => { setPlusEntry(e); setPlusQtyInput(''); setPlusPriceInput(''); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('History')}>
                                    <IconButton size='small' onClick={() => setHistoryEntryId(e.id)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <HistoryIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('Remove')}>
                                    <IconButton size='small' onClick={() => remove(e.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
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
            <Dialog open={!!historyEntry} onClose={() => setHistoryEntryId(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <HistoryIcon sx={{ fontSize: 20, flexShrink: 0, mt: '2px' }} />
                    <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: '#000' }}>{historyEntry?.name || '—'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    {!historyEntry || historyEntry.history.length === 0 ? (
                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', py: 2 }}>{t('No history yet.')}</Typography>
                    ) : (
                        <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 36px', bgcolor: '#edf9fb', px: 2, py: 1.5, columnGap: 1 }}>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: mainPrimaryColor }}>Մուտքագրված</Typography>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right' }}>{t('Date Added')}</Typography>
                                <Box />
                            </Box>
                            {historyEntry.history.map((rec, i) => (
                                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 36px', px: 2, py: 0.8, columnGap: 1, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor }}>
                                        {rec.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#aaa', textAlign: 'right' }}>
                                        {(rec.addedAt instanceof Date ? rec.addedAt : new Date(rec.addedAt)).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </Typography>
                                    <Tooltip title={t('Remove')}>
                                        <IconButton size='small' onClick={() => deleteHistoryRecord(historyEntry.id, i)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.3 }}>
                                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ))}
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
