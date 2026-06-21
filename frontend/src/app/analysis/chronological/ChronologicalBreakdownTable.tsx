'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useTranslation } from 'react-i18next';

export interface BreakdownItem {
    id: string;
    catalogId?: string;
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

// ── Layout constants ──────────────────────────────────────────────────────────
const COL_W_NAME   = 220;
const COL_W_CODE   = 90;
const COL_W_QTY    = 60;
const COL_W_UNIT   = 54;
const LEFT_W       = COL_W_NAME + COL_W_CODE + COL_W_QTY + COL_W_UNIT;
const COL_W_MONTH  = 82;

// ── Colors ────────────────────────────────────────────────────────────────────
const BORDER        = 'rgba(0,0,0,0.08)';
const HEADER_BG     = '#f5f5f5';
const PURPLE        = '#6a1b9a';
const PURPLE_LIGHT  = 'rgba(106,27,154,0.08)';
const PURPLE_MID    = 'rgba(106,27,154,0.13)';
const PURPLE_YEAR   = 'rgba(106,27,154,0.10)';
const ROW_EVEN      = 'rgba(106,27,154,0.03)';
const MAT_EVEN      = 'rgba(106,27,154,0.05)';
const WHITE         = '#ffffff';

const MONTH_LABELS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

// ── Shared cell style helpers ─────────────────────────────────────────────────
const fixedCell = (width: number, extra?: React.CSSProperties): React.CSSProperties => ({
    width, minWidth: width, flexShrink: 0,
    padding: '5px 8px', fontSize: 14, borderRight: `1px solid ${BORDER}`,
    boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    ...extra,
});

const monthCell: React.CSSProperties = {
    width: COL_W_MONTH, minWidth: COL_W_MONTH, flexShrink: 0,
    padding: '5px 8px', fontSize: 14, textAlign: 'right',
    borderRight: `1px solid ${BORDER}`, boxSizing: 'border-box', whiteSpace: 'nowrap',
};

// ── Subcategory accordion ─────────────────────────────────────────────────────
interface SubcatGroup {
    subcat: string;
    laborItems: BreakdownItem[];
    materialsByParent: Map<string, BreakdownItem[]>;
}

function AccordionGroup({ group, months, rowIndex }: { group: SubcatGroup; months: string[]; rowIndex: { v: number } }) {
    const [open, setOpen] = useState(true);

    return (
        <>
            {/* Subcategory row */}
            <div style={{ display: 'flex', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
                <div style={{
                    width: LEFT_W, minWidth: LEFT_W, flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px', fontSize: 13, fontWeight: 700,
                    color: PURPLE, background: PURPLE_MID,
                    borderBottom: `1px solid ${BORDER}`,
                    position: 'sticky', left: 0, zIndex: 2, boxSizing: 'border-box',
                }}>
                    {open
                        ? <KeyboardArrowDownIcon sx={{ fontSize: 16, color: PURPLE, flexShrink: 0 }} />
                        : <KeyboardArrowRightIcon sx={{ fontSize: 16, color: PURPLE, flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {group.subcat}
                    </span>
                    <span style={{ opacity: 0.6, fontSize: 12, flexShrink: 0, marginLeft: 4 }}>
                        ({group.laborItems.length})
                    </span>
                </div>
                <div style={{ flex: 1, background: PURPLE_MID, borderBottom: `1px solid ${BORDER}` }} />
            </div>

            {open && group.laborItems.map((laborItem) => {
                const materials = group.materialsByParent.get(laborItem.id) ?? [];
                const ri = rowIndex.v++;
                const laborBg = ri % 2 === 0 ? ROW_EVEN : WHITE;

                return (
                    <div key={laborItem.id}>
                        {/* Labor (work) row */}
                        <div style={{ display: 'flex' }}>
                            <div style={{
                                width: LEFT_W, minWidth: LEFT_W, flexShrink: 0, display: 'flex',
                                background: laborBg, borderBottom: `1px solid ${BORDER}`,
                                position: 'sticky', left: 0, zIndex: 2,
                            }}>
                                <div style={{ ...fixedCell(COL_W_NAME, { fontWeight: 500, background: laborBg }) }} title={laborItem.name}>
                                    {laborItem.name}
                                </div>
                                <div style={{ ...fixedCell(COL_W_CODE, { color: '#555', background: laborBg }) }}>{laborItem.code}</div>
                                <div style={{ ...fixedCell(COL_W_QTY, { textAlign: 'right', background: laborBg }) }}>{laborItem.qty}</div>
                                <div style={{ ...fixedCell(COL_W_UNIT, { color: '#555', background: laborBg }) }}>{laborItem.unit}</div>
                            </div>
                            <div style={{ display: 'flex', background: laborBg, borderBottom: `1px solid ${BORDER}` }}>
                                {months.map(m => (
                                    <div key={m} style={{ ...monthCell, background: laborBg }}>
                                        {formatVal(laborItem.monthlyPrices[m])}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Material child rows — indented */}
                        {materials.map((mat) => {
                            const mri = rowIndex.v++;
                            const matBg = mri % 2 === 0 ? MAT_EVEN : 'rgba(106,27,154,0.02)';
                            return (
                                <div key={mat.id} style={{ display: 'flex' }}>
                                    <div style={{
                                        width: LEFT_W, minWidth: LEFT_W, flexShrink: 0, display: 'flex',
                                        background: matBg, borderBottom: `1px solid ${BORDER}`,
                                        position: 'sticky', left: 0, zIndex: 2,
                                    }}>
                                        <div style={{ ...fixedCell(COL_W_NAME, { paddingLeft: 24, color: '#555', fontSize: 13, background: matBg }) }} title={mat.name}>
                                            └ {mat.name}
                                        </div>
                                        <div style={{ ...fixedCell(COL_W_CODE, { color: '#777', fontSize: 13, background: matBg }) }}>{mat.code}</div>
                                        <div style={{ ...fixedCell(COL_W_QTY, { textAlign: 'right', fontSize: 13, background: matBg }) }}>{mat.qty}</div>
                                        <div style={{ ...fixedCell(COL_W_UNIT, { color: '#777', fontSize: 13, background: matBg }) }}>{mat.unit}</div>
                                    </div>
                                    <div style={{ display: 'flex', background: matBg, borderBottom: `1px solid ${BORDER}` }}>
                                        {months.map(m => (
                                            <div key={m} style={{ ...monthCell, fontSize: 13, background: matBg }}>
                                                {formatVal(mat.monthlyPrices[m])}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChronologicalBreakdownTable({ months, items }: Props) {
    const { t } = useTranslation();
    const yearGroups = groupByYear(months);

    // Build subcategory groups preserving labor→material hierarchy
    const subcatMap = new Map<string, SubcatGroup>();
    const laborItems = items.filter(i => i.parentId === null);
    const materialItems = items.filter(i => i.parentId !== null);

    // Index materials by their parentId
    const matByParent = new Map<string, BreakdownItem[]>();
    for (const mat of materialItems) {
        const key = mat.parentId!;
        if (!matByParent.has(key)) matByParent.set(key, []);
        matByParent.get(key)!.push(mat);
    }

    // Group labor items by subcategory (order preserved)
    for (const labor of laborItems) {
        const key = labor.subcategoryName || '—';
        if (!subcatMap.has(key)) {
            subcatMap.set(key, { subcat: key, laborItems: [], materialsByParent: new Map() });
        }
        const group = subcatMap.get(key)!;
        group.laborItems.push(labor);
        const children = matByParent.get(labor.id) ?? [];
        if (children.length > 0) group.materialsByParent.set(labor.id, children);
    }

    const groups = Array.from(subcatMap.values());
    const rowIndex = { v: 0 };

    return (
        <Box sx={{ mt: 3, borderRadius: 2, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Box sx={{ minWidth: LEFT_W + months.length * COL_W_MONTH, display: 'flex', flexDirection: 'column' }}>

                    {/* ── Header row 1: year groups ── */}
                    <div style={{ display: 'flex', background: HEADER_BG, borderBottom: `1px solid ${BORDER}` }}>
                        <div style={{
                            width: LEFT_W, minWidth: LEFT_W, flexShrink: 0,
                            padding: '8px 10px', fontSize: 15, fontWeight: 700,
                            borderRight: `1px solid ${BORDER}`, position: 'sticky', left: 0, zIndex: 3,
                            background: HEADER_BG, boxSizing: 'border-box',
                        }}>
                            {t('Name')}
                        </div>
                        <div style={{ display: 'flex' }}>
                            {yearGroups.map(({ year, months: ym }) => (
                                <div key={year} style={{
                                    width: ym.length * COL_W_MONTH,
                                    minWidth: ym.length * COL_W_MONTH,
                                    padding: '7px 0', textAlign: 'center',
                                    fontSize: 14, fontWeight: 700, color: PURPLE,
                                    background: PURPLE_YEAR,
                                    borderLeft: `2px solid ${PURPLE}`,
                                    borderRight: `2px solid ${PURPLE}`,
                                }}>
                                    {year}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Header row 2: fixed col labels + month labels ── */}
                    <div style={{ display: 'flex', background: HEADER_BG, borderBottom: `2px solid ${BORDER}` }}>
                        {/* Fixed column headers */}
                        <div style={{
                            width: LEFT_W, minWidth: LEFT_W, flexShrink: 0, display: 'flex',
                            position: 'sticky', left: 0, zIndex: 3, background: HEADER_BG,
                        }}>
                            <div style={{ ...fixedCell(COL_W_NAME, { fontSize: 13, fontWeight: 700, background: HEADER_BG }) }}>{t('Name')}</div>
                            <div style={{ ...fixedCell(COL_W_CODE, { fontSize: 13, fontWeight: 700, background: HEADER_BG }) }}>{t('Code')}</div>
                            <div style={{ ...fixedCell(COL_W_QTY, { fontSize: 13, fontWeight: 700, textAlign: 'right', background: HEADER_BG }) }}>{t('Qty')}</div>
                            <div style={{ ...fixedCell(COL_W_UNIT, { fontSize: 13, fontWeight: 700, background: HEADER_BG }) }}>{t('Unit')}</div>
                        </div>
                        {/* Month labels */}
                        <div style={{ display: 'flex' }}>
                            {months.map((m, idx) => {
                                const mo = Number(m.split('-')[1]) - 1;
                                const isFirst = idx === 0 || m.split('-')[0] !== months[idx-1]?.split('-')[0];
                                return (
                                    <div key={m} style={{
                                        width: COL_W_MONTH, minWidth: COL_W_MONTH,
                                        padding: '5px 0', textAlign: 'center', fontSize: 13, color: '#444',
                                        borderRight: `1px solid ${BORDER}`,
                                        borderLeft: isFirst ? `2px solid ${PURPLE}` : undefined,
                                        boxSizing: 'border-box',
                                    }}>
                                        {MONTH_LABELS[mo]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Data rows ── */}
                    {groups.map((group) => (
                        <AccordionGroup key={group.subcat} group={group} months={months} rowIndex={rowIndex} />
                    ))}

                </Box>
            </Box>
        </Box>
    );
}
