'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box, Typography, CircularProgress, Chip, TextField, IconButton, Tooltip, Tab, Paper,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EngineeringIcon from '@mui/icons-material/Engineering';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';

const RENT_EST_SEGS = [
    { key: 'labor',     inner: '#00CCDD', outer: '#00899B', dot: '#00899B' },
    { key: 'materials', inner: '#4EE89A', outer: '#1CA461', dot: '#1CA461' },
    { key: 'other',     inner: '#A8DED9', outer: '#5CB8B0', dot: '#5CB8B0' },
];
const RENT_ACT_SEGS = [
    { key: 'labor',     inner: '#FF7043', outer: '#BF360C', dot: '#E64A19' },
    { key: 'materials', inner: '#FFB300', outer: '#E65100', dot: '#F57C00' },
    { key: 'other',     inner: '#FFE57F', outer: '#FF8F00', dot: '#FFA000' },
];

const OE_BAR_GRADS = [
    { top: '#00CCDD', bottom: '#00899B', stroke: '#006e7e' },
    { top: '#4EE89A', bottom: '#1CA461', stroke: '#148048' },
    { top: '#A8DED9', bottom: '#5CB8B0', stroke: '#44908a' },
    { top: '#27C97A', bottom: '#00855A', stroke: '#006644' },
    { top: '#6FE0D8', bottom: '#2BADA6', stroke: '#1e8880' },
    { top: '#00B28F', bottom: '#007060', stroke: '#005548' },
    { top: '#C5E8C6', bottom: '#7DB87E', stroke: '#5e9660' },
    { top: '#3DC9BF', bottom: '#1A8A84', stroke: '#116b66' },
];
const OE_ACT_GRAD = { top: '#FF8A65', bottom: '#E64A19', stroke: '#bf360c' };
const oeFormatY = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${Math.round(v / 1_000)}K` : String(Math.round(v));
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';
import { useTranslation } from 'react-i18next';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import EstimatePageDialog from '@/app/estimates/EstimateDialog';
import RentayinOtherCostsDialog from './RentayinOtherCostsDialog';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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
    actualLaborTotal: number | null;
    actualMaterialTotal: number | null;
    unitCostSource: 'actual' | 'library' | 'manual' | null;
    sectionName: string;
    subsectionName: string;
}

interface RentayinRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
    rows?: RentayinRow[];
    laborPriceOverrides?: Record<string, number>;
    materialPriceOverrides?: Record<string, number>;
    otherCostPercentages?: Record<string, number>;
    estimateOtherExpenses?: Record<string, number>[];
    costingOtherActuals?: Record<string, number>;
    createdAt: string;
}

interface LaborRow { _id: string; laborItemId: string; isGroupRow: boolean; fullCode: string; catalogName: string; laborOfferItemName: string; unitSymbol: string; quantity: number; changableAveragePrice: number; cost: number; subsectionName: string; sectionName: string; }
interface GroupedLabor { laborItemId: string; fullCode: string; name: string; unitSymbol: string; totalCost: number; totalQuantity: number; items: LaborRow[]; }
interface MaterialRow { _id: string; materialItemId: string; laborCatalogName: string; laborFullCode: string; laborOfferItemName: string; materialCatalogName: string; materialCatalogFullCode: string; materialOfferItemName: string; unitSymbol: string; quantity: number; changableAveragePrice: number; cost: number; }
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
    const [laborOverrides, setLaborOverrides] = useState<Record<string, number>>({});
    const [matOverrides, setMatOverrides] = useState<Record<string, number>>({});
    const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null);
    const [editingPriceValue, setEditingPriceValue] = useState('');
    const [colWidths, setColWidths] = useState([44, 360, 70, 80, 130, 120, 80, 130, 120, 160, 90]);
    const [refreshing, setRefreshing] = useState(false);
    const [estimateEditOpen, setEstimateEditOpen] = useState(false);
    const [otherCostsOpen, setOtherCostsOpen] = useState(false);
    const [otherCostPercentages, setOtherCostPercentages] = useState<Record<string, number>>({});
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const toggleSection = (key: string) => setCollapsedSections(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    const handleRefresh = async (d: RentayinRecord) => {
        setRefreshing(true);
        try {
            const res = await Api.requestSession<{ ok: boolean; rows: any[] }>({ command: 'rentayin/refresh', args: { id: d._id } });
            setDetail(prev => prev ? { ...prev, rows: res.rows } : prev);
        } finally { setRefreshing(false); }
    };
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
        if (detail) {
            setLaborOverrides(detail.laborPriceOverrides ?? {});
            setMatOverrides(detail.materialPriceOverrides ?? {});
            setOtherCostPercentages((detail as any).otherCostPercentages ?? {});
        }
    }, [detail?._id]);
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
            <>
            <PageContents title={detail.estimateName}>
                <TabContext value={tab}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => router.push('/analysis/rentayin')} size='small' sx={{ color: 'text.secondary', mr: 0.5, '&:hover': { color: mainPrimaryColor } }}>
                                <ArrowBackIcon fontSize='small' />
                            </IconButton>
                            <TabList onChange={(_, v) => setTab(v)} sx={{ '& .MuiTabs-indicator': { backgroundColor: '#00A390' }, '& .MuiTab-root.Mui-selected': { color: '#00A390' } }}>
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />Ընդհանուր</Box>} value='general' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><TableChartOutlinedIcon sx={{ fontSize: 18 }} />{t('Analysis')}</Box>} value='table' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><EngineeringIcon sx={{ fontSize: 18 }} />Աշխատանքներ</Box>} value='works' />
                                <Tab label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><CategoryOutlinedIcon sx={{ fontSize: 18 }} />Նյութեր</Box>} value='materials' />
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
                                                                    const actUnitCost = row.actualUnitCost;
                                    const actTotal = actUnitCost !== null && actUnitCost > 0 ? actUnitCost * row.quantity : null;
                                                                    const pct = profitPct(row);
                                                                    const isEditing = editingIndex === globalIdx && row.unitCostSource !== 'actual';
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
                                                                            <td style={tdStyle({ textAlign: 'right', color: '#555' })}>{row.estimatedUnitCost > 0 ? Math.round(row.estimatedUnitCost).toLocaleString() : '\u2014'}</td>
                                                                            <td style={tdStyle({ textAlign: 'right', fontWeight: 500, color: '#333' })}>{estTotal > 0 ? estTotal.toLocaleString() : '\u2014'}</td>
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
                                                                                        <span style={{ fontSize: '0.82rem', color: row.unitCostSource === 'actual' ? '#111' : row.unitCostSource === 'library' ? '#1565C0' : '#888' }}>
                                                                                            {actUnitCost !== null && actUnitCost > 0 && (row.unitCostSource === 'actual' || row.unitCostSource === 'library') ? Math.round(actUnitCost).toLocaleString() : '\u2014'}
                                                                                        </span>
                                                                                        {row.unitCostSource !== 'actual' && (
                                                                                        <Tooltip title={t('Edit')} placement='top' arrow>
                                                                                            <IconButton size='small'
                                                                                                onClick={() => { setEditingIndex(globalIdx); setEditValue(row.actualUnitCost?.toString() ?? ''); }}
                                                                                                sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}>
                                                                                                <EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                        )}
                                                                                    </Box>
                                                                                )}
                                                                            </td>
                                                                            <td style={tdStyle({ textAlign: 'right', fontWeight: 500, color: actTotal !== null ? (row.actualUnitCost !== null ? mainPrimaryColor : '#888') : '#ddd' })}>
                                                                                {actTotal !== null && (row.unitCostSource === 'actual' || row.unitCostSource === 'library') ? actTotal.toLocaleString() : '\u2014'}
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
                    <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, p: 2 }}>
                        {(() => {
                            const rows = detail?.rows ?? [];
                            const totalEstLaborCost = rows.reduce((s, r) => s + r.estimatedUnitCost * r.quantity, 0);
                            const totalEstMatCost = rows.reduce((s, r) => s + (r.estimatedMaterialUnitCost ?? 0) * r.quantity, 0);
                            const totalEstCost = totalEstLaborCost + totalEstMatCost;
                            const totalActLaborCost = rows.reduce((s, r) => s + ((r.actualLaborUnitCost ?? 0) * r.quantity), 0);
                            const totalActMatCost = rows.reduce((s, r) => s + ((r.actualMaterialUnitCost ?? 0) * r.quantity), 0);
                            const totalActCost = totalActLaborCost + totalActMatCost;
                            // Per-row donut split: actual rows use actualLaborTotal/actualMaterialTotal;
                            // library/manual rows fall back to estimated split (same as Հashvarkayan column logic)
                            const donutActLabor = rows.reduce((s, r) => {
                                if (r.unitCostSource === 'actual') return s + (r.actualLaborTotal ?? r.estimatedUnitCost * r.quantity);
                                return s + r.estimatedUnitCost * r.quantity;
                            }, 0);
                            const donutActMat = rows.reduce((s, r) => {
                                if (r.unitCostSource === 'actual') return s + (r.actualMaterialTotal ?? 0);
                                return s + (r.estimatedMaterialUnitCost ?? 0) * r.quantity;
                            }, 0);
                            const rowsWithActual = rows.filter(r => r.actualUnitCost !== null).length;
                            const completionPct = rows.length > 0 ? Math.min(100, Math.round((rowsWithActual / rows.length) * 100)) : null;
                            const estExpenses: Record<string, number>[] = (detail as any)?.estimateOtherExpenses ?? [];
                            const totalEstOther = estExpenses.reduce((s, e) => { const k = Object.keys(e)[0]; return s + (k && k !== 'typeOfCost' ? ((e[k] ?? 0) / 100) * totalEstCost : 0); }, 0);
                            const costingActualsForDonut: Record<string, number> = (detail as any)?.costingOtherActuals ?? {};
                            const actPctsForDonut: Record<string, number> = otherCostPercentages;
                            const totalActOther = Object.keys({ ...costingActualsForDonut, ...actPctsForDonut }).reduce((s, key) => {
                                const p = actPctsForDonut[key] ?? 0;
                                return s + (p > 0 ? (p / 100) * totalActCost : (costingActualsForDonut[key] ?? 0));
                            }, 0);
                            const profitAmt = totalActCost > 0 && totalEstCost > 0 ? totalEstCost - totalActCost : null;
                            const profitPct = profitAmt !== null && totalEstCost > 0 ? (profitAmt / totalEstCost) * 100 : null;
                            const fmtAMD = (n: number) => formatCurrencyRounded(Math.round(n)) + ' ֏';
                            const profColor = profitPct === null ? '#bbb' : profitPct >= 0 ? '#2e7d32' : '#c62828';
                            const buildDonutData = (labor: number, materials: number, other: number) => {
                                const total = labor + materials + other;
                                return [
                                    { key: 'labor',     name: t('Labor'),          value: labor,     pct: total > 0 ? ((labor / total) * 100).toFixed(1) : '0.0' },
                                    { key: 'materials', name: t('Materials'),       value: materials, pct: total > 0 ? ((materials / total) * 100).toFixed(1) : '0.0' },
                                    { key: 'other',     name: t('Other Expenses'),  value: other,     pct: total > 0 ? ((other / total) * 100).toFixed(1) : '0.0' },
                                ];
                            };
                            const estDonutData = buildDonutData(totalEstLaborCost, totalEstMatCost, totalEstOther);
                            const actDonutData = buildDonutData(donutActLabor, donutActMat, totalActOther);
                            const renderDonut = (data: ReturnType<typeof buildDonutData>, prefix: string, segs: typeof RENT_EST_SEGS) => {
                                const hasAny = data.some(d => d.value > 0);
                                return (
                                    <Box sx={{ flex: 1, minHeight: 128 }}>
                                        <ResponsiveContainer width='100%' height={128}>
                                            <PieChart>
                                                <defs>{segs.map(s => (
                                                    <radialGradient key={s.key} id={`${prefix}-${s.key}`} cx='50%' cy='50%' r='50%'>
                                                        <stop offset='0%' stopColor={s.inner} />
                                                        <stop offset='100%' stopColor={s.outer} />
                                                    </radialGradient>
                                                ))}</defs>
                                                <Pie data={hasAny ? data : [{ key: 'empty', name: '', value: 1, pct: '0' }]} cx='50%' cy='50%' innerRadius={32} outerRadius={54} paddingAngle={hasAny ? 2 : 0} dataKey='value' strokeWidth={0} minAngle={hasAny ? 6 : 0}>
                                                    {hasAny ? data.map(entry => {
                                                        const seg = segs.find(s => s.key === entry.key);
                                                        return <Cell key={entry.key} fill={entry.value > 0 ? (seg ? `url(#${prefix}-${seg.key})` : '#ccc') : 'transparent'} stroke={entry.value > 0 ? (seg?.outer ?? '#ccc') : 'none'} strokeWidth={entry.value > 0 ? 0.5 : 0} />;
                                                    }) : [<Cell key='empty' fill='#f0f0f0' stroke='none' />]}
                                                </Pie>
                                                {hasAny && <RechartsTooltip content={({ active, payload }: any) => {
                                                    if (!active || !payload?.length || !payload[0].value) return null;
                                                    const e = payload[0];
                                                    return (
                                                        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, minWidth: 130 }}>
                                                            <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{e.name}</Typography>
                                                            <Typography variant='body2' sx={{ color: '#00A390' }}>{Number(e.value).toLocaleString()} AMD</Typography>
                                                            <Typography variant='caption' sx={{ color: 'text.secondary' }}>{e.payload.pct}%</Typography>
                                                        </Paper>
                                                    );
                                                }} />}
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                );
                            };
                            const renderLegend = (data: ReturnType<typeof buildDonutData>, segs: typeof RENT_EST_SEGS) => (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                    {data.map(d => {
                                        const seg = segs.find(s => s.key === d.key);
                                        return (
                                            <Box key={d.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: d.value > 0 ? (seg?.dot ?? '#ccc') : '#e0e0e0', flexShrink: 0 }} />
                                                <Typography variant='caption' sx={{ color: d.value > 0 ? 'text.secondary' : '#bdbdbd', fontSize: '0.68rem' }}>{d.name} {d.value > 0 ? `${d.pct}%` : '—'}</Typography>
                                                <Typography variant='caption' sx={{ color: '#aaa', fontSize: '0.65rem', ml: 'auto' }}>{d.value > 0 ? Math.round(d.value).toLocaleString() : ''}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                            return (
                                <Box>
                                    <Box onClick={() => toggleSection('quick')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, userSelect: 'none' }}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('Quick actions')}</Typography>
                                        <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af', transform: collapsedSections.has('quick') ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                    </Box>
                                    {!collapsedSections.has('quick') && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
                                        {[
                                            { icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 24, color: '#7b1fa2', opacity: 0.55 }} />, label: 'Նախահաշիվ', onClick: () => setEstimateEditOpen(true), hoverBg: 'rgba(123,31,162,0.06)' },
                                            { icon: <RefreshIcon sx={{ fontSize: 24, color: '#1565c0', opacity: 0.55 }} />, label: 'Թարմացնել', onClick: () => handleRefresh(detail), hoverBg: 'rgba(21,101,192,0.06)' },
                                            { icon: <AddCardOutlinedIcon sx={{ fontSize: 24, color: '#e53935', opacity: 0.55 }} />, label: 'Այլ ծախսեր', onClick: () => setOtherCostsOpen(true), hoverBg: 'rgba(229,57,53,0.06)' },
                                        ].map(({ icon, label, onClick, hoverBg }) => (
                                            <Box key={label} onClick={onClick} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 118, height: 96, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: hoverBg }, '&:hover svg': { opacity: '1 !important' } }}>
                                                {icon}
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{label}</Typography>
                                            </Box>
                                        ))}
                                    </Box>}
                                    <Box onClick={() => toggleSection('overview')} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, userSelect: 'none' }}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('Overview')}</Typography>
                                        <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af', transform: collapsedSections.has('overview') ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                    </Box>
                                    {!collapsedSections.has('overview') && <>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch', mb: 2 }}>
                                            {/* Cost breakdown widget */}
                                            <Paper elevation={0} sx={{ flex: 1.5, border: '1px solid #d0f0f4', borderRadius: 3, background: '#fff', minHeight: 220, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', p: 2 }}>
                                                <Box sx={{ display: 'flex', gap: 1, flex: 1, minHeight: 0 }}>
                                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5 }}>Նախահաշիվ</Typography>
                                                        {renderDonut(estDonutData, 'rent-est', RENT_EST_SEGS)}
                                                        {renderLegend(estDonutData, RENT_EST_SEGS)}
                                                    </Box>
                                                    <Box sx={{ width: '1px', background: '#f0f0f0', mx: 0.5, alignSelf: 'stretch' }} />
                                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5 }}>Հաշվարկային</Typography>
                                                        {renderDonut(actDonutData, 'rent-act', RENT_ACT_SEGS)}
                                                        {renderLegend(actDonutData, RENT_ACT_SEGS)}
                                                    </Box>
                                                </Box>
                                            </Paper>
                                            {/* Profitability widget */}
                                            <Paper elevation={0} sx={{ flex: 1, border: '1px solid #d0f0f4', borderRadius: 3, background: '#fff', minHeight: 220, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', p: 2 }}>
                                                <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 1 }}>{t('Average profitability of works')}</Typography>
                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    {profitPct === null ? (
                                                        <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>{t('No data')}</Typography>
                                                    ) : (
                                                        <>
                                                            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: profColor, lineHeight: 1.1, mb: 1.5 }}>
                                                                {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
                                                            </Typography>
                                                            <Box sx={{ width: '100%', px: 1 }}>
                                                                <Box sx={{ position: 'relative', height: 8, bgcolor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                                                    {(() => {
                                                                        const RANGE = 60;
                                                                        const clamped = Math.max(-RANGE, Math.min(RANGE, profitPct));
                                                                        return <Box sx={{
                                                                            position: 'absolute', height: '100%', borderRadius: 4,
                                                                            background: profitPct >= 0 ? 'linear-gradient(to right, #2e7d32, rgba(46,125,50,0.35))' : 'linear-gradient(to right, rgba(198,40,40,0.35), #c62828)',
                                                                            left: profitPct >= 0 ? '50%' : `${50 + (clamped / RANGE) * 50}%`,
                                                                            width: `${Math.abs(clamped / RANGE) * 50}%`,
                                                                        }} />;
                                                                    })()}
                                                                    <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, bgcolor: '#ccc', transform: 'translateX(-50%)' }} />
                                                                </Box>
                                                            </Box>
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 1, textAlign: 'center' }}>
                                                                {fmtAMD(Math.abs(profitAmt!))} {profitAmt! >= 0 ? t('savings') : t('overrun')}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            </Paper>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 2 }}>
                                            <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: 'linear-gradient(135deg,#ffffff 0%,#edfbfc 100%)', transition: 'transform 0.2s,box-shadow 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}><EngineeringIcon sx={{ fontSize: 22, color: mainPrimaryColor }} /><Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('Quantity of Labor')}</Typography></Box>
                                                <Typography variant='caption' sx={{ color: '#aaa', display: 'block', mb: 0.4 }}>{t('Total')} / {t('With data')}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                    <Typography variant='body1' sx={{ fontWeight: 700, color: '#333' }}>{rows.length}</Typography>
                                                    <Typography sx={{ color: '#bbb' }}>/</Typography>
                                                    <Typography variant='body1' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{rowsWithActual}</Typography>
                                                </Box>
                                            </Paper>
                                            <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: 'linear-gradient(135deg,#ffffff 0%,#edfbfc 100%)', transition: 'transform 0.2s,box-shadow 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)' } }}>
                                                <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>{t('Total Cost')}</Typography>
                                                <Typography variant='caption' sx={{ color: '#aaa', display: 'block', mb: 0.4 }}>{t('Estimated')} / {t('Actual')}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography variant='body1' sx={{ fontWeight: 700, color: '#333' }}>{fmtAMD(totalEstCost)}</Typography>
                                                    <Typography sx={{ color: '#bbb' }}>/</Typography>
                                                    {totalActCost > 0 ? <Typography variant='body1' sx={{ fontWeight: 700, color: totalActCost > totalEstCost ? '#e53935' : mainPrimaryColor }}>{fmtAMD(totalActCost)}</Typography> : <Typography variant='body1' sx={{ color: '#bbb' }}>—</Typography>}
                                                </Box>
                                            </Paper>
                                            <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: 'linear-gradient(135deg,#ffffff 0%,#edfbfc 100%)', transition: 'transform 0.2s,box-shadow 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)' } }}>
                                                <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>{t('Materials Cost')}</Typography>
                                                <Typography variant='caption' sx={{ color: '#aaa', display: 'block', mb: 0.4 }}>{t('Estimated')} / {t('Actual')}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography variant='body1' sx={{ fontWeight: 700, color: '#333' }}>{fmtAMD(totalEstMatCost)}</Typography>
                                                    <Typography sx={{ color: '#bbb' }}>/</Typography>
                                                    {totalActMatCost > 0 ? <Typography variant='body1' sx={{ fontWeight: 700, color: totalActMatCost > totalEstMatCost ? '#e53935' : mainPrimaryColor }}>{fmtAMD(totalActMatCost)}</Typography> : <Typography variant='body1' sx={{ color: '#bbb' }}>—</Typography>}
                                                </Box>
                                            </Paper>
                                            <Paper elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2.5, background: 'linear-gradient(135deg,#ffffff 0%,#edfbfc 100%)', transition: 'transform 0.2s,box-shadow 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,171,190,0.18)' } }}>
                                                <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>{t('Labor Cost')}</Typography>
                                                <Typography variant='caption' sx={{ color: '#aaa', display: 'block', mb: 0.4 }}>{t('Estimated')} / {t('Actual')}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography variant='body1' sx={{ fontWeight: 700, color: '#333' }}>{fmtAMD(totalEstLaborCost)}</Typography>
                                                    <Typography sx={{ color: '#bbb' }}>/</Typography>
                                                    {totalActLaborCost > 0 ? <Typography variant='body1' sx={{ fontWeight: 700, color: totalActLaborCost > totalEstLaborCost ? '#e53935' : mainPrimaryColor }}>{fmtAMD(totalActLaborCost)}</Typography> : <Typography variant='body1' sx={{ color: '#bbb' }}>—</Typography>}
                                                </Box>
                                            </Paper>
                                        </Box>
                                    </>}
                                    {/* Other Costs bar charts */}
                                    {(() => {
                                        const rows = detail?.rows ?? [];
                                        const totalEstCost = rows.reduce((s, r) => s + (r.estimatedUnitCost + (r.estimatedMaterialUnitCost ?? 0)) * r.quantity, 0);
                                        const totalActCost = rows.reduce((s, r) => s + ((r.actualUnitCost ?? 0) * r.quantity), 0);
                                        const estExpenses: Record<string, number>[] = (detail as any)?.estimateOtherExpenses ?? [];
                                        const actPcts: Record<string, number> = otherCostPercentages;
                                        const costingActuals: Record<string, number> = (detail as any)?.costingOtherActuals ?? {};
                                        const allKeys = Array.from(new Set([
                                            ...estExpenses.map(e => Object.keys(e)[0]).filter(Boolean),
                                            ...Object.keys(actPcts),
                                            ...Object.keys(costingActuals).filter(k => (costingActuals[k] ?? 0) > 0),
                                        ])).filter(k => k && k !== 'typeOfCost');
                                        if (allKeys.length === 0) return null;
                                        const fmtAMD = (n: number) => formatCurrencyRounded(Math.round(n)) + ' ֏';
                                        return (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, mt: 2, userSelect: 'none' }} onClick={() => toggleSection('othercosts')}>
                                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Այլ ծախսեր</Typography>
                                                    <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af', transform: collapsedSections.has('othercosts') ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                                </Box>
                                                {!collapsedSections.has('othercosts') && (
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                                                        {allKeys.map((key, i) => {
                                                            const estPct = estExpenses.find(e => Object.keys(e)[0] === key)?.[key] ?? 0;
                                                            const estimatedValue = Math.round((estPct / 100) * totalEstCost);
                                                            const actPct = actPcts[key] ?? 0;
                                                            const actualValue = actPct > 0
                                                                ? Math.round((actPct / 100) * totalActCost)
                                                                : Math.round(costingActuals[key] ?? 0);
                                                            if (estimatedValue === 0 && actualValue === 0) return null;
                                                            const grad = OE_BAR_GRADS[i % OE_BAR_GRADS.length];
                                                            const estId = `oc-est-${key}`;
                                                            const actId = `oc-act-${key}`;
                                                            const pctDiff = estimatedValue > 0 && actualValue > 0 ? ((actualValue - estimatedValue) / estimatedValue) * 100 : null;
                                                            const chartData = [
                                                                { name: t('Estimated'), value: estimatedValue, gradId: estId },
                                                                { name: t('Actual'), value: actualValue, gradId: actId },
                                                            ].filter(d => d.value > 0);
                                                            return (
                                                                <Paper key={key} elevation={0} sx={{ border: '1px solid #d0f0f4', borderRadius: 3, p: 2, background: '#fff', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minHeight: 200, position: 'relative' }}>
                                                                    {pctDiff !== null && (
                                                                        <Box sx={{ position: 'absolute', top: 8, right: 10, px: 0.9, py: 0.25, borderRadius: '10px', bgcolor: pctDiff > 0 ? 'rgba(229,57,53,0.1)' : 'rgba(67,160,71,0.1)' }}>
                                                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: pctDiff > 0 ? '#e53935' : '#43a047', lineHeight: 1 }}>{pctDiff > 0 ? '+' : ''}{pctDiff.toFixed(1)}%</Typography>
                                                                        </Box>
                                                                    )}
                                                                    <Typography variant='caption' sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', textAlign: 'center', mb: 0.5, display: 'block' }}>{t(key)}</Typography>
                                                                    <Box sx={{ minHeight: 128 }}>
                                                                        <ResponsiveContainer width='100%' height={128}>
                                                                            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap='40%'>
                                                                                <defs>
                                                                                    <linearGradient id={estId} x1='0' y1='0' x2='0' y2='1'>
                                                                                        <stop offset='0%' stopColor={grad.top} />
                                                                                        <stop offset='100%' stopColor={grad.bottom} />
                                                                                    </linearGradient>
                                                                                    <linearGradient id={actId} x1='0' y1='0' x2='0' y2='1'>
                                                                                        <stop offset='0%' stopColor={OE_ACT_GRAD.top} />
                                                                                        <stop offset='100%' stopColor={OE_ACT_GRAD.bottom} />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                                <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='#f0f0f0' />
                                                                                <XAxis dataKey='name' tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                                                                                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} tickFormatter={oeFormatY} width={36} />
                                                                                <RechartsTooltip formatter={(v: unknown) => fmtAMD(v as number)} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                                                                <Bar dataKey='value' radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                                                                    {chartData.map((d, ci) => <Cell key={ci} fill={`url(#${d.gradId})`} />)}
                                                                                </Bar>
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                                        <Typography variant='caption' sx={{ color: '#555', fontSize: '0.68rem' }}>{oeFormatY(estimatedValue)}</Typography>
                                                                        {actualValue > 0 && <Typography variant='caption' sx={{ color: OE_ACT_GRAD.top, fontWeight: 600, fontSize: '0.68rem' }}>{oeFormatY(actualValue)}</Typography>}
                                                                    </Box>
                                                                </Paper>
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            </>
                                        );
                                    })()}

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
                                        <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Արժևկի</TableCell>
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
                                                        <TableCell align='right' sx={{ py: 1.5, pr: 1 }}>
                                                        {editingPriceKey === 'lg:' + group.laborItemId ? (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                <TextField size='small' type='number' value={editingPriceValue} onChange={e => setEditingPriceValue(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') {
                                                                            const p = parseFloat(editingPriceValue);
                                                                            if (!isNaN(p) && p > 0 && detail) {
                                                                                const newOvr: Record<string,number> = { ...laborOverrides };
                                                                                group.items.forEach(it => { delete newOvr[it._id]; });
                                                                                newOvr[group.laborItemId] = p;
                                                                                setLaborOverrides(newOvr);
                                                                                Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: group.laborItemId, price: p } });
                                                                                group.items.forEach(it => Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: it._id, price: -1 } }));
                                                                            }
                                                                            setEditingPriceKey(null);
                                                                        } else if (e.key === 'Escape') { setEditingPriceKey(null); }
                                                                    }}
                                                                    sx={{ width: 90 }} inputProps={{ min: 0 }} autoFocus />
                                                                <IconButton size='small' onClick={() => {
                                                                    const p = parseFloat(editingPriceValue);
                                                                    if (!isNaN(p) && p > 0 && detail) {
                                                                        const newOvr: Record<string,number> = { ...laborOverrides };
                                                                        group.items.forEach(it => { delete newOvr[it._id]; });
                                                                        newOvr[group.laborItemId] = p;
                                                                        setLaborOverrides(newOvr);
                                                                        Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: group.laborItemId, price: p } });
                                                                        group.items.forEach(it => Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: it._id, price: -1 } }));
                                                                    }
                                                                    setEditingPriceKey(null);
                                                                }} sx={{ color: mainPrimaryColor, p: '2px' }}><CheckIcon sx={{ fontSize: 14 }} /></IconButton>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                <span style={{ fontSize: '0.82rem', color: laborOverrides[group.laborItemId] ? '#111' : '#aaa' }}>
                                                                    {laborOverrides[group.laborItemId] ? Math.round(laborOverrides[group.laborItemId]).toLocaleString() : '—'}
                                                                </span>
                                                                <Tooltip title='Edit price for all' placement='top' arrow>
                                                                    <IconButton size='small' onClick={e => { e.stopPropagation(); setEditingPriceKey('lg:' + group.laborItemId); setEditingPriceValue(laborOverrides[group.laborItemId]?.toString() ?? ''); }}
                                                                        sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}><EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} /></IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5 }}>{Math.round(group.totalCost).toLocaleString()} AMD</TableCell>
                                                        <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>{pct(group.totalCost)}</TableCell>
                                                    </TableRow>
                                                    {isOpen && group.items.map((item, idx2) => (
                                                        <TableRow key={String(item._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                                            <TableCell sx={{ pl: 5, py: 1.5 }}><Typography variant='body2' color='text.secondary'>{idx2 + 1}. {item.laborOfferItemName || item.catalogName}</Typography></TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{item.unitSymbol}</TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{Number(item.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                            <TableCell align='right' sx={{ whiteSpace: 'nowrap', py: 1.5, pr: 1 }}>
                                                            {editingPriceKey === 'li:' + item._id ? (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                    <TextField size='small' type='number' value={editingPriceValue} onChange={e => setEditingPriceValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const p = parseFloat(editingPriceValue); if (!isNaN(p) && p > 0 && detail) { setLaborOverrides(prev => ({ ...prev, [item._id]: p })); Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: item._id, price: p } }); } setEditingPriceKey(null); } else if (e.key === 'Escape') { setEditingPriceKey(null); } }} sx={{ width: 90 }} inputProps={{ min: 0 }} autoFocus />
                                                                    <IconButton size='small' onClick={() => { const p = parseFloat(editingPriceValue); if (!isNaN(p) && p > 0 && detail) { setLaborOverrides(prev => ({ ...prev, [item._id]: p })); Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: item._id, price: p } }); } setEditingPriceKey(null); }} sx={{ color: mainPrimaryColor, p: '2px' }}><CheckIcon sx={{ fontSize: 14 }} /></IconButton>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                    <span style={{ fontSize: '0.82rem', color: '#777' }}>{Math.round((laborOverrides[item._id] ?? laborOverrides[item.laborItemId] ?? item.changableAveragePrice) || 0) || '—'}</span>
                                                                    <Tooltip title='Edit' placement='top' arrow><IconButton size='small' onClick={() => { setEditingPriceKey('li:' + item._id); setEditingPriceValue(String(laborOverrides[item._id] ?? laborOverrides[item.laborItemId] ?? item.changableAveragePrice ?? '')); }} sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}><EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} /></IconButton></Tooltip>
                                                                </Box>
                                                            )}
                                                        </TableCell>
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
                                        <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Արժևկի</TableCell>
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
                                                        <TableCell align='right' sx={{ py: 1.5, pr: 1 }}>
                                                        {editingPriceKey === 'mg:' + group.materialItemId ? (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                <TextField size='small' type='number' value={editingPriceValue} onChange={e => setEditingPriceValue(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') {
                                                                            const p = parseFloat(editingPriceValue);
                                                                            if (!isNaN(p) && p > 0 && detail) {
                                                                                const newOvr: Record<string,number> = { ...matOverrides };
                                                                                group.items.forEach(it => { delete newOvr[it._id]; });
                                                                                newOvr[group.materialItemId] = p;
                                                                                setMatOverrides(newOvr);
                                                                                Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'material', key: group.materialItemId, price: p } });
                                                                                group.items.forEach(it => Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: it._id, price: -1 } }));
                                                                            }
                                                                            setEditingPriceKey(null);
                                                                        } else if (e.key === 'Escape') { setEditingPriceKey(null); }
                                                                    }}
                                                                    sx={{ width: 90 }} inputProps={{ min: 0 }} autoFocus />
                                                                <IconButton size='small' onClick={() => {
                                                                    const p = parseFloat(editingPriceValue);
                                                                    if (!isNaN(p) && p > 0 && detail) {
                                                                        const newOvr: Record<string,number> = { ...matOverrides };
                                                                        group.items.forEach(it => { delete newOvr[it._id]; });
                                                                        newOvr[group.materialItemId] = p;
                                                                        setMatOverrides(newOvr);
                                                                        Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'material', key: group.materialItemId, price: p } });
                                                                        group.items.forEach(it => Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'labor', key: it._id, price: -1 } }));
                                                                    }
                                                                    setEditingPriceKey(null);
                                                                }} sx={{ color: mainPrimaryColor, p: '2px' }}><CheckIcon sx={{ fontSize: 14 }} /></IconButton>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                <span style={{ fontSize: '0.82rem', color: matOverrides[group.materialItemId] ? '#111' : '#aaa' }}>
                                                                    {matOverrides[group.materialItemId] ? Math.round(matOverrides[group.materialItemId]).toLocaleString() : '—'}
                                                                </span>
                                                                <Tooltip title='Edit price for all' placement='top' arrow>
                                                                    <IconButton size='small' onClick={e => { e.stopPropagation(); setEditingPriceKey('mg:' + group.materialItemId); setEditingPriceValue(matOverrides[group.materialItemId]?.toString() ?? ''); }}
                                                                        sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}><EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} /></IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                        <TableCell align='center' sx={{ fontWeight: 500, whiteSpace: 'nowrap', py: 1.5 }}>{Math.round(group.totalCost).toLocaleString()} AMD</TableCell>
                                                        <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>{pct(group.totalCost)}</TableCell>
                                                    </TableRow>
                                                    {isOpen && group.items.map((item, idx2) => (
                                                        <TableRow key={String(item._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                                            <TableCell sx={{ pl: 5, py: 1.5 }}><Typography variant='body2' color='text.secondary'>{idx2 + 1}. {item.laborCatalogName || item.laborOfferItemName}</Typography></TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{item.unitSymbol}</TableCell>
                                                            <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>{Number(item.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                            <TableCell align='right' sx={{ whiteSpace: 'nowrap', py: 1.5, pr: 1 }}>
                                                            {editingPriceKey === 'mi:' + item._id ? (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                    <TextField size='small' type='number' value={editingPriceValue} onChange={e => setEditingPriceValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const p = parseFloat(editingPriceValue); if (!isNaN(p) && p > 0 && detail) { setMatOverrides(prev => ({ ...prev, [item._id]: p })); Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'material', key: item._id, price: p } }); } setEditingPriceKey(null); } else if (e.key === 'Escape') { setEditingPriceKey(null); } }} sx={{ width: 90 }} inputProps={{ min: 0 }} autoFocus />
                                                                    <IconButton size='small' onClick={() => { const p = parseFloat(editingPriceValue); if (!isNaN(p) && p > 0 && detail) { setMatOverrides(prev => ({ ...prev, [item._id]: p })); Api.requestSession({ command: 'rentayin/set_price_override', args: { id: detail._id, type: 'material', key: item._id, price: p } }); } setEditingPriceKey(null); }} sx={{ color: mainPrimaryColor, p: '2px' }}><CheckIcon sx={{ fontSize: 14 }} /></IconButton>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                    <span style={{ fontSize: '0.82rem', color: '#777' }}>{Math.round((matOverrides[item._id] ?? matOverrides[item.materialItemId] ?? item.changableAveragePrice) || 0) || '—'}</span>
                                                                    <Tooltip title='Edit' placement='top' arrow><IconButton size='small' onClick={() => { setEditingPriceKey('mi:' + item._id); setEditingPriceValue(String(matOverrides[item._id] ?? matOverrides[item.materialItemId] ?? item.changableAveragePrice ?? '')); }} sx={{ opacity: 0, 'tr:hover &': { opacity: 1 }, transition: 'opacity 0.15s', p: '2px' }}><EditOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} /></IconButton></Tooltip>
                                                                </Box>
                                                            )}
                                                        </TableCell>
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
            {estimateEditOpen && detail?.estimateId && (
                <EstimatePageDialog
                    estimateId={detail.estimateId}
                    estimateTitle={detail.estimateName ?? ''}
                    onClose={() => setEstimateEditOpen(false)}
                />
            )}
            <RentayinOtherCostsDialog
                open={otherCostsOpen}
                onClose={() => setOtherCostsOpen(false)}
                percentages={otherCostPercentages}
                totalActualCost={(() => { const rows = detail?.rows ?? []; return rows.reduce((s, r) => s + ((r.actualUnitCost ?? 0) * r.quantity), 0); })()}
                onSave={async (pcts) => {
                    setOtherCostPercentages(pcts);
                    if (detail) {
                        await Api.requestSession({ command: 'rentayin/save_other_costs', args: { id: detail._id, percentages: pcts } });
                    }
                }}
            />
        </>
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
                        variant='outlined'
                        label={creating ? t('Loading...') : t('Create')}
                        onClick={() => setDialogOpen(true)}
                        disabled={creating}
                        sx={{ borderRadius: '25px', height: '36px', '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
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
