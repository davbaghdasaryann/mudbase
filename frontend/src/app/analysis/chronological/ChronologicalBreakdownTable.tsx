'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
    sectionName: string;
    subsectionName: string;
    parentId: string | null;
    monthlyPrices: Record<string, number>;
}

interface Props {
    months: string[];
    items: BreakdownItem[];
}

// ── Fixed column widths (Name is dynamic based on panel width) ───────────────
const W_CODE  = 94;
const W_UNIT  = 52;
const W_QTY   = 58;
const W_FIXED = W_CODE + W_UNIT + W_QTY; // 204
const DEF_LEFT = 470;
const MIN_LEFT = 280;
const W_MONTH  = 80;

// ── Row heights ──────────────────────────────────────────────────────────────
const H_HEADER  = 34;
const H_SECTION = 30;
const H_SUBSECT = 32;
const H_ROW     = 36;

// ── Light colour palette ─────────────────────────────────────────────────────
const TEAL      = '#00897b';
const BORDER    = '#e0e0e0';
const YEAR_BG   = '#d7f0ed';
const HDR_BG    = '#f5f5f5';
const SEC_BG    = '#eaf5f3';
const SEC_FG    = '#005f56';
const SUB_BG    = '#f8f8f8';
const SUB_FG    = '#444';
const LBR_EVEN  = '#f9fffe';
const LBR_ODD   = '#ffffff';
const MAT_EVEN  = '#f2faf8';
const MAT_ODD   = '#f8fdfc';

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

const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '0 7px', border: `1px solid ${BORDER}`, whiteSpace: 'nowrap',
    verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', ...extra,
});

// ── Row descriptor — single source of truth for both panels ─────────────────
type RowDesc =
    | { kind: 'section'; key: string; name: string; isOpen: boolean }
    | { kind: 'subsect'; key: string; name: string; isOpen: boolean; count: number }
    | { kind: 'labor';   key: string; item: BreakdownItem; bg: string; hasMats: boolean; matsOpen: boolean }
    | { kind: 'mat';     key: string; item: BreakdownItem; bg: string };

export default function ChronologicalBreakdownTable({ months, items }: Props) {
    const { t } = useTranslation();
    const yearGroups = groupByYear(months);

    const laborItems = useMemo(() => items.filter(i => i.parentId === null), [items]);
    const matByParent = useMemo(() => {
        const m = new Map<string, BreakdownItem[]>();
        for (const mat of items.filter(i => i.parentId !== null)) {
            if (!m.has(mat.parentId!)) m.set(mat.parentId!, []);
            m.get(mat.parentId!)!.push(mat);
        }
        return m;
    }, [items]);

    // Build Section → (optional Subsection) → [labor items] structure,
    // preserving the backend's already-sorted order.
    // A subsection whose name equals the section name is treated as "no subsection".
    const structure = useMemo(() => {
        const secOrder: string[] = [];
        // section → Map<subKey, labor[]>  (subKey = '' means "directly under section")
        const secData = new Map<string, Map<string, BreakdownItem[]>>();

        for (const l of laborItems) {
            const sec = l.sectionName || '—';
            const sub = (l.subsectionName && l.subsectionName !== l.sectionName) ? l.subsectionName : '';
            if (!secData.has(sec)) { secData.set(sec, new Map()); secOrder.push(sec); }
            const subMap = secData.get(sec)!;
            if (!subMap.has(sub)) subMap.set(sub, []);
            subMap.get(sub)!.push(l);
        }
        return { secOrder, secData };
    }, [laborItems]);

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
        const r: Record<string, boolean> = {};
        for (const s of structure.secOrder) r[s] = true;
        return r;
    });
    const [openSubsects, setOpenSubsects] = useState<Record<string, boolean>>(() => {
        const r: Record<string, boolean> = {};
        for (const [, sm] of structure.secData)
            for (const k of sm.keys()) if (k) r[k] = true;
        return r;
    });
    // Materials collapsed by default — user expands per labor item
    const [expandedMats, setExpandedMats] = useState<Set<string>>(new Set());

    const toggleSec  = useCallback((k: string) => setOpenSections(s => ({ ...s, [k]: !s[k] })), []);
    const toggleSub  = useCallback((k: string) => setOpenSubsects(s => ({ ...s, [k]: !s[k] })), []);
    const toggleMats = useCallback((id: string) => setExpandedMats(s => {
        const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
    }), []);

    // ── Resizable left panel — width persisted to localStorage ─────────────
    const [leftWidth, setLeftWidthState] = useState(DEF_LEFT);

    // Wrap setter so every programmatic resize immediately persists
    const setLeftWidth = useCallback((w: number) => {
        setLeftWidthState(w);
        localStorage.setItem('chron-left-width', String(w));
    }, []);

    // Restore saved width once after mount
    useEffect(() => {
        const saved = parseInt(localStorage.getItem('chron-left-width') ?? '', 10);
        if (!isNaN(saved) && saved >= MIN_LEFT) setLeftWidthState(saved);
    }, []);

    const dragging  = useRef(false);
    const startX    = useRef(0);
    const startW    = useRef(0);

    const onDividerDown = useCallback((e: React.MouseEvent) => {
        dragging.current = true;
        startX.current   = e.clientX;
        startW.current   = leftWidth;
        e.preventDefault();
    }, [leftWidth]);

    // ── Grab-to-scroll (Pointer Events — works for mouse, touch, and pen) ────
    const rightRef    = useRef<HTMLDivElement>(null);
    const grabbing    = useRef(false);
    const grabStartX  = useRef(0);
    const grabScrollX = useRef(0);
    const [isGrabbing, setIsGrabbing] = useState(false);

    const onRightPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return; // left-click only
        grabbing.current    = true;
        grabStartX.current  = e.clientX;
        grabScrollX.current = rightRef.current?.scrollLeft ?? 0;
        setIsGrabbing(true);
        // capture keeps events routed here even when pointer leaves the element
        e.currentTarget.setPointerCapture(e.pointerId);
    }, []);

    const onRightPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!grabbing.current || !rightRef.current) return;
        rightRef.current.scrollLeft = grabScrollX.current - (e.clientX - grabStartX.current);
    }, []);

    const onRightPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!grabbing.current) return;
        grabbing.current = false;
        setIsGrabbing(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, []);

    useEffect(() => {
        // Only the resize divider still needs document-level listeners
        const onMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            setLeftWidth(Math.max(MIN_LEFT, startW.current + (e.clientX - startX.current)));
        };
        const onUp = () => { dragging.current = false; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, []);

    const wName = Math.max(60, leftWidth - W_FIXED);

    // ── Pre-compute flat row list (same for both panels) ────────────────────
    const rows = useMemo<RowDesc[]>(() => {
        const list: RowDesc[] = [];
        let ri = 0;
        for (const sec of structure.secOrder) {
            const secOpen = openSections[sec] ?? true;
            list.push({ kind: 'section', key: `sec-${sec}`, name: sec, isOpen: secOpen });
            if (!secOpen) continue;

            for (const [sub, laborList] of structure.secData.get(sec)!) {
                if (sub) {
                    const subOpen = openSubsects[sub] ?? true;
                    list.push({ kind: 'subsect', key: `sub-${sub}`, name: sub, isOpen: subOpen, count: laborList.length });
                    if (!subOpen) continue;
                }
                for (const labor of laborList) {
                    const bg = (ri++ % 2 === 0) ? LBR_EVEN : LBR_ODD;
                    const children = matByParent.get(labor.id) ?? [];
                    const matsOpen = expandedMats.has(labor.id);
                    list.push({ kind: 'labor', key: `lb-${labor.id}`, item: labor, bg, hasMats: children.length > 0, matsOpen });
                    if (matsOpen) {
                        for (const mat of children) {
                            const mbg = (ri++ % 2 === 0) ? MAT_EVEN : MAT_ODD;
                            list.push({ kind: 'mat', key: `mt-${mat.id}`, item: mat, bg: mbg });
                        }
                    }
                }
            }
        }
        return list;
    }, [structure, openSections, openSubsects, expandedMats, matByParent]);

    const rowH = (r: RowDesc) =>
        r.kind === 'section' ? H_SECTION : r.kind === 'subsect' ? H_SUBSECT : H_ROW;

    // ── Render ───────────────────────────────────────────────────────────────
    const leftRows = (
        <tbody>
            {rows.map(row => {
                if (row.kind === 'section') return (
                    <tr key={row.key} style={{ height: H_SECTION, cursor: 'pointer' }} onClick={() => toggleSec(row.name)}>
                        <td colSpan={4} style={cell({ backgroundColor: SEC_BG, color: SEC_FG, fontWeight: 700, fontSize: 12, letterSpacing: 0.4, padding: '0 10px', borderBottom: `2px solid #a8dbd6` })}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {row.isOpen ? <KeyboardArrowDownIcon sx={{ fontSize: 14 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 14 }} />}
                                {row.name}
                            </span>
                        </td>
                    </tr>
                );
                if (row.kind === 'subsect') return (
                    <tr key={row.key} style={{ height: H_SUBSECT, cursor: 'pointer' }} onClick={() => toggleSub(row.name)}>
                        <td colSpan={4} style={cell({ backgroundColor: SUB_BG, color: SUB_FG, fontWeight: 600, fontSize: 12, padding: '0 18px', borderLeft: `3px solid #a8dbd6` })}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {row.isOpen ? <KeyboardArrowDownIcon sx={{ fontSize: 13 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 13 }} />}
                                <span style={{ letterSpacing: 0.3 }}>{row.name}</span>
                                <span style={{ opacity: 0.4, fontSize: 11 }}>({row.count})</span>
                            </span>
                        </td>
                    </tr>
                );
                if (row.kind === 'labor') return (
                    <tr key={row.key} style={{ height: H_ROW }}>
                        <td style={cell({ backgroundColor: row.bg, fontSize: 12, textAlign: 'center', color: '#555' })}>{row.item.code}</td>
                        <td style={cell({ backgroundColor: row.bg, fontWeight: 500, fontSize: 13, padding: '0 4px 0 6px' })} title={row.item.name}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {row.hasMats && (
                                    <span onClick={e => { e.stopPropagation(); toggleMats(row.item.id); }}
                                        style={{ cursor: 'pointer', display: 'flex', flexShrink: 0, color: TEAL, marginLeft: -2 }}>
                                        {row.matsOpen ? <KeyboardArrowDownIcon sx={{ fontSize: 14 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 14 }} />}
                                    </span>
                                )}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.item.name}</span>
                            </span>
                        </td>
                        <td style={cell({ backgroundColor: row.bg, textAlign: 'center', fontSize: 12, color: '#555' })}>{row.item.unit}</td>
                        <td style={cell({ backgroundColor: row.bg, textAlign: 'right', fontSize: 13 })}>{row.item.qty}</td>
                    </tr>
                );
                // mat
                return (
                    <tr key={row.key} style={{ height: H_ROW }}>
                        <td style={cell({ backgroundColor: row.bg, fontSize: 11, textAlign: 'center', color: '#888' })}>{row.item.code}</td>
                        <td style={cell({ backgroundColor: row.bg, color: '#555', fontSize: 12, paddingLeft: 22 })} title={row.item.name}>└ {row.item.name}</td>
                        <td style={cell({ backgroundColor: row.bg, textAlign: 'center', fontSize: 11, color: '#888' })}>{row.item.unit}</td>
                        <td style={cell({ backgroundColor: row.bg, textAlign: 'right', fontSize: 12 })}>{row.item.qty}</td>
                    </tr>
                );
            })}
        </tbody>
    );

    const rightRows = (
        <tbody>
            {rows.map(row => {
                const h = rowH(row);
                if (row.kind === 'section') return (
                    <tr key={row.key} style={{ height: h }}>
                        <td colSpan={months.length} style={cell({ backgroundColor: SEC_BG, borderBottom: `2px solid #a8dbd6` })} />
                    </tr>
                );
                if (row.kind === 'subsect') return (
                    <tr key={row.key} style={{ height: h }}>
                        <td colSpan={months.length} style={cell({ backgroundColor: SUB_BG })} />
                    </tr>
                );
                const prices = row.item.monthlyPrices;
                const fs = row.kind === 'labor' ? 13 : 12;
                return (
                    <tr key={row.key} style={{ height: h }}>
                        {months.map((m, idx) => {
                            const isFirst = idx === 0 || m.split('-')[0] !== months[idx - 1]?.split('-')[0];
                            return (
                                <td key={m} style={cell({ backgroundColor: row.bg, textAlign: 'right', fontSize: fs, borderLeft: isFirst ? `2px solid ${TEAL}` : undefined })}>
                                    {formatVal(prices[m])}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
        </tbody>
    );

    return (
        <Box sx={{ mt: 3, border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', userSelect: 'none' }}>

            {/* ── LEFT FIXED PANEL ── */}
            <Box sx={{ flexShrink: 0, width: leftWidth, zIndex: 2, boxShadow: '3px 0 8px rgba(0,0,0,0.06)', position: 'relative' }}>
                <table style={{ tableLayout: 'fixed', width: leftWidth, borderCollapse: 'collapse' }}>
                    <colgroup>
                        <col style={{ width: W_CODE }} />
                        <col style={{ width: wName }} />
                        <col style={{ width: W_UNIT }} />
                        <col style={{ width: W_QTY }} />
                    </colgroup>
                    <thead>
                        <tr style={{ height: H_HEADER }}>
                            <th colSpan={4} style={cell({ backgroundColor: YEAR_BG, fontSize: 11, fontWeight: 700, color: TEAL, textAlign: 'left', letterSpacing: 0.6, textTransform: 'uppercase' })}>
                                {t('Estimate Items')}
                            </th>
                        </tr>
                        <tr style={{ height: H_HEADER }}>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 600, fontSize: 12, textAlign: 'center' })}>{t('Code')}</th>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 600, fontSize: 12, textAlign: 'left' })}>{t('Name')}</th>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 600, fontSize: 12, textAlign: 'center' })}>{t('Unit')}</th>
                            <th style={cell({ backgroundColor: HDR_BG, fontWeight: 600, fontSize: 12, textAlign: 'right' })}>{t('Qty')}</th>
                        </tr>
                    </thead>
                    {leftRows}
                </table>
            </Box>

            {/* ── RESIZE HANDLE ── */}
            <Box
                onMouseDown={onDividerDown}
                sx={{ width: 5, flexShrink: 0, cursor: 'col-resize', backgroundColor: BORDER, zIndex: 3, transition: 'background-color 0.15s', '&:hover': { backgroundColor: '#a8dbd6' } }}
            />

            {/* ── RIGHT SCROLLABLE PANEL ── */}
            <Box
                ref={rightRef}
                onPointerDown={onRightPointerDown}
                onPointerMove={onRightPointerMove}
                onPointerUp={onRightPointerUp}
                onPointerCancel={onRightPointerUp}
                sx={{ flex: 1, overflowX: 'auto', minWidth: 0, cursor: isGrabbing ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
            >
                <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <colgroup>
                        {months.map(m => <col key={m} style={{ width: W_MONTH }} />)}
                    </colgroup>
                    <thead>
                        <tr style={{ height: H_HEADER }}>
                            {yearGroups.map(({ year, months: ym }) => (
                                <th key={year} colSpan={ym.length} style={cell({ backgroundColor: YEAR_BG, color: TEAL, fontWeight: 700, fontSize: 13, textAlign: 'center', borderLeft: `2px solid ${TEAL}` })}>
                                    {year}
                                </th>
                            ))}
                        </tr>
                        <tr style={{ height: H_HEADER }}>
                            {months.map((m, idx) => {
                                const mo = Number(m.split('-')[1]) - 1;
                                const isFirst = idx === 0 || m.split('-')[0] !== months[idx - 1]?.split('-')[0];
                                return (
                                    <th key={m} style={cell({ backgroundColor: HDR_BG, fontSize: 12, textAlign: 'center', borderLeft: isFirst ? `2px solid ${TEAL}` : undefined })}>
                                        {MONTH_LABELS[mo]}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    {rightRows}
                </table>
            </Box>
        </Box>
    );
}
