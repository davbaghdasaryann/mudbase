'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';
import type { CostHistoryEntry } from './page';

interface LaborRow {
    _id: string; catalogName: string; laborOfferItemName: string;
    unitSymbol: string; quantity: number; changableAveragePrice: number;
    cost: number; subsectionName: string; sectionName: string;
}
interface Section { _id: string; name: string; displayIndex: number; totalCost: number; }
interface Subsection { _id: string; estimateSectionId: string; name: string; displayIndex: number; }

function toId(v: unknown): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'oid' in (v as any)) return (v as any).oid;
    return String(v);
}

const BORDER = '#e8f7f9';
const SEC_BG = '#e6f7f9';
const SUB_BG = '#f7fdfe';
const MIN_COL_W = 50;
const NCOLS = 11;

const BASE_COLS = [
    { key: 'no',       defaultW: 44  },
    { key: 'name',     defaultW: 280 },
    { key: 'estQty',   defaultW: 80  },
    { key: 'estAmt',   defaultW: 130 },
    { key: 'actQty',   defaultW: 80  },
    { key: 'actAmt',   defaultW: 130 },
    { key: 'remQty',   defaultW: 80  },
    { key: 'remAmt',   defaultW: 140 },
    { key: 'pct',      defaultW: 140 },
    { key: 'extraQty', defaultW: 80  },
    { key: 'extraAmt', defaultW: 135 },
];

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

const thStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`, padding: '6px 8px', whiteSpace: 'nowrap', position: 'relative',
    fontWeight: 700, fontSize: '0.78rem', color: '#222',
    backgroundColor: '#f0fbfc', borderBottom: `2px solid ${mainPrimaryColor}`, ...extra,
});
const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`, padding: '5px 8px',
    fontSize: '0.82rem', verticalAlign: 'middle', ...extra,
});
const fmtQty = (v: number | null) => v !== null ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '\u2014';

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    actualData: Record<string, { quantity: string; unitPrice: string; spent?: string }>;
    costHistory: CostHistoryEntry[];
}

export default function AnalysisTab({ estimate, actualData, costHistory }: Props) {
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [colWidths, setColWidths] = useState<number[]>(BASE_COLS.map(c => c.defaultW));
    const resizingCol = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrollDragging = useRef(false);
    const scrollDragStart = useRef({ x: 0, scrollLeft: 0 });
    const estimateId = toId(estimate._id);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
        ])
            .then(async ([laborData, sectData]) => {
                const sorted = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sorted); setRows(laborData ?? []);
                const arrays = await Promise.all(
                    sorted.map(s => Api.requestSession<Subsection[]>({ command: 'estimate/fetch_subsections', args: { estimateSectionId: toId(s._id) } }).catch(() => [] as Subsection[]))
                );
                setSubsections(arrays.flat());
            })
            .catch(console.error).finally(() => setLoading(false));
    }, [estimateId]);

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

    const getActuals = (row: LaborRow) => {
        const rowId = toId(row._id);
        const a = actualData[rowId];
        const actQty   = parseFloat((a?.quantity ?? '').replace(',', '.')) || 0;
        const volTotal = parseFloat((a?.spent    ?? '').replace(',', '.')) || 0;
        const salTotal = costHistory.filter(e => e.laborItemId === rowId).reduce((s, e) => s + e.total, 0);
        const actTotal = volTotal + salTotal;
        const hasData  = !!(a || salTotal > 0);
        return { actQty, actTotal, hasData };
    };

    let counter = 0;

    const renderRow = (row: LaborRow, idx: number, pl: number) => {
        const { actQty, actTotal, hasData } = getActuals(row);
        const estQty   = Number(row.quantity ?? 0);
        const estTotal = row.cost ?? 0;
        const remQty   = hasData ? estQty - actQty : null;
        const remTotal = hasData ? estTotal - actTotal : null;
        const pct      = remTotal !== null && estTotal > 0 ? (remTotal / estTotal) * 100 : null;
        const cheaper  = remTotal !== null ? remTotal >= 0 : null;
        const exQty    = hasData && actQty > estQty  ? actQty  - estQty  : null;
        const exAmt    = hasData && actTotal > estTotal ? actTotal - estTotal : null;
        const BL = '2px solid #b2e8ed';
        const itemName = row.laborOfferItemName || row.catalogName;

        return (
            <tr key={toId(row._id)} style={{ backgroundColor: idx % 2 === 0 ? '#fafeff' : '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f5fdfe'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#fafeff' : '#fff'; }}
            >
                <td style={tdStyle({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{idx}</td>
                <td style={tdStyle({ paddingLeft: pl, whiteSpace: 'normal' })}>{itemName}</td>
                <td style={tdStyle({ textAlign: 'right', color: '#555', borderLeft: BL })}>{fmtQty(estQty)}</td>
                <td style={tdStyle({ textAlign: 'right', fontWeight: 600, color: '#333' })}>{formatCurrencyRounded(estTotal)} AMD</td>
                <td style={tdStyle({ textAlign: 'right', color: hasData ? '#555' : '#ccc', borderLeft: BL })}>{hasData ? fmtQty(actQty) : '\u2014'}</td>
                <td style={tdStyle({ textAlign: 'right', fontWeight: 600, color: hasData ? mainPrimaryColor : '#ccc' })}>
                    {hasData ? `${formatCurrencyRounded(actTotal)} AMD` : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: BL, color: remQty === null ? '#ccc' : remQty >= 0 ? '#2e7d32' : '#c62828', fontWeight: remQty !== null ? 600 : 400 })}>
                    {fmtQty(remQty)}
                </td>
                <td style={tdStyle({ textAlign: 'right' })}>
                    {remTotal !== null
                        ? <span style={{ fontWeight: 700, color: cheaper! ? '#2e7d32' : '#c62828' }}>{remTotal >= 0 ? '+' : ''}{formatCurrencyRounded(remTotal)} AMD</span>
                        : <span style={{ color: '#ccc' }}>{'\u2014'}</span>}
                </td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: BL })}>
                    {pct !== null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                            {cheaper ? <TrendingDownIcon sx={{ fontSize: 14, color: '#2e7d32' }} /> : <TrendingUpIcon sx={{ fontSize: 14, color: '#c62828' }} />}
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: cheaper ? '#2e7d32' : '#c62828' }}>
                                {Math.abs(pct).toFixed(1)}%
                            </Typography>
                        </Box>
                    ) : <span style={{ color: '#ccc' }}>{'\u2014'}</span>}
                </td>
                <td style={tdStyle({ textAlign: 'right', borderLeft: BL, color: exQty !== null ? '#c62828' : '#ccc', fontWeight: exQty !== null ? 600 : 400 })}>
                    {exQty !== null ? fmtQty(exQty) : '\u2014'}
                </td>
                <td style={tdStyle({ textAlign: 'right' })}>
                    {exAmt !== null
                        ? <span style={{ fontWeight: 700, color: '#c62828' }}>{formatCurrencyRounded(exAmt)} AMD</span>
                        : <span style={{ color: '#ccc' }}>{'\u2014'}</span>}
                </td>
            </tr>
        );
    };

    const grandEstQty   = rows.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
    const grandEstTotal = rows.reduce((s, r) => s + (r.cost ?? 0), 0);
    const grandActQty   = rows.reduce((s, r) => { const { actQty, hasData } = getActuals(r); return hasData ? s + actQty : s; }, 0);
    const grandActTotal = rows.reduce((s, r) => { const { actTotal, hasData } = getActuals(r); return hasData ? s + actTotal : s; }, 0);
    const grandHasAct   = rows.some(r => getActuals(r).hasData);
    const grandRemQty   = grandHasAct ? grandEstQty - grandActQty : null;
    const grandRemTotal = grandHasAct ? grandEstTotal - grandActTotal : null;
    const grandPct      = grandRemTotal !== null && grandEstTotal > 0 ? (grandRemTotal / grandEstTotal) * 100 : null;
    const grandExQty    = rows.reduce((s, r) => { const { actQty, hasData } = getActuals(r); const eq = Number(r.quantity ?? 0); return hasData && actQty > eq ? s + (actQty - eq) : s; }, 0);
    const grandExAmt    = rows.reduce((s, r) => { const { actTotal, hasData } = getActuals(r); const et = r.cost ?? 0; return hasData && actTotal > et ? s + (actTotal - et) : s; }, 0);
    const grandHasEx    = rows.some(r => { const { actQty, actTotal, hasData } = getActuals(r); return hasData && (actQty > Number(r.quantity ?? 0) || actTotal > (r.cost ?? 0)); });

    const totalW = colWidths.reduce((s, w) => s + w, 0);
    const BL = '2px solid #b2e8ed';

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
                        <th colSpan={2} style={thStyle({ textAlign: 'center', borderLeft: BL })}>Նախահաշիվ</th>
                        <th colSpan={2} style={thStyle({ textAlign: 'center', borderLeft: BL })}>Փաստացի</th>
                        <th colSpan={2} style={thStyle({ textAlign: 'center', borderLeft: BL })}>Մնացորդային</th>
                        <th rowSpan={2} style={thStyle({ textAlign: 'right', verticalAlign: 'middle', borderLeft: BL })}>
                            Շահութաբերություն<ResizeHandle onDragStart={e => startResize(8, e)} />
                        </th>
                        <th colSpan={2} style={thStyle({ textAlign: 'center', borderLeft: BL })}>Լրացուցիչ</th>
                    </tr>
                    <tr>
                        {[2, 3, 4, 5, 6, 7, 9, 10].map(i => (
                            <th key={i} style={thStyle({ textAlign: 'right', fontSize: '0.73rem', fontWeight: 600, color: '#444',
                                ...([2, 4, 6, 9].includes(i) ? { borderLeft: BL } : {}),
                            })}>
                                {[2, 4, 6, 9].includes(i) ? 'քանակ' : 'Անուն'}
                                <ResizeHandle onDragStart={e => startResize(i > 7 ? i - 1 : i, e)} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sections.map((section, si) => {
                        const sectionItems = rows.filter(r => r.sectionName === section.name);
                        if (sectionItems.length === 0) return null;
                        const subs = subsMap.get(toId(section._id)) ?? [];
                        return (
                            <>
                                <tr key={`sec-${section._id}`} style={{ backgroundColor: SEC_BG }}>
                                    <td colSpan={NCOLS} style={tdStyle({ fontWeight: 700, fontSize: '0.85rem', color: '#00818f', paddingLeft: 16, borderTop: si > 0 ? '2px solid #b2e8ed' : undefined })}>
                                        {si + 1}. {section.name.toUpperCase()}
                                    </td>
                                </tr>
                                {subs.length > 0
                                    ? subs.map((sub, subI) => {
                                        const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                        if (subItems.length === 0) return null;
                                        return (
                                            <>
                                                <tr key={`sub-${sub._id}`} style={{ backgroundColor: SUB_BG }}>
                                                    <td colSpan={NCOLS} style={tdStyle({ paddingLeft: 28, color: '#666', fontStyle: 'italic', fontSize: '0.8rem' })}>
                                                        {si + 1}.{subI + 1}. {sub.name}
                                                    </td>
                                                </tr>
                                                {subItems.map(row => renderRow(row, ++counter, 36))}
                                            </>
                                        );
                                    })
                                    : sectionItems.map(row => renderRow(row, ++counter, 20))
                                }
                            </>
                        );
                    })}
                    <tr style={{ backgroundColor: '#d6f4f7' }}>
                        <td colSpan={2} style={tdStyle({ fontWeight: 800, color: mainPrimaryColor, fontSize: '0.88rem', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            Ընդամենը
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: BL, borderTop: `2px solid ${mainPrimaryColor}` })}>{fmtQty(grandEstQty)}</td>
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 800, color: mainPrimaryColor, fontSize: '0.88rem', borderTop: `2px solid ${mainPrimaryColor}` })}>{formatCurrencyRounded(grandEstTotal)} AMD</td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: BL, borderTop: `2px solid ${mainPrimaryColor}` })}>{grandHasAct ? fmtQty(grandActQty) : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 800, color: mainPrimaryColor, fontSize: '0.88rem', borderTop: `2px solid ${mainPrimaryColor}` })}>{grandHasAct ? `${formatCurrencyRounded(grandActTotal)} AMD` : '\u2014'}</td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: BL, color: grandRemQty === null ? '#ccc' : grandRemQty >= 0 ? '#2e7d32' : '#c62828', fontWeight: 700, borderTop: `2px solid ${mainPrimaryColor}` })}>{fmtQty(grandRemQty)}</td>
                        <td style={tdStyle({ textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandRemTotal !== null
                                ? <span style={{ fontSize: '0.88rem', fontWeight: 800, color: grandRemTotal >= 0 ? '#2e7d32' : '#c62828' }}>{grandRemTotal >= 0 ? '+' : ''}{formatCurrencyRounded(grandRemTotal)} AMD</span>
                                : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: BL, borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandPct !== null
                                ? <span style={{ fontSize: '0.88rem', fontWeight: 800, color: grandPct >= 0 ? '#2e7d32' : '#c62828' }}>{grandPct >= 0 ? '+' : ''}{grandPct.toFixed(1)}%</span>
                                : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderLeft: BL, borderTop: `2px solid ${mainPrimaryColor}`, color: grandHasEx ? '#c62828' : '#ccc', fontWeight: grandHasEx ? 700 : 400 })}>
                            {grandHasEx ? fmtQty(grandExQty) : '\u2014'}
                        </td>
                        <td style={tdStyle({ textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}` })}>
                            {grandHasEx
                                ? <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#c62828' }}>{formatCurrencyRounded(grandExAmt)} AMD</span>
                                : '\u2014'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </Box>
    );
}
