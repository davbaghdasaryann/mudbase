'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Button, Typography, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputBase, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

interface MaterialOption {
    materialItemId: string;
    name: string;
    fullCode: string;
    unit: string;
    estimateQuantity: number;
    costPerUnit: number;
}

export interface PahestHistoryRecord {
    quantity: number;
    costPerUnit: number;
    addedAt: Date;
}

export interface PahestEntry {
    materialItemId: string;
    name: string;
    unit: string;
    quantity: number;
    costedQuantity?: number;
    estimateQuantity: number;
    costPerUnit: number;
    addedAt: Date;
    history: PahestHistoryRecord[];
}

interface Props {
    estimateId: string;
    entries: PahestEntry[];
    onChange: (entries: PahestEntry[]) => void;
}

function toIdStr(id: unknown): string {
    if (id == null) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && 'oid' in (id as any)) return (id as any).oid;
    return String(id);
}

export default function PahestMainMaterials({ estimateId, entries, onChange }: Props) {
    const { t } = useTranslation();
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<MaterialOption | null>(null);
    const [qtyInput, setQtyInput] = useState('');
    const [addPriceInput, setAddPriceInput] = useState('');

    const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
    const historyEntry = historyEntryId ? (entries.find(e => e.materialItemId === historyEntryId) ?? null) : null;

    const [plusEntry, setPlusEntry] = useState<PahestEntry | null>(null);
    const [plusQtyInput, setPlusQtyInput] = useState('');
    const [plusPriceInput, setPlusPriceInput] = useState('');

    useEffect(() => {
        setLoading(true);
        Api.requestSession<any[]>({
            command: 'estimate/fetch_materials_list',
            args: { estimateId },
        }).then(items => {
            const seen = new Set<string>();
            const rows: MaterialOption[] = [];
            for (const item of items) {
                const id = toIdStr(item.materialItemId);
                if (!id || seen.has(id)) continue;
                seen.add(id);
                const md = item.estimateMaterialItemData?.[0];
                rows.push({
                    materialItemId: id,
                    name: md?.name || '—',
                    fullCode: md?.fullCode || '',
                    unit: item.estimateMeasurementUnitData?.[0]?.representationSymbol || '',
                    estimateQuantity: item.quantity ?? 0,
                    costPerUnit: md?.averagePrice ?? 0,
                });
            }
            setMaterials(rows);
        }).catch(console.error).finally(() => setLoading(false));
    }, [estimateId]);

    const openAdd = () => {
        setSearch('');
        setSelected(null);
        setQtyInput('');
        setAddPriceInput('');
        setAddOpen(true);
    };

    const handleConfirm = () => {
        if (!selected || !qtyInput) return;
        const qty = parseFloat(qtyInput.replace(',', '.')) || 0;
        if (qty <= 0) return;
        const now = new Date();
        const enteredPrice = parseFloat(addPriceInput.replace(',', '.'));
        const unitPrice = !isNaN(enteredPrice) && addPriceInput.trim() !== '' ? enteredPrice : selected.costPerUnit;
        const newRecord: PahestHistoryRecord = { quantity: qty, costPerUnit: unitPrice, addedAt: now };
        const existing = entries.findIndex(e => e.materialItemId === selected.materialItemId);
        if (existing >= 0) {
            const next = [...entries];
            next[existing] = {
                ...next[existing],
                quantity: next[existing].quantity + qty,
                addedAt: now,
                history: [...next[existing].history, newRecord],
            };
            onChange(next);
        } else {
            onChange([...entries, {
                materialItemId: selected.materialItemId,
                name: selected.name,
                unit: selected.unit,
                quantity: qty,
                estimateQuantity: selected.estimateQuantity,
                costPerUnit: unitPrice,
                addedAt: now,
                history: [newRecord],
            }]);
        }
        setAddOpen(false);
    };

    const handlePlusConfirm = () => {
        if (!plusEntry) return;
        const qty = parseFloat(plusQtyInput.replace(',', '.')) || 0;
        const price = parseFloat(plusPriceInput.replace(',', '.'));
        const now = new Date();
        const idx = entries.findIndex(e => e.materialItemId === plusEntry.materialItemId);
        if (idx < 0) return;
        const next = [...entries];
        const newCostPerUnit = !isNaN(price) && plusPriceInput.trim() !== '' ? price : next[idx].costPerUnit;
        const patch: Partial<PahestEntry> & { history?: PahestHistoryRecord[]; addedAt?: Date } = {};
        if (qty > 0) {
            patch.quantity = next[idx].quantity + qty;
            patch.history = [...next[idx].history, { quantity: qty, costPerUnit: newCostPerUnit, addedAt: now }];
            patch.addedAt = now;
        }
        if (!isNaN(price) && plusPriceInput.trim() !== '') patch.costPerUnit = price;
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
        setPlusEntry(null);
        setPlusQtyInput('');
        setPlusPriceInput('');
    };

    const handleDelete = (materialItemId: string) => {
        onChange(entries.filter(e => e.materialItemId !== materialItemId));
    };

    const deleteHistoryRecord = (materialItemId: string, recIdx: number) => {
        const idx = entries.findIndex(e => e.materialItemId === materialItemId);
        if (idx < 0) return;
        const entry = entries[idx];
        const rec = entry.history[recIdx];
        const newHistory = entry.history.filter((_, i) => i !== recIdx);
        if (newHistory.length === 0) {
            onChange(entries.filter(e => e.materialItemId !== materialItemId));
            setHistoryEntryId(null);
        } else {
            const next = [...entries];
            next[idx] = { ...next[idx], quantity: Math.max(0, entry.quantity - rec.quantity), history: newHistory };
            onChange(next);
        }
    };

    const filtered = materials.filter(m =>
        (m.name + m.fullCode).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={openAdd}
                    disabled={loading}
                    sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, fontSize: '14px', '&:hover': { bgcolor: 'rgba(0,171,190,0.06)' } }}
                >
                    {t('Add')}
                </Button>
            </Box>

            {entries.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, color: '#bbb' }}>
                    <Typography variant='body2' color='text.secondary'>{t('No materials added yet.')}</Typography>
                </Box>
            ) : (
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 90px 140px 120px 120px 88px', bgcolor: '#edf9fb', px: 2, py: 1.5, columnGap: 2 }}>
                        {[t('Material'), t('Unit'), t('Total'), 'Մուտքագրված', 'Ծախսագրված', ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', textAlign: i === 0 ? 'left' : 'center' }}>{h}</Typography>
                        ))}
                    </Box>
                    {entries.map((e, idx) => (
                        <Box key={e.materialItemId} sx={{ display: 'grid', gridTemplateColumns: '1fr 90px 140px 120px 120px 88px', px: 2, py: 0.8, columnGap: 2, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: idx % 2 === 0 ? '#fff' : '#fbfeff', '&:hover': { bgcolor: '#f2fcfd' } }}>
                            <Typography sx={{ fontSize: '0.9rem', color: '#222', fontWeight: 500 }}>{e.name}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>{e.unit}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#555', textAlign: 'center', fontWeight: (e.costPerUnit * e.quantity) > 0 ? 600 : 400 }}>{(e.costPerUnit * e.quantity) > 0 ? (e.costPerUnit * e.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor, textAlign: 'center' }}>
                                {e.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: (e.costedQuantity ?? 0) > 0 ? 700 : 400, color: (e.costedQuantity ?? 0) > 0 ? mainPrimaryColor : '#aaa', textAlign: 'center' }}>
                                {(e.costedQuantity ?? 0) > 0 ? (e.costedQuantity!).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title={t('Add')}>
                                    <IconButton size='small' onClick={() => { setPlusEntry(e); setPlusQtyInput(''); setPlusPriceInput(''); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('History')}>
                                    <IconButton size='small' onClick={() => setHistoryEntryId(e.materialItemId)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <HistoryIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('Remove')}>
                                    <IconButton size='small' onClick={() => handleDelete(e.materialItemId)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Add material modal */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3, minHeight: 480 } }}>
                <DialogTitle sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#111', pb: 1 }}><img src='/images/logo_square.svg' alt='M' width={24} height={24} style={{ position: 'absolute', left: 24 }} />Ավելացնել</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e0f5f7', borderRadius: 2, px: 1.5, mb: 1.5, backgroundColor: '#fafeff' }}>
                        <SearchIcon sx={{ color: '#aaa', mr: 1, fontSize: 18 }} />
                        <InputBase
                            placeholder={t('Search') + '...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ flex: 1, fontSize: '0.88rem', py: 0.5 }}
                            autoFocus
                        />
                    </Box>
                    <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e0f5f7', borderRadius: 2, mb: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress size={24} sx={{ color: mainPrimaryColor }} />
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Typography sx={{ px: 2, py: 2, fontSize: '0.85rem', color: '#aaa' }}>{t('No results')}</Typography>
                        ) : filtered.map(m => (
                            <Box
                                key={m.materialItemId}
                                onClick={() => { setSelected(m); setQtyInput(''); }}
                                sx={{
                                    px: 2, py: 1, fontSize: '0.85rem', cursor: 'pointer',
                                    borderBottom: '1px solid #f0fbfc',
                                    backgroundColor: selected?.materialItemId === m.materialItemId ? 'rgba(0,171,190,0.08)' : 'transparent',
                                    color: selected?.materialItemId === m.materialItemId ? mainPrimaryColor : '#333',
                                    fontWeight: selected?.materialItemId === m.materialItemId ? 600 : 400,
                                    '&:hover': { backgroundColor: 'rgba(0,171,190,0.06)' },
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                {m.name}
                                <Typography component='span' sx={{ ml: 1, fontSize: '0.78rem', color: '#888' }}>({m.unit})</Typography>
                            </Box>
                        ))}
                    </Box>
                    {selected && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>{t('Quantity')}</Typography>
                                <InputBase
                                    value={qtyInput}
                                    onChange={e => setQtyInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder='0'
                                    autoFocus
                                    sx={{ border: `1px solid ${mainPrimaryColor}`, borderRadius: '6px', px: 1.5, py: 0.5, width: '100%', fontSize: '0.88rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.15)' } }}
                                />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>Միավորի արժեք</Typography>
                                <InputBase
                                    value={addPriceInput}
                                    onChange={e => setAddPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder={selected.costPerUnit > 0 ? String(selected.costPerUnit) : '0'}
                                    sx={{ border: '1px solid #e0f5f7', borderRadius: '6px', px: 1.5, py: 0.5, width: '100%', fontSize: '0.88rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.15)' } }}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setAddOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        disabled={!selected || !qtyInput || parseFloat(qtyInput) <= 0}
                        onClick={handleConfirm}
                        sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                    >
                        {t('Add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Plus modal */}
            <Dialog open={!!plusEntry} onClose={() => setPlusEntry(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: '#111', pb: 1, fontSize: '0.95rem' }}>{plusEntry?.name}</DialogTitle>
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
                        {plusEntry && plusEntry.quantity > 0 && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.4 }}>
                                {t('Current')}: {plusEntry.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
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
                            placeholder={plusEntry ? (plusEntry.costPerUnit > 0 ? String(plusEntry.costPerUnit) : '0') : '0'}
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
                    <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: '#000' }}>{historyEntry?.name}</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    {!historyEntry || historyEntry.history.length === 0 ? (
                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', py: 2 }}>{t('No history yet.')}</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {historyEntry.history.map((rec, i) => {
                                const cpu = rec.costPerUnit ?? historyEntry.costPerUnit;
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
                                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#555' }}>{cpu > 0 ? cpu.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</Typography>
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
                                                <IconButton size='small' onClick={() => deleteHistoryRecord(historyEntry.materialItemId, i)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.3, alignSelf: 'flex-start' }}>
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
