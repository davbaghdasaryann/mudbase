'use client';

import { useState, useMemo } from 'react';
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

// ── Column widths ────────────────────────────────────────────────────────────
const W_NAME  = 230;
const W_CODE  = 88;
const W_QTY   = 60;
const W_UNIT  = 54;
const LEFT_W  = W_NAME + W_CODE + W_QTY + W_UNIT; // 432
const W_MONTH = 82;

// ── Row heights (fixed — guarantees left/right panel row alignment) ──────────
const H_HEADER = 34; // each of the 2 header rows
const H_SUBCAT = 34; // accordion header row
const H_ROW    = 36; // data rows

// ── Colors — teal/green matching the chart bars ──────────────────────────────
const TEAL      = '#007a6e';
const TEAL_MED  = '#4db6ac';
const TEAL_LITE = '#a8e6df';
const BORDER    = '#b2dfdb';
const YEAR_BG   = '#b2dfdb';
const HDR_BG    = '#e0f7fa';
const SUBCAT_BG = '#e0f2f1';
const SUBCAT_FG = '#004d40';
const LBR_EVEN  = '#f0faf9';
const LBR_ODD   = '#ffffff';
const MAT_EVEN  = '#e6f7f5';
const MAT_ODD   = '#f5fbfa';

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
    return Array.from(map.entries()).sort(([a],[b]) => a - b).map(([year, months]) => ({ year, months }));
}

// Pre-computed row descriptor — both panels render from this same list
type RowDesc =
    | { kind: 'subcat'; key: string; subcat: string; laborCount: number; isOpen: boolean }
    | { kind: 'labor';  key: string; item: BreakdownItem; bg: string }
    | { kind: 'mat';    key: string; item: BreakdownItem; bg: string };

// Shared cell style helpers
const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '0 8px', border: `1px solid ${BORDER}`, whiteSpace: 'nowrap',
    verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', ...extra,
});

export default function ChronologicalBreakdownTable({ months, items }: Props) {
    const { t } = useTranslation();
    const yearGroups = groupByYear(months);

    // Build structures
    const laborItems = useMemo(() => items.filter(i => i.parentId === null), [items]);
    const matByParent = useMemo(() => {
        const m = new Map<string, BreakdownItem[]>();
        for (const mat of items.filter(i => i.parentId !== null)) {
            if (!m.has(mat.parentId!)) m.set(mat.parentId!, []);
            m.get(mat.parentId!)!.push(mat);
        }
        return m;
    }, [items]);

    const subcatOrder = useMemo(() => {
        const seen = new Set<string>();
        const order: string[] = [];
        for (const l of laborItems) {
            const k = l.subcategoryName || '—';
            if (!seen.has(k)) { seen.add(k); order.push(k); }
        }
        return order;
    }, [laborItems]);

    const subcatMap = useMemo(() => {
        const m = new Map<string, BreakdownItem[]>();
        for (const l of laborItems) {
            const k = l.subcategoryName || '—';
            if (!m.has(k)) m.set(k, []);
            m.get(k)!.push(l);
        }
        return m;
    }, [laborItems]);

    const [openSubcats, setOpenSubcats] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const k of subcatOrder) init[k] = true;
        return init;
    });
    const toggle = (k: string) => setOpenSubcats(s => ({ ...s, [k]: !s[k] }));

    // Flat row list — used by BOTH panels so they stay in sync
    const rows = useMemo<RowDesc[]>(() => {
        const list: RowDesc[] = [];
        let ri = 0;
        for (const subcat of subcatOrder) {
            const laborList = subcatMap.get(subcat) ?? [];
            const isOpen = openSubcats[subcat] ?? true;
            list.push({ kind: 'subcat', key: `sc-${subcat}`, subcat, laborCount: laborList.length, isOpen });
            if (isOpen) {
                for (const labor of laborList) {
                    const bg = (ri++ % 2 === 0) ? LBR_EVEN : LBR_ODD;
                    list.push({ kind: 'labor', key: `lb-${labor.id}`, item: labor, bg });
                    for (const mat of matByParent.get(labor.id) ?? []) {
                        const mbg = (ri++ % 2 === 0) ? MAT_EVEN : MAT_ODD;
                        list.push({ kind: 'mat', key: `mt-${mat.id}`, item: mat, bg: mbg });
                    }
                }
            }
        }
        return list;
    }, [subcatOrder, subcatMap, openSubcats, matByParent]);

    return (
        <Box sx={{ mt: 3, border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex' }}>

            {/* ── LEFT FIXED PANEL (never scrolls horizontally) ── */}
            <Box sx={{ flexShrink: 0, width: LEFT_W, zIndex: 2, boxShadow: '4px 0 10px rgba(0,0,0,0.10)', position: 'relative' }}>
                <table style={{ tableLayout: 'fixed', width: LEFT_W, borderCollapse: 'collapse' }}>
                    <colgroup>
                        <col style={{ width: W_NAME }} />
                        <col style={{ width: W_CODE }} />
                        <col style={{ width: W_QTY }} />
                        <col style={{ width: W_UNIT }} />
                    </colgroup>
                    <thead>
                        {/* Row 1 — matches year-group header height in right panel */}
                        <tr style={{ height: H_HEADER }}>
                            <th colSpan={4} style={cell({ backgroundColor: YEAR_BG, fontSize: 12, fontWeight: 700, color: TEAL, textAlign: 'left', letterSpacing: 0.5 })}>
                                {t('Estimate Items')}
                            </th>
                        </tr>
                        {/* Row 2 — column labels */}
                        <tr style={{ height: H_HEADER }}>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 700, fontSize: 13, textAlign: 'left' })}>{t('Name')}</th>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 700, fontSize: 13, textAlign: 'left' })}>{t('Code')}</th>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 700, fontSize: 13, textAlign: 'right' })}>{t('Qty')}</th>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 700, fontSize: 13, textAlign: 'left' })}>{t('Unit')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            if (row.kind === 'subcat') return (
                                <tr key={row.key} style={{ height: H_SUBCAT, cursor: 'pointer' }} onClick={() => toggle(row.subcat)}>
                                    <td colSpan={4} style={cell({ backgroundColor: SUBCAT_BG, color: SUBCAT_FG, fontWeight: 700, fontSize: 13, padding: '0 10px' })}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            {row.isOpen
                                                ? <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                                                : <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />}
                                            <span style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{row.subcat}</span>
                                            <span style={{ opacity: 0.55, fontSize: 12 }}>({row.laborCount})</span>
                                        </span>
                                    </td>
                                </tr>
                            );
                            if (row.kind === 'labor') return (
                                <tr key={row.key} style={{ height: H_ROW }}>
                                    <td style={cell({ backgroundColor: row.bg, fontWeight: 500, fontSize: 14 })} title={row.item.name}>{row.item.name}</td>
                                    <td style={cell({ backgroundColor: row.bg, color: '#555', fontSize: 14 })}>{row.item.code}</td>
                                    <td style={cell({ backgroundColor: row.bg, textAlign: 'right', fontSize: 14 })}>{row.item.qty}</td>
                                    <td style={cell({ backgroundColor: row.bg, color: '#555', fontSize: 14 })}>{row.item.unit}</td>
                                </tr>
                            );
                            // mat
                            return (
                                <tr key={row.key} style={{ height: H_ROW }}>
                                    <td style={cell({ backgroundColor: row.bg, color: '#4d4d4d', fontSize: 13, paddingLeft: 20 })} title={row.item.name}>└ {row.item.name}</td>
                                    <td style={cell({ backgroundColor: row.bg, color: '#666', fontSize: 13 })}>{row.item.code}</td>
                                    <td style={cell({ backgroundColor: row.bg, textAlign: 'right', fontSize: 13 })}>{row.item.qty}</td>
                                    <td style={cell({ backgroundColor: row.bg, color: '#666', fontSize: 13 })}>{row.item.unit}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>

            {/* ── RIGHT SCROLLABLE PANEL ── */}
            <Box sx={{ flex: 1, overflowX: 'auto', minWidth: 0 }}>
                <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <colgroup>
                        {months.map(m => <col key={m} style={{ width: W_MONTH }} />)}
                    </colgroup>
                    <thead>
                        {/* Row 1 — year groups */}
                        <tr style={{ height: H_HEADER }}>
                            {yearGroups.map(({ year, months: ym }) => (
                                <th key={year} colSpan={ym.length} style={cell({ backgroundColor: YEAR_BG, color: TEAL, fontWeight: 700, fontSize: 14, textAlign: 'center', borderLeft: `2px solid ${TEAL}` })}>
                                    {year}
                                </th>
                            ))}
                        </tr>
                        {/* Row 2 — month labels */}
                        <tr style={{ height: H_HEADER }}>
                            {months.map((m, idx) => {
                                const mo = Number(m.split('-')[1]) - 1;
                                const isFirst = idx === 0 || m.split('-')[0] !== months[idx - 1]?.split('-')[0];
                                return (
                                    <th key={m} style={cell({ backgroundColor: HDR_BG, fontSize: 13, textAlign: 'center', borderLeft: isFirst ? `2px solid ${TEAL}` : undefined })}>
                                        {MONTH_LABELS[mo]}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            if (row.kind === 'subcat') return (
                                <tr key={row.key} style={{ height: H_SUBCAT }}>
                                    <td colSpan={months.length} style={cell({ backgroundColor: SUBCAT_BG })} />
                                </tr>
                            );
                            const bg = row.bg;
                            const prices = row.kind === 'labor' ? row.item.monthlyPrices : row.item.monthlyPrices;
                            const fs = row.kind === 'labor' ? 14 : 13;
                            return (
                                <tr key={row.key} style={{ height: H_ROW }}>
                                    {months.map((m, idx) => {
                                        const isFirst = idx === 0 || m.split('-')[0] !== months[idx - 1]?.split('-')[0];
                                        return (
                                            <td key={m} style={cell({ backgroundColor: bg, textAlign: 'right', fontSize: fs, borderLeft: isFirst ? `2px solid ${TEAL}` : undefined })}>
                                                {formatVal(prices[m])}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>
        </Box>
    );
}
