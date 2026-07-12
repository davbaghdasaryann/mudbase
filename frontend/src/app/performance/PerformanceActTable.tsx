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

interface Section {
    _id: string;
    name: string;
    displayIndex: number;
    totalCost: number;
}

interface Subsection {
    _id: string;
    estimateSectionId: string;
    name: string;
    displayIndex: number;
    totalCost: number;
}

const colHeaderSx = {
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    backgroundColor: '#f0fbfc',
    borderBottom: `2px solid ${mainPrimaryColor}`,
    color: '#00ABBE',
    fontSize: '0.8rem',
};

export default function PerformanceActTable({ estimate }: { estimate: EstimatesApi.ApiEstimate }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const estimateId = String(estimate._id);

    useEffect(() => {
        setLoading(true);
        setRows([]);
        setSections([]);
        setSubsections([]);

        Promise.all([
            Api.requestSession<LaborRow[]>({ command: 'estimate/fetch_labor_for_analysis', args: { estimateId } }),
            Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } }),
        ])
            .then(async ([laborData, sectData]) => {
                const sortedSections = (sectData ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sortedSections);
                setRows(laborData ?? []);

                const arrays = await Promise.all(
                    sortedSections.map(s =>
                        Api.requestSession<Subsection[]>({
                            command: 'estimate/fetch_subsections',
                            args: { estimateSectionId: String(s._id) },
                        }).catch(() => [] as Subsection[])
                    )
                );
                setSubsections(arrays.flat());
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
        </Box>
    );

    if (error) return (
        <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>
    );

    if (rows.length === 0) return (
        <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
            {t('No data for selected period')}
        </Typography>
    );

    const grandTotal = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    // Build ordered section → subsection → items hierarchy
    const subsectionsBySection = new Map<string, Subsection[]>();
    for (const sect of sections) {
        const subs = subsections
            .filter(s => String(s.estimateSectionId) === String(sect._id))
            .sort((a, b) => a.displayIndex - b.displayIndex);
        subsectionsBySection.set(String(sect._id), subs);
    }

    // Global sequential item counter
    let itemCounter = 0;

    return (
        <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            <Table size='small' sx={{ '& .MuiTableCell-root': { borderColor: '#e8f7f9' } }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...colHeaderSx, width: 48, textAlign: 'center' }}>{t('No.')}</TableCell>
                        <TableCell sx={{ ...colHeaderSx }}>{t('Description of Work')}</TableCell>
                        <TableCell sx={{ ...colHeaderSx, textAlign: 'center' }}>{t('Unit')}</TableCell>
                        <TableCell sx={{ ...colHeaderSx, textAlign: 'right' }}>{t('Quantity')}</TableCell>
                        <TableCell sx={{ ...colHeaderSx, textAlign: 'right' }}>{t('Unit Price')}</TableCell>
                        <TableCell sx={{ ...colHeaderSx, textAlign: 'right' }}>{t('Total')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sections.map((section, sectionIdx) => {
                        const sectionItems = rows.filter(r => r.sectionName === section.name);
                        if (sectionItems.length === 0) return null;

                        const sectionSubsections = subsectionsBySection.get(String(section._id)) ?? [];
                        const sectionTotal = sectionItems.reduce((sum, r) => sum + (r.cost ?? 0), 0);

                        return (
                            <>
                                {/* Section header row */}
                                <TableRow key={`section-${section._id}`} sx={{ backgroundColor: '#e6f7f9' }}>
                                    <TableCell
                                        colSpan={6}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            color: '#00818f',
                                            py: 1.2,
                                            pl: 2,
                                            borderTop: sectionIdx > 0 ? `2px solid #b2e8ed` : undefined,
                                            letterSpacing: '0.03em',
                                        }}
                                    >
                                        {sectionIdx + 1}. {section.name.toUpperCase()}
                                    </TableCell>
                                </TableRow>

                                {/* Subsections with items */}
                                {sectionSubsections.length > 0
                                    ? sectionSubsections.map((sub, subIdx) => {
                                        const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                        if (subItems.length === 0) return null;

                                        return (
                                            <>
                                                {/* Subsection label row */}
                                                <TableRow key={`sub-${sub._id}`} sx={{ backgroundColor: '#f7fdfe' }}>
                                                    <TableCell
                                                        colSpan={6}
                                                        sx={{ pl: 4, py: 0.8, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}
                                                    >
                                                        {sectionIdx + 1}.{subIdx + 1}. {sub.name}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Items */}
                                                {subItems.map(row => {
                                                    itemCounter += 1;
                                                    return (
                                                        <TableRow key={String(row._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>{itemCounter}</TableCell>
                                                            <TableCell sx={{ pl: 5 }}>
                                                                <Typography variant='body2'>
                                                                    {row.fullCode && (
                                                                        <Box component='span' sx={{ color: mainPrimaryColor, mr: 0.75, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                            {row.fullCode}
                                                                        </Box>
                                                                    )}
                                                                    {row.laborOfferItemName || row.catalogName}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary', whiteSpace: 'nowrap' }}>{row.unitSymbol}</TableCell>
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
                                                    );
                                                })}
                                            </>
                                        );
                                    })
                                    : /* No subsections — render items directly */
                                    sectionItems.map(row => {
                                        itemCounter += 1;
                                        return (
                                            <TableRow key={String(row._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                                <TableCell sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>{itemCounter}</TableCell>
                                                <TableCell sx={{ pl: 3 }}>
                                                    <Typography variant='body2'>
                                                        {row.fullCode && (
                                                            <Box component='span' sx={{ color: mainPrimaryColor, mr: 0.75, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                {row.fullCode}
                                                            </Box>
                                                        )}
                                                        {row.laborOfferItemName || row.catalogName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center', color: 'text.secondary', whiteSpace: 'nowrap' }}>{row.unitSymbol}</TableCell>
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
                                        );
                                    })
                                }

                                {/* Section subtotal */}
                                <TableRow sx={{ backgroundColor: '#eaf8fa' }}>
                                    <TableCell colSpan={5} sx={{ fontWeight: 700, textAlign: 'right', color: '#00818f', fontSize: '0.8rem', py: 1, pr: 2 }}>
                                        {t('Subtotal')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', color: '#00818f', py: 1 }}>
                                        {formatCurrencyRounded(sectionTotal)} AMD
                                    </TableCell>
                                </TableRow>
                            </>
                        );
                    })}

                    {/* Grand total */}
                    <TableRow sx={{ backgroundColor: '#d6f4f7' }}>
                        <TableCell colSpan={5} sx={{ fontWeight: 800, textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}`, color: mainPrimaryColor, fontSize: '0.85rem', py: 1.2, pr: 2 }}>
                            {t('Total')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}`, whiteSpace: 'nowrap', color: mainPrimaryColor, py: 1.2 }}>
                            {formatCurrencyRounded(grandTotal)} AMD
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    );
}
