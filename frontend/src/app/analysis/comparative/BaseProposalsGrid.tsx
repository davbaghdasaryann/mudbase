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
import { CompanyOption } from './SelectCompanyDialog';

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

const TrendIndicator = ({ unitCost, price }: { unitCost: number; price: number | null }) => {
    if (price === null) return null;
    const a = Math.round(unitCost);
    const b = Math.round(price);
    if (a === b) return <CheckIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
    if (price > unitCost) return <NorthEastIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    return <SouthWestIcon sx={{ fontSize: 16, color: 'success.main' }} />;
};

export default function BaseProposalsGrid({ estimate, companies = [] }: { estimate: EstimatesApi.ApiEstimate; companies?: CompanyOption[] }) {
    const { t } = useTranslation();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    // companyPrices: { [estimatedLaborId]: { [accountId]: price | null } }
    const [companyPrices, setCompanyPrices] = useState<Record<string, Record<string, number | null>>>({});
    const [loading, setLoading] = useState(true);
    const [pricesLoading, setPricesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const estimateId = String(estimate._id);

    // Fetch the base labor rows (once per estimate)
    useEffect(() => {
        setLoading(true);
        setGroups([]);
        setCompanyPrices({});
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

    // Fetch company prices whenever selected companies change
    useEffect(() => {
        if (companies.length === 0) { setCompanyPrices({}); return; }
        setPricesLoading(true);
        const accountIds = companies.map(c => String(c._id)).join(',');
        Api.requestSession<{ _id: string; companyPrices: Record<string, number | null> }[]>({
            command: 'estimate/fetch_base_proposals_prices',
            args: { estimateId, accountIds },
        })
            .then((rows) => {
                const map: Record<string, Record<string, number | null>> = {};
                for (const row of rows ?? []) {
                    map[String(row._id)] = row.companyPrices;
                }
                setCompanyPrices(map);
            })
            .catch(() => {})
            .finally(() => setPricesLoading(false));
    }, [estimateId, companies.map(c => String(c._id)).join(',')]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
        </Box>
    );

    if (error) return (
        <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>
    );

    if (groups.length === 0) return null;

    const colSpan = 3 + Math.max(companies.length, 1);

    return (
        <Table size='small' sx={{ mt: 2, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell align='left' sx={{ fontWeight: 600 }}>{t('Labor Description')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit of Measure')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit Cost')}</TableCell>
                    {companies.length === 0 ? (
                        <TableCell align='center' sx={{ fontWeight: 600, color: 'text.disabled', whiteSpace: 'nowrap' }}>
                            {t('Company')}
                        </TableCell>
                    ) : companies.map((c) => (
                        <TableCell key={String(c._id)} align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.companyName}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {groups.map((group, si) => (
                    <React.Fragment key={group.sectionName || si}>
                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                            <TableCell colSpan={colSpan} sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                {String(si + 1).padStart(2, '0')}. {group.sectionName}
                            </TableCell>
                        </TableRow>
                        {group.items.map((item, i) => {
                            const rowPrices = companyPrices[String(item._id)] ?? {};
                            return (
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
                                        {formatCurrencyRounded(item.unitCost)}
                                    </TableCell>
                                    {companies.length === 0 ? (
                                        <TableCell align='center' sx={{ color: 'text.disabled', py: 1.5 }}>—</TableCell>
                                    ) : companies.map((c) => {
                                        const price = rowPrices[String(c._id)] ?? null;
                                        return (
                                            <TableCell key={String(c._id)} align='center' sx={{ py: 1.5, color: price === null ? 'text.disabled' : undefined }}>
                                                {pricesLoading ? (
                                                    <CircularProgress size={12} />
                                                ) : price === null ? '—' : (
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                        <TrendIndicator unitCost={item.unitCost} price={price} />
                                                        {formatCurrencyRounded(price)}
                                                    </Box>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </React.Fragment>
                ))}
            </TableBody>
        </Table>
    );
}
