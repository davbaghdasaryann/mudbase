'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import { useGrabScroll } from '@/hooks/useGrabScroll';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

type GridMode = 'general' | 'labor' | 'materials';

interface Row {
    _id: string;
    itemName: string;
    unitSymbol: string;
    unitCost: number;
    sectionName: string;
    sectionDisplayIndex: number;
}

interface SectionGroup {
    sectionName: string;
    sectionDisplayIndex: number;
    items: Row[];
}

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    mode?: GridMode;
}

export default function EnteredDataGrid({ estimate, mode = 'general' }: Props) {
    const { t } = useTranslation();
    const grab = useGrabScroll();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const estimateId = String(estimate._id);
    const isMaterials = mode === 'materials';
    const descriptionHeader = isMaterials ? t('Material Description') : t('Labor Description');

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
                    const dedupKey = `${row.itemName}|${row.unitSymbol}|${row.unitCost}`;
                    if (seen.has(dedupKey)) return false;
                    seen.add(dedupKey);
                    return true;
                });
                const map = new Map<string, SectionGroup>();
                for (const row of unique) {
                    const key = row.sectionName;
                    if (!map.has(key)) {
                        map.set(key, { sectionName: row.sectionName, sectionDisplayIndex: row.sectionDisplayIndex, items: [] });
                    }
                    map.get(key)!.items.push(row);
                }
                setGroups(Array.from(map.values()).sort((a, b) => a.sectionDisplayIndex - b.sectionDisplayIndex));
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId, mode]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
        </Box>
    );

    if (error) return (
        <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>
    );

    if (groups.length === 0) return null;

    return (
        <Box ref={grab.ref} onMouseDown={grab.onMouseDown} onMouseMove={grab.onMouseMove} onMouseUp={grab.onMouseUp} onMouseLeave={grab.onMouseLeave} sx={{ overflowX: 'auto', cursor: 'grab' }}>
        <Table size='small' sx={{ mt: 2, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell align='left' sx={{ fontWeight: 600 }}>{descriptionHeader}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit of Measure')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit Cost')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, color: 'text.disabled', whiteSpace: 'nowrap' }}>
                        {t('Entered Data')}
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {(() => {
                    let flatIndex = 0;
                    return groups.map((group, si) => (
                    <React.Fragment key={group.sectionName || si}>
                        {!isMaterials && (
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell colSpan={4} sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                    {String(si + 1).padStart(2, '0')}. {group.sectionName}
                                </TableCell>
                            </TableRow>
                        )}
                        {group.items.map((item, i) => {
                            const label = isMaterials ? `${++flatIndex}. ${item.itemName}` : `${si + 1}.${i + 1} ${item.itemName}`;
                            return (
                                <TableRow key={String(item._id)} sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                    <TableCell align='left' sx={{ py: 1.5 }}>
                                        <Typography variant='body2' color='text.secondary'>{label}</Typography>
                                    </TableCell>
                                    <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>{item.unitSymbol}</TableCell>
                                    <TableCell align='center' sx={{ py: 1.5 }}>{formatCurrencyRounded(item.unitCost)}</TableCell>
                                    <TableCell align='center' sx={{ color: 'text.disabled', py: 1.5 }}>—</TableCell>
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
