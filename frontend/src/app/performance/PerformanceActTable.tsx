'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';

interface LaborRow {
    _id: string;
    laborItemId: string;
    fullCode: string;
    catalogName: string;
    laborOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
    subsectionName: string;
    sectionName: string;
}

const headerCellSx = {
    fontWeight: 700,
    whiteSpace: 'nowrap',
    backgroundColor: '#f0fbfc',
    borderBottom: `2px solid ${mainPrimaryColor}`,
    color: '#00ABBE',
    fontSize: '0.8rem',
};

export default function PerformanceActTable({ estimate }: { estimate: EstimatesApi.ApiEstimate }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setRows([]);
        Api.requestSession<LaborRow[]>({
            command: 'estimate/fetch_labor_for_analysis',
            args: { estimateId: String(estimate._id) },
        })
            .then(data => setRows(data ?? []))
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimate._id]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
        </Box>
    );

    if (error) return (
        <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>
    );

    const grandTotal = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    return (
        <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
            <Table size='small' sx={{ '& .MuiTableCell-root': { borderColor: '#e8f7f9' } }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...headerCellSx, width: 48, textAlign: 'center' }}>{t('No.')}</TableCell>
                        <TableCell sx={{ ...headerCellSx }}>{t('Description of Work')}</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>{t('Unit')}</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('Quantity')}</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('Unit Price')}</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('Total')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow
                            key={String(row._id)}
                            sx={{ '&:hover': { backgroundColor: '#f5fdfe' }, '&:nth-of-type(even)': { backgroundColor: '#fafeff' } }}
                        >
                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>{i + 1}</TableCell>
                            <TableCell>
                                <Typography variant='body2'>
                                    {row.fullCode && (
                                        <Box component='span' sx={{ color: mainPrimaryColor, mr: 0.75, fontSize: '0.75rem', fontWeight: 600 }}>
                                            {row.fullCode}
                                        </Box>
                                    )}
                                    {row.laborOfferItemName || row.catalogName}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                {row.unitSymbol}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {Number(row.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                {formatCurrencyRounded(row.changableAveragePrice)}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                {formatCurrencyRounded(row.cost)}
                            </TableCell>
                        </TableRow>
                    ))}

                    {rows.length > 0 && (
                        <TableRow sx={{ backgroundColor: '#f0fbfc' }}>
                            <TableCell colSpan={5} sx={{ fontWeight: 700, textAlign: 'right', borderTop: `1px solid ${mainPrimaryColor}`, color: mainPrimaryColor }}>
                                {t('Total')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, textAlign: 'right', borderTop: `1px solid ${mainPrimaryColor}`, whiteSpace: 'nowrap' }}>
                                {formatCurrencyRounded(grandTotal)} AMD
                            </TableCell>
                        </TableRow>
                    )}

                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                {t('No data for selected period')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Box>
    );
}
