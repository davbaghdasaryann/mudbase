'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, IconButton, Tooltip, InputBase, Collapse, Divider,
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { type CostHistoryEntry } from './page';
import { mainPrimaryColor } from '@/theme';

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
    isGroupRow?: boolean;
}

interface CostModalState {
    row: LaborRow;
    value: string;
    spent: string;
}

type SnapshotData = { laborRows: LaborRow[]; sections: Section[]; subsections: Subsection[] };

interface Props {
    open: boolean;
    onClose: () => void;
    estimate: EstimatesApi.ApiEstimate;
    estimateSnapshot?: SnapshotData | null;
    unforeseenEstimate?: EstimatesApi.ApiEstimate | null;
    unforeseenSnapshot?: SnapshotData | null;
    onCostAdded: (entry: CostHistoryEntry) => void;
    onActualUpdate?: (rowId: string, qty: number, spent: number) => void;
    actualData?: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
}

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

async function fetchEstimateData(estimateId: string) {
    const [laborData, sectData] = await Promise.all([
        Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
    ]);
    const sorted = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
    const arrays = await Promise.all(
        sorted.map(s =>
            Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: toId(s._id) } })
                .catch(() => [] as Subsection[])
        )
    );
    return { sections: sorted, subsections: arrays.flat(), rows: laborData ?? [] };
}

export default function VolumesDialog({ open, onClose, estimate, estimateSnapshot, unforeseenEstimate, unforeseenSnapshot, onCostAdded, onActualUpdate, actualData }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [ufSections, setUfSections] = useState<Section[]>([]);
    const [ufSubsections, setUfSubsections] = useState<Subsection[]>([]);
    const [ufRows, setUfRows] = useState<LaborRow[]>([]);
    const [costModal, setCostModal] = useState<CostModalState | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
    const [groupChildren, setGroupChildren] = useState<Record<string, LaborRow[]>>({});
    const [openedSecs, setOpenedSecs] = useState<Set<string>>(new Set());
    const [openedSubs, setOpenedSubs] = useState<Set<string>>(new Set());
    const toggleSec = (id: string) => setOpenedSecs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleSub = (id: string) => setOpenedSubs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const getActualQty = (rowId: string) => parseFloat(actualData?.[rowId]?.quantity || '0') || 0;

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
                _id: typeof c._id === 'object' && c._id.$oid ? c._id.$oid : String(c._id),
                catalogName: '',
                laborOfferItemName: c.laborOfferItemName || c.catalogName || '',
                unitSymbol: c.itemMeasurementUnit || '',
                quantity: c.quantity || 0,
                subsectionName: row.subsectionName,
                sectionName: row.sectionName,
            }));
            setGroupChildren(prev => ({ ...prev, [gid]: mapped }));
        } finally {
            setLoadingGroups(prev => { const s = new Set(prev); s.delete(gid); return s; });
        }
    };

    const estimateId = toId(estimate._id);
    const ufEstimateId = unforeseenEstimate ? toId(unforeseenEstimate._id) : '';

    useEffect(() => {
        if (!open) return;
        if (estimateSnapshot) {
            setSections(estimateSnapshot.sections);
            setSubsections(estimateSnapshot.subsections);
            setRows(estimateSnapshot.laborRows);
            if (unforeseenSnapshot) {
                setUfSections(unforeseenSnapshot.sections);
                setUfSubsections(unforeseenSnapshot.subsections);
                setUfRows(unforeseenSnapshot.laborRows);
            } else if (ufEstimateId) {
                fetchEstimateData(ufEstimateId).then(d => { setUfSections(d.sections); setUfSubsections(d.subsections); setUfRows(d.rows); }).catch(console.error);
            } else {
                setUfSections([]); setUfSubsections([]); setUfRows([]);
            }
            return;
        }
        setLoading(true);
        const fetches: Promise<void>[] = [
            fetchEstimateData(estimateId).then(d => { setSections(d.sections); setSubsections(d.subsections); setRows(d.rows); }),
        ];
        if (ufEstimateId) {
            fetches.push(fetchEstimateData(ufEstimateId).then(d => { setUfSections(d.sections); setUfSubsections(d.subsections); setUfRows(d.rows); }));
        } else {
            setUfSections([]); setUfSubsections([]); setUfRows([]);
        }
        Promise.all(fetches).catch(console.error).finally(() => setLoading(false));
    }, [open, estimateId, ufEstimateId, estimateSnapshot, unforeseenSnapshot]);

    const handleConfirmCost = () => {
        if (!costModal) return;
        const { row, value } = costModal;
        const qty = parseFloat(value.replace(',', '.')) || 0;
        if (qty <= 0) return;
        onActualUpdate?.(toId(row._id), qty, 0);
        onCostAdded({
            id: String(Date.now() + Math.random()),
            laborItemId: row._id,
            workName: row.laborOfferItemName || row.catalogName || '—',
            unit: row.unitSymbol || '',
            quantity: qty,
            unitPrice: 0,
            total: 0,
            addedAt: new Date(),
        });
        setCostModal(null);
    };

    const COLS = '24px 1fr 80px 90px 120px 40px';
    const HEADERS = ['', t('Description'), t('Unit'), t('Quantity'), 'Ծախսագրում', ''];

    const renderSections = (secs: Section[], subs: Subsection[], rws: LaborRow[], accentColor = mainPrimaryColor, secBg = '#e6f7f9', subBg = '#f7fdfe') => (
        <>
        {secs.map(sec => {
            const secSubs = subs.filter(sub => toId(sub.estimateSectionId) === toId(sec._id)).sort((a, b) => a.displayIndex - b.displayIndex);
            return (
                <Box key={toId(sec._id)} sx={{ mb: 1.5, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                    <Box
                        onClick={() => toggleSec(toId(sec._id))}
                        sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', px: 2, py: 1, borderLeft: `3px solid ${accentColor}`, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#efefef' } }}
                    >
                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#333', flex: 1 }}>{sec.name}</Typography>
                        <ExpandMoreIcon sx={{ fontSize: 17, color: '#999', transition: 'transform 0.2s', transform: openedSecs.has(toId(sec._id)) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                    </Box>
                    <Collapse in={openedSecs.has(toId(sec._id))}>
                    {secSubs.length === 0 ? (
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#bbb' }}>{t('No sections found')}</Typography>
                        </Box>
                    ) : secSubs.map(sub => {
                        const subRows = rws.filter(r => r.subsectionName === sub.name && r.sectionName === sec.name);
                        const subKey = toId(sec._id) + '|' + toId(sub._id);
                        return (
                            <Box key={toId(sub._id)} sx={{ borderTop: '1px solid #f0f0f0' }}>
                                <Box onClick={() => toggleSub(subKey)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.75, bgcolor: '#fafafa', cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#f3f3f3' } }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#555', flex: 1 }}>{sub.name}</Typography>
                                    <ExpandMoreIcon sx={{ fontSize: 15, color: '#bbb', transition: 'transform 0.2s', transform: openedSubs.has(subKey) ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                </Box>
                                <Collapse in={openedSubs.has(subKey)}>
                                {subRows.length > 0 && (
                                    <Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.5, bgcolor: '#f0fbfc', borderTop: '1px solid #e0f5f7' }}>
                                            {['', t('Description'), t('Unit'), t('Quantity'), 'Ծախսագրում', ''].map((h, i) => (
                                                <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textAlign: i <= 1 ? 'left' : 'center' }}>{i === 4 ? '' : h}</Typography>
                                            ))}
                                        </Box>
                                        {subRows.length === 0 ? null : subRows.map((row, i) => {
                                            const gid = toId(row._id);
                                            const actualQty = getActualQty(gid);
                                            const isExpanded = expandedGroups.has(gid);
                                            const isLoadingG = loadingGroups.has(gid);
                                            const children = groupChildren[gid] ?? [];
                                            return (
                                                <React.Fragment key={gid}>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.6, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {row.isGroupRow && (
                                                                isLoadingG ? (
                                                                    <CircularProgress size={12} sx={{ color: accentColor }} />
                                                                ) : (
                                                                    <IconButton size='small' onClick={(e) => handleGroupToggle(e, gid, row)} sx={{ p: 0.2, color: accentColor }}>
                                                                        {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
                                                                    </IconButton>
                                                                )
                                                            )}
                                                        </Box>
                                                        <Typography sx={{ fontSize: '0.82rem', color: row.isGroupRow ? accentColor : '#333', fontWeight: row.isGroupRow ? 600 : 400 }}>
                                                            {row.laborOfferItemName || row.catalogName || '—'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.82rem', color: '#666', textAlign: 'center' }}>{row.unitSymbol || '—'}</Typography>
                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: accentColor, textAlign: 'center' }}>{row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '—'}</Typography>
                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', textAlign: 'center' }}>{actualQty > 0 ? actualQty.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}</Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                            <Tooltip title={t('Add new quantity')}>
                                                                <IconButton size='small' onClick={() => setCostModal({ row, value: '', spent: '' })} sx={{ color: '#ccc', p: 0.3, '&:hover': { color: accentColor } }}>
                                                                    <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>
                                                    {isExpanded && children.map((child, ci) => (
                                                        <Box key={toId(child._id)} sx={{ display: 'grid', gridTemplateColumns: COLS, pl: 4, pr: 2, py: 0.5, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: ci % 2 === 0 ? '#f8feff' : '#f3fbfc', borderLeft: `3px solid ${accentColor}22` }}>
                                                            <Box />
                                                            <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>{child.laborOfferItemName || child.catalogName || '—'}</Typography>
                                                            <Typography sx={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>{child.unitSymbol || '—'}</Typography>
                                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: accentColor, textAlign: 'center' }}>{child.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '—'}</Typography>
                                                            <Box /><Box />
                                                        </Box>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </Box>
                                )}
                                </Collapse>
                            </Box>
                        );
                    })}
                    </Collapse>
                </Box>
            );
        })}
        </>
    );

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}>
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(230,81,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ListAltIcon sx={{ fontSize: 20, color: '#E65100' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Ծավալների գրանցում</Typography>
                    </Box>
                    <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>
            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />
            <DialogContent sx={{ pt: 0, pb: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                    </Box>
                ) : sections.length === 0 ? (
                    <Typography sx={{ color: '#aaa', py: 4, textAlign: 'center' }}>{t('No sections found')}</Typography>
                ) : (
                    <Box>
                        {renderSections(sections, subsections, rows)}
                        {ufSections.length > 0 && (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1, px: 1 }}>
                                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#e65100', whiteSpace: 'nowrap' }}>Չնախատեսված աշխատանքներ</Typography>
                                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#ffe0cc' }} />
                                </Box>
                                {renderSections(ufSections, ufSubsections, ufRows, '#e65100', '#fff8f4', '#fff3ee')}
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Close')}</Button>
            </DialogActions>
        </Dialog>

        {/* Cost entry sub-modal */}
        <Dialog open={!!costModal} onClose={() => setCostModal(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: '#1a1a1a', pb: 1, fontSize: '1rem' }}>
                Ծախսագրում
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: '0.88rem', color: '#555', mb: 2 }}>
                    {costModal?.row.laborOfferItemName || costModal?.row.catalogName || '—'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 1.5, px: 1.5, py: 1 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 0.5 }}>Քանակը</Typography>
                        <InputBase
                            autoFocus
                            fullWidth
                            value={costModal?.value ?? ''}
                            onChange={ev => setCostModal(prev => prev ? { ...prev, value: ev.target.value.replace(/[^0-9.]/g, '') } : prev)}
                            onKeyDown={ev => { if (ev.key === 'Escape') setCostModal(null); }}
                            placeholder='0'
                            sx={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setCostModal(null)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                <Button
                    variant='contained'
                    onClick={handleConfirmCost}
                    disabled={!costModal || !(parseFloat((costModal.value ?? '').replace(',', '.')) > 0)}
                    sx={{ borderRadius: '20px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#009aab' } }}
                >
                    {t('Add')}
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
}
