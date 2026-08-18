'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Divider, InputBase, Popover, Typography } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import type { CostHistoryEntry } from './page';
import { type PahestEntry } from './PahestMainMaterials';

const ACCENT = '#00A390';

interface ActualEntry { quantity: string; unitPrice: string; spent?: string; }
type ActualData = Record<string, ActualEntry>;

interface LaborRow {
    _id: string;
    laborItemId?: string;
    fullCode?: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    materialTotalCost?: number;
    subsectionName: string;
    sectionName: string;
    isGroupRow?: boolean;
    parentGroupRowId?: string;
}

interface MaterialRow {
    _id: string;
    estimatedLaborId: string;
    materialItemId: string;
    materialCatalogName: string;
    materialOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
}

interface Section {
    _id: string;
    name: string;
    displayIndex: number;
    totalCost?: number;
}

interface Subsection {
    _id: string;
    estimateSectionId: string;
    name: string;
    displayIndex: number;
    totalCost?: number;
}

type SnapshotData = { laborRows: LaborRow[]; sections: Section[]; subsections: Subsection[] };

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

const BASE_COLS = [
    { key: 'no',    defaultW: 52  },
    { key: 'desc',  defaultW: 500 },
    { key: 'unit',  defaultW: 72  },
    { key: 'qty',   defaultW: 90  },
    { key: 'up',    defaultW: 140 },
    { key: 'total', defaultW: 110 },
    { key: 'qty2',  defaultW: 90  },
    { key: 'up2',   defaultW: 140 },
    { key: 'total2',defaultW: 110 },
    { key: 'rqty',   defaultW: 90  },
    { key: 'rup',    defaultW: 140 },
    { key: 'rtot',   defaultW: 110 },
];
const MIN_COL_W = 50;

const ROW_LINE = '1px solid #f0f2f4';
const GSEP = '1px solid #e8f4f6';

const thStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '8px 10px',
    whiteSpace: 'nowrap',
    position: 'relative',
    fontWeight: 600,
    fontSize: '0.75rem',
    color: '#6b7280',
    backgroundColor: '#fff',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    border: 'none',
    borderBottom: '2px solid #e8f7f9',
    ...extra,
});

const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '7px 10px',
    fontSize: '0.82rem',
    verticalAlign: 'middle',
    border: 'none',
    borderBottom: ROW_LINE,
    ...extra,
});

function ResizeHandle({ onDragStart }: { onDragStart: (e: React.MouseEvent) => void }) {
    return (
        <div
            onMouseDown={onDragStart}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize', zIndex: 10, backgroundColor: 'transparent', transition: 'background-color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,171,190,0.35)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
        />
    );
}

export default function CostingTable({ estimate, estimateSnapshot, onCostAdded, actualData: externalActualData, onActualDataChange, costHistory, pahestEntries, accentColor }: { estimate: EstimatesApi.ApiEstimate; estimateSnapshot?: SnapshotData | null; onCostAdded?: (entry: CostHistoryEntry) => void; actualData?: ActualData; onActualDataChange?: (data: ActualData) => void; costHistory?: CostHistoryEntry[]; pahestEntries?: PahestEntry[]; accentColor?: string }) {
    const { t } = useTranslation();
    const SA = accentColor ?? ACCENT;
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [colWidths, setColWidths] = useState<number[]>(BASE_COLS.map(c => c.defaultW));
    const [localActualData, setLocalActualData] = useState<ActualData>({});
    const actualData = externalActualData ?? localActualData;
    const updateActualData = (data: ActualData) => { if (onActualDataChange) onActualDataChange(data); else setLocalActualData(data); };
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalSelected, setModalSelected] = useState<LaborRow | null>(null);
    const [modalQty, setModalQty] = useState('');
    const [modalSpent, setModalSpent] = useState('');

    const [groupDialog, setGroupDialog] = useState<{ open: boolean; groupName: string; items: any[]; loading: boolean }>({ open: false, groupName: '', items: [], loading: false });
    const [breakdownAnchor, setBreakdownAnchor] = useState<HTMLElement | null>(null);
    const [breakdownData, setBreakdownData] = useState<{ salaryTotal: number; volumeTotal: number; matActTotal: number; actTotal: number; actUP: number; unitSymbol: string } | null>(null);

    const handleGroupRowClick = useCallback(async (row: LaborRow) => {
        setGroupDialog({ open: true, groupName: row.laborOfferItemName || row.catalogName, items: [], loading: true });
        try {
            const items = await Api.requestSession<any[]>({ command: 'estimate/fetch_group_works', args: { parentGroupRowId: row._id } });
            setGroupDialog(prev => ({ ...prev, items: items ?? [], loading: false }));
        } catch {
            setGroupDialog(prev => ({ ...prev, loading: false }));
        }
    }, []);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrollDragging = useRef(false);
    const scrollDragStart = useRef({ x: 0, scrollLeft: 0 });
    const resizingCol = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

    const estimateId = toId(estimate._id);

    useEffect(() => {
        const matFetch = Api.requestSession<MaterialRow[]>({ command: 'estimate/fetch_materials_for_analysis', args: { estimateId } });
        if (estimateSnapshot) {
            setRows(estimateSnapshot.laborRows);
            setSections(estimateSnapshot.sections);
            setSubsections(estimateSnapshot.subsections);
            setLoading(false);
            matFetch.then(d => setMaterialRows(d ?? [])).catch(() => {});
            return;
        }
        setLoading(true);
        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
            matFetch,
        ])
            .then(async ([laborData, sectData, matData]) => {
                const sortedSections = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sortedSections);
                setRows(laborData ?? []);
                setMaterialRows(matData ?? []);
                const arrays = await Promise.all(
                    sortedSections.map(s =>
                        Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: String(s._id) } })
                            .catch(() => [] as Subsection[])
                    )
                );
                setSubsections(arrays.flat());
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId, estimateSnapshot]);

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
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [colWidths]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!scrollRef.current || resizingCol.current) return;
        isScrollDragging.current = true;
        scrollDragStart.current = { x: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
        scrollRef.current.style.cursor = 'grabbing';
    }, []);
    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isScrollDragging.current || !scrollRef.current || resizingCol.current) return;
        scrollRef.current.scrollLeft = scrollDragStart.current.scrollLeft - (e.clientX - scrollDragStart.current.x);
    }, []);
    const onMouseUp = useCallback(() => {
        if (!scrollRef.current) return;
        isScrollDragging.current = false;
        scrollRef.current.style.cursor = 'grab';
    }, []);

    const openModal = useCallback(() => {
        setModalSearch('');
        setModalSelected(null);
        setModalQty('');
        setModalSpent('');
        setModalOpen(true);
    }, []);

    const handleModalSelect = useCallback((row: LaborRow) => {
        setModalSelected(row);
        const existing = actualData[toId(row._id)];
        setModalQty(existing?.quantity ?? '');
        setModalSpent(existing?.spent ?? '');
    }, [actualData]);

    const handleModalConfirm = useCallback(() => {
        if (!modalSelected) return;
        const q = parseFloat(modalQty.replace(',', '.')) || 0;
        const s = parseFloat(modalSpent.replace(',', '.')) || 0;
        const p = q > 0 ? s / q : 0;
        updateActualData({ ...actualData, [toId(modalSelected._id)]: { quantity: modalQty, unitPrice: String(p), spent: modalSpent } });
        onCostAdded?.({
            id: `${Date.now()}-${toId(modalSelected._id)}`,
            laborItemId: toId(modalSelected._id),
            workName: modalSelected.laborOfferItemName || modalSelected.catalogName,
            unit: modalSelected.unitSymbol,
            quantity: q,
            unitPrice: p,
            total: q * p,
            addedAt: new Date(),
        });
        setModalOpen(false);
    }, [modalSelected, modalQty, modalSpent, onCostAdded]);

    const handleExport = useCallback(() => {
        const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const TOTAL_COLS = 9;
        let html = `<table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">`;
        html += `<tr><td colspan="${TOTAL_COLS}" style="border:1px solid #ccc;padding:6px 8px;font-weight:bold;font-size:14px;text-align:center;background:#e0f7fa;">${esc(estimate.name ?? '')}</td></tr>`;
        html += `<tr><td colspan="${TOTAL_COLS}" style="border:1px solid #ccc;padding:5px 8px;">&nbsp;</td></tr>`;
        const hdr = (label: string, extra = '') => `<th style="border:1px solid #ccc;padding:6px 8px;font-weight:bold;background:#e0f7fa;${extra}">${esc(label)}</th>`;
        const grpHdr = (label: string, extra = '') => `<th colspan="3" style="border:1px solid #ccc;padding:6px 8px;font-weight:bold;background:#e0f7fa;text-align:center;${extra}">${esc(label)}</th>`;
        html += `<tr>${hdr(t('No.'), 'rowspan="2"')}${hdr(t('Description of Work'), 'rowspan="2"')}${hdr(t('Unit'), 'rowspan="2"')}${grpHdr(t('As per Estimate'))}${grpHdr(t('Actual'), 'border-left:2px solid #b2e8ed;')}</tr>`;
        html += `<tr>${hdr(t('Quantity'))}${hdr(t('Unit Price'))}${hdr(t('Total'))}${hdr(t('Quantity'), 'border-left:2px solid #b2e8ed;')}${hdr(t('Unit Price'))}${hdr(t('Total'))}</tr>`;

        const subsMap = new Map<string, Subsection[]>();
        for (const sect of sections) {
            subsMap.set(String(sect._id), subsections.filter(s => String(s.estimateSectionId) === String(sect._id)).sort((a, b) => a.displayIndex - b.displayIndex));
        }

        let counter = 0;
        for (let si = 0; si < sections.length; si++) {
            const section = sections[si];
            const sectionItems = rows.filter(r => r.sectionName === section.name && !r.parentGroupRowId);
            if (sectionItems.length === 0) continue;
            const subs = subsMap.get(String(section._id)) ?? [];
            html += `<tr><td colspan="${TOTAL_COLS}" style="font-weight:bold;font-size:13px;background:#e0f5f7;border:1px solid #ccc;padding:6px 10px;text-align:center;">${esc(`${si + 1}. ${section.name.toUpperCase()}`)}</td></tr>`;

            const renderRow = (row: LaborRow, idx: number) =>
                `<tr><td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${idx}</td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;">${esc(row.laborOfferItemName || row.catalogName)}</td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:center;">${esc(row.unitSymbol)}</td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;">${Number(row.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;">${formatCurrencyRounded(row.changableAveragePrice)}</td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;font-weight:bold;">${formatCurrencyRounded(row.cost)}</td>` +
                `<td style="border:1px solid #ccc;border-left:2px solid #b2e8ed;padding:5px 8px;text-align:right;"></td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;"></td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;"></td></tr>`;

            if (subs.length > 0) {
                for (let subI = 0; subI < subs.length; subI++) {
                    const sub = subs[subI];
                    const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                    if (subItems.length === 0) continue;
                    html += `<tr><td colspan="${TOTAL_COLS}" style="font-style:italic;border:1px solid #ccc;padding:5px 10px;padding-left:20px;font-size:11px;background:#f7fdfe;">${esc(`${si + 1}.${subI + 1}. ${sub.name}`)}</td></tr>`;
                    for (const row of subItems) html += renderRow(row, ++counter);
                }
            } else {
                for (const row of sectionItems) html += renderRow(row, ++counter);
            }

            const secTotal = sectionItems.reduce((s, r) => s + (r.cost ?? 0), 0);
            html += `<tr style="background:#eaf8fa;">` +
                `<td colspan="5" style="font-weight:bold;text-align:right;border:1px solid #ccc;padding:5px 10px;">${esc(t('Subtotal'))}</td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;text-align:right;font-weight:bold;">${formatCurrencyRounded(secTotal)} AMD</td>` +
                `<td style="border:1px solid #ccc;border-left:2px solid #b2e8ed;padding:5px 8px;"></td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;"></td>` +
                `<td style="border:1px solid #ccc;padding:5px 8px;"></td></tr>`;
        }

        html += `<tr><td colspan="${TOTAL_COLS}" style="font-weight:bold;text-align:left;background:#d6f4f7;border-top:2px solid #00ABBE;border:1px solid #ccc;padding:6px 10px;">${esc(t('Total'))}</td></tr>`;
        html += '</table>';

        const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${html}</body></html>`;
        const blob = new Blob([full], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'costing.xls'; a.click();
        URL.revokeObjectURL(url);
    }, [rows, sections, subsections, estimate, t]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: ACCENT }} /></Box>;
    if (error) return <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>;
    if (rows.length === 0) return <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>{t('No data for selected period')}</Typography>;

    const grandTotal = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);
    const subsectionsBySection = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsectionsBySection.set(String(sect._id),
            subsections.filter(s => String(s.estimateSectionId) === String(sect._id)).sort((a, b) => a.displayIndex - b.displayIndex));
    }

    const totalCols = BASE_COLS.length;
    let itemCounter = 0;

    // Computes material actual total for a row, handling both new entries (laborItemId set) and
    // old entries (no laborItemId, look up via pahest estimatedLaborId)
    const calcMatActTotal = (rowId: string) => (costHistory ?? []).filter(e => {
        if (e.paymentMethod !== 'nyuth_tsakhsagrum') return false;
        if (e.laborItemId) return e.laborItemId === rowId;
        if (!e.materialItemId) return false;
        const pe = (pahestEntries ?? []).find(p => p.materialItemId === e.materialItemId);
        return pe?.estimatedLaborId ? pe.estimatedLaborId === rowId : false;
    }).reduce((s, e) => s + e.total, 0);

    const getRowActTotal = (row: LaborRow) => {
        const rowId = toId(row._id);
        const a = actualData[rowId];
        const volumeTotal = parseFloat((a?.spent ?? '').replace(',', '.')) || 0;
        const salaryTotal = (costHistory ?? []).filter(e => e.laborItemId === rowId && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
        const matActTotal = calcMatActTotal(rowId);
        return { actTotal: volumeTotal + salaryTotal + matActTotal, hasData: !!(a || salaryTotal > 0 || matActTotal > 0) };
    };

    const renderItemRow = (row: LaborRow, counter: number, descIndent: number) => {
        const rowId = toId(row._id);
        const mats = materialRows.filter(m => toId(m.estimatedLaborId) === rowId);
        const a = actualData[rowId];
        const q = parseFloat((a?.quantity ?? '').replace(',', '.')) || 0;
        const volumeTotal = parseFloat((a?.spent ?? '').replace(',', '.')) || 0;
        const salaryTotal = (costHistory ?? []).filter(e => e.laborItemId === rowId && e.paymentMethod !== 'nyuth_tsakhsagrum').reduce((s, e) => s + e.total, 0);
        const matActTotal = calcMatActTotal(rowId);
        const actTotal = volumeTotal + salaryTotal + matActTotal;
        const hasData = !!(a || salaryTotal > 0 || matActTotal > 0);
        const estQty = Number(row.quantity ?? 0);
        const laborCostRounded = Math.round(estQty * row.changableAveragePrice);
        const rawMatEst = row.materialTotalCost !== undefined ? row.materialTotalCost : mats.reduce((s, m) => s + m.cost, 0);
        const matCostRounded = Math.round(rawMatEst);
        const estTotal = laborCostRounded + matCostRounded;
        const estUP = estQty > 0 ? Math.round(estTotal / estQty) : (row.changableAveragePrice ?? 0);
        const actUP = q > 0 ? actTotal / q : 0;
        const rQty = q > 0 ? estQty - q : null;
        const rUp = q > 0 ? estUP : null;
        const rTot = q > 0 ? Math.round((estQty - q) * estUP) : null;
        const col = (v: number | null) => v === null ? '#ccc' : v >= 0 ? '#2e7d32' : '#c62828';
        const fw = (v: number | null) => v !== null ? 600 : 400;
        return (
            <tr key={toId(row._id)} style={{ backgroundColor: '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fdfe'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fff'; }}
            >
                <td style={tdStyle({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{counter}</td>
                <td style={tdStyle({ paddingLeft: descIndent, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' })}>
                    {row.isGroupRow ? (
                        <span
                            onClick={() => handleGroupRowClick(row)}
                            style={{ color: ACCENT, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                        >
                            {row.laborOfferItemName || row.catalogName}
                        </span>
                    ) : (row.laborOfferItemName || row.catalogName)}
                </td>
                <td style={tdStyle({ textAlign: 'center', color: '#666' })}>{row.unitSymbol}</td>
                <td style={tdStyle({ textAlign: 'right' })}>{estQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td style={tdStyle({ textAlign: 'right', color: '#555' })}>{formatCurrencyRounded(estUP)}</td>
                <td style={tdStyle({ textAlign: 'right', fontWeight: 600 })}>{formatCurrencyRounded(estTotal)}</td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, color: q > 0 ? '#222' : '#ccc' })}>{q > 0 ? q.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                <td style={tdStyle({ textAlign: 'right', color: (q > 0 && actTotal > 0) ? '#555' : '#ccc' })}>
                    {(q > 0 && actTotal > 0) ? (
                        <span
                            onClick={e => { setBreakdownAnchor(e.currentTarget as HTMLElement); setBreakdownData({ salaryTotal, volumeTotal, matActTotal, actTotal, actUP, unitSymbol: row.unitSymbol }); }}
                            style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                        >
                            {formatCurrencyRounded(actUP)}
                        </span>
                    ) : '—'}
                </td>
                <td style={tdStyle({ textAlign: 'right', fontWeight: 600, color: actTotal > 0 ? ACCENT : '#ccc' })}>{actTotal > 0 ? formatCurrencyRounded(actTotal) : '—'}</td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: GSEP, color: col(rQty), fontWeight: fw(rQty) })}>{rQty !== null ? rQty.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>
                <td style={tdStyle({ textAlign: 'right', color: col(rUp), fontWeight: fw(rUp) })}>{rUp !== null ? formatCurrencyRounded(rUp) : '—'}</td>
                <td style={tdStyle({ textAlign: 'right', color: col(rTot), fontWeight: fw(rTot) })}>{rTot !== null ? formatCurrencyRounded(rTot) : '—'}</td>
            </tr>
        );
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mb: 1.5 }}>
                <Button variant='outlined' size='small' startIcon={<SaveAltIcon />} onClick={handleExport}
                    sx={{ borderRadius: '20px', borderColor: '#aaa', color: '#555', fontWeight: 600, '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#888' } }}>
                    {t('Export')}
                </Button>
            </Box>

            <Box ref={scrollRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                sx={{ overflow: 'auto', cursor: 'grab' }}>
                <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', minWidth: colWidths.reduce((s, w) => s + w, 0) }}>
                    <colgroup>{colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                    <thead>
                        {/* Row 1: fixed cols (rowspan=2) + group labels */}
                        <tr>
                            {[0, 1, 2].map(i => (
                                <th key={BASE_COLS[i].key} rowSpan={2} style={thStyle({ textAlign: i === 0 ? 'center' : 'left', verticalAlign: 'middle' })}>
                                    {i === 0 ? t('No.') : i === 1 ? t('Description of Work') : t('Unit')}
                                    <ResizeHandle onDragStart={e => startResize(i, e)} />
                                </th>
                            ))}
                            <th colSpan={3} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', color: ACCENT })}>
                                {t('As per Estimate')}
                            </th>
                            <th colSpan={3} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', borderLeft: GSEP, color: ACCENT })}>
                                {t('Actual')}
                            </th>
                            <th colSpan={3} style={thStyle({ textAlign: 'center', verticalAlign: 'middle', borderLeft: GSEP, color: ACCENT })}>Մնացորդային</th>
                        </tr>
                        {/* Row 2: sub-column labels */}
                        <tr>
                            {[3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                                <th key={BASE_COLS[i].key} style={thStyle({
                                    textAlign: 'right',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    borderBottom: GSEP,
                                    ...(i === 6 || i === 9 ? { borderLeft: GSEP } : {}),
                                })}>
                                    {i === 3 || i === 6 || i === 9 ? t('Quantity') : i === 4 || i === 7 || i === 10 ? t('Unit Price') : t('Total')}
                                    <ResizeHandle onDragStart={e => startResize(i, e)} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map((section, sectionIdx) => {
                            const sectionItems = rows.filter(r => r.sectionName === section.name && !r.parentGroupRowId);
                            if (sectionItems.length === 0) return null;
                            const subs = subsectionsBySection.get(String(section._id)) ?? [];
                            const sectionLaborIds = new Set(sectionItems.map(r => toId(r._id)));
                            const sectionMaterials = materialRows.filter(m => sectionLaborIds.has(toId(m.estimatedLaborId)));
                            const sectionTotal = sectionItems.reduce((sum, r) => {
                                const lc = Math.round(Number(r.quantity ?? 0) * r.changableAveragePrice);
                                const rawMat = r.materialTotalCost !== undefined ? r.materialTotalCost : sectionMaterials.filter(m => toId(m.estimatedLaborId) === toId(r._id)).reduce((s, m) => s + m.cost, 0);
                                return sum + lc + Math.round(rawMat);
                            }, 0);

                            return (
                                <>
                                    <tr key={`section-${section._id}`} style={{ backgroundColor: '#f9feff' }}>
                                        <td colSpan={totalCols} style={tdStyle({ fontWeight: 700, fontSize: '0.85rem', color: SA, paddingLeft: 16, letterSpacing: '0.03em', borderTop: sectionIdx > 0 ? GSEP : undefined })}>
                                            {sectionIdx + 1}. {section.name.toUpperCase()}
                                        </td>
                                    </tr>

                                    {subs.length > 0
                                        ? subs.map((sub, subIdx) => {
                                            const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                            if (subItems.length === 0) return null;
                                            const subTotal = subItems.reduce((sum, r) => {
                                                const mats = materialRows.filter(m => toId(m.estimatedLaborId) === toId(r._id));
                                                const lc = Math.round(Number(r.quantity ?? 0) * r.changableAveragePrice);
                                                const rawMat = r.materialTotalCost !== undefined ? r.materialTotalCost : mats.reduce((s, m) => s + m.cost, 0);
                                                return sum + lc + Math.round(rawMat);
                                            }, 0);
                                            return (
                                                <>
                                                    {sub.name?.trim() && (
                                                        <tr key={`sub-${sub._id}`}>
                                                            <td colSpan={totalCols} style={tdStyle({ paddingLeft: 28, color: '#9ca3af', fontStyle: 'italic', fontSize: '0.78rem' })}>
                                                                {sectionIdx + 1}.{subIdx + 1}. {sub.name}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {subItems.map(row => renderItemRow(row, ++itemCounter, sub.name?.trim() ? 36 : 20))}
                                                    <tr key={`subtotal-${sub._id}`} style={{ backgroundColor: '#f5fbfc' }}>
                                                        {(() => {
                                                            const subActTotal = subItems.reduce((s, r) => s + getRowActTotal(r).actTotal, 0);
                                                            const subHasAct = subItems.some(r => getRowActTotal(r).hasData);
                                                            const subRemTotal = subHasAct ? subTotal - subActTotal : null;
                                                            return (<>
                                                                <td colSpan={5} style={tdStyle({ fontWeight: 600, color: '#6b7280', fontSize: '0.78rem', paddingLeft: 28, borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}>{sectionIdx + 1}.{subIdx + 1}. Ընդամենը</td>
                                                                <td style={tdStyle({ fontWeight: 700, textAlign: 'right', color: SA, whiteSpace: 'nowrap', borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}>{formatCurrencyRounded(subTotal)} AMD</td>
                                                                <td style={tdStyle({ borderLeft: GSEP, borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}></td>
                                                                <td style={tdStyle({ borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}></td>
                                                                <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: subHasAct ? SA : '#ccc', whiteSpace: 'nowrap', borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}>{subHasAct ? formatCurrencyRounded(subActTotal) + ' AMD' : '—'}</td>
                                                                <td style={tdStyle({ borderLeft: GSEP, borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}></td>
                                                                <td style={tdStyle({ borderTop: '1px solid #d6f0f2', borderBottom: 'none' })}></td>
                                                                <td style={tdStyle({ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', borderTop: '1px solid #d6f0f2', borderBottom: 'none', color: subRemTotal === null ? '#ccc' : subRemTotal >= 0 ? '#2e7d32' : '#c62828' })}>{subRemTotal !== null ? formatCurrencyRounded(subRemTotal) + ' AMD' : '—'}</td>
                                                            </>);
                                                        })()}
                                                    </tr>
                                                </>
                                            );
                                        })
                                        : sectionItems.map(row => renderItemRow(row, ++itemCounter, 20))
                                    }

                                    <tr key={`sectotal-${section._id}`} style={{ backgroundColor: '#eef9fb' }}>
                                        {(() => {
                                            const sectActTotal = sectionItems.reduce((s, r) => s + getRowActTotal(r).actTotal, 0);
                                            const sectHasAct = sectionItems.some(r => getRowActTotal(r).hasData);
                                            const sectRemTotal = sectHasAct ? sectionTotal - sectActTotal : null;
                                            return (<>
                                                <td colSpan={5} style={tdStyle({ fontWeight: 700, color: '#007a89', fontSize: '0.77rem', paddingLeft: 12, borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}>{sectionIdx + 1}. Ընդամենը</td>
                                                <td style={tdStyle({ fontWeight: 700, textAlign: 'right', color: SA, whiteSpace: 'nowrap', borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}>{formatCurrencyRounded(sectionTotal)} AMD</td>
                                                <td style={tdStyle({ borderLeft: GSEP, borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}></td>
                                                <td style={tdStyle({ borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}></td>
                                                <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: sectHasAct ? SA : '#ccc', whiteSpace: 'nowrap', borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}>{sectHasAct ? formatCurrencyRounded(sectActTotal) + ' AMD' : '—'}</td>
                                                <td style={tdStyle({ borderLeft: GSEP, borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}></td>
                                                <td style={tdStyle({ borderTop: '2px solid #c0e8ec', borderBottom: 'none' })}></td>
                                                <td style={tdStyle({ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', borderTop: '2px solid #c0e8ec', borderBottom: 'none', color: sectRemTotal === null ? '#ccc' : sectRemTotal >= 0 ? '#2e7d32' : '#c62828' })}>{sectRemTotal !== null ? formatCurrencyRounded(sectRemTotal) + ' AMD' : '—'}</td>
                                            </>);
                                        })()}
                                    </tr>
                                </>
                            );
                        })}

                        <tr style={{ backgroundColor: '#f0fbfc' }}>
                            {(() => {
                                const grandEstTotal = rows.reduce((s, r) => {
                                    const mats = materialRows.filter(m => toId(m.estimatedLaborId) === toId(r._id));
                                    const lc = Math.round(Number(r.quantity ?? 0) * r.changableAveragePrice);
                                    const rawMat = r.materialTotalCost !== undefined ? r.materialTotalCost : mats.reduce((sm, m) => sm + m.cost, 0);
                                    return s + lc + Math.round(rawMat);
                                }, 0);
                                const grandActTotal = rows.reduce((s, r) => s + getRowActTotal(r).actTotal, 0);
                                const grandHasAct = rows.some(r => getRowActTotal(r).hasData);
                                const grandRemTotal = grandHasAct ? grandEstTotal - grandActTotal : null;
                                return (<>
                                    <td colSpan={5} style={tdStyle({ fontWeight: 700, color: SA, fontSize: '0.85rem', paddingLeft: 16, borderTop: `2px solid ${SA}`, borderBottom: 'none' })}>{t('Total')}</td>
                                    <td style={tdStyle({ fontWeight: 700, textAlign: 'right', color: SA, whiteSpace: 'nowrap', borderTop: `2px solid ${SA}`, borderBottom: 'none' })}>{formatCurrencyRounded(grandEstTotal)} AMD</td>
                                    <td style={tdStyle({ borderLeft: GSEP, borderTop: `2px solid ${SA}`, borderBottom: 'none' })}></td>
                                    <td style={tdStyle({ borderTop: `2px solid ${SA}`, borderBottom: 'none' })}></td>
                                    <td style={tdStyle({ textAlign: 'right', fontWeight: 700, color: grandHasAct ? SA : '#ccc', whiteSpace: 'nowrap', borderTop: `2px solid ${SA}`, borderBottom: 'none' })}>{grandHasAct ? formatCurrencyRounded(grandActTotal) + ' AMD' : '—'}</td>
                                    <td style={tdStyle({ borderLeft: GSEP, borderTop: `2px solid ${SA}`, borderBottom: 'none' })}></td>
                                    <td style={tdStyle({ borderTop: `2px solid ${SA}`, borderBottom: 'none' })}></td>
                                    <td style={tdStyle({ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', borderTop: `2px solid ${SA}`, borderBottom: 'none', color: grandRemTotal === null ? '#ccc' : grandRemTotal >= 0 ? '#2e7d32' : '#c62828' })}>{grandRemTotal !== null ? formatCurrencyRounded(grandRemTotal) + ' AMD' : '—'}</td>
                                </>);
                            })()}
                        </tr>
                    </tbody>
                </table>
            </Box>

            {/* Add Cost Modal */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: ACCENT, pb: 1 }}>{t('Add Cost')}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {/* Search */}
                    <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid #e0f5f7`, borderRadius: 2, px: 1.5, mb: 1.5, backgroundColor: '#fafeff' }}>
                        <SearchIcon sx={{ color: '#aaa', mr: 1, fontSize: 18 }} />
                        <InputBase
                            placeholder={t('Search') + '...'}
                            value={modalSearch}
                            onChange={e => setModalSearch(e.target.value)}
                            sx={{ flex: 1, fontSize: '0.88rem', py: 0.5 }}
                            autoFocus
                        />
                    </Box>

                    {/* Work list */}
                    <Box sx={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e0f5f7', borderRadius: 2, mb: 2 }}>
                        {rows
                            .filter(r => {
                                const name = (r.laborOfferItemName || r.catalogName || '').toLowerCase();
                                return name.includes(modalSearch.toLowerCase());
                            })
                            .map(r => (
                                <Box
                                    key={String(r._id)}
                                    onClick={() => handleModalSelect(r)}
                                    sx={{
                                        px: 2, py: 1, fontSize: '0.85rem', cursor: 'pointer',
                                        borderBottom: '1px solid #f0fbfc',
                                        backgroundColor: modalSelected?._id === r._id ? 'rgba(0,171,190,0.08)' : 'transparent',
                                        color: modalSelected?._id === r._id ? ACCENT : '#333',
                                        fontWeight: modalSelected?._id === r._id ? 600 : 400,
                                        '&:hover': { backgroundColor: 'rgba(0,171,190,0.06)' },
                                        '&:last-child': { borderBottom: 'none' },
                                    }}
                                >
                                    {r.laborOfferItemName || r.catalogName}
                                    <Typography component='span' sx={{ ml: 1, fontSize: '0.78rem', color: '#888' }}>({r.unitSymbol})</Typography>
                                </Box>
                            ))
                        }
                    </Box>

                    {/* Volume + Spent material inputs */}
                    {modalSelected && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>Ծavali</Typography>
                                    <InputBase
                                        value={modalQty}
                                        onChange={e => setModalQty(e.target.value)}
                                        placeholder='0'
                                        sx={{ border: `1px solid ${ACCENT}`, borderRadius: '6px', px: 1.5, py: 0.5, width: '100%', fontSize: '0.88rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.15)' } }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>Ծakhsvats nyuthi qanaky</Typography>
                                    <InputBase
                                        value={modalSpent}
                                        onChange={e => setModalSpent(e.target.value)}
                                        placeholder='0'
                                        sx={{ border: `1px solid ${ACCENT}`, borderRadius: '6px', px: 1.5, py: 0.5, width: '100%', fontSize: '0.88rem', '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.15)' } }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setModalOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        disabled={!modalSelected || !modalQty || !modalSpent}
                        onClick={handleModalConfirm}
                        sx={{ borderRadius: '20px', backgroundColor: ACCENT, '&:hover': { backgroundColor: '#009aab' } }}
                    >
                        {t('Add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Group Works Dialog */}
            <Dialog open={groupDialog.open} onClose={() => setGroupDialog(prev => ({ ...prev, open: false }))} maxWidth='lg' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: ACCENT, pb: 1 }}>{groupDialog.groupName}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {groupDialog.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
                    ) : groupDialog.items.length === 0 ? (
                        <Typography sx={{ color: '#888', py: 2 }}>{t('No works')}</Typography>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr>
                                        {[t('ID'), t('Labor'), t('Unit'), t('Quantity'), t('Price'), t('Without material'), t('Material Cost'), t('Price with material'), t('Unit Price')].map((h, i) => (
                                            <th key={i} style={{ padding: '8px 10px', textAlign: i === 0 ? 'center' : i <= 1 ? 'left' : 'right', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '2px solid #e8f7f9', whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupDialog.items.map((item: any, idx: number) => {
                                        const qty = item.quantity ?? 0;
                                        const price = item.changableAveragePrice ?? 0;
                                        const matCost = item.materialTotalCost ?? 0;
                                        const withoutMat = Math.round(qty * price);
                                        const withMat = withoutMat + Math.round(matCost);
                                        const unitPrice = qty > 0 ? Math.round(withMat / qty) : 0;
                                        return (
                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafeff' }}>
                                                <td style={{ padding: '7px 10px', textAlign: 'center', color: '#888', borderBottom: '1px solid #f0f2f4' }}>{item.fullCode || '—'}</td>
                                                <td style={{ padding: '7px 10px', borderBottom: '1px solid #f0f2f4' }}>{item.laborOfferItemName || '—'}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', color: '#666', borderBottom: '1px solid #f0f2f4' }}>{item.itemMeasurementUnit || '—'}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f2f4' }}>{qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f2f4' }}>{formatCurrencyRounded(price)}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f2f4' }}>{formatCurrencyRounded(withoutMat)}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #f0f2f4' }}>{formatCurrencyRounded(matCost)}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 500, borderBottom: '1px solid #f0f2f4' }}>{formatCurrencyRounded(withMat)}</td>
                                                <td style={{ padding: '7px 10px', textAlign: 'right', color: ACCENT, fontWeight: 600, borderBottom: '1px solid #f0f2f4' }}>{formatCurrencyRounded(unitPrice)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setGroupDialog(prev => ({ ...prev, open: false }))} sx={{ borderRadius: '20px', color: '#888' }}>{t('Close')}</Button>
                </DialogActions>
            </Dialog>

            {/* Actual unit price breakdown popover */}
            <Popover
                open={!!breakdownAnchor}
                anchorEl={breakdownAnchor}
                onClose={() => setBreakdownAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2, p: 2, minWidth: 220, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
            >
                {breakdownData && (() => {
                    const { salaryTotal, volumeTotal, matActTotal, actTotal, actUP, unitSymbol } = breakdownData;
                    const q = actTotal > 0 && actUP > 0 ? actTotal / actUP : 1;
                    const fmtAMD = (v: number) => `${formatCurrencyRounded(Math.round(v))} AMD`;
                    const rows: { label: string; val: number }[] = [
                        { label: t('Labor Cost'), val: salaryTotal / q },
                        { label: 'Volume / Spent', val: volumeTotal / q },
                        { label: t('Materials Cost'), val: matActTotal / q },
                    ].filter(r => r.val > 0);
                    return (
                        <Box>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                                {t('Cost Breakdown')} / {unitSymbol}
                            </Typography>
                            {rows.map(r => (
                                <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, mb: 0.6 }}>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#666' }}>{r.label}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#333', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtAMD(r.val)}</Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                                <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#222' }}>{t('Unit Price')}</Typography>
                                <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: SA, whiteSpace: 'nowrap' }}>{fmtAMD(actUP)}</Typography>
                            </Box>
                        </Box>
                    );
                })()}
            </Popover>
        </Box>
    );
}
