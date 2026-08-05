'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';
import type { CostHistoryEntry } from './page';
import { type PahestEntry } from './PahestMainMaterials';

interface LaborRow {
    _id: string; catalogName: string; laborOfferItemName: string;
    unitSymbol: string; quantity: number; changableAveragePrice: number;
    cost: number; materialTotalCost?: number; subsectionName: string; sectionName: string;
    isGroupRow?: boolean; parentGroupRowId?: string;
}
interface MaterialRow {
    _id: string; estimatedLaborId: string; materialItemId: string;
    materialCatalogName: string; materialOfferItemName: string;
    unitSymbol: string; quantity: number; changableAveragePrice: number; cost: number;
}
interface Section { _id: string; name: string; displayIndex: number; totalCost?: number; }
interface Subsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

const MIN_COL_W = 40;
const NCOLS = 16;

const BASE_COLS = [
    { key: 'no',        defaultW: 44  },
    { key: 'name',      defaultW: 500 },
    { key: 'unit',      defaultW: 90  },
    { key: 'estQty',    defaultW: 80  },
    { key: 'estUnit',   defaultW: 165 },
    { key: 'estAmt',    defaultW: 140 },
    { key: 'actQty',    defaultW: 80  },
    { key: 'actUnit',   defaultW: 165 },
    { key: 'actAmt',    defaultW: 140 },
    { key: 'remQty',    defaultW: 80  },
    { key: 'remUnit',   defaultW: 165 },
    { key: 'remAmt',    defaultW: 140 },
    { key: 'pct',       defaultW: 185 },
    { key: 'extraQty',  defaultW: 80  },
    { key: 'extraUnit', defaultW: 165 },
    { key: 'extraAmt',  defaultW: 140 },
];

function ResizeHandle({ onDragStart }: { onDragStart: (e: React.MouseEvent) => void }) {
    return (
        <div
            onMouseDown={onDragStart}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, cursor: 'col-resize', zIndex: 10, backgroundColor: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,171,190,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
        />
    );
}

const ROW_LINE = '1px solid #f0f2f4';
const GSEP = '1px solid #e8f4f6';
const ACCENT = mainPrimaryColor;

const thBase: React.CSSProperties = {
    padding: '8px 10px', whiteSpace: 'nowrap', position: 'relative',
    fontWeight: 600, fontSize: '0.75rem', color: '#6b7280',
    backgroundColor: '#fff', letterSpacing: '0.03em',
    textTransform: 'uppercase', border: 'none',
};
const thStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({ ...thBase, ...extra, borderBottom: '2px solid #e8f7f9' });
const tdBase: React.CSSProperties = { padding: '7px 10px', fontSize: '0.82rem', verticalAlign: 'middle', border: 'none', borderBottom: ROW_LINE };
const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({ ...tdBase, ...extra });
const fmtQty  = (v: number | null) => v !== null ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '\u2014';
const fmtUnit = (v: number | null) => v !== null ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '\u2014';

interface SnapshotData {
    laborRows: LaborRow[];
    sections: Section[];
    subsections: Subsection[];
}

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    estimateSnapshot?: SnapshotData | null;
    unforeseenEstimate?: EstimatesApi.ApiEstimate | null;
    unforeseenSnapshot?: SnapshotData | null;
    onDeleteUnforeseen?: () => void;
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    costHistory: CostHistoryEntry[];
    pahestEntries?: PahestEntry[];
}

async function fetchAnalysisData(estimateId: string) {
    const [laborData, sectData, matData] = await Promise.all([
        Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
        Api.requestSession<MaterialRow[]>({ command: 'estimate/fetch_materials_for_analysis', args: { estimateId } }),
    ]);
    const sorted = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
    const arrays = await Promise.all(
        sorted.map(s => Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: toId(s._id) } }).catch(() => [] as Subsection[]))
    );
    return { rows: laborData ?? [], sections: sorted, subsections: arrays.flat(), materialRows: matData ?? [] };
}

export default function AnalysisTab({ estimate, estimateSnapshot, unforeseenEstimate, unforeseenSnapshot, onDeleteUnforeseen, actualData, costHistory, pahestEntries }: Props) {
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [ufRows, setUfRows] = useState<LaborRow[]>([]);
    const [ufSections, setUfSections] = useState<Section[]>([]);
    const [ufSubsections, setUfSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [colWidths, setColWidths] = useState<number[]>(BASE_COLS.map(c => c.defaultW));
    const resizingCol = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrollDragging = useRef(false);
    const scrollDragStart = useRef({ x: 0, scrollLeft: 0 });
    const estimateId = toId(estimate._id);
    const ufEstimateId = unforeseenEstimate ? toId(unforeseenEstimate._id) : '';

    useEffect(() => {
        if (estimateSnapshot) {
            setRows(estimateSnapshot.laborRows);
            setSections(estimateSnapshot.sections);
            setSubsections(estimateSnapshot.subsections);
            fetchAnalysisData(estimateId).then(d => setMaterialRows(d.materialRows)).catch(() => {});
            if (unforeseenSnapshot) {
                setUfRows(unforeseenSnapshot.laborRows ?? []);
                setUfSections(unforeseenSnapshot.sections ?? []);
                setUfSubsections(unforeseenSnapshot.subsections ?? []);
            } else if (ufEstimateId) {
                fetchAnalysisData(ufEstimateId).then(d => { setUfRows(d.rows); setUfSections(d.sections); setUfSubsections(d.subsections); }).catch(console.error);
            } else {
                setUfRows([]); setUfSections([]); setUfSubsections([]);
            }
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetches: Promise<void>[] = [
            fetchAnalysisData(estimateId).then(d => { setRows(d.rows); setSections(d.sections); setSubsections(d.subsections); setMaterialRows(d.materialRows); }),
        ];
        if (ufEstimateId) {
            fetches.push(fetchAnalysisData(ufEstimateId).then(d => { setUfRows(d.rows); setUfSections(d.sections); setUfSubsections(d.subsections); }));
        } else {
            setUfRows([]); setUfSections([]); setUfSubsections([]);
        }
        Promise.all(fetches).catch(console.error).finally(() => setLoading(false));
    }, [estimateId, ufEstimateId, estimateSnapshot, unforeseenSnapshot]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!resizingCol.current) return;
            const { colIdx, startX, startW } = resizingCol.current;
            setColWidths(prev => { const c = [...prev]; c[colIdx] = Math.max(MIN_COL_W, startW + e.clientX - startX); return c; });
        };
        const onUp = () => { resizingCol.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }, []);

    const startResize = useCallback((colIdx: number, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        resizingCol.current = { colIdx, startX: e.clientX, startW: colWidths[colIdx] ?? 100 };
        document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    }, [colWidths]);

    const onScrollMouseDown = useCallback((e: React.MouseEvent) => {
        if (!scrollRef.current || resizingCol.current) return;
        isScrollDragging.current = true;
        scrollDragStart.current = { x: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
        scrollRef.current.style.cursor = 'grabbing';
    }, []);
    const onScrollMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isScrollDragging.current || !scrollRef.current || resizingCol.current) return;
        scrollRef.current.scrollLeft = scrollDragStart.current.scrollLeft - (e.clientX - scrollDragStart.current.x);
    }, []);
    const onScrollMouseUp = useCallback(() => {
        if (!scrollRef.current) return;
        isScrollDragging.current = false;
        scrollRef.current.style.cursor = 'grab';
    }, []);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
        </Box>
    );
    if (rows.length === 0) return (
        <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>Տվյալ չկա</Typography>
    );

    const subsMap = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsMap.set(toId(sect._id),
            subsections.filter(s => toId(s.estimateSectionId) === toId(sect._id)).sort((a, b) => a.displayIndex - b.displayIndex));
    }
    const ufSubsMap = new Map<string, Subsection[]>();
    for (const sect of ufSections) {
        ufSubsMap.set(toId(sect._id),
            ufSubsections.filter(s => toId(s.estimateSectionId) === toId(sect._id)).sort((a, b) => a.displayIndex - b.displayIndex));
    }

    const getActuals = (row: LaborRow) => {
        const rowId = toId(row._id);
        const a = actualData[rowId];
        const actQty   = parseFloat((a?.quantity ?? '').replace(',', '.')) || 0;
        const volTotal = parseFloat((a?.spent    ?? '').replace(',', '.')) || 0;
        const salTotal = costHistory.filter(e => e.laborItemId === rowId).reduce((s, e) => s + e.total, 0);
        const mats     = materialRows.filter(m => toId(m.estimatedLaborId) === rowId);
        const matActTotal = mats.reduce((s, m) => {
            const pe = (pahestEntries ?? []).find(p => p.materialItemId === toId(m.materialItemId));
            return s + (pe ? pe.history.reduce((ss, r) => ss + r.quantity * r.costPerUnit, 0) : 0);
        }, 0);
        const actTotal = volTotal + salTotal + matActTotal;
        const hasData  = !!(a || salTotal > 0 || matActTotal > 0);
        return { actQty, actTotal, hasData };
    };

    const getEstimate = (row: LaborRow) => {
        const mats = materialRows.filter(m => toId(m.estimatedLaborId) === toId(row._id));
        const rawMatEst = row.materialTotalCost !== undefined ? row.materialTotalCost : mats.reduce((s, m) => s + m.cost, 0);
        const estQty = Number(row.quantity ?? 0);
        const laborCostRounded = Math.round(estQty * row.changableAveragePrice);
        const matCostRounded = Math.round(rawMatEst);
        const estTotal = laborCostRounded + matCostRounded;
        const estUnitP = estQty > 0 ? Math.round(estTotal / estQty) : (row.changableAveragePrice ?? null);
        return { estQty, estTotal, estUnitP };
    };

    let counter = 0;

    const renderRow = (row: LaborRow, idx: number, pl: number) => {
        const { actQty, actTotal, hasData } = getActuals(row);
        const { estQty, estTotal, estUnitP } = getEstimate(row);
        const actUnitP = hasData && actQty > 0 ? actTotal / actQty : null;
        const remQty   = hasData ? estQty - actQty : null;
        const remUnitP = hasData ? estUnitP : null;
        const remTotal = remQty !== null && estUnitP !== null ? Math.round(remQty * estUnitP) : null;
        const pct      = hasData && actUnitP !== null && estUnitP !== null && estUnitP > 0 ? ((estUnitP - actUnitP) / estUnitP) * 100 : null;
        const cheaper  = pct !== null ? pct >= 0 : null;
        const exQty    = hasData && actQty > estQty ? actQty - estQty : null;
        const exUnitP  = exQty !== null ? estUnitP : null;
        const exAmt    = exQty !== null && estUnitP !== null ? Math.round(exQty * estUnitP) : null;
        const itemName = row.laborOfferItemName || row.catalogName;

        return (
            <tr key={toId(row._id)}
                style={{ backgroundColor: '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fdfe'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fff'; }}
            >
                <td style={tdStyle({ textAlign: 'center', color: '#bbb', fontSize: '0.74rem' })}>{idx}</td>
                <td style={tdStyle({ paddingLeft: pl, whiteSpace: 'normal', color: '#111' })}>{itemName}</td>
                <td style={tdStyle({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{row.unitSymbol || '\u2014'}</td>
                <td style={tdStyle({ textAlign: 'right', color: '#777', borderLeft: GSEP })}>{fmtQty(estQty)}</td>
                <td style={tdStyle({ textAlign: 'right', color: '#555' })}>{estUnitP !== null ? fmtUnit(estUnitP) : '\u2014'}</td>
                <td style={tdStyle({ textAlign: 'right', color: '#333', fontWeight: 500 })}>{formatCurrencyRounded(estTotal)}</td>
                <td style={tdStyle({ textAlign: 'right', color: hasData ? '#777' : '#ddd', borderLeft: GSEP })}>{hasData ? fmtQty(actQty) : '\u2014'}</td>
                <td style={tdStyle({ textAlign: 'right', color: hasData && actUnitP !== null ? '#555' : '#ddd' })}>{hasData && actUnitP !== null ? fmtUnit(actUnitP) : '\u2014'}</td>
                <td style={tdStyle({ textAlign: 'right', color: hasData ? ACCENT : '#ddd', fontWeight: hasData ? 600 : 400 })}>
                    {hasData ? formatCurrencyRounded(actTotal) : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, color: remQty === null ? '#ddd' : remQty >= 0 ? '#2e7d32' : '#c62828' })}>
                    {fmtQty(remQty)}
                </td>
                <td style={tdStyle({ textAlign: 'right', color: remUnitP === null ? '#ddd' : cheaper! ? '#2e7d32' : '#c62828' })}>
                    {remUnitP !== null ? fmtUnit(remUnitP) : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right', color: remTotal === null ? '#ddd' : cheaper !== null && cheaper ? '#2e7d32' : '#c62828', fontWeight: remTotal !== null ? 600 : 400 })}>
                    {remTotal !== null ? `+${formatCurrencyRounded(remTotal)}` : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP })}>
                    {pct !== null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                            {cheaper ? <TrendingDownIcon sx={{ fontSize: 13, color: '#2e7d32' }} /> : <TrendingUpIcon sx={{ fontSize: 13, color: '#c62828' }} />}
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: cheaper ? '#2e7d32' : '#c62828' }}>
                                {Math.abs(pct).toFixed(1)}%
                            </span>
                        </Box>
                    ) : <span style={{ color: '#ddd' }}>{'\u2014'}</span>}
                </td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, color: exQty !== null ? '#c62828' : '#ddd', fontWeight: exQty !== null ? 600 : 400 })}>
                    {exQty !== null ? fmtQty(exQty) : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right', color: exUnitP !== null ? '#c62828' : '#ddd' })}>
                    {exUnitP !== null ? fmtUnit(exUnitP) : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right', color: exAmt !== null ? '#c62828' : '#ddd', fontWeight: exAmt !== null ? 700 : 400 })}>
                    {exAmt !== null ? formatCurrencyRounded(exAmt) : '\u2014'}
                </td>
            </tr>
        );
    };

    const grandEstQty   = rows.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
    const grandEstTotal = rows.reduce((s, r) => s + getEstimate(r).estTotal, 0);
    const grandEstUnitP = grandEstQty > 0 ? grandEstTotal / grandEstQty : null;
    const grandActQty   = rows.reduce((s, r) => { const { actQty, hasData } = getActuals(r); return hasData ? s + actQty : s; }, 0);
    const grandActTotal = rows.reduce((s, r) => { const { actTotal, hasData } = getActuals(r); return hasData ? s + actTotal : s; }, 0);
    const grandActUnitP = grandActQty > 0 ? grandActTotal / grandActQty : null;
    const grandHasAct   = rows.some(r => getActuals(r).hasData);
    const grandRemQty   = grandHasAct ? grandEstQty - grandActQty : null;
    const grandRemUnitP = grandHasAct ? grandEstUnitP : null;
    const grandRemTotal = grandHasAct && grandRemQty !== null && grandEstUnitP !== null ? Math.round(grandRemQty * grandEstUnitP) : null;
    const grandPct      = grandHasAct && grandActUnitP !== null && grandEstUnitP !== null && grandEstUnitP > 0 ? ((grandEstUnitP - grandActUnitP) / grandEstUnitP) * 100 : null;
    const grandExQty    = rows.reduce((s, r) => { const { actQty, hasData } = getActuals(r); const eq = Number(r.quantity ?? 0); return hasData && actQty > eq ? s + (actQty - eq) : s; }, 0);
    const grandExUnitP  = grandHasAct && grandEstUnitP !== null ? grandEstUnitP : null;
    const grandExAmt    = grandHasAct && grandExQty > 0 && grandEstUnitP !== null ? Math.round(grandExQty * grandEstUnitP) : null;
    const grandHasEx    = rows.some(r => { const { actQty, hasData } = getActuals(r); const { estQty } = getEstimate(r); return hasData && actQty > estQty; });

    const totalW = colWidths.reduce((s, w) => s + w, 0);

    const SUB_COLS: Array<{ idx: number; label: string; bl: boolean }> = [
        { idx: 3,  label: 'քանակ', bl: true  },
        { idx: 4,  label: 'Միավորի Արժեքը', bl: false },
        { idx: 5,  label: 'Ընդհանուր', bl: false },
        { idx: 6,  label: 'քանակ', bl: true  },
        { idx: 7,  label: 'Միավորի Արժեքը', bl: false },
        { idx: 8,  label: 'Ընդհանուր', bl: false },
        { idx: 9,  label: 'քանակ', bl: true  },
        { idx: 10, label: 'Միավորի Արժեքը', bl: false },
        { idx: 11, label: 'Ընդհանուր', bl: false },
        { idx: 13, label: 'քանակ', bl: true  },
        { idx: 14, label: 'Միավորի Արժեքը', bl: false },
        { idx: 15, label: 'Ընդհանուր', bl: false },
    ];

    return (
        <Box ref={scrollRef}
            onMouseDown={onScrollMouseDown} onMouseMove={onScrollMouseMove}
            onMouseUp={onScrollMouseUp} onMouseLeave={onScrollMouseUp}
            sx={{ pb: 4, width: '100%', overflowX: 'auto', cursor: 'grab' }}>
            <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', minWidth: totalW }}>
                <colgroup>{colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                <thead>
                    <tr>
                        <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle' })}>
                            {'\u2116'}<ResizeHandle onDragStart={e => startResize(0, e)} />
                        </th>
                        <th rowSpan={2} style={thStyle({ textAlign: 'left', verticalAlign: 'middle' })}>
                            Աշխատանքի անվանումը<ResizeHandle onDragStart={e => startResize(1, e)} />
                        </th>
                        <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle' })}>
                            Միավոր<ResizeHandle onDragStart={e => startResize(2, e)} />
                        </th>
                        <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: '#00818f' })}>Նախահաշիվ</th>
                        <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: '#00818f' })}>Փաստացի</th>
                        <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: '#00818f' })}>Մնացորդային</th>
                        <th rowSpan={2} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', borderLeft: GSEP })}>
                            Շահութաբերություն<ResizeHandle onDragStart={e => startResize(12, e)} />
                        </th>
                        <th colSpan={3} style={thStyle({ textAlign: 'center', borderLeft: GSEP, color: '#c62828' })}>Լրացուցիչ</th>
                    </tr>
                    <tr>
                        {SUB_COLS.map(({ idx, label, bl }) => (
                            <th key={idx} style={thStyle({
                                textAlign: 'right', fontSize: '0.7rem', color: '#9ca3af',
                                ...(bl ? { borderLeft: GSEP } : {}),
                            })}>
                                {label}
                                <ResizeHandle onDragStart={e => startResize(idx, e)} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sections.map((section, si) => {
                        const sectionItems = rows.filter(r => r.sectionName === section.name && !r.parentGroupRowId);
                        if (sectionItems.length === 0) return null;
                        const subs = subsMap.get(toId(section._id)) ?? [];
                        return (
                            <>
                                <tr key={`sec-${section._id}`}>
                                    <td colSpan={NCOLS} style={tdStyle({
                                        fontWeight: 700, fontSize: '0.78rem', color: '#00818f',
                                        paddingLeft: 12, paddingTop: si > 0 ? 18 : 10, paddingBottom: 4,
                                        letterSpacing: '0.05em', textTransform: 'uppercase',
                                        borderBottom: '1px solid #d6eef1', backgroundColor: '#f9feff',
                                    })}>
                                        {si + 1}. {section.name}
                                    </td>
                                </tr>
                                {subs.length > 0
                                    ? subs.map((sub, subI) => {
                                        const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                        if (subItems.length === 0) return null;
                                        return (
                                            <>
                                                {sub.name?.trim() && (
                                                    <tr key={`sub-${sub._id}`}>
                                                        <td colSpan={NCOLS} style={tdStyle({
                                                            paddingLeft: 24, paddingTop: 8, paddingBottom: 4,
                                                            color: '#6b7280', fontSize: '0.77rem', fontWeight: 500,
                                                            borderBottom: '1px solid #f0f2f4',
                                                        })}>
                                                            {si + 1}.{subI + 1}. {sub.name}
                                                        </td>
                                                    </tr>
                                                )}
                                                {subItems.map(row => renderRow(row, ++counter, 32))}
                                            </>
                                        );
                                    })
                                    : sectionItems.map(row => renderRow(row, ++counter, 16))
                                }
                            </>
                        );
                    })}
                    <tr style={{ backgroundColor: '#f0fbfc' }}>
                        <td colSpan={3} style={tdStyle({ fontWeight: 700, color: ACCENT, fontSize: '0.82rem', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none' })}>
                            Ընդամենը
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: '#555' })}>{fmtQty(grandEstQty)}</td>
                        <td style={tdStyle({ textAlign: 'right', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: '#555' })}>{grandEstUnitP !== null ? fmtUnit(grandEstUnitP) : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: '#222', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none' })}>{formatCurrencyRounded(grandEstTotal)}</td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: '#555' })}>{grandHasAct ? fmtQty(grandActQty) : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: '#555' })}>{grandHasAct && grandActUnitP !== null ? fmtUnit(grandActUnitP) : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: ACCENT, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none' })}>{grandHasAct ? formatCurrencyRounded(grandActTotal) : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: grandRemQty === null ? '#ccc' : grandRemQty >= 0 ? '#2e7d32' : '#c62828', fontWeight: 600 })}>{fmtQty(grandRemQty)}</td>
                        <td style={tdStyle({ textAlign: 'right', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: grandRemUnitP === null ? '#ccc' : grandPct !== null && grandPct >= 0 ? '#2e7d32' : '#c62828' })}>{grandRemUnitP !== null ? fmtUnit(grandRemUnitP) : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 700, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: grandRemTotal === null ? '#ccc' : grandPct !== null && grandPct >= 0 ? '#2e7d32' : '#c62828' })}>
                            {grandRemTotal !== null ? `+${formatCurrencyRounded(grandRemTotal)}` : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none' })}>
                            {grandPct !== null
                                ? <span style={{ fontWeight: 700, fontSize: '0.82rem', color: grandPct >= 0 ? '#2e7d32' : '#c62828' }}>{grandPct >= 0 ? '+' : ''}{grandPct.toFixed(1)}%</span>
                                : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: grandHasEx ? '#c62828' : '#ccc', fontWeight: grandHasEx ? 600 : 400 })}>
                            {grandHasEx ? fmtQty(grandExQty) : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none', color: grandHasEx ? '#c62828' : '#ccc' })}>
                            {grandExUnitP !== null ? fmtUnit(grandExUnitP) : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: grandHasEx ? '#c62828' : '#ccc', borderTop: `2px solid ${ACCENT}`, borderBottom: 'none' })}>
                            {grandHasEx ? formatCurrencyRounded(grandExAmt) : '\u2014'}
                        </td>
                    </tr>
                    {ufSections.length > 0 && (() => {
                        let ufCounter = 0;
                        const ufEstTotal = ufRows.reduce((s, r) => s + (r.cost ?? 0), 0);
                        const ufEstQty   = ufRows.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
                        const ufActQty   = ufRows.reduce((s, r) => { const { actQty, hasData } = getActuals(r); return hasData ? s + actQty : s; }, 0);
                        const ufActTotal = ufRows.reduce((s, r) => { const { actTotal, hasData } = getActuals(r); return hasData ? s + actTotal : s; }, 0);
                        const ufHasAct   = ufRows.some(r => getActuals(r).hasData);
                        const ufRemQty   = ufHasAct ? ufEstQty - ufActQty : null;
                        const ufRemTotal = ufHasAct ? ufEstTotal - ufActTotal : null;
                        return (
                            <>
                                <tr>
                                    <td colSpan={NCOLS} style={{ padding: '8px 12px 4px', borderBottom: '1px solid #ffe0cc', borderTop: '2px solid #ffe0cc', backgroundColor: '#fff8f4' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ReportProblemOutlinedIcon sx={{ fontSize: 16, color: '#e65100' }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#e65100', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Չնախատեսված աշխատանքներ</span>
                                            {unforeseenEstimate?.name && (
                                                <span style={{ fontSize: '0.75rem', color: '#999' }}>({unforeseenEstimate.name})</span>
                                            )}
                                            {onDeleteUnforeseen && (
                                                <IconButton size='small' onClick={onDeleteUnforeseen} sx={{ ml: 'auto', color: '#bbb', '&:hover': { color: '#e53935' }, p: 0.5 }}>
                                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </td>
                                </tr>
                                {ufSections.map((section, si) => {
                                    const sectionItems = ufRows.filter(r => r.sectionName === section.name && !r.parentGroupRowId);
                                    if (sectionItems.length === 0) return null;
                                    const subs = ufSubsMap.get(toId(section._id)) ?? [];
                                    return (
                                        <>
                                            <tr key={`ufsec-${section._id}`}>
                                                <td colSpan={NCOLS} style={tdStyle({ fontWeight: 700, fontSize: '0.78rem', color: '#e65100', paddingLeft: 12, paddingTop: si > 0 ? 18 : 10, paddingBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #ffe8d9', backgroundColor: '#fff8f4' })}>
                                                    {si + 1}. {section.name}
                                                </td>
                                            </tr>
                                            {subs.length > 0
                                                ? subs.map((sub, subI) => {
                                                    const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                                    if (subItems.length === 0) return null;
                                                    return (
                                                        <>
                                                            {sub.name?.trim() && (
                                                                <tr key={`ufsub-${sub._id}`}>
                                                                    <td colSpan={NCOLS} style={tdStyle({ paddingLeft: 24, paddingTop: 8, paddingBottom: 4, color: '#6b7280', fontSize: '0.77rem', fontWeight: 500, borderBottom: '1px solid #f0f2f4' })}>
                                                                        {si + 1}.{subI + 1}. {sub.name}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {subItems.map(row => renderRow(row, ++ufCounter, 32))}
                                                        </>
                                                    );
                                                })
                                                : sectionItems.map(row => renderRow(row, ++ufCounter, 16))
                                            }
                                        </>
                                    );
                                })}
                                <tr style={{ backgroundColor: '#fff3ee' }}>
                                    <td colSpan={3} style={tdStyle({ fontWeight: 700, color: '#e65100', fontSize: '0.82rem', borderTop: '2px solid #e65100', borderBottom: 'none' })}>
                                        Ընդամենը (չնախ.)
                                    </td>
                                    <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: '2px solid #e65100', borderBottom: 'none', color: '#555' })}>{fmtQty(ufEstQty)}</td>
                                    <td style={tdStyle({ textAlign: 'right', borderTop: '2px solid #e65100', borderBottom: 'none', color: '#555' })}>{'—'}</td>
                                    <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: '#222', borderTop: '2px solid #e65100', borderBottom: 'none' })}>{formatCurrencyRounded(ufEstTotal)}</td>
                                    <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: '2px solid #e65100', borderBottom: 'none', color: '#555' })}>{ufHasAct ? fmtQty(ufActQty) : '—'}</td>
                                    <td style={tdStyle({ textAlign: 'right', borderTop: '2px solid #e65100', borderBottom: 'none', color: '#555' })}>{'—'}</td>
                                    <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: '#e65100', borderTop: '2px solid #e65100', borderBottom: 'none' })}>{ufHasAct ? formatCurrencyRounded(ufActTotal) : '—'}</td>
                                    <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, borderTop: '2px solid #e65100', borderBottom: 'none', color: ufRemQty === null ? '#ccc' : ufRemQty >= 0 ? '#2e7d32' : '#c62828', fontWeight: 600 })}>{fmtQty(ufRemQty)}</td>
                                    <td colSpan={6} style={tdStyle({ borderTop: '2px solid #e65100', borderBottom: 'none', color: ufRemTotal === null ? '#ccc' : ufRemTotal >= 0 ? '#2e7d32' : '#c62828', textAlign: 'right', fontWeight: 700 })}>
                                        {ufRemTotal !== null ? `${ufRemTotal >= 0 ? '+' : ''}${formatCurrencyRounded(ufRemTotal)}` : '—'}
                                    </td>
                                </tr>
                            </>
                        );
                    })()}
                </tbody>
            </table>
        </Box>
    );
}
