'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, IconButton, Tooltip, InputBase, Collapse,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';
import { type PahestEntry } from './PahestMainMaterials';
import { type AylEntry } from './PahestAylMaterials';
import { type CostHistoryEntry } from './page';

interface Section { _id: string; name: string; displayIndex: number; }
interface Subsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }
interface LaborRow {
    _id: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    subsectionName: string;
    sectionName: string;
}

interface MaterialModalState {
    material: PahestEntry;
    value: string;
}

interface AylModalState {
    entry: AylEntry;
    value: string;
}

type SnapshotData = { laborRows: LaborRow[]; sections: Section[]; subsections: Subsection[] };

interface Props {
    open: boolean;
    onClose: () => void;
    estimate: EstimatesApi.ApiEstimate;
    estimateSnapshot?: SnapshotData | null;
    unforeseenEstimate?: EstimatesApi.ApiEstimate | null;
    unforeseenSnapshot?: SnapshotData | null;
    pahestEntries: PahestEntry[];
    onPahestUpdate: (materialItemId: string, qty: number, costPerUnit: number, estimatedLaborId?: string) => void;
    originalEstimateId?: string;
    aylEntries?: AylEntry[];
    onAylUpdate?: (id: string, qty: number) => void;
    onCostAdded?: (entry: CostHistoryEntry) => void;
    actualData?: Record<string, { quantity: string; unitPrice: string }>;
}

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

async function fetchEstimateRows(estimateId: string) {
    const [laborData, sectData] = await Promise.all([
        Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
    ]);
    const sorted = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
    const arrays = await Promise.all(
        sorted.map(s => Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: toId(s._id) } }).catch(() => [] as Subsection[]))
    );
    return { sections: sorted, subsections: arrays.flat(), rows: laborData ?? [] };
}

export default function MaterialsDialog({ open, onClose, estimate, estimateSnapshot, unforeseenEstimate, unforeseenSnapshot, pahestEntries, onPahestUpdate, originalEstimateId, aylEntries, onAylUpdate, onCostAdded, actualData }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [ufSections, setUfSections] = useState<Section[]>([]);
    const [ufSubsections, setUfSubsections] = useState<Subsection[]>([]);
    const [ufRows, setUfRows] = useState<LaborRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<LaborRow | null>(null);
    const [materialModal, setMaterialModal] = useState<MaterialModalState | null>(null);
    const [aylModal, setAylModal] = useState<AylModalState | null>(null);
    const [laborMatIds, setLaborMatIds] = useState<Map<string, Set<string>>>(new Map());
    const [laborMatIdsReady, setLaborMatIdsReady] = useState(false);
    const [matNameMap, setMatNameMap] = useState<Map<string, string>>(new Map());
    const [collapsedSecs, setCollapsedSecs] = useState<Set<string>>(new Set());
    const toggleSec = (id: string) => setCollapsedSecs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const confirmingRef = useRef(false);
    const aylConfirmingRef = useRef(false);

    const estimateId = toId(estimate._id);
    const ufEstimateId = unforeseenEstimate ? toId(unforeseenEstimate._id) : '';

    useEffect(() => {
        if (!open) return;
        setSelectedRow(null);
        setLaborMatIdsReady(false);

        const ZERO_MAT_ID = '000000000000000000000000';
        const buildLaborMatMap = (items: any[], groupData?: any[]): Map<string, Set<string>> => {
            const map = new Map<string, Set<string>>();
            for (const item of items ?? []) {
                const laborId = toId(item.estimatedLaborId);
                const rawMatId = toId(item.materialItemId);
                // Blank materials use document _id as materialItemId in pahest entries
                const matId = (rawMatId && rawMatId !== ZERO_MAT_ID) ? rawMatId : toId(item._id);
                if (!laborId || !matId) continue;
                if (!map.has(laborId)) map.set(laborId, new Set());
                map.get(laborId)!.add(matId);
            }
            for (const group of groupData ?? []) {
                const groupId = toId(group.groupId);
                if (!groupId) continue;
                for (const child of group.children ?? []) {
                    for (const mat of child.materials ?? []) {
                        const matId = toId(mat.materialItemId);
                        if (!matId) continue;
                        if (!map.has(groupId)) map.set(groupId, new Set());
                        map.get(groupId)!.add(matId);
                    }
                }
            }
            return map;
        };

        const origId = originalEstimateId && originalEstimateId !== estimateId ? originalEstimateId : '';
        const empty: Promise<any[]> = Promise.resolve([]);
        Promise.all([
            Api.requestSession<any[]>({ command: 'estimate/fetch_materials_list', args: { estimateId } }),
            ufEstimateId ? Api.requestSession<any[]>({ command: 'estimate/fetch_materials_list', args: { estimateId: ufEstimateId } }) : empty,
            Api.requestSession<any[]>({ command: 'estimate/fetch_group_materials_for_pahest', args: { estimateId } }),
            origId ? Api.requestSession<any[]>({ command: 'estimate/fetch_materials_list', args: { estimateId: origId } }) : empty,
        ]).then(([main, uf, groups, origMain]) => {
            const combined = [...(main ?? []), ...(uf ?? [])];
            const builtMap = buildLaborMatMap(combined, groups);

            // For costings that were forked from an original estimate, pahest entries may store
            // the original estimate's estimate_material_items._id as materialItemId for blank materials.
            // Build a localLaborName → localLaborId map from local blank materials, then add the
            // original estimate's blank material _id to the matching local labor row's allowed set.
            if (origId && origMain && origMain.length > 0) {
                const localNameToLaborId = new Map<string, string>();
                for (const item of main ?? []) {
                    const rawMatId = toId(item.materialItemId);
                    if (!rawMatId || rawMatId === ZERO_MAT_ID) {
                        const laborId = toId(item.estimatedLaborId);
                        const laborName: string = item.laborData?.laborOfferItemName || item.laborName || '';
                        if (laborId && laborName) localNameToLaborId.set(laborName, laborId);
                    }
                }
                for (const item of origMain) {
                    const rawMatId = toId(item.materialItemId);
                    if (!rawMatId || rawMatId === ZERO_MAT_ID) {
                        const origMatId = toId(item._id);
                        const laborName: string = item.laborData?.laborOfferItemName || item.laborName || '';
                        const localLaborId = localNameToLaborId.get(laborName);
                        if (origMatId && localLaborId) {
                            if (!builtMap.has(localLaborId)) builtMap.set(localLaborId, new Set());
                            builtMap.get(localLaborId)!.add(origMatId);
                        }
                    }
                }
            }

            setLaborMatIds(builtMap);
            // Build materialItemId → name map to fill in blank names from old entries
            const nameMap = new Map<string, string>();
            for (const item of combined) {
                const rawMatId = toId(item.materialItemId);
                const matId = (rawMatId && rawMatId !== ZERO_MAT_ID) ? rawMatId : toId(item._id);
                const name = item.estimateMaterialItemData?.[0]?.name || item.materialOfferItemName || '';
                if (matId && name) nameMap.set(matId, name);
            }
            for (const group of groups ?? []) {
                for (const child of group.children ?? []) {
                    for (const mat of child.materials ?? []) {
                        const matId = toId(mat.materialItemId);
                        if (matId && mat.name) nameMap.set(matId, mat.name);
                    }
                }
            }
            setMatNameMap(nameMap);
            setLaborMatIdsReady(true);
        }).catch(() => setLaborMatIdsReady(true));

        if (estimateSnapshot) {
            setSections(estimateSnapshot.sections);
            setSubsections(estimateSnapshot.subsections);
            setRows(estimateSnapshot.laborRows);
            if (unforeseenSnapshot) {
                setUfSections(unforeseenSnapshot.sections ?? []);
                setUfSubsections(unforeseenSnapshot.subsections ?? []);
                setUfRows(unforeseenSnapshot.laborRows ?? []);
            } else if (ufEstimateId) {
                fetchEstimateRows(ufEstimateId).then(d => { setUfSections(d.sections); setUfSubsections(d.subsections); setUfRows(d.rows); }).catch(console.error);
            } else {
                setUfSections([]); setUfSubsections([]); setUfRows([]);
            }
            return;
        }
        setLoading(true);
        const fetches: Promise<void>[] = [
            fetchEstimateRows(estimateId).then(d => { setSections(d.sections); setSubsections(d.subsections); setRows(d.rows); }),
        ];
        if (ufEstimateId) {
            fetches.push(fetchEstimateRows(ufEstimateId).then(d => { setUfSections(d.sections); setUfSubsections(d.subsections); setUfRows(d.rows); }));
        } else {
            setUfSections([]); setUfSubsections([]); setUfRows([]);
        }
        Promise.all(fetches).catch(console.error).finally(() => setLoading(false));
    }, [open, estimateId, ufEstimateId, estimateSnapshot, unforeseenSnapshot, originalEstimateId]);

    const handleConfirm = () => {
        if (!materialModal || confirmingRef.current) return;
        const qty = parseFloat(materialModal.value.replace(',', '.')) || 0;
        if (qty <= 0) return;
        confirmingRef.current = true;
        const mat = materialModal.material;
        const effectiveLaborId = selectedRow ? toId(selectedRow._id) : (mat.estimatedLaborId || '');
        onPahestUpdate(mat.materialItemId, qty, mat.costPerUnit, mat.estimatedLaborId || undefined);
        onCostAdded?.({
            id: String(Date.now() + Math.random()),
            workName: mat.name,
            unit: mat.unit,
            quantity: qty,
            unitPrice: mat.costPerUnit,
            total: qty * mat.costPerUnit,
            addedAt: new Date(),
            paymentMethod: 'nyuth_tsakhsagrum',
            laborItemId: effectiveLaborId || undefined,
            materialItemId: mat.materialItemId,
        });
        setMaterialModal(null);
        setTimeout(() => { confirmingRef.current = false; }, 600);
    };

    const handleAylConfirm = () => {
        if (!aylModal || aylConfirmingRef.current) return;
        const qty = parseFloat(aylModal.value.replace(',', '.')) || 0;
        if (qty <= 0) return;
        aylConfirmingRef.current = true;
        const e = aylModal.entry;
        onAylUpdate?.(e.id, qty);
        const unitPrice = parseFloat(e.costPerUnit) || 0;
        const aylLaborId = selectedRow ? String(selectedRow._id) : undefined;
        onCostAdded?.({
            id: String(Date.now() + Math.random()),
            workName: e.name || '—',
            unit: e.unit,
            quantity: qty,
            unitPrice,
            total: qty * unitPrice,
            addedAt: new Date(),
            paymentMethod: 'pahest_ayl_cost',
            materialItemId: e.id,
            laborItemId: aylLaborId,
        });
        setAylModal(null);
        setTimeout(() => { aylConfirmingRef.current = false; }, 600);
    };

    const onPage2 = !!selectedRow;

    const renderWorkSections = (secs: Section[], subs: Subsection[], rws: LaborRow[], accentColor = mainPrimaryColor, subBg = '#f7fdfe') => {
        const withVolume = rws.filter(r => {
            const laborId = toId(r._id);
            const hasVolume = parseFloat(actualData?.[laborId]?.quantity || '0') > 0;
            const laborAllowedMats = laborMatIds.get(laborId) ?? new Set<string>();
            const hasPahest = pahestEntries.some(e => e.quantity > 0 && laborAllowedMats.has(e.materialItemId));
            return hasVolume || hasPahest;
        });
        return (
        <>
        {secs.map(sec => {
            const secSubs = subs.filter(sub => toId(sub.estimateSectionId) === toId(sec._id)).sort((a, b) => a.displayIndex - b.displayIndex);
            const secHasVolume = secSubs.some(sub => withVolume.some(r => r.subsectionName === sub.name && r.sectionName === sec.name));
            if (!secHasVolume) return null;
            return (
                <Box key={toId(sec._id)} sx={{ mb: 1, borderRadius: 2, overflow: 'hidden', border: `1px solid ${accentColor}22` }}>
                    <Box onClick={() => toggleSec(toId(sec._id))} sx={{ display: 'flex', alignItems: 'center', bgcolor: accentColor === mainPrimaryColor ? '#e6f7f9' : '#fff3ee', px: 3, py: 1.1, borderLeft: `4px solid ${accentColor}`, cursor: 'pointer', userSelect: 'none', '&:hover': { filter: 'brightness(0.97)' } }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: accentColor, flex: 1 }}>{sec.name}</Typography>
                        <ExpandMoreIcon sx={{ fontSize: 18, color: accentColor, transition: 'transform 0.2s', transform: collapsedSecs.has(toId(sec._id)) ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
                    </Box>
                    <Collapse in={!collapsedSecs.has(toId(sec._id))}>
                    {secSubs.map(sub => {
                        const subRows = withVolume.filter(r => r.subsectionName === sub.name && r.sectionName === sec.name);
                        if (subRows.length === 0) return null;
                        return (
                            <Box key={toId(sub._id)}>
                                <Box sx={{ px: 3, py: 0.6, bgcolor: subBg, borderTop: '1px solid #e8f9fb' }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>{sub.name}</Typography>
                                </Box>
                                {subRows.map(row => (
                                    <Box key={toId(row._id)} onClick={() => setSelectedRow(row)} sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1, cursor: 'pointer', borderTop: '1px solid #f0fbfc', '&:hover': { bgcolor: accentColor === mainPrimaryColor ? '#f2fcfd' : '#fff8f4' } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: '0.83rem', color: '#222', fontWeight: 500 }}>{row.laborOfferItemName || row.catalogName || '—'}</Typography>
                                            <Typography sx={{ fontSize: '0.74rem', color: '#888', mt: 0.2 }}>{row.unitSymbol} · {row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 })}</Typography>
                                        </Box>
                                        <ChevronRightIcon sx={{ fontSize: 18, color: '#ccc' }} />
                                    </Box>
                                ))}
                            </Box>
                        );
                    })}
                    </Collapse>
                </Box>
            );
        })}
        </>
        );
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh', overflow: 'hidden' } }}
        >
            {/* Dynamic title */}
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#1a1a1a', pb: 1, minHeight: 56, flexShrink: 0 }}>
                {onPage2 ? (
                    <>
                        <IconButton size='small' onClick={() => setSelectedRow(null)} sx={{ color: mainPrimaryColor, mr: 0.5 }}>
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: mainPrimaryColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedRow?.laborOfferItemName || selectedRow?.catalogName}
                        </Typography>
                    </>
                ) : (
                    <>
                        <ShoppingCartOutlinedIcon sx={{ fontSize: 22, flexShrink: 0 }} />
                        Նյութերի ծախսագրում
                    </>
                )}
            </DialogTitle>

            {/* Sliding content */}
            <DialogContent sx={{ p: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{
                    display: 'flex',
                    width: '200%',
                    flex: 1,
                    minHeight: 0,
                    transform: onPage2 ? 'translateX(-50%)' : 'translateX(0)',
                    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
                }}>
                    {/* PAGE 1: Works list */}
                    <Box sx={{ width: '50%', overflowY: 'auto', pt: 0.5, pb: 1 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                            </Box>
                        ) : sections.length === 0 ? (
                            <Typography sx={{ color: '#aaa', py: 4, textAlign: 'center', px: 2 }}>{t('No sections found')}</Typography>
                        ) : !rows.some(r => {
                            const laborId = toId(r._id);
                            return parseFloat(actualData?.[laborId]?.quantity || '0') > 0 || pahestEntries.some(e => e.quantity > 0 && (laborMatIds.get(laborId) ?? new Set<string>()).has(e.materialItemId));
                        }) && !ufRows.some(r => parseFloat(actualData?.[toId(r._id)]?.quantity || '0') > 0) ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, px: 4, gap: 0.5 }}>
                                <Typography sx={{ color: '#bbb', fontSize: '0.82rem', textAlign: 'center' }}>Նախ անհրաժեշտ է ծավալի գրանցում կատարել</Typography>
                                <Typography sx={{ color: '#ccc', fontSize: '0.78rem', textAlign: 'center' }}>Volume registration must be completed first</Typography>
                            </Box>
                        ) : (
                            <Box>
                                {renderWorkSections(sections, subsections, rows)}
                                {ufSections.length > 0 && ufRows.some(r => parseFloat(actualData?.[toId(r._id)]?.quantity || '0') > 0) && (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, mb: 1, px: 3 }}>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#e65100', whiteSpace: 'nowrap' }}>Չնախատեսված աշխատանքներ</Typography>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                        </Box>
                                        {renderWorkSections(ufSections, ufSubsections, ufRows, '#e65100', '#fff8f4')}
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* PAGE 2: Materials for selected work */}
                    <Box sx={{ width: '50%', overflowY: 'auto', p: 3 }}>
                        {(() => {
                            const allowedMatIds = selectedRow ? (laborMatIds.get(toId(selectedRow._id)) ?? new Set<string>()) : new Set<string>();
                            const visiblePahest = pahestEntries.filter(e => e.quantity > 0 && allowedMatIds.has(e.materialItemId));
                            const visibleAyl = aylEntries?.filter(e => e.mutq > 0) ?? [];
                            if (!laborMatIdsReady) {
                                return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress size={24} sx={{ color: mainPrimaryColor }} /></Box>;
                            }
                            if (visiblePahest.length === 0 && visibleAyl.length === 0) {
                                return (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, color: '#bbb' }}>
                                        <ShoppingCartOutlinedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                                        <Typography sx={{ fontSize: '0.88rem' }}>Պահեստում նյութեր չկան</Typography>
                                    </Box>
                                );
                            }
                            return (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Box sx={{ flex: 1, height: '1px', bgcolor: '#e0f5f7' }} />
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', whiteSpace: 'nowrap' }}>Հիմնական նյութեր</Typography>
                                        <Box sx={{ flex: 1, height: '1px', bgcolor: '#e0f5f7' }} />
                                    </Box>
                                    {visiblePahest.length === 0 && (
                                        <Typography sx={{ fontSize: '0.82rem', color: '#bbb', textAlign: 'center', py: 1 }}>Հիմնական նյութեր չկան</Typography>
                                    )}
                                    {visiblePahest.map(mat => (
                                        <Box
                                            key={mat.materialItemId}
                                            sx={{ border: '1px solid #e0f5f7', borderRadius: 2, p: 1.5, bgcolor: '#fff', '&:hover': { bgcolor: '#f8fdfe', borderColor: mainPrimaryColor } }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#222', flex: 1, pr: 1 }}>{mat.name || matNameMap.get(mat.materialItemId) || '—'}</Typography>
                                                <Tooltip title={t('Add new quantity')}>
                                                    <IconButton
                                                        size='small'
                                                        onClick={() => setMaterialModal({ material: mat, value: '' })}
                                                        sx={{ color: mainPrimaryColor, bgcolor: 'rgba(0,171,190,0.08)', '&:hover': { bgcolor: 'rgba(0,171,190,0.18)' }, p: 0.6 }}
                                                    >
                                                        <AddCircleOutlineIcon sx={{ fontSize: 22 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>{t('Unit')}</Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#555' }}>{mat.unit || '—'}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>Մուտքագրված</Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: mainPrimaryColor }}>
                                                        {mat.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>Ծախսագրված</Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: (mat.costedQuantity ?? 0) > 0 ? '#222' : '#ccc' }}>
                                                        {(mat.costedQuantity ?? 0) > 0 ? mat.costedQuantity!.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                    {visibleAyl.length > 0 && (
                                        <>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 0.5 }}>
                                                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e0f5f7' }} />
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', whiteSpace: 'nowrap' }}>Այլ նյութեր</Typography>
                                                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e0f5f7' }} />
                                            </Box>
                                            {visibleAyl.map(ayl => (
                                                <Box key={ayl.id} sx={{ border: '1px solid #e0f5f7', borderRadius: 2, p: 1.5, bgcolor: '#fff', '&:hover': { bgcolor: '#f8fdfe', borderColor: mainPrimaryColor } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#222', flex: 1, pr: 1 }}>{ayl.name || '—'}</Typography>
                                                        <Tooltip title={t('Add new quantity')}>
                                                            <IconButton size='small' onClick={() => setAylModal({ entry: ayl, value: '' })} sx={{ color: mainPrimaryColor, bgcolor: 'rgba(0,171,190,0.08)', '&:hover': { bgcolor: 'rgba(0,171,190,0.18)' }, p: 0.6 }}>
                                                                <AddCircleOutlineIcon sx={{ fontSize: 22 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>{t('Unit')}</Typography>
                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#555' }}>{ayl.unit || '—'}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>Մուտքագրված</Typography>
                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: mainPrimaryColor }}>
                                                                {ayl.mutq.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>Ծախսագրված</Typography>
                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: parseFloat(ayl.tsakh || '0') > 0 ? '#222' : '#ccc' }}>
                                                                {parseFloat(ayl.tsakh || '0') > 0 ? parseFloat(ayl.tsakh).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </>
                                    )}
                                </Box>
                            );
                        })()}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, flexShrink: 0 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Close')}</Button>
            </DialogActions>
        </Dialog>

        {/* Material costing sub-modal */}
        <Dialog open={!!materialModal} onClose={() => setMaterialModal(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: '#1a1a1a', pb: 1, fontSize: '1rem' }}>
                {materialModal?.material.name}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>{t('Unit')}</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>{materialModal?.material.unit || '—'}</Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>Մուտքագրված</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: mainPrimaryColor }}>
                            {materialModal?.material.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                        </Typography>
                    </Box>
                </Box>
                {(materialModal?.material.costedQuantity ?? 0) > 0 && (
                    <Box sx={{ mb: 1.5, px: 1.5, py: 0.8, bgcolor: '#f0fbfc', borderRadius: 1.5 }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>
                            Ծախսագրված: <strong style={{ color: '#555' }}>{materialModal!.material.costedQuantity!.toLocaleString(undefined, { maximumFractionDigits: 3 })}</strong>
                        </Typography>
                    </Box>
                )}
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>{t('Quantity')}</Typography>
                    <InputBase
                        autoFocus
                        fullWidth
                        value={materialModal?.value ?? ''}
                        onChange={ev => setMaterialModal(prev => prev ? { ...prev, value: ev.target.value.replace(/[^0-9.]/g, '') } : prev)}
                        onKeyDown={ev => { if (ev.key === 'Enter') handleConfirm(); if (ev.key === 'Escape') setMaterialModal(null); }}
                        placeholder='0'
                        sx={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setMaterialModal(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                <Button
                    variant='contained'
                    onClick={handleConfirm}
                    disabled={!materialModal || !(parseFloat((materialModal.value ?? '').replace(',', '.')) > 0)}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                >
                    {t('Add')}
                </Button>
            </DialogActions>
        </Dialog>
        <Dialog open={!!aylModal} onClose={() => setAylModal(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: '#1a1a1a', pb: 1, fontSize: '1rem' }}>
                {aylModal?.entry.name}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>{t('Unit')}</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>{aylModal?.entry.unit || '—'}</Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>Մուտքագրված</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: mainPrimaryColor }}>
                            {aylModal?.entry.mutq.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                        </Typography>
                    </Box>
                </Box>
                {aylModal && parseFloat(aylModal.entry.tsakh || '0') > 0 && (
                    <Box sx={{ mb: 1.5, px: 1.5, py: 0.8, bgcolor: '#f0fbfc', borderRadius: 1.5 }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>
                            Ծախսագրված: <strong style={{ color: '#555' }}>{parseFloat(aylModal.entry.tsakh).toLocaleString(undefined, { maximumFractionDigits: 3 })}</strong>
                        </Typography>
                    </Box>
                )}
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>{t('Quantity')}</Typography>
                    <InputBase
                        autoFocus
                        fullWidth
                        value={aylModal?.value ?? ''}
                        onChange={ev => setAylModal(prev => prev ? { ...prev, value: ev.target.value.replace(/[^0-9.]/g, '') } : prev)}
                        onKeyDown={ev => { if (ev.key === 'Enter') handleAylConfirm(); if (ev.key === 'Escape') setAylModal(null); }}
                        placeholder='0'
                        sx={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setAylModal(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                <Button
                    variant='contained'
                    onClick={handleAylConfirm}
                    disabled={!aylModal || !(parseFloat((aylModal.value ?? '').replace(',', '.')) > 0)}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                >
                    {t('Add')}
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
}
