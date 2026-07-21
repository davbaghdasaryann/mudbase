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
import CheckIcon from '@mui/icons-material/Check';
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
    addedAt: Date;
}

export interface PahestEntry {
    materialItemId: string;
    name: string;
    unit: string;
    quantity: number;
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

    // add sub-modal state
    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<MaterialOption | null>(null);
    const [qtyInput, setQtyInput] = useState('');

    // history dialog — store id so it stays in sync when entries update
    const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
    const historyEntry = historyEntryId ? (entries.find(e => e.materialItemId === historyEntryId) ?? null) : null;

    // inline edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQtyInput, setEditQtyInput] = useState('');

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
        setAddOpen(true);
    };

    const handleConfirm = () => {
        if (!selected || !qtyInput) return;
        const qty = parseFloat(qtyInput.replace(',', '.')) || 0;
        if (qty <= 0) return;
        const now = new Date();
        const newRecord: PahestHistoryRecord = { quantity: qty, addedAt: now };
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
                costPerUnit: selected.costPerUnit,
                addedAt: now,
                history: [newRecord],
            }]);
        }
        setAddOpen(false);
    };

    const startInlineEdit = (entry: PahestEntry) => {
        setEditingId(entry.materialItemId);
        setEditQtyInput('');
    };

    const confirmInlineEdit = (entry: PahestEntry) => {
        const qty = parseFloat(editQtyInput.replace(',', '.')) || 0;
        if (qty <= 0) { setEditingId(null); return; }
        const now = new Date();
        const newRecord: PahestHistoryRecord = { quantity: qty, addedAt: now };
        const idx = entries.findIndex(e => e.materialItemId === entry.materialItemId);
        if (idx < 0) return;
        const next = [...entries];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty, addedAt: now, history: [...next[idx].history, newRecord] };
        onChange(next);
        setEditingId(null);
        setEditQtyInput('');
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
            {/* Add button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant='outlined'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={openAdd}
                    disabled={loading}
                    sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, '&:hover': { bgcolor: 'rgba(0,171,190,0.06)' } }}
                >
                    {t('Add')}
                </Button>
            </Box>

            {/* Added items list */}
            {entries.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, color: '#bbb' }}>
                    <Typography variant='body2' color='text.secondary'>{t('No materials added yet.')}</Typography>
                </Box>
            ) : (
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
                    {/* Header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 110px 110px 72px', bgcolor: '#edf9fb', px: 2, py: 0.8 }}>
                        {[t('Material'), t('Unit'), 'Միավորի արժեք', 'Մուտքագրված', 'Ծախսագրված', ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: i === 0 ? 'left' : i < 5 ? 'right' : 'center' }}>{h}</Typography>
                        ))}
                    </Box>
                    {entries.map((e, idx) => (
                        <Box key={e.materialItemId} sx={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 110px 110px 72px', px: 2, py: 0.8, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: idx % 2 === 0 ? '#fff' : '#fbfeff', '&:hover': { bgcolor: '#f2fcfd' } }}>
                            <Typography sx={{ fontSize: '0.84rem', color: '#222', fontWeight: 500 }}>{e.name}</Typography>
                            <Typography sx={{ fontSize: '0.84rem', color: '#888', textAlign: 'right' }}>{e.unit}</Typography>
                            <Typography sx={{ fontSize: '0.84rem', color: '#555', textAlign: 'right' }}>{e.costPerUnit > 0 ? e.costPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3 }}>
                                {editingId === e.materialItemId ? (
                                    <>
                                        <InputBase
                                            autoFocus
                                            value={editQtyInput}
                                            onChange={ev => setEditQtyInput(ev.target.value.replace(/[^0-9.]/g, ''))}
                                            placeholder={e.quantity.toString()}
                                            onKeyDown={ev => { if (ev.key === 'Enter') confirmInlineEdit(e); if (ev.key === 'Escape') setEditingId(null); }}
                                            sx={{ width: 64, fontSize: '0.88rem', fontWeight: 700, color: mainPrimaryColor, border: `1px solid ${mainPrimaryColor}`, borderRadius: '4px', px: 0.8, py: 0.2, textAlign: 'right', '& input': { textAlign: 'right' } }}
                                        />
                                        <IconButton size='small' onClick={() => confirmInlineEdit(e)} sx={{ color: mainPrimaryColor, p: 0.3 }}>
                                            <CheckIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </>
                                ) : (
                                    <>
                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor }}>
                                            {e.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                        </Typography>
                                        <Tooltip title={t('Add new quantity')}>
                                            <IconButton size='small' onClick={() => startInlineEdit(e)} sx={{ color: '#ccc', p: 0.3, '&:hover': { color: mainPrimaryColor } }}>
                                                <AddCircleOutlineIcon sx={{ fontSize: 13 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>
                            <Typography sx={{ fontSize: '0.9rem', color: '#aaa', textAlign: 'right' }}>—</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title={t('History')}>
                                    <IconButton size='small' onClick={() => setHistoryEntryId(e.materialItemId)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <HistoryIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('Remove')}>
                                    <IconButton size='small' onClick={() => handleDelete(e.materialItemId)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Add material sub-modal */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>Հիմնական նյութեր — {t('Add')}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {/* Search */}
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

                    {/* Materials list */}
                    <Box sx={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e0f5f7', borderRadius: 2, mb: 2 }}>
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

                    {/* Quantity input — appears after selection */}
                    {selected && (
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

            {/* History dialog */}
            <Dialog open={!!historyEntry} onClose={() => setHistoryEntryId(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon sx={{ fontSize: 20 }} />
                    <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: '#000' }}>{historyEntry?.name}</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    {!historyEntry || historyEntry.history.length === 0 ? (
                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', py: 2 }}>{t('No history yet.')}</Typography>
                    ) : (
                        <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 36px', bgcolor: '#edf9fb', px: 2, py: 0.8 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: mainPrimaryColor }}>Մուտքագրված</Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right' }}>{t('Date Added')}</Typography>
                                <Box />
                            </Box>
                            {historyEntry.history.map((rec, i) => (
                                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 36px', px: 2, py: 0.8, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor }}>
                                        {rec.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#aaa', textAlign: 'right' }}>
                                        {(rec.addedAt instanceof Date ? rec.addedAt : new Date(rec.addedAt)).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </Typography>
                                    <Tooltip title={t('Remove')}>
                                        <IconButton size='small' onClick={() => deleteHistoryRecord(historyEntry.materialItemId, i)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.3 }}>
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
