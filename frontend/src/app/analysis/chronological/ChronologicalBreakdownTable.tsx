'use client';

import { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';

export interface BreakdownItem {
    id: string;
    name: string;
    code: string;
    type: 'labor' | 'material';
    qty: number;
    unit: string;
    subcategoryName: string;
    monthlyPrices: Record<string, number>;
}

interface Props {
    months: string[];
    items: BreakdownItem[];
}

const BORDER = 'rgba(0,0,0,0.08)';
const HEADER_BG = '#f5f5f5';
const TEAL_BG = 'rgba(0,171,190,0.10)';
const TEAL_SECTION = 'rgba(0,171,190,0.12)';
const PURPLE_SECTION = 'rgba(106,27,154,0.08)';
const PURPLE_COLOR = '#6a1b9a';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COL_W_CODE = 80;
const COL_W_QTY = 54;
const COL_W_UNIT = 48;
const COL_W_NAME = 200;
const COL_W_MONTH = 72;
const LEFT_FIXED_W = COL_W_NAME + COL_W_CODE + COL_W_QTY + COL_W_UNIT;

function formatVal(v: number | undefined): string {
    if (!v) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return v.toLocaleString();
}

function groupByYear(months: string[]): { year: number; months: string[] }[] {
    const map = new Map<number, string[]>();
    for (const m of months) {
        const y = Number(m.split('-')[0]);
        if (!map.has(y)) map.set(y, []);
        map.get(y)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b).map(([year, months]) => ({ year, months }));
}

function groupBySubcategory(items: BreakdownItem[]): { subcat: string; items: BreakdownItem[] }[] {
    const map = new Map<string, BreakdownItem[]>();
    for (const item of items) {
        const key = item.subcategoryName || '—';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([subcat, items]) => ({ subcat, items }));
}

interface AccordionGroupProps {
    subcat: string;
    items: BreakdownItem[];
    months: string[];
    rowBg: string;
    isLabor: boolean;
    defaultOpen?: boolean;
}

function AccordionGroup({ subcat, items, months, rowBg, isLabor, defaultOpen = true }: AccordionGroupProps) {
    const [open, setOpen] = useState(defaultOpen);
    const accentColor = isLabor ? mainPrimaryColor : PURPLE_COLOR;
    const sectionBg = isLabor ? TEAL_SECTION : PURPLE_SECTION;

    return (
        <>
            {/* Subcategory accordion header — left fixed side */}
            <div style={{ display: 'flex' }}>
                {/* Fixed left: accordion header */}
                <div
                    style={{
                        width: LEFT_FIXED_W,
                        minWidth: LEFT_FIXED_W,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 8px',
                        background: sectionBg,
                        borderBottom: `1px solid ${BORDER}`,
                        cursor: 'pointer',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                    }}
                    onClick={() => setOpen((v) => !v)}
                >
                    {open
                        ? <KeyboardArrowDownIcon sx={{ fontSize: 16, color: accentColor, flexShrink: 0 }} />
                        : <KeyboardArrowRightIcon sx={{ fontSize: 16, color: accentColor, flexShrink: 0 }} />}
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {subcat}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: accentColor, opacity: 0.65, ml: 0.5, flexShrink: 0 }}>
                        ({items.length})
                    </Typography>
                </div>
                {/* Right: empty filler for scrollable side */}
                <div style={{ flex: 1, background: sectionBg, borderBottom: `1px solid ${BORDER}` }} />
            </div>

            {open && items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex' }}>
                    {/* Fixed left columns */}
                    <div
                        style={{
                            width: LEFT_FIXED_W,
                            minWidth: LEFT_FIXED_W,
                            flexShrink: 0,
                            display: 'flex',
                            background: i % 2 === 0 ? rowBg : '#fff',
                            borderBottom: `1px solid ${BORDER}`,
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                        }}
                    >
                        <div style={{ width: COL_W_NAME, minWidth: COL_W_NAME, padding: '5px 10px', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}` }} title={item.name}>
                            {item.name}
                        </div>
                        <div style={{ width: COL_W_CODE, minWidth: COL_W_CODE, padding: '5px 6px', fontSize: 11, color: '#666', borderRight: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.code}
                        </div>
                        <div style={{ width: COL_W_QTY, minWidth: COL_W_QTY, padding: '5px 6px', fontSize: 12, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>
                            {item.qty}
                        </div>
                        <div style={{ width: COL_W_UNIT, minWidth: COL_W_UNIT, padding: '5px 6px', fontSize: 11, color: '#666', borderRight: `1px solid ${BORDER}` }}>
                            {item.unit}
                        </div>
                    </div>
                    {/* Scrollable month cells */}
                    <div style={{ display: 'flex', background: i % 2 === 0 ? rowBg : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                        {months.map((m) => (
                            <div key={m} style={{ width: COL_W_MONTH, minWidth: COL_W_MONTH, padding: '5px 6px', fontSize: 12, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>
                                {formatVal(item.monthlyPrices[m])}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}

export default function ChronologicalBreakdownTable({ months, items }: Props) {
    const { t } = useTranslation();
    const yearGroups = groupByYear(months);
    const laborItems = items.filter((i) => i.type === 'labor');
    const materialItems = items.filter((i) => i.type === 'material');
    const laborGroups = groupBySubcategory(laborItems);
    const materialGroups = groupBySubcategory(materialItems);

    const scrollW = months.length * COL_W_MONTH;

    return (
        <Box sx={{ mt: 3, borderRadius: 2, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {/* Outer scroll container */}
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Box sx={{ minWidth: LEFT_FIXED_W + scrollW, display: 'flex', flexDirection: 'column' }}>

                    {/* ── Header row 1: fixed cols + year groups ── */}
                    <div style={{ display: 'flex', background: HEADER_BG, borderBottom: `1px solid ${BORDER}` }}>
                        {/* Fixed left header */}
                        <div style={{ width: LEFT_FIXED_W, minWidth: LEFT_FIXED_W, flexShrink: 0, display: 'flex', position: 'sticky', left: 0, zIndex: 3, background: HEADER_BG }}>
                            <div style={{ width: COL_W_NAME, minWidth: COL_W_NAME, padding: '8px 10px', fontSize: 12, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>
                                {t('Name')}
                            </div>
                            <div style={{ width: COL_W_CODE, minWidth: COL_W_CODE, padding: '8px 6px', fontSize: 12, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>
                                {t('Code')}
                            </div>
                            <div style={{ width: COL_W_QTY, minWidth: COL_W_QTY, padding: '8px 6px', fontSize: 12, fontWeight: 700, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>
                                {t('Qty')}
                            </div>
                            <div style={{ width: COL_W_UNIT, minWidth: COL_W_UNIT, padding: '8px 6px', fontSize: 12, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>
                                {t('Unit')}
                            </div>
                        </div>
                        {/* Year groups */}
                        <div style={{ display: 'flex' }}>
                            {yearGroups.map(({ year, months: ym }) => (
                                <div
                                    key={year}
                                    style={{
                                        width: ym.length * COL_W_MONTH,
                                        minWidth: ym.length * COL_W_MONTH,
                                        padding: '6px 0',
                                        textAlign: 'center',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: mainPrimaryColor,
                                        background: TEAL_BG,
                                        borderLeft: `2px solid ${mainPrimaryColor}`,
                                        borderRight: `2px solid ${mainPrimaryColor}`,
                                    }}
                                >
                                    {year}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Header row 2: month labels ── */}
                    <div style={{ display: 'flex', background: HEADER_BG, borderBottom: `2px solid ${BORDER}` }}>
                        {/* Empty fixed left */}
                        <div style={{ width: LEFT_FIXED_W, minWidth: LEFT_FIXED_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 3, background: HEADER_BG, borderRight: `1px solid ${BORDER}` }} />
                        {/* Month labels */}
                        <div style={{ display: 'flex' }}>
                            {months.map((m, idx) => {
                                const mo = Number(m.split('-')[1]) - 1;
                                const isFirst = idx === 0 || m.split('-')[0] !== months[idx - 1]?.split('-')[0];
                                return (
                                    <div
                                        key={m}
                                        style={{
                                            width: COL_W_MONTH,
                                            minWidth: COL_W_MONTH,
                                            padding: '4px 0',
                                            textAlign: 'center',
                                            fontSize: 11,
                                            color: '#555',
                                            borderRight: `1px solid ${BORDER}`,
                                            borderLeft: isFirst ? `2px solid ${mainPrimaryColor}` : undefined,
                                        }}
                                    >
                                        {MONTH_LABELS[mo]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Works section ── */}
                    {laborGroups.length > 0 && (
                        <>
                            {/* Works section header */}
                            <div style={{ display: 'flex' }}>
                                <div style={{
                                    width: LEFT_FIXED_W, minWidth: LEFT_FIXED_W, flexShrink: 0,
                                    padding: '6px 12px', fontSize: 12, fontWeight: 700,
                                    color: mainPrimaryColor, background: TEAL_SECTION,
                                    borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                                    position: 'sticky', left: 0, zIndex: 2,
                                    letterSpacing: 0.5,
                                }}>
                                    {t('Works').toUpperCase()}
                                </div>
                                <div style={{ flex: 1, background: TEAL_SECTION, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }} />
                            </div>
                            {laborGroups.map((g) => (
                                <AccordionGroup key={g.subcat} subcat={g.subcat} items={g.items} months={months} rowBg='rgba(0,171,190,0.04)' isLabor defaultOpen />
                            ))}
                        </>
                    )}

                    {/* ── Materials section ── */}
                    {materialGroups.length > 0 && (
                        <>
                            <div style={{ display: 'flex' }}>
                                <div style={{
                                    width: LEFT_FIXED_W, minWidth: LEFT_FIXED_W, flexShrink: 0,
                                    padding: '6px 12px', fontSize: 12, fontWeight: 700,
                                    color: PURPLE_COLOR, background: PURPLE_SECTION,
                                    borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                                    position: 'sticky', left: 0, zIndex: 2,
                                    letterSpacing: 0.5,
                                }}>
                                    {t('Materials').toUpperCase()}
                                </div>
                                <div style={{ flex: 1, background: PURPLE_SECTION, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }} />
                            </div>
                            {materialGroups.map((g) => (
                                <AccordionGroup key={g.subcat} subcat={g.subcat} items={g.items} months={months} rowBg='rgba(106,27,154,0.03)' isLabor={false} defaultOpen />
                            ))}
                        </>
                    )}

                </Box>
            </Box>
        </Box>
    );
}
