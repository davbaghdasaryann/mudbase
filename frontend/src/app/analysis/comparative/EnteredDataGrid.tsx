'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead, InputBase, IconButton } from '@mui/material';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthWestIcon from '@mui/icons-material/SouthWest';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useGrabScroll } from '@/hooks/useGrabScroll';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

type GridMode = 'general' | 'labor' | 'materials';

export interface EnteredCompany {
    id: string;
    name: string;
}

interface Row {
    _id: string;
    itemName: string;
    unitSymbol: string;
    unitCost: number;
    quantity?: number;
    sectionName: string;
    sectionDisplayIndex: number;
}

interface SectionGroup {
    sectionName: string;
    sectionDisplayIndex: number;
    items: Row[];
}

type CellState = { unitCost: string; qty: string };

const AM_UNIT     = 'Չափման միավոր';
const AM_ESTIMATE = 'Նախահաշիվ';
const AM_UCOST    = 'Միավորի արժեք';
const AM_QTY      = 'Քանակ';
const AM_TOTAL    = 'Ընդհանուր';

// min-widths (px) — table is width:100% so desc expands to fill remaining space
const DEFAULT_WIDTHS: Record<string, number> = {
    desc: 240, unit: 130,
    est_uc: 120, est_qty: 90, est_total: 120,
};
const compDefWidth = (suffix: string) => suffix === 'qty' ? 90 : suffix === 'uc' ? 110 : 130;

const SUB_SX   = { fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' as const, bgcolor: '#f4f4f4', borderBottom: '2px solid #e0e0e0', position: 'relative' as const };
const GROUP_SX = { fontWeight: 700, fontSize: 12, textAlign: 'center' as const, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0', position: 'relative' as const };

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    mode?: GridMode;
    companies?: EnteredCompany[];
    onDeleteCompany?: (id: string) => void;
}

export default function EnteredDataGrid({ estimate, mode = 'general', companies = [], onDeleteCompany }: Props) {
    const grab = useGrabScroll();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cellValues, setCellValues] = useState<Record<string, Record<string, CellState>>>({});
    const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);

    const estimateId = String(estimate._id);
    const isMaterials = mode === 'materials';

    useEffect(() => {
        setLoading(true);
        setGroups([]);
        const req: Promise<any[]> = isMaterials
            ? Api.requestSession<any[]>({ command: 'estimate/fetch_material_market_comparison', args: { estimateId } })
                .then(rows => (rows ?? []).map(r => ({ ...r, itemName: r.materialOfferItemName || r.catalogName })))
            : Api.requestSession<any[]>({ command: 'estimate/fetch_labor_market_comparison', args: mode === 'general' ? { estimateId, includeMaterials: 'true' } : { estimateId } })
                .then(rows => (rows ?? []).map(r => ({ ...r, itemName: r.laborOfferItemName || r.catalogName })));
        req.then(rows => {
            const seen = new Set<string>();
            const unique = rows.filter(r => {
                const k = `${r.itemName}|${r.unitSymbol}|${r.unitCost}`;
                if (seen.has(k)) return false; seen.add(k); return true;
            });
            const map = new Map<string, SectionGroup>();
            for (const r of unique) {
                if (!map.has(r.sectionName))
                    map.set(r.sectionName, { sectionName: r.sectionName, sectionDisplayIndex: r.sectionDisplayIndex, items: [] });
                map.get(r.sectionName)!.items.push(r);
            }
            setGroups(Array.from(map.values()).sort((a, b) => a.sectionDisplayIndex - b.sectionDisplayIndex));
        }).catch(e => setError(String(e))).finally(() => setLoading(false));
    }, [estimateId, mode]);

    const getCell = (itemId: string, cid: string): CellState => cellValues[itemId]?.[cid] ?? { unitCost: '', qty: '' };
    const updateCell = (itemId: string, cid: string, field: keyof CellState, val: string) =>
        setCellValues(prev => ({ ...prev, [itemId]: { ...prev[itemId], [cid]: { ...getCell(itemId, cid), [field]: val } } }));
    const calcTotalNum = (itemId: string, cid: string): number | null => {
        const { unitCost, qty } = getCell(itemId, cid);
        const uc = parseFloat(unitCost), q = parseFloat(qty);
        return isNaN(uc) || isNaN(q) ? null : uc * q;
    };

    const startResize = useCallback((key: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startW = colWidths[key] ?? 100;
        const onMove = (me: MouseEvent) =>
            setColWidths(prev => ({ ...prev, [key]: Math.max(60, startW + me.clientX - startX) }));
        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [colWidths]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>;
    if (error) return <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>;
    if (groups.length === 0) return null;

    const totalCols = 2 + 3 + companies.length * 3;

    const rh = (key: string) => <ResizeHandle onMouseDown={e => startResize(key, e)} />;

    return (
        <Box ref={grab.ref} onMouseDown={grab.onMouseDown} onMouseMove={grab.onMouseMove} onMouseUp={grab.onMouseUp} onMouseLeave={grab.onMouseLeave}
            sx={{ overflowX: 'auto', cursor: 'grab' }}>
        <Table size='small' sx={{ mt: 2, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <TableHead>
                <TableRow>
                    <TableCell rowSpan={2} sx={{ ...GROUP_SX, textAlign: 'left', verticalAlign: 'middle', minWidth: companies.length > 0 ? Math.max(690, colWidths.desc) : colWidths.desc }}>
                        {rh('desc')}
                    </TableCell>
                    <TableCell rowSpan={2} align='center' sx={{ ...GROUP_SX, verticalAlign: 'middle', minWidth: colWidths.unit }}>
                        {AM_UNIT}{rh('unit')}
                    </TableCell>
                    <TableCell colSpan={3} align='center' sx={{ ...GROUP_SX, borderLeft: '2px solid #e0e0e0' }}>
                        {AM_ESTIMATE}{rh('est_total')}
                    </TableCell>
                    {companies.map(c => (
                        <TableCell key={c.id} colSpan={3} align='center' sx={{ ...GROUP_SX, borderLeft: '2px solid #e0e0e0' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                {c.name}
                                {onDeleteCompany && (
                                    <IconButton size='small' onClick={() => onDeleteCompany(c.id)}
                                        sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                )}
                            </Box>
                            {rh(c.id + '_tot')}
                        </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                    <TableCell align='center' sx={{ ...SUB_SX, borderLeft: '2px solid #e0e0e0', minWidth: colWidths.est_uc }}>
                        {AM_UCOST}{rh('est_uc')}
                    </TableCell>
                    <TableCell align='center' sx={{ ...SUB_SX, minWidth: colWidths.est_qty }}>
                        {AM_QTY}{rh('est_qty')}
                    </TableCell>
                    <TableCell align='center' sx={{ ...SUB_SX, minWidth: colWidths.est_total }}>
                        {AM_TOTAL}{rh('est_total')}
                    </TableCell>
                    {companies.flatMap(c => [
                        <TableCell key={c.id+'_uc'} align='center' sx={{ ...SUB_SX, borderLeft: '2px solid #e0e0e0', minWidth: colWidths[c.id+'_uc'] ?? compDefWidth('uc') }}>
                            {AM_UCOST}{rh(c.id+'_uc')}
                        </TableCell>,
                        <TableCell key={c.id+'_qty'} align='center' sx={{ ...SUB_SX, minWidth: colWidths[c.id+'_qty'] ?? compDefWidth('qty') }}>
                            {AM_QTY}{rh(c.id+'_qty')}
                        </TableCell>,
                        <TableCell key={c.id+'_tot'} align='center' sx={{ ...SUB_SX, minWidth: colWidths[c.id+'_tot'] ?? compDefWidth('tot') }}>
                            {AM_TOTAL}{rh(c.id+'_tot')}
                        </TableCell>,
                    ])}
                </TableRow>
            </TableHead>
            <TableBody>
                {(() => {
                    let flatIndex = 0;
                    return groups.map((group, si) => (
                    <React.Fragment key={group.sectionName || si}>
                        {!isMaterials && (
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                <TableCell colSpan={totalCols} sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                    {String(si + 1).padStart(2, '0')}. {group.sectionName}
                                </TableCell>
                            </TableRow>
                        )}
                        {group.items.map((item, i) => {
                            const itemId = String(item._id);
                            const estQty = item.quantity ?? 0;
                            const estTotal = item.unitCost * estQty;
                            const label = isMaterials ? `${++flatIndex}. ${item.itemName}` : `${si + 1}.${i + 1} ${item.itemName}`;
                            return (
                                <TableRow key={itemId} sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#f5fdfe' } }}>
                                    <TableCell align='left' sx={{ py: 1.5 }}>
                                        <Typography variant='body2' color='text.secondary'>{label}</Typography>
                                    </TableCell>
                                    <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>{item.unitSymbol}</TableCell>
                                    <TableCell align='center' sx={{ py: 1.5, borderLeft: '2px solid #f0f0f0' }}>{formatCurrencyRounded(item.unitCost)}</TableCell>
                                    <TableCell align='center' sx={{ py: 1.5, color: estQty ? undefined : 'text.disabled' }}>{estQty || '—'}</TableCell>
                                    <TableCell align='center' sx={{ py: 1.5, color: estTotal ? undefined : 'text.disabled' }}>
                                        {estTotal ? formatCurrencyRounded(estTotal) : '—'}
                                    </TableCell>
                                    {companies.map(c => (
                                        <React.Fragment key={c.id}>
                                            <TableCell align='center' sx={{ py: 0.5, borderLeft: '2px solid #f0f0f0' }}>
                                                <EditCell value={getCell(itemId, c.id).unitCost} onChange={v => updateCell(itemId, c.id, 'unitCost', v)} />
                                            </TableCell>
                                            <TableCell align='center' sx={{ py: 0.5 }}>
                                                <EditCell value={getCell(itemId, c.id).qty} onChange={v => updateCell(itemId, c.id, 'qty', v)} />
                                            </TableCell>
                                            <TableCell align='center' sx={{ py: 1.5 }}>
                                                <TrendCell companyTotal={calcTotalNum(itemId, c.id)} estTotal={estTotal} />
                                            </TableCell>
                                        </React.Fragment>
                                    ))}
                                </TableRow>
                            );
                        })}
                    </React.Fragment>
                ));
                })()}
            </TableBody>
        </Table>
        </Box>
    );
}

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
    return (
        <Box onMouseDown={onMouseDown} sx={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 5,
            cursor: 'col-resize', zIndex: 1,
            '&:hover': { bgcolor: 'rgba(0,171,190,0.3)' },
        }} />
    );
}

function TrendCell({ companyTotal, estTotal }: { companyTotal: number | null; estTotal: number }) {
    if (companyTotal === null) return <Typography variant='body2' color='text.disabled'>—</Typography>;
    const a = Math.round(estTotal), b = Math.round(companyTotal);
    const icon = a === b
        ? <CheckIcon sx={{ fontSize: 16, color: 'warning.main' }} />
        : companyTotal > estTotal
            ? <NorthEastIcon sx={{ fontSize: 16, color: 'error.main' }} />
            : <SouthWestIcon sx={{ fontSize: 16, color: 'success.main' }} />;
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}>
            {icon}{formatCurrencyRounded(companyTotal)}
        </Box>
    );
}

function EditCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <InputBase
            value={value}
            onChange={e => onChange(e.target.value)}
            inputProps={{ style: { textAlign: 'center', fontSize: 13, padding: '2px 0' } }}
            sx={{
                width: '90%', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.75, fontSize: 13,
                '&:hover': { borderColor: 'text.secondary' },
                '&.Mui-focused': { borderColor: 'primary.main', borderWidth: '1.5px' },
            }}
        />
    );
}
