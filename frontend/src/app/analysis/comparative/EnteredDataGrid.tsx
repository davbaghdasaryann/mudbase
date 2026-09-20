'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead, InputBase } from '@mui/material';
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

// cell state: { unitCost: string, qty: string }
type CellState = { unitCost: string; qty: string };

const AM_UNIT     = 'Չափման միավոր';   // Չафман миавор
const AM_ESTIMATE = 'Նախահաշիվ';                        // Нakhahashiv
const AM_UCOST    = 'Միավորի արժեք';     // Мiавори аrжек
const AM_QTY      = 'Քանակ';                                               // Кanakk
const AM_TOTAL    = 'Ընդհանուր';                        // Эnthanur

const SUB_HEADER_SX = { fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', bgcolor: '#f4f4f4', borderBottom: '2px solid #e0e0e0' };
const GROUP_HEADER_SX = { fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', textAlign: 'center' as const, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0' };

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    mode?: GridMode;
    companies?: EnteredCompany[];
}

export default function EnteredDataGrid({ estimate, mode = 'general', companies = [] }: Props) {
    const grab = useGrabScroll();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // cellValues[itemId][companyId] = { unitCost, qty }
    const [cellValues, setCellValues] = useState<Record<string, Record<string, CellState>>>({});

    const estimateId = String(estimate._id);
    const isMaterials = mode === 'materials';

    useEffect(() => {
        setLoading(true);
        setGroups([]);

        const baseRequest: Promise<any[]> = isMaterials
            ? Api.requestSession<any[]>({
                  command: 'estimate/fetch_material_market_comparison',
                  args: { estimateId },
              }).then((rows) => (rows ?? []).map((r) => ({ ...r, itemName: r.materialOfferItemName || r.catalogName })))
            : Api.requestSession<any[]>({
                  command: 'estimate/fetch_labor_market_comparison',
                  args: mode === 'general' ? { estimateId, includeMaterials: 'true' } : { estimateId },
              }).then((rows) => (rows ?? []).map((r) => ({ ...r, itemName: r.laborOfferItemName || r.catalogName })));

        baseRequest
            .then((rows) => {
                const seen = new Set<string>();
                const unique = rows.filter((row) => {
                    const key = `${row.itemName}|${row.unitSymbol}|${row.unitCost}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                const map = new Map<string, SectionGroup>();
                for (const row of unique) {
                    if (!map.has(row.sectionName)) {
                        map.set(row.sectionName, { sectionName: row.sectionName, sectionDisplayIndex: row.sectionDisplayIndex, items: [] });
                    }
                    map.get(row.sectionName)!.items.push(row);
                }
                setGroups(Array.from(map.values()).sort((a, b) => a.sectionDisplayIndex - b.sectionDisplayIndex));
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId, mode]);

    const getCellState = (itemId: string, companyId: string): CellState =>
        cellValues[itemId]?.[companyId] ?? { unitCost: '', qty: '' };

    const updateCell = (itemId: string, companyId: string, field: keyof CellState, value: string) => {
        setCellValues(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [companyId]: { ...getCellState(itemId, companyId), [field]: value },
            },
        }));
    };

    const calcTotal = (itemId: string, companyId: string): string => {
        const { unitCost, qty } = getCellState(itemId, companyId);
        const uc = parseFloat(unitCost);
        const q = parseFloat(qty);
        if (isNaN(uc) || isNaN(q)) return '—';
        return formatCurrencyRounded(uc * q);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>;
    if (error) return <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>;
    if (groups.length === 0) return null;

    const totalCols = 2 + 3 + companies.length * 3;

    return (
        <Box ref={grab.ref} onMouseDown={grab.onMouseDown} onMouseMove={grab.onMouseMove} onMouseUp={grab.onMouseUp} onMouseLeave={grab.onMouseLeave}
            sx={{ overflowX: 'auto', cursor: 'grab' }}>
        <Table size='small' sx={{ mt: 2, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <TableHead>
                {/* Row 1: top-level group headers */}
                <TableRow>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, whiteSpace: 'nowrap', bgcolor: '#f9f9f9', verticalAlign: 'middle' }} />
                    <TableCell rowSpan={2} align='center' sx={{ fontWeight: 700, whiteSpace: 'nowrap', bgcolor: '#f9f9f9', verticalAlign: 'middle', minWidth: 90 }}>
                        {AM_UNIT}
                    </TableCell>
                    <TableCell colSpan={3} align='center' sx={{ ...GROUP_HEADER_SX, borderLeft: '2px solid #e0e0e0' }}>
                        {AM_ESTIMATE}
                    </TableCell>
                    {companies.map(c => (
                        <TableCell key={c.id} colSpan={3} align='center' sx={{ ...GROUP_HEADER_SX, borderLeft: '2px solid #e0e0e0' }}>
                            {c.name}
                        </TableCell>
                    ))}
                </TableRow>
                {/* Row 2: sub-column headers */}
                <TableRow>
                    {/* Estimate sub-cols */}
                    <TableCell align='center' sx={{ ...SUB_HEADER_SX, borderLeft: '2px solid #e0e0e0' }}>{AM_UCOST}</TableCell>
                    <TableCell align='center' sx={SUB_HEADER_SX}>{AM_QTY}</TableCell>
                    <TableCell align='center' sx={SUB_HEADER_SX}>{AM_TOTAL}</TableCell>
                    {/* Per-company sub-cols */}
                    {companies.map(c => (
                        <React.Fragment key={c.id}>
                            <TableCell align='center' sx={{ ...SUB_HEADER_SX, borderLeft: '2px solid #e0e0e0' }}>{AM_UCOST}</TableCell>
                            <TableCell align='center' sx={SUB_HEADER_SX}>{AM_QTY}</TableCell>
                            <TableCell align='center' sx={SUB_HEADER_SX}>{AM_TOTAL}</TableCell>
                        </React.Fragment>
                    ))}
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
                                    {/* Estimate cols (read-only) */}
                                    <TableCell align='center' sx={{ py: 1.5, borderLeft: '2px solid #f0f0f0' }}>{formatCurrencyRounded(item.unitCost)}</TableCell>
                                    <TableCell align='center' sx={{ py: 1.5, color: estQty ? undefined : 'text.disabled' }}>
                                        {estQty || '—'}
                                    </TableCell>
                                    <TableCell align='center' sx={{ py: 1.5, color: estTotal ? undefined : 'text.disabled' }}>
                                        {estTotal ? formatCurrencyRounded(estTotal) : '—'}
                                    </TableCell>
                                    {/* Per-company editable cols */}
                                    {companies.map(c => (
                                        <React.Fragment key={c.id}>
                                            <TableCell align='center' sx={{ py: 0.5, borderLeft: '2px solid #f0f0f0' }}>
                                                <EditCell
                                                    value={getCellState(itemId, c.id).unitCost}
                                                    onChange={v => updateCell(itemId, c.id, 'unitCost', v)}
                                                />
                                            </TableCell>
                                            <TableCell align='center' sx={{ py: 0.5 }}>
                                                <EditCell
                                                    value={getCellState(itemId, c.id).qty}
                                                    onChange={v => updateCell(itemId, c.id, 'qty', v)}
                                                />
                                            </TableCell>
                                            <TableCell align='center' sx={{ py: 1.5, color: 'text.secondary', fontSize: 13 }}>
                                                {calcTotal(itemId, c.id)}
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

function EditCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <InputBase
            value={value}
            onChange={e => onChange(e.target.value)}
            inputProps={{ style: { textAlign: 'center', fontSize: 13, padding: '2px 0' } }}
            sx={{
                width: 80,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 0.75,
                fontSize: 13,
                '&:hover': { borderColor: 'text.secondary' },
                '&.Mui-focused': { borderColor: 'primary.main', borderWidth: '1.5px' },
            }}
        />
    );
}
