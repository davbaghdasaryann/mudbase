'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box, Button, CircularProgress, InputBase,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';

interface LaborRow {
    _id: string;
    laborItemId: string;
    fullCode: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    subsectionName: string;
    sectionName: string;
}

interface Section {
    _id: string;
    name: string;
    displayIndex: number;
    totalCost: number;
}

interface Subsection {
    _id: string;
    estimateSectionId: string;
    name: string;
    displayIndex: number;
    totalCost: number;
}

interface ActValues { unitPrice: string; quantity: string; }
type ActData = Record<string, ActValues>;

// Base column definitions (index → default width in px)
const BASE_COLS = [
    { key: 'no',    defaultW: 52  },
    { key: 'desc',  defaultW: 500 },
    { key: 'unit',  defaultW: 72  },
    { key: 'qty',   defaultW: 90  },
    { key: 'up',    defaultW: 100 },
    { key: 'total', defaultW: 110 },
];
const ACT_COL_KEYS = ['up', 'qty', 'total'];
const ACT_COL_DEFAULTS = [100, 90, 110];
const MIN_COL_W = 50;

function parseNum(v: string): number {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

const BORDER = '#e8f7f9';
const SEC_BG = '#e6f7f9';
const SUB_BG = '#f7fdfe';
const SUB_TOTAL_BG = '#eaf8fa';
const GRAND_BG = '#d6f4f7';
const HDR_BG = '#f0fbfc';

const th = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`,
    padding: '6px 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    position: 'relative',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: mainPrimaryColor,
    backgroundColor: HDR_BG,
    borderBottom: `2px solid ${mainPrimaryColor}`,
    ...extra,
});

const td = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: `1px solid ${BORDER}`,
    padding: '5px 8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.82rem',
    verticalAlign: 'middle',
    ...extra,
});

// Resize handle rendered inside each <th>
function ResizeHandle({ onDragStart }: { onDragStart: (e: React.MouseEvent) => void }) {
    return (
        <div
            onMouseDown={onDragStart}
            style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 5,
                cursor: 'col-resize',
                zIndex: 10,
                backgroundColor: 'transparent',
                transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,171,190,0.35)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
        />
    );
}

export default function PerformanceActTable({ estimate }: { estimate: EstimatesApi.ApiEstimate }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [acts, setActs] = useState<string[]>([]);
    const [actsData, setActsData] = useState<ActData[]>([]);

    // Column widths: base cols first, then 3 per act
    const [colWidths, setColWidths] = useState<number[]>(BASE_COLS.map(c => c.defaultW));

    // Drag-to-scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrollDragging = useRef(false);
    const scrollDragStart = useRef({ x: 0, scrollLeft: 0 });

    // Column resize
    const resizingCol = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

    const estimateId = String(estimate._id);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
        ])
            .then(async ([laborData, sectData]) => {
                const sortedSections = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sortedSections);
                setRows(laborData ?? []);
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
    }, [estimateId]);

    // Column resize global listeners
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!resizingCol.current) return;
            const { colIdx, startX, startW } = resizingCol.current;
            const newW = Math.max(MIN_COL_W, startW + e.clientX - startX);
            setColWidths(prev => { const c = [...prev]; c[colIdx] = newW; return c; });
        };
        const onUp = () => { resizingCol.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }, []);

    const startResize = useCallback((colIdx: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizingCol.current = { colIdx, startX: e.clientX, startW: colWidths[colIdx] ?? 100 };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [colWidths]);

    const handleAddAct = useCallback((currentRows: LaborRow[]) => {
        const next = acts.length + 1;
        setActs(prev => [...prev, `ACT-${next}`]);
        const prefilled: ActData = {};
        for (const row of currentRows) {
            prefilled[String(row._id)] = { unitPrice: String(row.changableAveragePrice ?? ''), quantity: '0' };
        }
        setActsData(prev => [...prev, prefilled]);
        setColWidths(prev => [...prev, ...ACT_COL_DEFAULTS]);
    }, [acts.length]);

    const handleActValue = useCallback((actIdx: number, itemId: string, field: 'unitPrice' | 'quantity', value: string) => {
        setActsData(prev => {
            const copy = [...prev];
            copy[actIdx] = { ...copy[actIdx], [itemId]: { ...copy[actIdx]?.[itemId], [field]: value } };
            return copy;
        });
    }, []);

    // Scroll drag
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
        scrollRef.current.style.cursor = acts.length > 0 ? 'grab' : 'default';
    }, [acts.length]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: mainPrimaryColor }} /></Box>;
    if (error) return <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>;
    if (rows.length === 0) return <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>{t('No data for selected period')}</Typography>;

    const grandTotal = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    const subsectionsBySection = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsectionsBySection.set(String(sect._id),
            subsections.filter(s => String(s.estimateSectionId) === String(sect._id)).sort((a, b) => a.displayIndex - b.displayIndex));
    }

    const totalCols = BASE_COLS.length + acts.length * ACT_COL_KEYS.length;
    let itemCounter = 0;

    const actCellBorderLeft: React.CSSProperties = { borderLeft: `2px solid #b2e8ed` };

    const renderItemRow = (row: LaborRow, counter: number, descIndent: number) => (
        <tr key={String(row._id)} style={{ backgroundColor: counter % 2 === 0 ? '#fafeff' : '#fff' }}
            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f5fdfe'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = counter % 2 === 0 ? '#fafeff' : '#fff'; }}
        >
            <td style={td({ textAlign: 'center', color: '#888', fontSize: '0.78rem' })}>{counter}</td>
            <td style={td({ paddingLeft: descIndent, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' })}>
                {row.fullCode && <span style={{ color: mainPrimaryColor, marginRight: 6, fontSize: '0.75rem', fontWeight: 600 }}>{row.fullCode}</span>}
                {row.laborOfferItemName || row.catalogName}
            </td>
            <td style={td({ textAlign: 'center', color: '#666' })}>{row.unitSymbol}</td>
            <td style={td({ textAlign: 'right' })}>{Number(row.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td style={td({ textAlign: 'right', color: '#555' })}>{formatCurrencyRounded(row.changableAveragePrice)}</td>
            <td style={td({ textAlign: 'right', fontWeight: 600 })}>{formatCurrencyRounded(row.cost)}</td>
            {acts.map((_, actIdx) => {
                const vals = actsData[actIdx]?.[String(row._id)];
                const actTotal = parseNum(vals?.unitPrice ?? '0') * parseNum(vals?.quantity ?? '0');
                return (
                    <>
                        <td key={`${actIdx}-up`} style={td({ ...actCellBorderLeft, textAlign: 'right', padding: '3px 6px' })}>
                            <InputBase value={vals?.unitPrice ?? ''} onChange={e => handleActValue(actIdx, String(row._id), 'unitPrice', e.target.value)} placeholder='0'
                                sx={{ border: `1px solid ${mainPrimaryColor}`, borderRadius: '4px', px: 1, py: 0.25, fontSize: '0.8rem', width: '100%', '& input': { textAlign: 'right', padding: 0 }, '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.18)' } }}
                                onMouseDown={e => e.stopPropagation()} />
                        </td>
                        <td key={`${actIdx}-qty`} style={td({ textAlign: 'right', padding: '3px 6px' })}>
                            <InputBase value={vals?.quantity ?? ''} onChange={e => handleActValue(actIdx, String(row._id), 'quantity', e.target.value)} placeholder='0'
                                sx={{ border: `1px solid ${mainPrimaryColor}`, borderRadius: '4px', px: 1, py: 0.25, fontSize: '0.8rem', width: '100%', '& input': { textAlign: 'right', padding: 0 }, '&:focus-within': { boxShadow: '0 0 0 2px rgba(0,171,190,0.18)' } }}
                                onMouseDown={e => e.stopPropagation()} />
                        </td>
                        <td key={`${actIdx}-tot`} style={td({ textAlign: 'right', fontWeight: 600, color: mainPrimaryColor })}>{formatCurrencyRounded(actTotal)}</td>
                    </>
                );
            })}
        </tr>
    );

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Button variant='outlined' size='small' startIcon={<AddIcon />} onClick={() => handleAddAct(rows)}
                    sx={{ borderRadius: '20px', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}>
                    {t('Add Performance')}
                </Button>
            </Box>

            <Box ref={scrollRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'auto', cursor: acts.length > 0 ? 'grab' : 'default' }}>
                <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', minWidth: colWidths.reduce((s, w) => s + w, 0) }}>
                    <colgroup>
                        {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                    </colgroup>
                    <thead>
                        {/* Row 1: base headers (rowSpan=2 when acts exist) + ACT group labels */}
                        <tr>
                            {BASE_COLS.map((col, i) => (
                                <th key={col.key} rowSpan={acts.length > 0 ? 2 : 1}
                                    style={th({ textAlign: i === 0 ? 'center' : i >= 3 ? 'right' : 'left', verticalAlign: 'middle' })}>
                                    {i === 0 ? t('No.') : i === 1 ? t('Description of Work') : i === 2 ? t('Unit') : i === 3 ? t('Quantity') : i === 4 ? t('Unit Price') : t('Total')}
                                    <ResizeHandle onDragStart={e => startResize(i, e)} />
                                </th>
                            ))}
                            {acts.map((label, ai) => (
                                <th key={label} colSpan={3}
                                    style={th({ textAlign: 'center', backgroundColor: '#e6f7f9', borderLeft: '2px solid #b2e8ed', verticalAlign: 'middle' })}>
                                    {label}
                                </th>
                            ))}
                        </tr>
                        {/* Row 2: ACT sub-headers */}
                        {acts.length > 0 && (
                            <tr>
                                {acts.map((label, ai) => {
                                    const base = BASE_COLS.length + ai * 3;
                                    return ACT_COL_KEYS.map((k, ki) => (
                                        <th key={`${label}-${k}`}
                                            style={th({ textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#00818f', backgroundColor: HDR_BG, borderBottom: `1px solid #b2e8ed`, ...(ki === 0 ? actCellBorderLeft : {}), verticalAlign: 'middle' })}>
                                            {k === 'up' ? t('Unit Price') : k === 'qty' ? t('Quantity') : t('Total')}
                                            <ResizeHandle onDragStart={e => startResize(base + ki, e)} />
                                        </th>
                                    ));
                                })}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {sections.map((section, sectionIdx) => {
                            const sectionItems = rows.filter(r => r.sectionName === section.name);
                            if (sectionItems.length === 0) return null;
                            const subs = subsectionsBySection.get(String(section._id)) ?? [];
                            const sectionTotal = sectionItems.reduce((sum, r) => sum + (r.cost ?? 0), 0);

                            return (
                                <>
                                    <tr key={`section-${section._id}`} style={{ backgroundColor: SEC_BG }}>
                                        <td colSpan={totalCols} style={td({ fontWeight: 700, fontSize: '0.85rem', color: '#00818f', paddingLeft: 16, letterSpacing: '0.03em', borderTop: sectionIdx > 0 ? '2px solid #b2e8ed' : undefined })}>
                                            {sectionIdx + 1}. {section.name.toUpperCase()}
                                        </td>
                                    </tr>

                                    {subs.length > 0
                                        ? subs.map((sub, subIdx) => {
                                            const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                            if (subItems.length === 0) return null;
                                            return (
                                                <>
                                                    <tr key={`sub-${sub._id}`} style={{ backgroundColor: SUB_BG }}>
                                                        <td colSpan={totalCols} style={td({ paddingLeft: 28, color: '#666', fontStyle: 'italic', fontSize: '0.8rem' })}>
                                                            {sectionIdx + 1}.{subIdx + 1}. {sub.name}
                                                        </td>
                                                    </tr>
                                                    {subItems.map(row => renderItemRow(row, ++itemCounter, 36))}
                                                </>
                                            );
                                        })
                                        : sectionItems.map(row => renderItemRow(row, ++itemCounter, 20))
                                    }

                                    <tr style={{ backgroundColor: SUB_TOTAL_BG }}>
                                        <td colSpan={5} style={td({ fontWeight: 700, textAlign: 'right', color: '#00818f', fontSize: '0.8rem', paddingRight: 12 })}>{t('Subtotal')}</td>
                                        <td style={td({ fontWeight: 700, textAlign: 'right', color: '#00818f', whiteSpace: 'nowrap' })}>{formatCurrencyRounded(sectionTotal)} AMD</td>
                                        {acts.map((_, actIdx) => {
                                            const actQtySum = sectionItems.reduce((s, r) => s + parseNum(actsData[actIdx]?.[String(r._id)]?.quantity ?? '0'), 0);
                                            const actTotalSum = sectionItems.reduce((s, r) => {
                                                const v = actsData[actIdx]?.[String(r._id)];
                                                return s + parseNum(v?.unitPrice ?? '0') * parseNum(v?.quantity ?? '0');
                                            }, 0);
                                            return (
                                                <>
                                                    <td key={`sub-${actIdx}-up`} style={td({ ...actCellBorderLeft, textAlign: 'right', color: '#00818f' })}></td>
                                                    <td key={`sub-${actIdx}-qty`} style={td({ fontWeight: 700, textAlign: 'right', color: '#00818f', whiteSpace: 'nowrap' })}>{actQtySum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                    <td key={`sub-${actIdx}-tot`} style={td({ fontWeight: 700, textAlign: 'right', color: '#00818f', whiteSpace: 'nowrap' })}>{formatCurrencyRounded(actTotalSum)} AMD</td>
                                                </>
                                            );
                                        })}
                                    </tr>
                                </>
                            );
                        })}

                        <tr style={{ backgroundColor: GRAND_BG }}>
                            <td colSpan={5} style={td({ fontWeight: 800, textAlign: 'right', color: mainPrimaryColor, fontSize: '0.85rem', paddingRight: 12, borderTop: `2px solid ${mainPrimaryColor}` })}>{t('Total')}</td>
                            <td style={td({ fontWeight: 800, textAlign: 'right', color: mainPrimaryColor, whiteSpace: 'nowrap', borderTop: `2px solid ${mainPrimaryColor}` })}>{formatCurrencyRounded(grandTotal)} AMD</td>
                            {acts.map((_, actIdx) => {
                                const actQtyGrand = rows.reduce((s, r) => s + parseNum(actsData[actIdx]?.[String(r._id)]?.quantity ?? '0'), 0);
                                const actTotalGrand = rows.reduce((s, r) => {
                                    const v = actsData[actIdx]?.[String(r._id)];
                                    return s + parseNum(v?.unitPrice ?? '0') * parseNum(v?.quantity ?? '0');
                                }, 0);
                                return (
                                    <>
                                        <td key={`grand-${actIdx}-up`} style={td({ ...actCellBorderLeft, borderTop: `2px solid ${mainPrimaryColor}` })}></td>
                                        <td key={`grand-${actIdx}-qty`} style={td({ fontWeight: 800, textAlign: 'right', color: mainPrimaryColor, whiteSpace: 'nowrap', borderTop: `2px solid ${mainPrimaryColor}` })}>{actQtyGrand.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                        <td key={`grand-${actIdx}-tot`} style={td({ fontWeight: 800, textAlign: 'right', color: mainPrimaryColor, whiteSpace: 'nowrap', borderTop: `2px solid ${mainPrimaryColor}` })}>{formatCurrencyRounded(actTotalGrand)} AMD</td>
                                    </>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </Box>
        </Box>
    );
}
