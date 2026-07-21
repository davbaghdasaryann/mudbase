'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress,
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
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
}

interface Props {
    open: boolean;
    onClose: () => void;
    estimate: EstimatesApi.ApiEstimate;
}

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

export default function VolumesDialog({ open, onClose, estimate }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [rows, setRows] = useState<LaborRow[]>([]);

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

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: mainPrimaryColor, pb: 1 }}>
                <ListAltIcon sx={{ fontSize: 22 }} />
                'Ծավալների գրանցում'
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
                                    {/* Section header */}
                                    <Box sx={{ bgcolor: '#e6f7f9', px: 2, py: 1, borderRadius: '8px 8px 0 0', borderLeft: `4px solid ${mainPrimaryColor}` }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: mainPrimaryColor }}>
                                            {sec.name}
                                        </Typography>
                                    </Box>
                                    {secSubs.length === 0 ? (
                                        <Box sx={{ px: 2, py: 1, borderLeft: '2px solid #e0f5f7', ml: 1 }}>
                                            <Typography sx={{ fontSize: '0.8rem', color: '#bbb' }}>{t('No sections found')}</Typography>
                                        </Box>
                                    ) : secSubs.map(sub => {
                                        const subRows = rows.filter(r => r.subsectionName === sub.name && r.sectionName === sec.name);
                                        return (
                                            <Box key={toId(sub._id)} sx={{ borderLeft: '2px solid #e0f5f7', ml: 1, mb: 0.5 }}>
                                                {/* Subsection header */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.8, bgcolor: '#f7fdfe' }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#444', flex: 1 }}>
                                                        {sub.name}
                                                    </Typography>
                                                </Box>
                                                {/* Items */}
                                                {subRows.length > 0 && (
                                                    <Box>
                                                        {/* Item header row */}
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', px: 2, py: 0.5, bgcolor: '#f0fbfc', borderTop: '1px solid #e0f5f7' }}>
                                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888' }}>{t('Description')}</Typography>
                                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textAlign: 'center' }}>{t('Unit')}</Typography>
                                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textAlign: 'center' }}>{t('Quantity')}</Typography>
                                                        </Box>
                                                        {subRows.map((row, i) => (
                                                            <Box key={row._id} sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', px: 2, py: 0.6, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: i % 2 === 0 ? '#fff' : '#fbfeff' }}>
                                                                <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>
                                                                    {row.laborOfferItemName || row.catalogName || '—'}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.82rem', color: '#666', textAlign: 'center' }}>
                                                                    {row.unitSymbol || '—'}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: mainPrimaryColor, textAlign: 'center' }}>
                                                                    {row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 }) ?? '—'}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
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
    );
}
