'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, IconButton, Tooltip, InputBase,
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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

interface GroupDialog {
    open: boolean;
    groupName: string;
    groupRow: LaborRow | null;
    items: LaborRow[];
    loading: boolean;
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
    const [groupDialog, setGroupDialog] = useState<GroupDialog>({ open: false, groupName: '', groupRow: null, items: [], loading: false });

    const getActualQty = (rowId: string) => parseFloat(actualData?.[rowId]?.quantity || '0') || 0;

    const handleGroupClick = async (row: LaborRow) => {
        setGroupDialog({ open: true, groupName: row.laborOfferItemName || row.catalogName || '—', groupRow: row, items: [], loading: true });
        try {
            const children = await Api.requestSession<any[]>({ command: 'estimate/fetch_group_works', args: { parentGroupRowId: toId(row._id) } });
            const mapped: LaborRow[] = (children ?? []).map(c => ({
                _id: typeof c._id === 'object' && c._id.$oid ? c._id.$oid : String(c._id),
                catalogName: '',
                laborOfferItemName: c.laborOfferItemName || c.catalogName || '',
                unitSymbol: c.itemMeasurementUnit || '',
                quantity: c.quantity || 0,
                subsectionName: row.subsectionName,
                sectionName: row.sectionName,
            }));
            setGroupDialog(prev => ({ ...prev, items: mapped, loading: false }));
        } catch {
            setGroupDialog(prev => ({ ...prev, loading: false }));
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

    const COLS = '1fr 80px 90px 120px 40px';
    const HEADERS = [t('Description'), t('Unit'), t('Quantity'), 'Ծախսագրում', ''];

    const renderSections = (secs: Section[], subs: Subsection[], rws: LaborRow[], accentColor = mainPrimaryColor, secBg = '#e6f7f9', subBg = '#f7fdfe') => (
        <>
        {secs.map(sec => {
            const secSubs = subs.filter(sub => toId(sub.estimateSectionId) === toId(sec._id)).sort((a, b) => a.displayIndex - b.displayIndex);
            return (
                <Box key={toId(sec._id)} sx={{ mb: 2 }}>
                    <Box sx={{ bgcolor: secBg, px: 2, py: 1, borderRadius: '8px 8px 0 0', borderLeft: `4px solid ${accentColor}` }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: accentColor }}>{sec.name}</Typography>
                    </Box>
                    {secSubs.length === 0 ? (
                        <Box sx={{ px: 2, py: 1, borderLeft: '2px solid #e0f5f7', ml: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#bbb' }}>{t('No sections found')}</Typography>
                        </Box>
                    ) : secSubs.map(sub => {
                        const subRows = rws.filter(r => r.subsectionName === sub.name && r.sectionName === sec.name);
                        return (
                            <Box key={toId(sub._id)} sx={{ borderLeft: `2px solid ${secBg}`, ml: 1, mb: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.8, bgcolor: subBg }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#444', flex: 1 }}>{sub.name}</Typography>
                                </Box>
                                {subRows.length > 0 && (
                                    <Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.5, bgcolor: '#f0fbfc', borderTop: '1px solid #e0f5f7' }}>
                                            {HEADERS.map((h, i) => (
                                                <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textAlign: i === 0 ? 'left' : 'center' }}>{h}</Typography>
                                            ))}
                                        </Box>
                                        {subRows.map((row, i) => {
                                            const gid = toId(row._id);
                                            const actualQty = getActualQty(gid);
                                            return (
                                                <Box key={gid} sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.6, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                                    {row.isGroupRow ? (
                                                        <Typography onClick={() => handleGroupClick(row)} sx={{ fontSize: '0.82rem', color: accentColor, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', fontWeight: 600, cursor: 'pointer' }}>
                                                            {row.laborOfferItemName || row.catalogName || '—'}
                                                        </Typography>
                                                    ) : (
                                                        <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>
                                                            {row.laborOfferItemName || row.catalogName || '—'}
                                                        </Typography>
                                                    )}
                                                    <Typography sx={{ fontSize: '0.82rem', color: '#666', textAlign: 'center' }}>{row.unitSymbol || '—'}</Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: accentColor, textAlign: 'center' }}>{row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '—'}</Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', textAlign: 'center' }}>{actualQty > 0 ? actualQty.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}</Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Tooltip title={t('Add new quantity')}>
                                                            <IconButton size='small' onClick={() => setCostModal({ row, value: '', spent: '' })} sx={{ color: '#ccc', p: 0.3, '&:hover': { color: accentColor } }}>
                                                                <AddCircleOutlineIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            );
        })}
        </>
    );

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#1a1a1a', pb: 1 }}>
                <ListAltIcon sx={{ fontSize: 22 }} />
                Ծավալների գրանցում
            </DialogTitle>
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

        {/* Group works dialog */}
        <Dialog open={groupDialog.open} onClose={() => setGroupDialog(prev => ({ ...prev, open: false }))} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '70vh' } }}>
            <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 1, fontSize: '1rem' }}>{groupDialog.groupName}</DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                {groupDialog.loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: mainPrimaryColor }} /></Box>
                ) : groupDialog.items.length === 0 ? (
                    <Typography sx={{ color: '#aaa', py: 2 }}>{t('No works')}</Typography>
                ) : (
                    <Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', px: 2, py: 0.5, bgcolor: '#f0fbfc', borderRadius: 1 }}>
                            {HEADERS.slice(0, 3).map((h, i) => (
                                <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textAlign: i === 0 ? 'left' : 'center' }}>{h}</Typography>
                            ))}
                        </Box>
                        {groupDialog.items.map((child, i) => (
                            <Box key={toId(child._id)} sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', px: 2, py: 0.6, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>{child.laborOfferItemName || child.catalogName || '—'}</Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: '#666', textAlign: 'center' }}>{child.unitSymbol || '—'}</Typography>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: mainPrimaryColor, textAlign: 'center' }}>{child.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '—'}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setGroupDialog(prev => ({ ...prev, open: false }))} sx={{ borderRadius: '20px', color: '#888' }}>{t('Close')}</Button>
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
