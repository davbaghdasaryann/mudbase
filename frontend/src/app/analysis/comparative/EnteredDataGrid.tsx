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

const SUB_SX   = { fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' as const, bgcolor: '#f4f4f4', borderBottom: '2px solid #e0e0e0', position: 'relative' as const };
const GROUP_SX = { fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' as const, textAlign: 'center' as const, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0', position: 'relative' as const };

const DEFAULT_WIDTHS: Record<string, number> = {
    desc: 360, unit: 145,
    est_uc: 130, est_qty: 100, est_total: 130,
};
const compColWidth = (suffix: string) => suffix === 'uc' ? 110 : suffix === 'qty' ? 90 : 130;

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
        const baseRequest: Promise<any[]> = isMaterials
            ? Api.requestSession<any[]>({ command: 'estimate/fetch_material_market_comparison', args: { estimateId } })
                .then(rows => (rows ?? []).map(r => ({ ...r, itemName: r.materialOfferItemName || r.catalogName })))
            : Api.requestSession<any[]>({ command: 'estimate/fetch_labor_market_comparison', args: mode === 'general' ? { estimateId, includeMaterials: 'true' } : { estimateId } })
                .then(rows => (rows ?? []).map(r => ({ ...r, itemName: r.laborOfferItemName || r.catalogName })));
        baseRequest
            .then(rows => {
                const seen = new Set<string>();
                const unique = rows.filter(row => {
                    const key = `${row.itemName}|${row.unitSymbol}|${row.unitCost}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                const map = new Map<string, SectionGroup>();
                for (const row of unique) {
                    if (!map.has(row.sectionName))
                        map.set(row.sectionName, { sectionName: row.sectionName, sectionDisplayIndex: row.sectionDisplayIndex, items: [] });
                    map.get(row.sectionName)!.items.push(row);
                }
                setGroups(Array.from(map.values()).sort((a, b) => a.sectionDisplayIndex - b.sectionDisplayIndex));
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId, mode]);

    const getCell = (itemId: string, companyId: string): CellState =>
        cellValues[itemId]?.[companyId] ?? { unitCost: '', qty: '' };

    const updateCell = (itemId: string, companyId: string, field: keyof CellState, value: string) =>
        setCellValues(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [companyId]: { ...getCell(itemId, companyId), [field]: value } },
        }));

    const calcTotalNum = (itemId: string, companyId: string): number | null => {
        const { unitCost, qty } = getCell(itemId, companyId);
        const uc = parseFloat(unitCost), q = parseFloat(qty);
        return isNaN(uc) || isNaN(q) ? null : uc * q;
    };

    // Column resize
    const startResize = useCallback((key: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = colWidths[key] ?? 100;
        const onMove = (me: MouseEvent) =>
            setColWidths(prev => ({ ...prev, [key]: Math.max(60, startW + me.clientX - startX) }));
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [colWidths]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>;
    if (error) return <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>;
    if (groups.length === 0) return null;

    const totalCols = 2 + 3 + companies.length * 3;

    return (
        <Box ref={grab.ref} onMouseDown={grab.onMouseDown} onMouseMove={grab.onMouseMove} onMouseUp={grab.onMouseUp} onMouseLeave={grab.onMouseLeave}
            sx={{ overflowX: 'auto', cursor: 'grab' }}>
        <Table size='small' sx={{ mt: 2, tableLayout: 'fixed', width: 'auto', '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <colgroup>
                <col style={{ width: colWidths.desc }} />
                <col style={{ width: colWidths.unit }} />
                <col style={{ width: colWidths.est_uc }} />
                <col style={{ width: colWidths.est_qty }} />
                <col style={{ width: colWidths.est_total }} />
                {companies.flatMap(c => [
                    <col key={c.id+'_uc'}  style={{ width: colWidths[c.id+'_uc']    ?? compColWidth('uc') }} />,
                    <col key={c.id+'_qty'} style={{ width: colWidths[c.id+'_qty']   ?? compColWidth('qty') }} />,
                    <col key={c.id+'_tot'} style={{ width: colWidths[c.id+'_tot']   ?? compColWidth('tot') }} />,
                ])}
            </colgroup>
            <TableHead>
                {/* Row 1: group headers */}
                <TableRow>
                    <TableCell rowSpan={2} sx={{ ...GROUP_SX, verticalAlign: 'middle', textAlign: 'left', bgcolor: '#f9f9f9' }}>
                        <ResizeHandle onMouseDown={e => startResize('desc', e)} />
                    </TableCell>
                    <TableCell rowSpan={2} align='center' sx={{ ...GROUP_SX, verticalAlign: 'middle', whiteSpace: 'normal' }}>
                        {AM_UNIT}
                        <ResizeHandle onMouseDown={e => startResize('unit', e)} />
                    </TableCell>
                    <TableCell colSpan={3} align='center' sx={{ ...GROUP_SX, borderLeft: '2px solid #e0e0e0' }}>
                        {AM_ESTIMATE}
                        <ResizeHandle onMouseDown={e => startResize('est_total', e)} />
                    </TableCell>
                    {companies.map(c => (
                        <TableCell key={c.id} colSpan={3} align='center' sx={{ ...GROUP_SX, borderLeft: '2px solid #e0e0e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                {c.name}
                                {onDeleteCompany && (
                                    <IconButton size='small' onClick={() => onDeleteCompany(c.id)}
                                        sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                )}
                            </Box>
                            <ResizeHandle onMouseDown={e => startResize(c.id+'_tot', e)} />
                        </TableCell>
                    ))}
                </TableRow>
                {/* Row 2: sub-column headers */}
                <TableRow>
                    <TableCell align='center' sx={{ ...SUB_SX, borderLeft: '2px solid #e0e0e0' }}>
                        {AM_UCOST}<ResizeHandle onMouseDown={e => startResize('est_uc', e)} />
                    </TableCell>
                    <TableCell align='center' sx={SUB_SX}>
                        {AM_QTY}<ResizeHandle onMouseDown={e => startResize('est_qty', e)} />
                    </TableCell>
                    <TableCell align='center' sx={SUB_SX}>
                        {AM_TOTAL}<ResizeHandle onMouseDown={e => startResize('est_total', e)} />
                    </TableCell>
                    {companies.flatMap(c => [
                        <TableCell key={c.id+'_uc'} align='center' sx={{ ...SUB_SX, borderLeft: '2px solid #e0e0e0' }}>
                            {AM_UCOST}<ResizeHandle onMouseDown={e => startResize(c.id+'_uc', e)} />
                        </TableCell>,
                        <TableCell key={c.id+'_qty'} align='center' sx={SUB_SX}>
                            {AM_QTY}<ResizeHandle onMouseDown={e => startResize(c.id+'_qty', e)} />
                        </TableCell>,
                        <TableCell key={c.id+'_tot'} align='center' sx={SUB_SX}>
                            {AM_TOTAL}<ResizeHandle onMouseDown={e => startResize(c.id+'_tot', e)} />
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
                            const label = isMaterials
                                ? `${++flatIndex}. ${item.itemName}`
                                : `${si + 1}.${i + 1} ${item.itemName}`;
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
        <Box
            onMouseDown={onMouseDown}
            sx={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 5,
                cursor: 'col-resize', zIndex: 1,
                '&:hover': { bgcolor: 'rgba(0,171,190,0.3)' },
            }}
        />
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
