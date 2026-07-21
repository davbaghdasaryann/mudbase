'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, IconButton, Tooltip, InputBase,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';
import { type PahestEntry } from './PahestMainMaterials';

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

interface Props {
    open: boolean;
    onClose: () => void;
    estimate: EstimatesApi.ApiEstimate;
    pahestEntries: PahestEntry[];
    onPahestUpdate: (materialItemId: string, qty: number) => void;
}

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

export default function MaterialsDialog({ open, onClose, estimate, pahestEntries, onPahestUpdate }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [materialModal, setMaterialModal] = useState<MaterialModalState | null>(null);

    const estimateId = toId(estimate._id);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
        ])
            .then(async ([laborData, sectData]) => {
                const sorted = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sorted);
                setRows(laborData ?? []);
                const arrays = await Promise.all(
                    sorted.map(s =>
                        Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: toId(s._id) } })
                            .catch(() => [] as Subsection[])
                    )
                );
                setSubsections(arrays.flat());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open, estimateId]);

    const handleConfirm = () => {
        if (!materialModal) return;
        const qty = parseFloat(materialModal.value.replace(',', '.')) || 0;
        if (qty <= 0) return;
        onPahestUpdate(materialModal.material.materialItemId, qty);
        setMaterialModal(null);
    };

    const toggleRow = (rowId: string) => {
        setExpandedRowId(prev => prev === rowId ? null : rowId);
    };

    const COLS = '1fr 72px 110px 110px 36px';

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 22 }} />
                Նյութերի ծախսագրում
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
                        {sections.map(sec => {
                            const secSubs = subsections
                                .filter(sub => toId(sub.estimateSectionId) === toId(sec._id))
                                .sort((a, b) => a.displayIndex - b.displayIndex);
                            return (
                                <Box key={toId(sec._id)} sx={{ mb: 2 }}>
                                    <Box sx={{ bgcolor: '#e6f7f9', px: 2, py: 1, borderRadius: '8px 8px 0 0', borderLeft: `4px solid ${mainPrimaryColor}` }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: mainPrimaryColor }}>{sec.name}</Typography>
                                    </Box>
                                    {secSubs.map(sub => {
                                        const subRows = rows.filter(r => r.subsectionName === sub.name && r.sectionName === sec.name);
                                        if (subRows.length === 0) return null;
                                        return (
                                            <Box key={toId(sub._id)} sx={{ borderLeft: '2px solid #e0f5f7', ml: 1, mb: 0.5 }}>
                                                <Box sx={{ px: 2, py: 0.8, bgcolor: '#f7fdfe' }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#444' }}>{sub.name}</Typography>
                                                </Box>
                                                {subRows.map(row => {
                                                    const rowId = toId(row._id);
                                                    const isExpanded = expandedRowId === rowId;
                                                    return (
                                                        <Box key={rowId}>
                                                            <Box
                                                                onClick={() => toggleRow(rowId)}
                                                                sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.7, cursor: 'pointer', borderTop: '1px solid #f0fbfc', '&:hover': { bgcolor: '#f2fcfd' } }}
                                                            >
                                                                <Typography sx={{ flex: 1, fontSize: '0.82rem', color: '#333' }}>
                                                                    {row.laborOfferItemName || row.catalogName || '—'}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.78rem', color: '#888', mr: 1 }}>
                                                                    {row.unitSymbol}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: mainPrimaryColor, mr: 1 }}>
                                                                    {row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                                </Typography>
                                                                {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16, color: '#aaa' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#aaa' }} />}
                                                            </Box>
                                                            {isExpanded && (
                                                                <Box sx={{ ml: 2, mr: 1, mb: 1, border: '1px solid #e0f5f7', borderRadius: 1.5, overflow: 'hidden' }}>
                                                                    {pahestEntries.length === 0 ? (
                                                                        <Typography sx={{ fontSize: '0.82rem', color: '#bbb', px: 2, py: 1.5, textAlign: 'center' }}>Պահեստում նյութերի չկան</Typography>
                                                                    ) : (
                                                                        <>
                                                                            <Box sx={{ display: 'grid', gridTemplateColumns: COLS, bgcolor: '#edf9fb', px: 2, py: 0.8, columnGap: 1 }}>
                                                                                {[t('Material'), t('Unit'), 'Մուտքագրված', 'Ծախսագրված', ''].map((h, i) => (
                                                                                    <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#222', textAlign: i === 0 ? 'left' : 'center' }}>{h}</Typography>
                                                                                ))}
                                                                            </Box>
                                                                            {pahestEntries.map((mat, i) => (
                                                                                <Box key={mat.materialItemId} sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.6, columnGap: 1, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                                                                    <Typography sx={{ fontSize: '0.82rem', color: '#333', fontWeight: 500 }}>{mat.name}</Typography>
                                                                                    <Typography sx={{ fontSize: '0.82rem', color: '#888', textAlign: 'center' }}>{mat.unit}</Typography>
                                                                                    <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: mainPrimaryColor, textAlign: 'center' }}>
                                                                                        {mat.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                                                                    </Typography>
                                                                                    <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: (mat.costedQuantity ?? 0) > 0 ? '#333' : '#ccc', textAlign: 'center' }}>
                                                                                        {(mat.costedQuantity ?? 0) > 0 ? (mat.costedQuantity!).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                                                                                    </Typography>
                                                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                                                        <Tooltip title={t('Add new quantity')}>
                                                                                            <IconButton size='small' onClick={() => setMaterialModal({ material: mat, value: '' })} sx={{ color: '#ccc', p: 0.3, '&:hover': { color: mainPrimaryColor } }}>
                                                                                                <AddCircleOutlineIcon sx={{ fontSize: 14 }} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Box>
                                                                                </Box>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ borderRadius: '20px', color: '#888' }}>{t('Close')}</Button>
            </DialogActions>
        </Dialog>

        {/* Material costing sub-modal */}
        <Dialog open={!!materialModal} onClose={() => setMaterialModal(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: mainPrimaryColor, pb: 1, fontSize: '1rem' }}>
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
        </>
    );
}
