'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useTranslation } from 'react-i18next';

export interface BreakdownItem {
    id: string;
    name: string;
    code: string;
    type: 'labor' | 'material';
    qty: number;
    unit: string;
    subcategoryName: string;
    parentId: string | null;
    monthlyPrices: Record<string, number>;
}

interface Props {
    months: string[];
    items: BreakdownItem[];
}

// ── Column widths ─────────────────────────────────────────────────────────────
const W_NAME  = 220;
const W_CODE  = 90;
const W_QTY   = 60;
const W_UNIT  = 54;
const L_CODE  = W_NAME;
const L_QTY   = W_NAME + W_CODE;
const L_UNIT  = W_NAME + W_CODE + W_QTY;
const W_MONTH = 82;

// ── Colors (all SOLID — no transparency so sticky cells don't bleed through) ──
const BORDER        = '#e0e0e0';
const HEADER_BG     = '#f5f5f5';
const PURPLE        = '#6a1b9a';
const YEAR_BG       = '#f0ecf7';
const SUBCAT_BG     = '#ede4f3';
const SUBCAT_TEXT   = PURPLE;
const LABOR_EVEN    = '#fdfcff';
const LABOR_ODD     = '#ffffff';
const MAT_EVEN      = '#f8f5fc';
const MAT_ODD       = '#fcfaff';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatVal(v: number | undefined): string {
    if (!v) return '—';
    return Math.round(v).toLocaleString();
}

function groupByYear(months: string[]): { year: number; months: string[] }[] {
    const map = new Map<number, string[]>();
    for (const m of months) {
        const y = Number(m.split('-')[0]);
        if (!map.has(y)) map.set(y, []);
        map.get(y)!.push(m);
    }
    return Array.from(map.entries()).sort(([a],[b])=>a-b).map(([year,months])=>({year,months}));
}

// Shared sticky-cell base style
const stickyBase = (left: number, bg: string, zIdx = 2): React.CSSProperties => ({
    position: 'sticky',
    left,
    zIndex: zIdx,
    backgroundColor: bg,
    // explicitly block the scroll-through bleed with a right shadow
    boxShadow: left === L_UNIT ? '4px 0 6px -2px rgba(0,0,0,0.08)' : undefined,
});

export default function ChronologicalBreakdownTable({ months, items }: Props) {
    const { t } = useTranslation();
    const yearGroups = groupByYear(months);
    const totalCols = 4 + months.length;

    // Build subcategory groups: labor items with their material children
    const laborItems = items.filter(i => i.parentId === null);
    const matByParent = new Map<string, BreakdownItem[]>();
    for (const mat of items.filter(i => i.parentId !== null)) {
        if (!matByParent.has(mat.parentId!)) matByParent.set(mat.parentId!, []);
        matByParent.get(mat.parentId!)!.push(mat);
    }

    const subcatOrder: string[] = [];
    const subcatMap = new Map<string, BreakdownItem[]>();
    for (const labor of laborItems) {
        const key = labor.subcategoryName || '—';
        if (!subcatMap.has(key)) { subcatMap.set(key, []); subcatOrder.push(key); }
        subcatMap.get(key)!.push(labor);
    }

    // Accordion open state per subcategory
    const [openSubcats, setOpenSubcats] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const key of subcatOrder) init[key] = true;
        return init;
    });
    const toggleSubcat = (key: string) => setOpenSubcats(s => ({ ...s, [key]: !s[key] }));

    // Global row counter for alternating colors
    let rowIdx = 0;

    const tdStyle = (base?: React.CSSProperties): React.CSSProperties => ({
        padding: '5px 8px', fontSize: 14, border: `1px solid ${BORDER}`,
        whiteSpace: 'nowrap', verticalAlign: 'middle', ...base,
    });

    return (
        <Box sx={{ mt: 3, borderRadius: 2, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: W_NAME }} />
                        <col style={{ width: W_CODE }} />
                        <col style={{ width: W_QTY }} />
                        <col style={{ width: W_UNIT }} />
                        {months.map(m => <col key={m} style={{ width: W_MONTH }} />)}
                    </colgroup>

                    <thead>
                        {/* Row 1: fixed column headers (rowSpan=2) + year group headers */}
                        <tr>
                            <th rowSpan={2} style={{ ...tdStyle({ fontWeight: 700, fontSize: 14, textAlign: 'left', ...stickyBase(0, HEADER_BG, 4) }) }}>
                                {t('Name')}
                            </th>
                            <th rowSpan={2} style={{ ...tdStyle({ fontWeight: 700, fontSize: 14, textAlign: 'left', ...stickyBase(L_CODE, HEADER_BG, 4) }) }}>
                                {t('Code')}
                            </th>
                            <th rowSpan={2} style={{ ...tdStyle({ fontWeight: 700, fontSize: 14, textAlign: 'right', ...stickyBase(L_QTY, HEADER_BG, 4) }) }}>
                                {t('Qty')}
                            </th>
                            <th rowSpan={2} style={{ ...tdStyle({ fontWeight: 700, fontSize: 14, textAlign: 'left', ...stickyBase(L_UNIT, HEADER_BG, 4) }) }}>
                                {t('Unit')}
                            </th>
                            {yearGroups.map(({ year, months: ym }) => (
                                <th
                                    key={year}
                                    colSpan={ym.length}
                                    style={{ ...tdStyle({ backgroundColor: YEAR_BG, color: PURPLE, fontWeight: 700, fontSize: 14, textAlign: 'center', borderLeft: `2px solid ${PURPLE}`, borderRight: `2px solid ${PURPLE}` }) }}
                                >
                                    {year}
                                </th>
                            ))}
                        </tr>

                        {/* Row 2: month labels */}
                        <tr>
                            {months.map((m, idx) => {
                                const mo = Number(m.split('-')[1]) - 1;
                                const isFirst = idx === 0 || m.split('-')[0] !== months[idx-1]?.split('-')[0];
                                return (
                                    <th key={m} style={{ ...tdStyle({ backgroundColor: HEADER_BG, fontSize: 13, textAlign: 'center', borderLeft: isFirst ? `2px solid ${PURPLE}` : undefined }) }}>
                                        {MONTH_LABELS[mo]}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {subcatOrder.map(subcat => {
                            const laborList = subcatMap.get(subcat) ?? [];
                            const isOpen = openSubcats[subcat] ?? true;

                            return (
                                <>
                                    {/* Subcategory accordion header */}
                                    <tr key={`subcat-${subcat}`} onClick={() => toggleSubcat(subcat)} style={{ cursor: 'pointer' }}>
                                        <td colSpan={totalCols} style={{ ...tdStyle({ backgroundColor: SUBCAT_BG, color: SUBCAT_TEXT, fontWeight: 700, fontSize: 13, ...stickyBase(0, SUBCAT_BG, 3), padding: '5px 10px' }) }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                {isOpen
                                                    ? <KeyboardArrowDownIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                                                    : <KeyboardArrowRightIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />}
                                                <span style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{subcat}</span>
                                                <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 4 }}>({laborList.length})</span>
                                            </span>
                                        </td>
                                    </tr>

                                    {isOpen && laborList.map(labor => {
                                        const ri = rowIdx++;
                                        const laborBg = ri % 2 === 0 ? LABOR_EVEN : LABOR_ODD;
                                        const children = matByParent.get(labor.id) ?? [];

                                        return (
                                            <>
                                                {/* Labor row */}
                                                <tr key={labor.id}>
                                                    <td style={{ ...tdStyle({ fontWeight: 500, ...stickyBase(0, laborBg) }) }} title={labor.name}>{labor.name}</td>
                                                    <td style={{ ...tdStyle({ color: '#555', ...stickyBase(L_CODE, laborBg) }) }}>{labor.code}</td>
                                                    <td style={{ ...tdStyle({ textAlign: 'right', ...stickyBase(L_QTY, laborBg) }) }}>{labor.qty}</td>
                                                    <td style={{ ...tdStyle({ color: '#555', ...stickyBase(L_UNIT, laborBg) }) }}>{labor.unit}</td>
                                                    {months.map(m => <td key={m} style={{ ...tdStyle({ textAlign: 'right', backgroundColor: laborBg }) }}>{formatVal(labor.monthlyPrices[m])}</td>)}
                                                </tr>

                                                {/* Material child rows */}
                                                {children.map(mat => {
                                                    const mri = rowIdx++;
                                                    const matBg = mri % 2 === 0 ? MAT_EVEN : MAT_ODD;
                                                    return (
                                                        <tr key={mat.id}>
                                                            <td style={{ ...tdStyle({ fontSize: 13, color: '#555', paddingLeft: 22, ...stickyBase(0, matBg) }) }} title={mat.name}>└ {mat.name}</td>
                                                            <td style={{ ...tdStyle({ fontSize: 13, color: '#777', ...stickyBase(L_CODE, matBg) }) }}>{mat.code}</td>
                                                            <td style={{ ...tdStyle({ fontSize: 13, textAlign: 'right', ...stickyBase(L_QTY, matBg) }) }}>{mat.qty}</td>
                                                            <td style={{ ...tdStyle({ fontSize: 13, color: '#777', ...stickyBase(L_UNIT, matBg) }) }}>{mat.unit}</td>
                                                            {months.map(m => <td key={m} style={{ ...tdStyle({ fontSize: 13, textAlign: 'right', backgroundColor: matBg }) }}>{formatVal(mat.monthlyPrices[m])}</td>)}
                                                        </tr>
                                                    );
                                                })}
                                            </>
                                        );
                                    })}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </Box>
        </Box>
    );
}
