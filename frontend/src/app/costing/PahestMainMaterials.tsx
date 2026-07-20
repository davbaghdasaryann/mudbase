'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
    TextField, Button, CircularProgress, Chip,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

interface MaterialRow {
    materialItemId: string;
    name: string;
    fullCode: string;
    unit: string;
    estimateQuantity: number;
}

interface SavedEntry {
    materialItemId: string;
    name: string;
    unit: string;
    quantity: number;
}

interface Props {
    estimateId: string;
    // persist entries across re-opens
    saved: SavedEntry[];
    onSave: (entries: SavedEntry[]) => void;
}

function toIdStr(id: unknown): string {
    if (id == null) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && 'oid' in (id as any)) return (id as any).oid;
    return String(id);
}

export default function PahestMainMaterials({ estimateId, saved, onSave }: Props) {
    const { t } = useTranslation();
    const [materials, setMaterials] = useState<MaterialRow[]>([]);
    const [loading, setLoading] = useState(true);
    // qty inputs keyed by materialItemId
    const [inputs, setInputs] = useState<Record<string, string>>(() => {
        const m: Record<string, string> = {};
        for (const e of saved) m[e.materialItemId] = String(e.quantity);
        return m;
    });

    useEffect(() => {
        setLoading(true);
        Api.requestSession<any[]>({
            command: 'estimate/fetch_materials_list',
            args: { estimateId },
        }).then(items => {
            const seen = new Set<string>();
            const rows: MaterialRow[] = [];
            for (const item of items) {
                const id = toIdStr(item.materialItemId);
                if (!id || seen.has(id)) { if (id) { /* accumulate quantity */ const r = rows.find(r => r.materialItemId === id); if (r) r.estimateQuantity += item.quantity ?? 0; } continue; }
                seen.add(id);
                const md = item.estimateMaterialItemData?.[0];
                rows.push({
                    materialItemId: id,
                    name: md?.name || '—',
                    fullCode: md?.fullCode || '',
                    unit: item.estimateMeasurementUnitData?.[0]?.representationSymbol || '',
                    estimateQuantity: item.quantity ?? 0,
                });
            }
            setMaterials(rows);
        }).catch(console.error).finally(() => setLoading(false));
    }, [estimateId]);

    const handleSave = () => {
        const entries: SavedEntry[] = materials
            .filter(m => inputs[m.materialItemId] && parseFloat(inputs[m.materialItemId]) > 0)
            .map(m => ({
                materialItemId: m.materialItemId,
                name: m.name,
                unit: m.unit,
                quantity: parseFloat(inputs[m.materialItemId]),
            }));
        onSave(entries);
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
        </Box>
    );

    if (materials.length === 0) return (
        <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
            {t('No materials found for this estimate.')}
        </Typography>
    );

    return (
        <Box>
            <Table size='small' sx={{ mb: 2 }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#edf9fb' }}>
                        <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Code')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Material')}</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Unit')}</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Est. Qty')}</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor, minWidth: 120 }}>
                            {t('Warehouse Qty')}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {materials.map(mat => {
                        const val = inputs[mat.materialItemId] ?? '';
                        const saved_ = saved.find(s => s.materialItemId === mat.materialItemId);
                        return (
                            <TableRow key={mat.materialItemId} hover sx={{ '&:hover': { backgroundColor: '#f2fcfd' } }}>
                                <TableCell>
                                    <Typography variant='body2' sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                                        {mat.fullCode}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {mat.name}
                                        {saved_ && (
                                            <Chip label={t('Saved')} size='small'
                                                sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'rgba(0,171,190,0.1)', color: mainPrimaryColor, fontWeight: 700 }} />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align='right'>{mat.unit}</TableCell>
                                <TableCell align='right' sx={{ color: '#888' }}>
                                    {mat.estimateQuantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                </TableCell>
                                <TableCell align='right'>
                                    <TextField
                                        size='small'
                                        value={val}
                                        onChange={e => setInputs(prev => ({ ...prev, [mat.materialItemId]: e.target.value.replace(/[^0-9.]/g, '') }))}
                                        placeholder='0'
                                        inputProps={{ style: { textAlign: 'right', padding: '4px 8px', width: 90 } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                                '& fieldset': { borderColor: '#d0f0f4' },
                                                '&:hover fieldset': { borderColor: mainPrimaryColor },
                                                '&.Mui-focused fieldset': { borderColor: mainPrimaryColor },
                                            },
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant='contained'
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSave}
                    sx={{ borderRadius: '20px', bgcolor: mainPrimaryColor, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#009aab' } }}
                >
                    {t('Save')}
                </Button>
            </Box>
        </Box>
    );
}
