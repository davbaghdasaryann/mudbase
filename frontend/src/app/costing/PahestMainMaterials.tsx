'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

interface MaterialOption {
    materialItemId: string;
    estimatedLaborId: string;
    laborName: string;
    name: string;
    fullCode: string;
    unit: string;
    estimateQuantity: number;
    costPerUnit: number;
}

interface GroupChildMaterial {
    estimatedMaterialId: string;
    materialItemId: string;
    name: string;
    fullCode: string;
    unit: string;
    estimateQuantity: number;
    costPerUnit: number;
}

interface GroupChild {
    childId: string;
    childName: string;
    materials: GroupChildMaterial[];
}

interface GroupMaterialData {
    groupId: string;
    groupName: string;
    children: GroupChild[];
}

export interface PahestHistoryRecord {
    quantity: number;
    costPerUnit: number;
    addedAt: Date;
    attributedLaborId?: string;
}

export interface PahestEntry {
    materialItemId: string;
    estimatedLaborId?: string;
    name: string;
    unit: string;
    quantity: number;
    costedQuantity?: number;
    estimateQuantity: number;
    costPerUnit: number;
    addedAt: Date;
    history: PahestHistoryRecord[];
}

interface HistoryEntryInput { workName: string; unit: string; quantity: number; unitPrice: number; total: number; materialItemId?: string; estimatedLaborId?: string; }

interface Props {
    estimateId: string;
    unforeseenEstimateId?: string;
    entries: PahestEntry[];
    onChange: (entries: PahestEntry[]) => void;
    onHistoryEntry?: (e: HistoryEntryInput) => void;
    onRemoveEntry?: (materialItemId: string, estimatedLaborId?: string) => void;
    actualData?: Record<string, { quantity: string; unitPrice: string }>;
    costedMainKeys?: Set<string>;
}

function toIdStr(id: unknown): string {
    if (id == null) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && 'oid' in (id as any)) return (id as any).oid;
    return String(id);
}

export default function PahestMainMaterials({ estimateId, unforeseenEstimateId, entries, onChange, onHistoryEntry, onRemoveEntry, actualData, costedMainKeys }: Props) {
    const { t } = useTranslation();
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [groupData, setGroupData] = useState<GroupMaterialData[]>([]);
    const [loading, setLoading] = useState(true);

    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<MaterialOption | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [qtyInput, setQtyInput] = useState('');
    const [addPriceInput, setAddPriceInput] = useState('');

    const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
    const historyEntry = historyEntryId ? (entries.find(e => `${e.materialItemId}|${e.estimatedLaborId ?? ''}` === historyEntryId) ?? null) : null;

    const [plusEntry, setPlusEntry] = useState<PahestEntry | null>(null);
    const [plusQtyInput, setPlusQtyInput] = useState('');
    const [plusPriceInput, setPlusPriceInput] = useState('');
    const confirmingRef = useRef(false);
    const plusConfirmingRef = useRef(false);

    useEffect(() => {
        setLoading(true);
        const parseItems = (items: any[]): MaterialOption[] => {
            const map = new Map<string, MaterialOption>();
            const ZERO_ID = '000000000000000000000000';
            for (const item of items) {
                const rawId = toIdStr(item.materialItemId);
                const id = (rawId && rawId !== ZERO_ID) ? rawId : toIdStr(item._id);
                if (!id) continue;
                const laborId = toIdStr(item.estimatedLaborId);
                const key = `${id}|${laborId}`;
                if (map.has(key)) {
                    map.get(key)!.estimateQuantity += item.quantity ?? 0;
                } else {
                    const md = item.estimateMaterialItemData?.[0];
                    map.set(key, {
                        materialItemId: id,
                        estimatedLaborId: laborId,
                        laborName: item.laborName || '',
                        name: md?.name || item.materialOfferItemName || '—',
                        fullCode: md?.fullCode || '',
                        unit: item.estimateMeasurementUnitData?.[0]?.representationSymbol || '',
                        estimateQuantity: item.quantity ?? 0,
                        costPerUnit: md?.averagePrice ?? item.changableAveragePrice ?? 0,
                    });
                }
            }
            return Array.from(map.values());
        };
        const fetches = [
            Api.requestSession<any[]>({ command: 'estimate/fetch_materials_list', args: { estimateId } }),
            ...(unforeseenEstimateId ? [Api.requestSession<any[]>({ command: 'estimate/fetch_materials_list', args: { estimateId: unforeseenEstimateId } })] : []),
        ];
        Promise.all([
            ...fetches,
            Api.requestSession<GroupMaterialData[]>({ command: 'estimate/fetch_group_materials_for_pahest', args: { estimateId } }),
        ]).then(([main, ufOrGroup, maybeGroup]) => {
            const hasUf = !!unforeseenEstimateId;
            const uf = hasUf ? (ufOrGroup as any[]) : [];
            const groups = (hasUf ? maybeGroup : ufOrGroup) as GroupMaterialData[] ?? [];
            const mainRows = parseItems(main ?? []);
            const ufRows = parseItems(uf ?? []);
            const seen = new Set(mainRows.map(r => `${r.materialItemId}|${r.estimatedLaborId}`));
            const combined = [...mainRows, ...ufRows.filter(r => !seen.has(`${r.materialItemId}|${r.estimatedLaborId}`))];
            const resolvedGroups: GroupMaterialData[] = groups ?? [];
            // Exclude from standalone list any material already shown under a group
            const groupMatIds = new Set(resolvedGroups.flatMap(g => g.children.flatMap(c => c.materials.map(m => m.materialItemId))));
            setMaterials(combined.filter(m => !groupMatIds.has(m.materialItemId)));
            setGroupData(resolvedGroups);
        }).catch(console.error).finally(() => setLoading(false));
    }, [estimateId, unforeseenEstimateId]);

    const openAdd = () => {
        setSearch('');
        setSelected(null);
        setQtyInput('');
        setAddPriceInput('');
        setExpandedGroups(new Set(groupData.map(g => g.groupId)));
        setAddOpen(true);
    };

    const toggleGroup = (groupId: string) => setExpandedGroups(prev => {
        const next = new Set(prev);
        if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
        return next;
    });

    const selectGroupMaterial = (m: GroupChildMaterial) => {
        setSelected({ materialItemId: m.materialItemId, estimatedLaborId: '', laborName: '', name: m.name, fullCode: m.fullCode, unit: m.unit, estimateQuantity: m.estimateQuantity, costPerUnit: m.costPerUnit });
        setQtyInput('');
    };

    const handleConfirm = () => {
        if (!selected || !qtyInput || confirmingRef.current) return;
        const qty = parseFloat(qtyInput.replace(',', '.')) || 0;
        if (qty <= 0) return;
        confirmingRef.current = true;
        const now = new Date();
        const enteredPrice = parseFloat(addPriceInput.replace(',', '.'));
        const unitPrice = (!isNaN(enteredPrice) && addPriceInput.trim() !== '') ? enteredPrice : 0;
        const existing = entries.findIndex(e => e.materialItemId === selected.materialItemId && e.estimatedLaborId === selected.estimatedLaborId);
        const historyRecord = { quantity: qty, costPerUnit: unitPrice, addedAt: now };
        if (existing >= 0) {
            const next = [...entries];
            next[existing] = {
                ...next[existing],
                quantity: next[existing].quantity + qty,
                costPerUnit: unitPrice || next[existing].costPerUnit,
                addedAt: now,
                history: [...(next[existing].history ?? []), historyRecord],
            };
            onChange(next);
        } else {
            onChange([...entries, {
                materialItemId: selected.materialItemId,
                estimatedLaborId: selected.estimatedLaborId,
                name: selected.name || '—',
                unit: selected.unit,
                quantity: qty,
                estimateQuantity: selected.estimateQuantity,
                costPerUnit: unitPrice,
                addedAt: now,
                history: [historyRecord],
            }]);
        }
        onHistoryEntry?.({ workName: selected.name, unit: selected.unit, quantity: qty, unitPrice, total: qty * unitPrice, materialItemId: selected.materialItemId, estimatedLaborId: selected.estimatedLaborId });
        setAddOpen(false);
        setTimeout(() => { confirmingRef.current = false; }, 600);
    };

    const handlePlusConfirm = () => {
        if (!plusEntry || plusConfirmingRef.current) return;
        plusConfirmingRef.current = true;
        const qty = parseFloat(plusQtyInput.replace(',', '.')) || 0;
        const price = parseFloat(plusPriceInput.replace(',', '.'));
        const now = new Date();
        const idx = entries.findIndex(e => e.materialItemId === plusEntry.materialItemId && e.estimatedLaborId === plusEntry.estimatedLaborId);
        if (idx < 0) return;
        const next = [...entries];
        const newCostPerUnit = (!isNaN(price) && plusPriceInput.trim() !== '') ? price : 0;
        const patch: Partial<PahestEntry> & { history?: PahestHistoryRecord[]; addedAt?: Date } = {};
        if (qty > 0) {
            patch.quantity = next[idx].quantity + qty;
            patch.history = [...next[idx].history, { quantity: qty, costPerUnit: newCostPerUnit, addedAt: now }];
            patch.addedAt = now;
        }
        if (!isNaN(price) && plusPriceInput.trim() !== '') patch.costPerUnit = price;
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
        if (qty > 0) onHistoryEntry?.({ workName: plusEntry.name, unit: plusEntry.unit, quantity: qty, unitPrice: newCostPerUnit, total: qty * newCostPerUnit, materialItemId: plusEntry.materialItemId, estimatedLaborId: plusEntry.estimatedLaborId });
        setPlusEntry(null);
        setPlusQtyInput('');
        setPlusPriceInput('');
        setTimeout(() => { plusConfirmingRef.current = false; }, 600);
    };

    const handleDelete = (materialItemId: string, estimatedLaborId?: string) => {
        onChange(entries.filter(e => !(e.materialItemId === materialItemId && e.estimatedLaborId === estimatedLaborId)));
        onRemoveEntry?.(materialItemId, estimatedLaborId);
    };

    const deleteHistoryRecord = (materialItemId: string, estimatedLaborId: string | undefined, recIdx: number) => {
        const idx = entries.findIndex(e => e.materialItemId === materialItemId && e.estimatedLaborId === estimatedLaborId);
        if (idx < 0) return;
        const entry = entries[idx];
        const rec = entry.history[recIdx];
        const newHistory = entry.history.filter((_, i) => i !== recIdx);
        if (newHistory.length === 0) {
            onChange(entries.filter(e => !(e.materialItemId === materialItemId && e.estimatedLaborId === estimatedLaborId)));
            onRemoveEntry?.(materialItemId, estimatedLaborId);
            setHistoryEntryId(null);
        } else {
            const next = [...entries];
            next[idx] = { ...next[idx], quantity: Math.max(0, entry.quantity - rec.quantity), history: newHistory };
            onChange(next);
        }
    };

    // Merge standalone + group materials into one flat deduplicated list with source labels
    const allMergedMaterials = (() => {
        const q = search.toLowerCase();
        const map = new Map<string, { mat: MaterialOption; sources: string[] }>();
        const add = (mat: MaterialOption, source: string) => {
            const ex = map.get(mat.materialItemId);
            if (ex) {
                if (source && !ex.sources.includes(source)) ex.sources.push(source);
                ex.mat = { ...ex.mat, estimateQuantity: ex.mat.estimateQuantity + mat.estimateQuantity };
            } else {
                map.set(mat.materialItemId, { mat: { ...mat, estimatedLaborId: '', laborName: '' }, sources: source ? [source] : [] });
            }
        };
        for (const m of materials) {
            if (!q || (m.name + m.fullCode).toLowerCase().includes(q)) add(m, m.laborName);
        }
        for (const g of groupData) {
            for (const c of g.children) {
                for (const m of c.materials) {
                    if (!q || (m.name + m.fullCode).toLowerCase().includes(q)) {
                        add({ materialItemId: m.materialItemId, estimatedLaborId: '', laborName: '', name: m.name, fullCode: m.fullCode, unit: m.unit, estimateQuantity: m.estimateQuantity, costPerUnit: m.costPerUnit }, g.groupName || c.childName || 'Group');
                    }
                }
            }
        }
        return [...map.values()];
    })();

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
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 90px 140px 120px 120px 120px 88px', bgcolor: '#edf9fb', px: 2, py: 1.5, columnGap: 2 }}>
                        {[t('Material'), t('Unit'), 'Մուտքագրված', t('Total'), 'Ծախսագրված', 'Մնացորդ', ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', textAlign: i === 0 ? 'left' : 'center' }}>{h}</Typography>
                        ))}
                    </Box>
                    {entries.map((e, idx) => {
                        const remaining = e.quantity - (e.costedQuantity ?? 0);
                        return (
                        <Box key={`${e.materialItemId}|${e.estimatedLaborId ?? ''}`} sx={{ display: 'grid', gridTemplateColumns: '1fr 90px 140px 120px 120px 120px 88px', px: 2, py: 0.8, columnGap: 2, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: idx % 2 === 0 ? '#fff' : '#fbfeff', '&:hover': { bgcolor: '#f2fcfd' } }}>
                            <Typography sx={{ fontSize: '0.9rem', color: '#222', fontWeight: 500 }}>{e.name || '—'}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>{e.unit}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor, textAlign: 'center' }}>
                                {e.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#555', textAlign: 'center', fontWeight: e.history.reduce((s, r) => s + r.quantity * r.costPerUnit, 0) > 0 ? 600 : 400 }}>{e.history.reduce((s, r) => s + r.quantity * r.costPerUnit, 0) > 0 ? e.history.reduce((s, r) => s + r.quantity * r.costPerUnit, 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: (e.costedQuantity ?? 0) > 0 ? 700 : 400, color: (e.costedQuantity ?? 0) > 0 ? mainPrimaryColor : '#aaa', textAlign: 'center' }}>
                                {(e.costedQuantity ?? 0) > 0 ? (e.costedQuantity!).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: remaining !== 0 ? 700 : 400, color: remaining < 0 ? '#e53935' : remaining > 0 ? '#555' : '#aaa', textAlign: 'center' }}>
                                {remaining !== 0 ? remaining.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title={t('Add')}>
                                    <IconButton size='small' onClick={() => { setPlusEntry(e); setPlusQtyInput(''); setPlusPriceInput(''); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('History')}>
                                    <IconButton size='small' onClick={() => setHistoryEntryId(`${e.materialItemId}|${e.estimatedLaborId ?? ''}`)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                        <HistoryIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                                {(() => { const isCosted = costedMainKeys?.has(`${e.materialItemId}|${e.estimatedLaborId ?? ''}`); return (
                                <Tooltip title={isCosted ? t('Delete cost history first') : t('Remove')}>
                                    <span><IconButton size='small' disabled={isCosted} onClick={() => handleDelete(e.materialItemId, e.estimatedLaborId)} sx={{ color: isCosted ? '#e0e0e0' : '#ccc', '&:hover': { color: isCosted ? '#e0e0e0' : '#e53935' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                    </IconButton></span>
                                </Tooltip>
                                ); })()}
                            </Box>
                        </Box>
                        );
                    })}
                </Box>
            )}

            {/* Add material modal */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3, minHeight: 480 } }}>
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
                    <Box sx={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #e0f5f7', borderRadius: 2, mb: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress size={24} sx={{ color: mainPrimaryColor }} />
                            </Box>
                        ) : (
                            <>
                                {allMergedMaterials.map(({ mat: m, sources }) => (
                                    <Box
                                        key={m.materialItemId}
                                        onClick={() => { setSelected(m); setQtyInput(''); }}
                                        sx={{
                                            px: 2, py: 0.9, fontSize: '0.85rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            borderBottom: '1px solid #f0fbfc',
                                            backgroundColor: selected?.materialItemId === m.materialItemId ? 'rgba(0,171,190,0.08)' : 'transparent',
                                            color: selected?.materialItemId === m.materialItemId ? mainPrimaryColor : '#333',
                                            fontWeight: selected?.materialItemId === m.materialItemId ? 600 : 400,
                                            '&:hover': { backgroundColor: 'rgba(0,171,190,0.06)' },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                            <Typography sx={{ fontSize: '0.85rem', color: 'inherit', fontWeight: 'inherit' }}>{m.name}</Typography>
                                            <Typography component='span' sx={{ ml: 1, fontSize: '0.78rem', color: '#888', flexShrink: 0 }}>({m.unit})</Typography>
                                        </Box>
                                        {sources.length > 0 && (
                                            <Tooltip title={sources.join(', ')} placement='left' onClick={e => e.stopPropagation()}>
                                                <InfoOutlinedIcon sx={{ fontSize: 15, color: '#ccc', ml: 1, flexShrink: 0, '&:hover': { color: '#aaa' } }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                ))}
                                {allMergedMaterials.length === 0 && (
                                    <Typography sx={{ px: 2, py: 2, fontSize: '0.85rem', color: '#aaa' }}>{t('No results')}</Typography>
                                )}
                            </>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, opacity: selected ? 1 : 0.4, pointerEvents: selected ? 'auto' : 'none' }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>{t('Quantity')}</Typography>
                            <InputBase
                                value={qtyInput}
                                onChange={e => setQtyInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                autoFocus={!!selected}
                                disabled={!selected}
                                sx={{ border: `1px solid ${selected ? mainPrimaryColor : '#e0e0e0'}`, borderRadius: '6px', px: 1.5, py: 0.5, width: '100%', fontSize: '0.88rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.15)' } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>Միավորի արժեք</Typography>
                            <InputBase
                                value={addPriceInput}
                                onChange={e => setAddPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder={selected?.costPerUnit && selected.costPerUnit > 0 ? String(selected.costPerUnit) : '0'}
                                disabled={!selected}
                                sx={{ border: '1px solid #e0f5f7', borderRadius: '6px', px: 1.5, py: 0.5, width: '100%', fontSize: '0.88rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.15)' } }}
                            />
                        </Box>
                    </Box>
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
                                                <IconButton size='small' onClick={() => deleteHistoryRecord(historyEntry.materialItemId, historyEntry.estimatedLaborId, i)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.3, alignSelf: 'flex-start' }}>
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
