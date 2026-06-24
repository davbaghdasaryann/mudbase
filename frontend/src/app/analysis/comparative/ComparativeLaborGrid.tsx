'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import { useGrabScroll } from '@/hooks/useGrabScroll';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthWestIcon from '@mui/icons-material/SouthWest';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

interface LaborMarketComparisonRow {
    _id: string;
    laborItemId: string;
    fullCode: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    unitCost: number;
    marketAveragePrice: number | null;
    marketMinPrice: number | null;
    marketMaxPrice: number | null;
    sectionName: string;
    sectionDisplayIndex: number;
}

interface MaterialMarketComparisonRow {
    _id: string;
    materialItemId: string;
    fullCode: string;
    catalogName: string;
    materialOfferItemName: string;
    unitSymbol: string;
    unitCost: number;
    marketAveragePrice: number | null;
    marketMinPrice: number | null;
    marketMaxPrice: number | null;
    sectionName: string;
    sectionDisplayIndex: number;
}

interface MarketComparisonRow {
    _id: string;
    itemName: string;
    unitSymbol: string;
    unitCost: number;
    marketAveragePrice: number | null;
    marketMinPrice: number | null;
    marketMaxPrice: number | null;
    sectionName: string;
    sectionDisplayIndex: number;
}

interface SectionGroup {
    sectionName: string;
    sectionDisplayIndex: number;
    items: MarketComparisonRow[];
}

const TrendIndicator = ({ unitCost, marketAverage }: { unitCost: number; marketAverage: number | null }) => {
    if (marketAverage === null) return null;
    const roundedCost = Math.round(unitCost);
    const roundedAvg = Math.round(marketAverage);
    if (roundedCost === roundedAvg) return <CheckIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
    if (roundedCost > roundedAvg) return <NorthEastIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    return <SouthWestIcon sx={{ fontSize: 16, color: 'success.main' }} />;
};

const formatValue = (value: number | null) => value === null ? '-' : formatCurrencyRounded(value);

export default function ComparativeLaborGrid({ estimate, includeMaterials, materialsOnly }: { estimate: EstimatesApi.ApiEstimate; includeMaterials?: boolean; materialsOnly?: boolean }) {
    const { t } = useTranslation();
    const grab = useGrabScroll();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const estimateId = String(estimate._id);

    useEffect(() => {
        setLoading(true);
        setGroups([]);

        const request: Promise<MarketComparisonRow[]> = materialsOnly
            ? Api.requestSession<MaterialMarketComparisonRow[]>({
                  command: 'estimate/fetch_material_market_comparison',
                  args: { estimateId },
              }).then((rows) => (rows ?? []).map((row) => ({ ...row, itemName: row.materialOfferItemName || row.catalogName })))
            : Api.requestSession<LaborMarketComparisonRow[]>({
                  command: 'estimate/fetch_labor_market_comparison',
                  args: includeMaterials ? { estimateId, includeMaterials: 'true' } : { estimateId },
              }).then((rows) => (rows ?? []).map((row) => ({ ...row, itemName: row.laborOfferItemName || row.catalogName })));

        request
            .then((rows) => {
                const seen = new Set<string>();
                const unique = rows.filter((row) => {
                    const dedupKey = `${row.itemName}|${row.unitSymbol}|${row.unitCost}|${row.marketAveragePrice}|${row.marketMinPrice}|${row.marketMaxPrice}`;
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
                const grouped = Array.from(map.values()).sort((a, b) => a.sectionDisplayIndex - b.sectionDisplayIndex);
                setGroups(grouped);
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId, includeMaterials, materialsOnly]);

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
                    <TableCell align='left' sx={{ fontWeight: 600 }}>{materialsOnly ? t('Material Description') : t('Labor Description')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit of Measure')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit Cost')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Average Market Value')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Minimum Value')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Maximum Value')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {(() => {
                    let flatIndex = 0;
                    return groups.map((group, si) => (
                    <React.Fragment key={group.sectionName || si}>
                        {!materialsOnly && (
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell colSpan={6} sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                    {String(si + 1).padStart(2, '0')}. {group.sectionName}
                                </TableCell>
                            </TableRow>
                        )}

                        {group.items.map((item, i) => (
                            <TableRow key={String(item._id)} sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                <TableCell align='left' sx={{ py: 1.5 }}>
                                    <Typography variant='body2' color='text.secondary'>
                                        {materialsOnly ? `${++flatIndex}. ${item.itemName}` : `${si + 1}.${i + 1} ${item.itemName}`}
                                    </Typography>
                                </TableCell>
                                <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>
                                    {item.unitSymbol}
                                </TableCell>
                                <TableCell align='center' sx={{ py: 1.5 }}>
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                        <TrendIndicator unitCost={item.unitCost} marketAverage={item.marketAveragePrice} />
                                        {formatValue(item.unitCost)}
                                    </Box>
                                </TableCell>
                                <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>
                                    {formatValue(item.marketAveragePrice)}
                                </TableCell>
                                <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>
                                    {formatValue(item.marketMinPrice)}
                                </TableCell>
                                <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>
                                    {formatValue(item.marketMaxPrice)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                ));
                })()}

            </TableBody>
        </Table>
        </Box>
    );
}
