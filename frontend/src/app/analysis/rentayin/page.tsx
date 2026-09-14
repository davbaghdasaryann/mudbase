'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box, Typography, CircularProgress, Chip, TextField, IconButton, Tooltip, Tab,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
    estimatedMaterialUnitCost: number;
    actualLaborUnitCost: number | null;
    actualMaterialUnitCost: number | null;
    actualUnitCost: number | null;
    unitCostSource: 'actual' | 'library' | 'manual' | null;
    sectionName: string;
    subsectionName: string;
}

interface RentayinRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
    rows?: RentayinRow[];
    createdAt: string;
}

interface LaborRow { _id: string; laborItemId: string; isGroupRow: boolean; fullCode: string; catalogName: string; laborOfferItemName: string; unitSymbol: string; quantity: number; changableAveragePrice: number; cost: number; subsectionName: string; sectionName: string; }
interface GroupedLabor { laborItemId: string; fullCode: string; name: string; unitSymbol: string; totalCost: number; totalQuantity: number; items: LaborRow[]; }
interface MaterialRow { _id: string; materialItemId: string; laborCatalogName: string; laborFullCode: string; laborOfferItemName: string; materialCatalogName: string; materialCatalogFullCode: string; materialOfferItemName: string; unitSymbol: string; quantity: number; cost: number; }
interface GroupedByMaterial { materialItemId: string; materialFullCode: string; materialName: string; unitSymbol: string; totalCost: number; totalQuantity: number; items: MaterialRow[]; }

const SOURCE_CHIP: Record<string, { label: string; color: string }> = {
    actual: { label: 'Actual', color: '#2E7D32' },
    library: { label: 'Library', color: '#1565C0' },
    manual: { label: 'Manual', color: '#E65100' },
};

const GSEP = '1px solid #e8f4f6';
const ROW_LINE = '1px solid #f0f2f4';

const thBase: React.CSSProperties = {
    padding: '8px 10px', whiteSpace: 'nowrap', position: 'relative',
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
    const [tab, setTab] = useState('table');
    const [worksExpanded, setWorksExpanded] = useState<Record<string, boolean>>({});
    const [matsExpanded, setMatsExpanded] = useState<Record<string, boolean>>({});
    const [laborGroups, setLaborGroups] = useState<GroupedLabor[]>([]);
    const [laborGroupsLoading, setLaborGroupsLoading] = useState(false);
    const [matGroups, setMatGroups] = useState<GroupedByMaterial[]>([]);
    const [matGroupsLoading, setMatGroupsLoading] = useState(false);
    const [laborExpanded, setLaborExpanded] = useState<Record<string, boolean>>({});
    const [matGroupExpanded, setMatGroupExpanded] = useState<Record<string, boolean>>({});
    const [colWidths, setColWidths] = useState([44, 360, 70, 80, 130, 120, 80, 130, 120, 160, 90]);
    const inputRef = useRef<HTMLInputElement>(null);
    const resizingRef = useRef<{ ci: number; startX: number; startW: number } | null>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const scrollDragRef = useRef<{ startX: number; scrollLeft: number } | null>(null);

    useEffect(() => {
        Api.requestSession<RentayinRecord[]>({ command: 'rentayin/fetch_all' })
            .then(data => { setRecords(data ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedId) { setDetail(null); return; }
        setDetailLoading(true);
        Api.requestSession<RentayinRecord>({ command: 'rentayin/fetch', args: { id: selectedId } })
            .then(data => { setDetail(data); setDetailLoading(false);
 })
            .catch(() => setDetailLoading(false));
    }, [selectedId]);
    useEffect(() => {
        const estimateId = detail?.estimateId;
        if (!estimateId) return;
        if (tab === 'works' && laborGroups.length === 0) {
            setLaborGroupsLoading(true);
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } })
                .then(rows_ => {
                    const map = new Map<string, GroupedLabor>();
                    for (const row of (rows_ ?? [])) {
                        const key = String(row.laborItemId);
                        const displayName = row.isGroupRow ? (row.laborOfferItemName || row.catalogName) : row.catalogName;
                        if (!map.has(key)) map.set(key, { laborItemId: key, fullCode: row.fullCode, name: displayName, unitSymbol: row.unitSymbol ?? '', totalCost: 0, totalQuantity: 0, items: [] });
                        const g = map.get(key)!;
                        g.totalCost += row.cost;
                        g.totalQuantity += Number(row.quantity ?? 0);
                        g.items.push(row);
                    }
                    setLaborGroups(Array.from(map.values()));
                })
                .finally(() => setLaborGroupsLoading(false));
        }
        if (tab === 'materials' && matGroups.length === 0) {
            setMatGroupsLoading(true);
            Api.requestSession<MaterialRow[]>({ command: 'estimate/fetch_materials_for_analysis', args: { estimateId } })
                .then(rows_ => {
                    const map = new Map<string, GroupedByMaterial>();
                    for (const row of (rows_ ?? [])) {
                        const key = String(row.materialItemId);
                        if (!map.has(key)) map.set(key, { materialItemId: key, materialFullCode: row.materialCatalogFullCode, materialName: row.materialCatalogName || row.materialOfferItemName, unitSymbol: row.unitSymbol ?? '', totalCost: 0, totalQuantity: 0, items: [] });
                        const g = map.get(key)!;
                        g.totalCost += row.cost;
                        g.totalQuantity += Number(row.quantity ?? 0);
                        g.items.push(row);
                    }
                    setMatGroups(Array.from(map.values()));
                })
                .finally(() => setMatGroupsLoading(false));
        }
    }, [tab, detail?.estimateId]);

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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t('Delete this rentayin?'))) return;
        await Api.requestSession({ command: 'rentayin/delete', args: { id } });
        setRecords(prev => prev.filter(r => r._id !== id));
    };

    const startResize = (e: React.MouseEvent, ci: number) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = { ci, startX: e.clientX, startW: colWidths[ci] };
        const onMove = (ev: MouseEvent) => {
            if (!resizingRef.current) return;
            const { ci, startW, startX } = resizingRef.current;
            const newW = Math.max(40, startW + ev.clientX - startX);
            setColWidths(prev => { const n = [...prev]; n[ci] = newW; return n; });
        };
        const onUp = () => { resizingRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
    const rh = (ci: number) => (
        <div onMouseDown={(e) => startResize(e, ci)}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize', zIndex: 2, background: 'transparent' }} />
    );

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
                <TabContext value={tab}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => router.push('/analysis/rentayin')} size='small' sx={{ color: 'text.secondary', mr: 0.5, '&:hover': { color: mainPrimaryColor } }}>
                                <ArrowBackIcon fontSize='small' />
                            </IconButton>
                            <TabList onChange={(_, v) => setTab(v)} sx={{ '& .MuiTabs-indicator': { backgroundColor: '#00A390' }, '& .MuiTab-root.Mui-selected': { color: '#00A390' } }}>
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><SavingsOutlinedIcon sx={{ fontSize: 18 }} />Ընդհանուր</Box>} value='general' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><TableChartOutlinedIcon sx={{ fontSize: 18 }} />{t('Analysis')}</Box>} value='table' />
                                <Tab label='Աշխատանքներ' value='works' />
                                <Tab label='Նյութեր' value='materials' />
                            </TabList>
                            <Box sx={{ flex: 1 }} />
                            {overallProfit !== null && (
                                <Chip
                                    label={`${overallProfit >= 0 ? '+' : ''}${overallProfit.toFixed(1)}% ${t('profitability')}`}
                                    sx={{ bgcolor: overallProfit >= 0 ? '#E8F5E9' : '#FFEBEE', color: overallProfit >= 0 ? '#2E7D32' : '#C62828', fontWeight: 600, fontSize: '0.78rem' }}
                                />
                            )}
                            {pendingCount > 0 && (
                                <Chip label={`${pendingCount} ${t('need manual entry')}`} sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontSize: '0.78rem', ml: 1 }} />
                            )}
                        </Box>
                    </Box>

                    {tab === 'table' && (() => {
                        // Build section/subsection order from row data
                        const sections: string[] = [];
                        const subsMap = new Map<string, string[]>();
                        rows.forEach(row => {
                            const sec = row.sectionName || '';
                            const sub = row.subsectionName || '';
                            if (!sections.includes(sec)) sections.push(sec);
                            if (!subsMap.has(sec)) subsMap.set(sec, []);
                            const subs = subsMap.get(sec)!;
                            if (!subs.includes(sub)) subs.push(sub);
                        });
                        const NCOLS = 11;
                        let rowCounter = 0;
                        return (
                            <Box
                                ref={tableContainerRef}
                                onMouseDown={(e) => {
                                    const t = e.target as HTMLElement;
                                    if (t.style.cursor === 'col-resize' || t.closest('button,input,a')) return;
                                    scrollDragRef.current = { startX: e.clientX, scrollLeft: tableContainerRef.current?.scrollLeft ?? 0 };
                                }}
                                onMouseMove={(e) => {
                                    if (!scrollDragRef.current || !tableContainerRef.current) return;
                                    tableContainerRef.current.scrollLeft = scrollDragRef.current.scrollLeft - (e.clientX - scrollDragRef.current.startX);
                                }}
                                onMouseUp={() => { scrollDragRef.current = null; }}
                                onMouseLeave={() => { scrollDragRef.current = null; }}
                                sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fff', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
                                <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', minWidth: 1200 }}>
                                    <colgroup>{colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                                    <thead>
                                        <tr>
                                            <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', borderLeft: GSEP })}>#
                                            {rh(0)}</th>
                                            <th rowSpan={2} style={thStyle({ textAlign: 'left', verticalAlign: 'middle' })}>Աշխատանքի անվանումը{rh(1)}</th>
                                            <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle' })}>Միավոր{rh(2)}</th>
                                            <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: mainPrimaryColor })}>Նախահաշիվ</th>
                                            <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: mainPrimaryColor })}>Հաշվարկային</th>
                                            <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', borderLeft: GSEP, whiteSpace: 'normal' as const })}>Շահութաբերություն{rh(9)}</th>
                                            <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', borderLeft: GSEP })}>Աղբյուր{rh(10)}</th>
                                        </tr>
                                        <tr>
                                            <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af', borderLeft: GSEP })}>քանակ{rh(3)}</th>
                                            <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Միավորի Արժեքը{rh(4)}</th>
                                            <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Ընդհանուր{rh(5)}</th>
                                            <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af', borderLeft: GSEP })}>քանակ{rh(6)}</th>
                                                        <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Միավորի Արժեքը{rh(7)}</th>
                                            <th style={thStyle({ textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af' })}>Ընդհանուր{rh(8)}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sections.map((sec, si) => {
                                            const subs = subsMap.get(sec) ?? [];
                                            return (
                                                <React.Fragment key={`sec-${si}`}>
                                                    {sec && (
                                                        <tr>
                                                            <td colSpan={NCOLS} style={tdStyle({
                                                                fontWeight: 700, fontSize: '0.78rem', color: '#00818f',
                                                                paddingLeft: 12, paddingTop: si > 0 ? 18 : 10, paddingBottom: 4,
                                                                letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                                                                borderBottom: '1px solid #d6eef1', backgroundColor: '#f9feff',
                                                            })}>
                                                                {si + 1}. {sec}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {subs.map((sub, subI) => {
                                                        const subRows = rows.filter(r => (r.sectionName || '') === sec && (r.subsectionName || '') === sub);
                                                        return (
                                                            <React.Fragment key={`sub-${si}-${subI}`}>
                                                                {sub && (
                                                                    <tr>
                                                                        <td colSpan={NCOLS} style={tdStyle({
                                                                            paddingLeft: 24, paddingTop: 8, paddingBottom: 4,
                                                                            color: '#6b7280', fontSize: '0.77rem', fontWeight: 500,
                                                                            borderBottom: '1px solid #f0f2f4',
                                                                        })}>
                                                                            {si + 1}.{subI + 1}. {sub}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {subRows.map(row => {
                                                                    const globalIdx = rows.indexOf(row);
                                                                    const estTotal = row.estimatedUnitCost * row.quantity;
                                                                    const actUnitCost = row.actualUnitCost ?? row.estimatedUnitCost;
                                    const actTotal = actUnitCost > 0 ? actUnitCost * row.quantity : null;
                                                                    const pct = profitPct(row);
                                                                    const isEditing = editingIndex === globalIdx;
                                                                    const src = row.unitCostSource ? SOURCE_CHIP[row.unitCostSource] : null;
                                                                    rowCounter++;
                                                                    return (
                                                                        <tr
                                                                            key={globalIdx}
                                                                            style={{ backgroundColor: '#fff' }}
                                                                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fdfe'; }}
                                                                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fff'; }}
                                                                        >
                                                                            <td style={tdStyle({ textAlign: 'center', color: '#bbb', fontSize: '0.74rem' })}>{rowCounter}</td>
                                                                            <td style={tdStyle({ whiteSpace: 'normal' })}>
                                                                                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#111' }}>{row.laborOfferItemName}</span>
                                                                            </td>
                                                                            <td style={tdStyle({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{row.unitSymbol}</td>
                                                                            <td style={tdStyle({ textAlign: 'right', color: '#777', borderLeft: GSEP })}>{row.quantity.toLocaleString()}</td>
                                                                            <td style={tdStyle({ textAlign: 'right', color: '#555' })}>{row.actualUnitCost !== null && row.estimatedUnitCost > 0 ? Math.round(row.estimatedUnitCost).toLocaleString() : '\u2014'}</td>
                                                                            <td style={tdStyle({ textAlign: 'right', fontWeight: 500, color: '#333' })}>{row.actualUnitCost !== null && estTotal > 0 ? estTotal.toLocaleString() : '\u2014'}</td>
                                                                            <td style={tdStyle({ textAlign: 'right', color: '#777', borderLeft: GSEP })}>{row.quantity.toLocaleString()}</td>
                                                                            <td style={tdStyle({ textAlign: 'right' })}>
                                                                                {isEditing ? (
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                                        <TextField
                                                                                            inputRef={inputRef}
                                                                                            size='small'
                                                                                            type='number'
                                                                                            value={editValue}
                                                                                            onChange={e => setEditValue(e.target.value)}
                                                                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveManual(globalIdx); if (e.key === 'Escape') setEditingIndex(null); }}
                                                                                            sx={{ width: 100 }}
                                                                                            inputProps={{ min: 0 }}
                                                                                        />
                                                                                        <IconButton size='small' onClick={() => handleSaveManual(globalIdx)} disabled={saving} sx={{ color: mainPrimaryColor }}>
                                                                                            {saving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                                                                        </IconButton>
                                                                                    </Box>
                                                                                ) : (
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                                        <span style={{ fontSize: '0.82rem', color: row.actualUnitCost !== null ? '#111' : '#888' }}>
                                                                                            {actUnitCost > 0 ? Math.round(actUnitCost).toLocaleString() : '\u2014'}
                                                                                        </span>
                                                                                        <Tooltip title={t('Edit')} placement='top' arrow>
                                                                                            <IconButton size='small'
                                                                                                onClick={() => { setEditingIndex(globalIdx); setEditValue(row.actualUnitCost?.toString() ?? ''); }}
                                                                                                sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}>
                                                                                                <EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Box>
                                                                                )}
                                                                            </td>
                                                                            <td style={tdStyle({ textAlign: 'right', fontWeight: 500, color: actTotal !== null ? (row.actualUnitCost !== null ? mainPrimaryColor : '#888') : '#ddd' })}>
                                                                                {actTotal !== null ? actTotal.toLocaleString() : '\u2014'}
                                                                            </td>
                                                                            <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP })}>
                                                                                {pct !== null ? (
                                                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: pct >= 0 ? '#2E7D32' : '#C62828' }}>
                                                                                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                                                                    </span>
                                                                                ) : <span style={{ fontSize: '0.82rem', color: '#ccc' }}>{'—'}</span>}
                                                                            </td>
                                                                            <td style={tdStyle({ textAlign: 'center', borderLeft: GSEP })}>
                                                                                {src ? (
                                                                                    <Chip label={src.label} size='small' sx={{ fontSize: '0.68rem', bgcolor: `${src.color}18`, color: src.color, height: 20 }} />
                                                                                ) : (
                                                                                    <Chip label={t('Enter')} size='small'
                                                                                        onClick={() => { setEditingIndex(globalIdx); setEditValue(''); }}
                                                                                        sx={{ fontSize: '0.68rem', bgcolor: '#FFF3E0', color: '#E65100', height: 20, cursor: 'pointer' }} />
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </Box>
                        );
                    })()}
                {tab === 'general' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(() => {
                            const totalEstLaborCost = rows.reduce((s, r) => s + r.estimatedUnitCost * r.quantity, 0);
                            const totalEstMatCost = rows.reduce((s, r) => s + (r.estimatedMaterialUnitCost ?? 0) * r.quantity, 0);
                            const totalEstCost = totalEstLaborCost + totalEstMatCost;
                            const totalActLaborCost = rows.reduce((s, r) => s + ((r.actualLaborUnitCost ?? 0) * r.quantity), 0);
                            const totalActMatCost = rows.reduce((s, r) => s + ((r.actualMaterialUnitCost ?? 0) * r.quantity), 0);
                            const totalActCost = totalActLaborCost + totalActMatCost;
                            const fmt = (n: number) => Math.round(n).toLocaleString() + ' 噌';
                            const pct = (a: number, e: number) => e > 0 ? ((e - a) / e * 100) : null;
                            const rowData = [
                                { label: 'Նախահաշիվ Աշխատանկ', est: totalEstLaborCost, act: totalActLaborCost },
                                { label: 'Նախահաշիվ Նյութ', est: totalEstMatCost, act: totalActMatCost },
                                { label: 'Անիկունական Արժեկ', est: totalEstCost, act: totalActCost },
                            ];
                            return (
                                <Box sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fff' }}>
                                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 500 }}>
                                        <thead>
                                            <tr>
                                                <th style={thStyle({ textAlign: 'left', verticalAlign: 'middle', width: 250 })}>Անվանում</th>
                                                <th style={thStyle({ textAlign: 'right', verticalAlign: 'middle', borderLeft: GSEP, color: mainPrimaryColor })}>Նախահաշիվ</th>
                                                <th style={thStyle({ textAlign: 'right', verticalAlign: 'middle', borderLeft: GSEP, color: mainPrimaryColor })}>Հաշվարկայի坮</th>
                                                <th style={thStyle({ textAlign: 'right', verticalAlign: 'middle', borderLeft: GSEP })}>Շահութաբերություն</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rowData.map((d, i) => {
                                                const p = pct(d.act, d.est);
                                                const isTotalRow = i === rowData.length - 1;
                                                return (
                                                    <tr key={i} style={{ backgroundColor: isTotalRow ? '#f0fbfc' : '#fff', fontWeight: isTotalRow ? 600 : 400 }}>
                                                        <td style={tdStyle({ fontWeight: isTotalRow ? 600 : 400 })}>{d.label}</td>
                                                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, color: '#555' })}>{fmt(d.est)}</td>
                                                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, color: d.act > 0 ? mainPrimaryColor : '#bbb' })}>{d.act > 0 ? fmt(d.act) : '—'}</td>
                                                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP })}>
                                                            {p !== null ? (
                                                                <span style={{ fontWeight: 600, color: p >= 0 ? '#2E7D32' : '#C62828' }}>{p >= 0 ? '+' : ''}{p.toFixed(1)}%</span>
                                                            ) : <span style={{ color: '#ccc' }}>—</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </Box>
                            );
                        })()}
                    </Box>
                )}
                </Box>
{tab === 'works' && (
                    <Box sx={{ px: 2, pb: 2 }}>
                        {laborGroupsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>}
                        {!laborGroupsLoading && laborGroups.length > 0 && (() => {
                            const totalLaborCost = laborGroups.reduce((s, g) => s + g.totalCost, 0);
                            const pct = (cost: number) => totalLaborCost > 0 ? ((cost / totalLaborCost) * 100).toFixed(2) + '%' : '0%';
                            return (
                                <Table size='small' sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                                    <TableHead><TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                        <TableCell sx={{ fontWeight: 600, pl: 1.5 }}>{t('Name')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Quantity')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Cost')}</TableCell>
                                        <TableCell align='right' sx={{ fontWeight: 600, width: 60 }}>%</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {laborGroups.map(group => {
                                            const isOpen = !!laborExpanded[group.laborItemId];
                                            return (
                                                <React.Fragment key={group.laborItemId}>
                                                    <TableRow onClick={() => setLaborExpanded(p => ({ ...p, [group.laborItemId]: !p[group.laborItemId] }))} sx={{ cursor: 'pointer', backgroundColor: '#fafafa', '&:hover': { backgroundColor: '#f0f9fb' } }}>
                                                        <TableCell sx={{ pl: 1, py: 1.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {isOpen ? <ExpandLessIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} /> : <ExpandMoreIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} />}
                                                                <Typography variant='body2' sx={{ fontWeight: 500 }}>{group.fullCode && <Box component='span' sx={{ color: mainPrimaryColor, mr: 1 }}>{group.fullCode}</Box>}{group.name}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5, color: 'text.secondary' }}>{group.unitSymbol}</TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5 }}>{group.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5 }}>{Math.round(group.totalCost).toLocaleString()} AMD</TableCell>
                                                        <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>{pct(group.totalCost)}</TableCell>
                                                    </TableRow>
                                                    {isOpen && group.items.map((item, idx2) => (
                                                        <TableRow key={String(item._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                                            <TableCell sx={{ pl: 5, py: 1.5 }}><Typography variant='body2' color='text.secondary'>{idx2 + 1}. {item.laborOfferItemName || item.catalogName}</Typography></TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{item.unitSymbol}</TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{Number(item.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{Math.round(item.cost).toLocaleString()} AMD</TableCell>
                                                            <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>{pct(item.cost)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            );
                        })()}
                    </Box>
                )}
{tab === 'materials' && (
                    <Box sx={{ px: 2, pb: 2 }}>
                        {matGroupsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>}
                        {!matGroupsLoading && matGroups.length > 0 && (() => {
                            const totalMatCost = matGroups.reduce((s, g) => s + g.totalCost, 0);
                            const pct = (cost: number) => totalMatCost > 0 ? ((cost / totalMatCost) * 100).toFixed(2) + '%' : '0%';
                            return (
                                <Table size='small' sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                                    <TableHead><TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                        <TableCell sx={{ fontWeight: 600, pl: 1.5 }}>{t('Name')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Quantity')}</TableCell>
                                        <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Cost')}</TableCell>
                                        <TableCell align='right' sx={{ fontWeight: 600, width: 60 }}>%</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {matGroups.map(group => {
                                            const isOpen = !!matGroupExpanded[group.materialItemId];
                                            return (
                                                <React.Fragment key={group.materialItemId}>
                                                    <TableRow onClick={() => setMatGroupExpanded(p => ({ ...p, [group.materialItemId]: !p[group.materialItemId] }))} sx={{ cursor: 'pointer', backgroundColor: '#fafafa', '&:hover': { backgroundColor: '#f0f9fb' } }}>
                                                        <TableCell sx={{ pl: 1, py: 1.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {isOpen ? <ExpandLessIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} /> : <ExpandMoreIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} />}
                                                                <Typography variant='body2' sx={{ fontWeight: 500 }}>{group.materialFullCode && <Box component='span' sx={{ color: mainPrimaryColor, mr: 1 }}>{group.materialFullCode}</Box>}{group.materialName}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5, color: 'text.secondary' }}>{group.unitSymbol}</TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5 }}>{group.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5 }}>{Math.round(group.totalCost).toLocaleString()} AMD</TableCell>
                                                        <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>{pct(group.totalCost)}</TableCell>
                                                    </TableRow>
                                                    {isOpen && group.items.map((item, idx2) => (
                                                        <TableRow key={String(item._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                                            <TableCell sx={{ pl: 5, py: 1.5 }}><Typography variant='body2' color='text.secondary'>{idx2 + 1}. {item.laborCatalogName || item.laborOfferItemName}</Typography></TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{item.unitSymbol}</TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{Number(item.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{Math.round(item.cost).toLocaleString()} AMD</TableCell>
                                                            <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>{pct(item.cost)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            );
                        })()}
                    </Box>
                )}
                </TabContext>
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
                            <Tooltip title={t('Delete')}>
                                <IconButton size='small' onClick={(e) => handleDelete(rec._id, e)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                    <DeleteOutlineIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                })}
            </Box>
            <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelect} />
        </PageContents>
    );
}
