'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthWestIcon from '@mui/icons-material/SouthWest';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

interface LaborRow {
    _id: string;
    itemName: string;
    unitSymbol: string;
    unitCost: number;
    marketAveragePrice: number | null;
    sectionName: string;
    sectionDisplayIndex: number;
}

interface SectionGroup {
    sectionName: string;
    sectionDisplayIndex: number;
    items: LaborRow[];
}

const TrendIndicator = ({ unitCost, marketAverage }: { unitCost: number; marketAverage: number | null }) => {
    if (marketAverage === null) return null;
    const roundedCost = Math.round(unitCost);
    const roundedAvg = Math.round(marketAverage);
    if (roundedCost === roundedAvg) return <CheckIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
    if (roundedCost > roundedAvg) return <NorthEastIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    return <SouthWestIcon sx={{ fontSize: 16, color: 'success.main' }} />;
};

export default function BaseProposalsGrid({ estimate }: { estimate: EstimatesApi.ApiEstimate }) {
    const { t } = useTranslation();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const estimateId = String(estimate._id);

    useEffect(() => {
        setLoading(true);
        setGroups([]);
        Api.requestSession<any[]>({
            command: 'estimate/fetch_labor_market_comparison',
            args: { estimateId, includeMaterials: 'true' },
        })
            .then((rows) => {
                const map = new Map<string, SectionGroup>();
                for (const row of rows ?? []) {
                    const key = row.sectionName;
                    if (!map.has(key)) {
                        map.set(key, { sectionName: row.sectionName, sectionDisplayIndex: row.sectionDisplayIndex, items: [] });
                    }
                    map.get(key)!.items.push({ ...row, itemName: row.laborOfferItemName || row.catalogName });
                }
                setGroups(Array.from(map.values()).sort((a, b) => a.sectionDisplayIndex - b.sectionDisplayIndex));
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId]);

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
        <Table size='small' sx={{ mt: 2, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell align='left' sx={{ fontWeight: 600 }}>{t('Labor Description')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit of Measure')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit Cost')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, color: 'text.disabled', whiteSpace: 'nowrap' }}>
                        {t('Company')}
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {groups.map((group, si) => (
                    <React.Fragment key={group.sectionName || si}>
                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                            <TableCell colSpan={4} sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                {String(si + 1).padStart(2, '0')}. {group.sectionName}
                            </TableCell>
                        </TableRow>
                        {group.items.map((item, i) => (
                            <TableRow key={String(item._id)} sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                <TableCell align='left' sx={{ py: 1.5 }}>
                                    <Typography variant='body2' color='text.secondary'>
                                        {si + 1}.{i + 1} {item.itemName}
                                    </Typography>
                                </TableCell>
                                <TableCell align='center' sx={{ color: 'text.secondary', py: 1.5 }}>
                                    {item.unitSymbol}
                                </TableCell>
                                <TableCell align='center' sx={{ py: 1.5 }}>
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                        <TrendIndicator unitCost={item.unitCost} marketAverage={item.marketAveragePrice} />
                                        {formatCurrencyRounded(item.unitCost)}
                                    </Box>
                                </TableCell>
                                <TableCell align='center' sx={{ color: 'text.disabled', py: 1.5 }}>—</TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                ))}
            </TableBody>
        </Table>
    );
}
