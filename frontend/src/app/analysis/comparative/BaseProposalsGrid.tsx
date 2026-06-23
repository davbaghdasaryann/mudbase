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

const TrendIndicator = ({ unitCost, price }: { unitCost: number; price: number | null }) => {
    if (price === null) return null;
    const a = Math.round(unitCost);
    const b = Math.round(price);
    if (a === b) return <CheckIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
    if (price > unitCost) return <NorthEastIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    return <SouthWestIcon sx={{ fontSize: 16, color: 'success.main' }} />;
};

interface Props {
    estimate: EstimatesApi.ApiEstimate;
    companies?: CompanyOption[];
    mode?: GridMode;
}

export default function BaseProposalsGrid({ estimate, companies = [], mode = 'general' }: Props) {
    const { t } = useTranslation();
    const [groups, setGroups] = useState<SectionGroup[]>([]);
    const [companyPrices, setCompanyPrices] = useState<Record<string, Record<string, number | null>>>({});
    const [loading, setLoading] = useState(true);
    const [pricesLoading, setPricesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const estimateId = String(estimate._id);
    const isMaterials = mode === 'materials';
    const descriptionHeader = isMaterials ? t('Material Description') : t('Labor Description');

    // Fetch base rows whenever estimate or mode changes
    useEffect(() => {
        setLoading(true);
        setGroups([]);
        setCompanyPrices({});

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

    // Fetch company prices whenever selected companies or mode changes
    useEffect(() => {
        if (companies.length === 0) { setCompanyPrices({}); return; }
        setPricesLoading(true);
        const accountIds = companies.map(c => String(c._id)).join(',');
        const command = isMaterials
            ? 'estimate/fetch_base_proposals_material_prices'
            : 'estimate/fetch_base_proposals_prices';

        Api.requestSession<{ _id: string; companyPrices: Record<string, number | null> }[]>({
            command,
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
    }, [estimateId, mode, companies.map(c => String(c._id)).join(',')]);

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
                    <TableCell align='left' sx={{ fontWeight: 600 }}>{descriptionHeader}</TableCell>
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
                {(() => {
                    let flatIndex = 0;
                    return groups.map((group, si) => (
                    <React.Fragment key={group.sectionName || si}>
                        {!isMaterials && (
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell colSpan={colSpan} sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                    {String(si + 1).padStart(2, '0')}. {group.sectionName}
                                </TableCell>
                            </TableRow>
                        )}
                        {group.items.map((item, i) => {
                            const rowPrices = companyPrices[String(item._id)] ?? {};
                            const label = isMaterials ? `${++flatIndex}. ${item.itemName}` : `${si + 1}.${i + 1} ${item.itemName}`;
                            return (
                                <TableRow key={String(item._id)} sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                    <TableCell align='left' sx={{ py: 1.5 }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            {label}
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
                ));
                })()}
            </TableBody>
        </Table>
    );
}
