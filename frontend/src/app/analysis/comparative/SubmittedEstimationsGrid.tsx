'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthWestIcon from '@mui/icons-material/SouthWest';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { SharedEstimateCompany } from './SelectSharedEstimationDialog';

interface ComparisonItem {
    laborItemId: string;
    name: string;
    unitSymbol: string;
    quantity: number;
    baseUnitPrice: number;
    companyPrices: Record<string, number | null>;
}

interface ComparisonSection {
    sectionName: string;
    displayIndex: number;
    items: ComparisonItem[];
}

interface Summary {
    directCost: number;
    otherCost: number;
    total: number;
}

interface ComparisonData {
    sections: ComparisonSection[];
    baseSummary: Summary;
    companySummaries: Record<string, { directCost: number; totalCost: number; totalWithOther: number }>;
}

const TrendCell = ({ base, value }: { base: number; value: number | null }) => {
    if (value === null) return <TableCell align='center' sx={{ color: 'text.disabled' }}>—</TableCell>;
    const a = Math.round(base);
    const b = Math.round(value);
    let icon: React.ReactNode = null;
    let color = 'text.primary';
    if (a !== b) {
        if (value > base) {
            icon = <NorthEastIcon sx={{ fontSize: 14, color: 'error.main', verticalAlign: 'middle', mr: 0.3 }} />;
            color = 'error.main';
        } else {
            icon = <SouthWestIcon sx={{ fontSize: 14, color: 'success.main', verticalAlign: 'middle', mr: 0.3 }} />;
            color = 'success.main';
        }
    } else {
        icon = <CheckIcon sx={{ fontSize: 14, color: 'warning.main', verticalAlign: 'middle', mr: 0.3 }} />;
        color = 'warning.main';
    }
    return (
        <TableCell align='center' sx={{ color, whiteSpace: 'nowrap', py: 1 }}>
            {icon}{formatCurrencyRounded(value)}
        </TableCell>
    );
};

const SummaryTrendCell = ({ base, value }: { base: number; value: number | null | undefined }) => {
    if (value == null) return <TableCell align='center' sx={{ color: 'text.disabled' }}>—</TableCell>;
    const icon = value > base
        ? <NorthEastIcon sx={{ fontSize: 14, color: 'error.main', verticalAlign: 'middle', mr: 0.3 }} />
        : value < base
            ? <SouthWestIcon sx={{ fontSize: 14, color: 'success.main', verticalAlign: 'middle', mr: 0.3 }} />
            : <CheckIcon sx={{ fontSize: 14, color: 'warning.main', verticalAlign: 'middle', mr: 0.3 }} />;
    const color = value > base ? 'error.main' : value < base ? 'success.main' : 'warning.main';
    return (
        <TableCell align='center' sx={{ color, fontWeight: 600, whiteSpace: 'nowrap', py: 1.5 }}>
            {icon}{formatCurrencyRounded(value)}
        </TableCell>
    );
};

interface Props {
    originalEstimateId: string;
    companies: SharedEstimateCompany[];
}

export default function SubmittedEstimationsGrid({ originalEstimateId, companies }: Props) {
    const { t } = useTranslation();
    const [data, setData] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(true);

    const accountIds = companies.map(c => String(c._id));

    useEffect(() => {
        setLoading(true);
        setData(null);
        Api.requestSession<ComparisonData>({
            command: 'estimate/fetch_submitted_estimations_comparison',
            args: { originalEstimateId, accountIds: accountIds.join(',') },
        })
            .then(d => setData(d ?? null))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [originalEstimateId, accountIds.join(',')]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
        </Box>
    );

    if (!data || data.sections.length === 0) return (
        <Typography variant='body2' color='text.disabled' sx={{ py: 4, textAlign: 'center' }}>
            {t('No data')}
        </Typography>
    );

    const cellSx = { py: 1, px: 1.5 };
    const headerSx = { fontWeight: 600, background: '#f9f9f9', whiteSpace: 'nowrap' };

    let itemCounter = 0;

    return (
        <Box sx={{ overflowX: 'auto', mt: 1 }}>
            <Table size='small' sx={{ minWidth: 700, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                <TableHead>
                    {/* Row 1: base columns + company group headers */}
                    <TableRow sx={{ background: '#f9f9f9' }}>
                        <TableCell rowSpan={2} sx={{ ...headerSx, minWidth: 220 }}>{t('Work Description')}</TableCell>
                        <TableCell rowSpan={2} align='center' sx={{ ...headerSx, width: 70 }}>{t('Unit')}</TableCell>
                        <TableCell rowSpan={2} align='center' sx={{ ...headerSx, width: 80 }}>{t('Quantity')}</TableCell>
                        <TableCell rowSpan={2} align='center' sx={{ ...headerSx, width: 100 }}>{t('Unit Price')}</TableCell>
                        <TableCell rowSpan={2} align='center' sx={{ ...headerSx, width: 100 }}>{t('Total')}</TableCell>
                        {companies.map(c => (
                            <TableCell
                                key={String(c._id)}
                                colSpan={2}
                                align='center'
                                sx={{ ...headerSx, borderLeft: '2px solid #e0e0e0' }}
                            >
                                {c.companyName}
                            </TableCell>
                        ))}
                    </TableRow>
                    {/* Row 2: sub-headers per company */}
                    <TableRow sx={{ background: '#f9f9f9' }}>
                        {companies.map(c => (
                            <React.Fragment key={String(c._id)}>
                                <TableCell align='center' sx={{ ...headerSx, borderLeft: '2px solid #e0e0e0', width: 100, fontSize: '0.75rem' }}>
                                    {t('Unit Price')}
                                </TableCell>
                                <TableCell align='center' sx={{ ...headerSx, width: 100, fontSize: '0.75rem' }}>
                                    {t('Total')}
                                </TableCell>
                            </React.Fragment>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {data.sections.map((section, si) => (
                        <React.Fragment key={section.sectionName + si}>
                            {/* Section header */}
                            <TableRow sx={{ background: '#fafafa' }}>
                                <TableCell
                                    colSpan={5 + companies.length * 2}
                                    sx={{ fontWeight: 700, py: 1.5, pl: 1, color: 'text.primary' }}
                                >
                                    {String(si + 1).padStart(2, '0')}. {section.sectionName}
                                </TableCell>
                            </TableRow>

                            {/* Items */}
                            {section.items.map((item) => {
                                itemCounter++;
                                const baseTotal = item.quantity * item.baseUnitPrice;
                                return (
                                    <TableRow
                                        key={item.laborItemId}
                                        sx={{ background: '#fff', '&:hover': { background: '#f5fdfe' } }}
                                    >
                                        <TableCell sx={{ ...cellSx, pl: 2 }}>
                                            <Typography variant='body2' color='text.secondary'>
                                                {si + 1}.{itemCounter} {item.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='center' sx={{ ...cellSx, color: 'text.secondary' }}>
                                            {item.unitSymbol}
                                        </TableCell>
                                        <TableCell align='center' sx={cellSx}>{item.quantity}</TableCell>
                                        <TableCell align='center' sx={cellSx}>{formatCurrencyRounded(item.baseUnitPrice)}</TableCell>
                                        <TableCell align='center' sx={{ ...cellSx, fontWeight: 500 }}>
                                            {formatCurrencyRounded(baseTotal)}
                                        </TableCell>
                                        {companies.map(c => {
                                            const acctId = String(c._id);
                                            const price = item.companyPrices[acctId] ?? null;
                                            const total = price !== null ? item.quantity * price : null;
                                            return (
                                                <React.Fragment key={acctId}>
                                                    <TrendCell base={item.baseUnitPrice} value={price} />
                                                    <TrendCell base={baseTotal} value={total} />
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Summary rows */}
                    <TableRow sx={{ background: '#f5f5f5', borderTop: '2px solid #e0e0e0' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 600, py: 1.5, pl: 2 }}>{t('Direct Costs')}</TableCell>
                        <TableCell align='center' sx={{ fontWeight: 600, py: 1.5 }}>{formatCurrencyRounded(data.baseSummary.directCost)}</TableCell>
                        {companies.map(c => {
                            const acctId = String(c._id);
                            const val = data.companySummaries[acctId]?.directCost ?? null;
                            return (
                                <React.Fragment key={acctId}>
                                    <TableCell />
                                    <SummaryTrendCell base={data.baseSummary.directCost} value={val} />
                                </React.Fragment>
                            );
                        })}
                    </TableRow>

                    <TableRow sx={{ background: '#f5f5f5' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 600, py: 1.5, pl: 2 }}>{t('Other Costs')}</TableCell>
                        <TableCell align='center' sx={{ fontWeight: 600, py: 1.5 }}>{formatCurrencyRounded(data.baseSummary.otherCost)}</TableCell>
                        {companies.map(c => {
                            const acctId = String(c._id);
                            const summary = data.companySummaries[acctId];
                            const val = summary ? (summary.totalWithOther - summary.totalCost) : null;
                            return (
                                <React.Fragment key={acctId}>
                                    <TableCell />
                                    <SummaryTrendCell base={data.baseSummary.otherCost} value={val} />
                                </React.Fragment>
                            );
                        })}
                    </TableRow>

                    <TableRow sx={{ background: '#eef9f9' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 700, py: 1.5, pl: 2 }}>{t('Total')}</TableCell>
                        <TableCell align='center' sx={{ fontWeight: 700, py: 1.5 }}>{formatCurrencyRounded(data.baseSummary.total)}</TableCell>
                        {companies.map(c => {
                            const acctId = String(c._id);
                            const val = data.companySummaries[acctId]?.totalWithOther ?? null;
                            return (
                                <React.Fragment key={acctId}>
                                    <TableCell />
                                    <SummaryTrendCell base={data.baseSummary.total} value={val} />
                                </React.Fragment>
                            );
                        })}
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    );
}
