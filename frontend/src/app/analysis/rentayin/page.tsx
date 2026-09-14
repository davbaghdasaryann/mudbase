'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box, Typography, CircularProgress, Chip, TextField, IconButton, Tooltip,
} from '@mui/material';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';
import { useTranslation } from 'react-i18next';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';

interface RentayinRow {
    laborItemId: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    estimatedUnitCost: number;
    actualUnitCost: number | null;
    unitCostSource: 'actual' | 'library' | 'manual' | null;
    sectionName: string;
    subsectionName: string;
}

interface RentayinRecord {
    _id: string;
    estimateName: string;
    rows?: RentayinRow[];
    createdAt: string;
}

const SOURCE_CHIP: Record<string, { label: string; color: string }> = {
    actual: { label: 'Actual', color: '#2E7D32' },
    library: { label: 'Library', color: '#1565C0' },
    manual: { label: 'Manual', color: '#E65100' },
};

const GSEP = '1px solid #e8f4f6';
const ROW_LINE = '1px solid #f0f2f4';

const thBase: React.CSSProperties = {
    padding: '8px 10px', whiteSpace: 'nowrap',
    fontWeight: 600, fontSize: '0.75rem', color: '#6b7280',
    backgroundColor: '#fff', letterSpacing: '0.03em',
    textTransform: 'uppercase', border: 'none',
    borderBottom: '2px solid #e8f7f9',
};
const thStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({ ...thBase, ...extra });
const tdBase: React.CSSProperties = { padding: '7px 10px', fontSize: '0.82rem', verticalAlign: 'middle', border: 'none', borderBottom: ROW_LINE };
const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({ ...tdBase, ...extra });

export default function RentayinPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    const [records, setRecords] = useState<RentayinRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [detail, setDetail] = useState<RentayinRecord | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Api.requestSession<RentayinRecord[]>({ command: 'rentayin/fetch_all' })
            .then(data => { setRecords(data ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedId) { setDetail(null); return; }
        setDetailLoading(true);
        Api.requestSession<RentayinRecord>({ command: 'rentayin/fetch', args: { id: selectedId } })
            .then(data => { setDetail(data); setDetailLoading(false); })
            .catch(() => setDetailLoading(false));
    }, [selectedId]);

    useEffect(() => {
        if (editingIndex !== null) inputRef.current?.focus();
    }, [editingIndex]);

    const handleSelect = async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setCreating(true);
        try {
            const result = await Api.requestSession<RentayinRecord>({
                command: 'rentayin/create',
                args: { estimateId: estimate._id, estimateName: estimate.name },
            });
            setRecords(prev => [result, ...prev]);
            router.push(`?id=${result._id}`);
        } finally {
            setCreating(false);
        }
    };

    const handleSaveManual = async (rowIndex: number) => {
        if (!detail) return;
        const unitCost = parseFloat(editValue);
        if (isNaN(unitCost) || unitCost <= 0) return;
        setSaving(true);
        const row = (detail.rows ?? [])[rowIndex];
        const result = await Api.requestSession<{ ok: boolean; rows: RentayinRow[] }>({
            command: 'rentayin/update_row',
            args: { id: detail._id, laborItemId: row.laborItemId, rowIndex: String(rowIndex), unitCost: String(unitCost) },
        });
        setDetail(prev => prev ? { ...prev, rows: result.rows } : prev);
        setEditingIndex(null);
        setSaving(false);
    };

    const profitPct = (row: RentayinRow) => {
        if (!row.actualUnitCost || !row.estimatedUnitCost) return null;
        return ((row.estimatedUnitCost - row.actualUnitCost) / row.actualUnitCost) * 100;
    };

    // Detail view
    if (selectedId) {
        if (detailLoading || !detail) return (
            <PageContents title={t('Rentayin')}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
            </PageContents>
        );

        const rows = detail.rows ?? [];
        const totalEstimated = rows.reduce((s, r) => s + (r.estimatedUnitCost * r.quantity), 0);
        const totalActual = rows.reduce((s, r) => s + ((r.actualUnitCost ?? 0) * r.quantity), 0);
        const overallProfit = totalActual > 0 ? ((totalEstimated - totalActual) / totalActual) * 100 : null;
        const pendingCount = rows.filter(r => r.actualUnitCost === null).length;

        return (
            <PageContents title={detail.estimateName}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.push('/analysis/rentayin')} size='small' sx={{ border: `1px solid ${mainPrimaryColor}33`, borderRadius: 2 }}>
                            <ArrowBackIcon sx={{ fontSize: 18, color: mainPrimaryColor }} />
                        </IconButton>
                        <Typography variant='h6' sx={{ fontWeight: 600, flex: 1, fontSize: '1rem' }}>{detail.estimateName}</Typography>
                        {overallProfit !== null && (
                            <Chip
                                label={`${overallProfit >= 0 ? '+' : ''}${overallProfit.toFixed(1)}% ${t('profitability')}`}
                                sx={{ bgcolor: overallProfit >= 0 ? '#E8F5E9' : '#FFEBEE', color: overallProfit >= 0 ? '#2E7D32' : '#C62828', fontWeight: 600, fontSize: '0.78rem' }}
                            />
                        )}
                        {pendingCount > 0 && (
                            <Chip label={`${pendingCount} ${t('need manual entry')}`} sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontSize: '0.78rem' }} />
                        )}
                    </Box>

                    <Box sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fff' }}>
                        <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
                            <colgroup>
                                <col style={{ width: 44 }} />
                                <col style={{ width: 320 }} />
                                <col style={{ width: 70 }} />
                                {/* Նakhahashiv */}
                                <col style={{ width: 80 }} />
                                <col style={{ width: 130 }} />
                                <col style={{ width: 120 }} />
                                {/* Փastaci */}
                                <col style={{ width: 130 }} />
                                <col style={{ width: 90 }} />
                                <col style={{ width: 120 }} />
                                {/* Profit */}
                                <col style={{ width: 110 }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle' })}>#</th>
                                    <th rowSpan={2} style={thStyle({ textAlign: 'left', verticalAlign: 'middle' })}>Աշxatanqi anvanumы</th>
                                    <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle' })}>Mianor</th>
                                    <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: mainPrimaryColor })}>Նakhahashiv</th>
                                    <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: mainPrimaryColor })}>Փastaci</th>
                                    <th rowSpan={2} style={thStyle({ textAlign: 'right', verticalAlign: 'middle', borderLeft: GSEP })}>Shahutaberoution</th>
                                </tr>
                                <tr>
                                    <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af', borderLeft: GSEP })}>Qaanakk</th>
                                    <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Mianori Arzhekky</th>
                                    <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Endhanur</th>
                                    <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af', borderLeft: GSEP })}>Mianori Arzhekky</th>
                                    <th style={thStyle({ textAlign: 'center', fontSize: '0.7rem', color: '#9ca3af' })}>Aghbyur</th>
                                    <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Endhanur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => {
                                    const estTotal = row.estimatedUnitCost * row.quantity;
                                    const actTotal = row.actualUnitCost !== null ? row.actualUnitCost * row.quantity : null;
                                    const pct = profitPct(row);
                                    const isEditing = editingIndex === i;
                                    const src = row.unitCostSource ? SOURCE_CHIP[row.unitCostSource] : null;
                                    return (
                                        <tr
                                            key={i}
                                            style={{ backgroundColor: '#fff' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fdfe'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fff'; }}
                                        >
                                            <td style={tdStyle({ textAlign: 'center', color: '#bbb', fontSize: '0.74rem' })}>{i + 1}</td>
                                            <td style={tdStyle({ whiteSpace: 'normal' })}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#111' }}>{row.laborOfferItemName}</span>
                                                {(row.sectionName || row.subsectionName) && (
                                                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#999' }}>
                                                        {[row.sectionName, row.subsectionName].filter(Boolean).join(' › ')}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={tdStyle({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{row.unitSymbol}</td>
                                            {/* Նakhahashiv cols */}
                                            <td style={tdStyle({ textAlign: 'right', color: '#777', borderLeft: GSEP })}>{row.quantity.toLocaleString()}</td>
                                            <td style={tdStyle({ textAlign: 'right', color: '#555' })}>{row.estimatedUnitCost > 0 ? row.estimatedUnitCost.toLocaleString() : '—'}</td>
                                            <td style={tdStyle({ textAlign: 'right', fontWeight: 500, color: '#333' })}>{estTotal > 0 ? estTotal.toLocaleString() : '—'}</td>
                                            {/* Փastaci cols */}
                                            <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP })}>
                                                {isEditing ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                        <TextField
                                                            inputRef={inputRef}
                                                            size='small'
                                                            type='number'
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveManual(i); if (e.key === 'Escape') setEditingIndex(null); }}
                                                            sx={{ width: 100 }}
                                                            inputProps={{ min: 0 }}
                                                        />
                                                        <IconButton size='small' onClick={() => handleSaveManual(i)} disabled={saving} sx={{ color: mainPrimaryColor }}>
                                                            {saving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                                        </IconButton>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                        <span style={{ fontSize: '0.82rem', color: row.actualUnitCost ? '#111' : '#bbb' }}>
                                                            {row.actualUnitCost ? row.actualUnitCost.toLocaleString() : '—'}
                                                        </span>
                                                        <Tooltip title={t('Edit')} placement='top' arrow>
                                                            <IconButton size='small'
                                                                onClick={() => { setEditingIndex(i); setEditValue(row.actualUnitCost?.toString() ?? ''); }}
                                                                sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}>
                                                                <EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </td>
                                            <td style={tdStyle({ textAlign: 'center' })}>
                                                {src ? (
                                                    <Chip label={src.label} size='small' sx={{ fontSize: '0.68rem', bgcolor: `${src.color}18`, color: src.color, height: 20 }} />
                                                ) : (
                                                    <Chip label={t('Enter')} size='small'
                                                        onClick={() => { setEditingIndex(i); setEditValue(''); }}
                                                        sx={{ fontSize: '0.68rem', bgcolor: '#FFF3E0', color: '#E65100', height: 20, cursor: 'pointer' }} />
                                                )}
                                            </td>
                                            <td style={tdStyle({ textAlign: 'right', fontWeight: 500, color: actTotal !== null ? mainPrimaryColor : '#ddd' })}>
                                                {actTotal !== null ? actTotal.toLocaleString() : '—'}
                                            </td>
                                            {/* Profit */}
                                            <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP })}>
                                                {pct !== null ? (
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: pct >= 0 ? '#2E7D32' : '#C62828' }}>
                                                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                                    </span>
                                                ) : <span style={{ fontSize: '0.82rem', color: '#ccc' }}>—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Box>
                </Box>
            </PageContents>
        );
    }

    // List view
    if (loading) return (
        <PageContents title={t('Rentayin')}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
        </PageContents>
    );

    if (records.length === 0) return (
        <PageContents title={t('Rentayin')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 180px)', gap: 2 }}>
                <SavingsOutlinedIcon sx={{ fontSize: 100, color: mainPrimaryColor, opacity: 0.2 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No rentayin created yet')}</Typography>
                <PageButton
                    variant='outlined'
                    label={creating ? t('Loading...') : t('Create')}
                    size='large'
                    onClick={() => setDialogOpen(true)}
                    disabled={creating}
                    sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                />
            </Box>
            <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelect} />
        </PageContents>
    );

    return (
        <PageContents title={t('Rentayin')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <PageButton
                        variant='contained'
                        label={creating ? t('Loading...') : t('Create')}
                        onClick={() => setDialogOpen(true)}
                        disabled={creating}
                        sx={{ borderRadius: '25px', height: '36px', backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: mainPrimaryColor } }}
                    />
                </Box>
                {records.map(rec => {
                    const pending = (rec.rows ?? []).filter(r => r.actualUnitCost === null).length;
                    return (
                        <Box
                            key={rec._id}
                            onClick={() => router.push(`/analysis/rentayin?id=${rec._id}`)}
                            sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 2.5, py: 1.8, borderRadius: 2, border: '1px solid #e0f5f7',
                                backgroundColor: '#fafeff', cursor: 'pointer',
                                transition: 'box-shadow 0.15s, border-color 0.15s',
                                '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <SavingsOutlinedIcon sx={{ fontSize: 20, color: mainPrimaryColor, opacity: 0.6 }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.estimateName}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                                        {new Date(rec.createdAt).toLocaleDateString()}
                                        {pending > 0 && ` · ${pending} ${t('need manual entry')}`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
            <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelect} />
        </PageContents>
    );
}
