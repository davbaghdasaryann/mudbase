'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Button, CircularProgress, InputBase,
    Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

interface ActValues {
    unitPrice: string;
    quantity: string;
}

// itemId → { unitPrice, quantity }
type ActData = Record<string, ActValues>;

const colHeaderSx = {
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    backgroundColor: '#f0fbfc',
    borderBottom: `2px solid ${mainPrimaryColor}`,
    color: '#00ABBE',
    fontSize: '0.8rem',
    verticalAlign: 'middle',
};

const actHeaderSx = {
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    backgroundColor: '#e6f7f9',
    borderBottom: `2px solid ${mainPrimaryColor}`,
    color: mainPrimaryColor,
    fontSize: '0.8rem',
    textAlign: 'center' as const,
};

const actSubHeaderSx = {
    fontWeight: 600,
    fontSize: '0.75rem',
    color: '#00818f',
    backgroundColor: '#f0fbfc',
    borderBottom: `1px solid #b2e8ed`,
    whiteSpace: 'nowrap' as const,
    textAlign: 'right' as const,
    py: 0.5,
};

const editableCellSx = {
    border: `1px solid ${mainPrimaryColor}`,
    borderRadius: '4px',
    px: 1,
    py: 0.25,
    fontSize: '0.8rem',
    width: '80px',
    '& input': { textAlign: 'right', padding: 0 },
    '&:focus-within': { boxShadow: `0 0 0 2px rgba(0,171,190,0.18)` },
};

export default function PerformanceActTable({ estimate }: { estimate: EstimatesApi.ApiEstimate }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState<LaborRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // acts[i] = label e.g. "ACT-1"
    const [acts, setActs] = useState<string[]>([]);
    // actsData[actIndex][itemId] = { unitPrice, quantity }
    const [actsData, setActsData] = useState<ActData[]>([]);

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

    const handleAddAct = useCallback(() => {
        const next = acts.length + 1;
        setActs(prev => [...prev, `ACT-${next}`]);
        setActsData(prev => [...prev, {}]);
    }, [acts.length]);

    const handleActValue = useCallback((actIdx: number, itemId: string, field: 'unitPrice' | 'quantity', value: string) => {
        setActsData(prev => {
            const copy = [...prev];
            copy[actIdx] = {
                ...copy[actIdx],
                [itemId]: { ...copy[actIdx]?.[itemId], [field]: value },
            };
            return copy;
        });
    }, []);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
        </Box>
    );

    if (error) return <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>;

    if (rows.length === 0) return (
        <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
            {t('No data for selected period')}
        </Typography>
    );

    const grandTotal = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    const subsectionsBySection = new Map<string, Subsection[]>();
    for (const sect of sections) {
        subsectionsBySection.set(
            String(sect._id),
            subsections
                .filter(s => String(s.estimateSectionId) === String(sect._id))
                .sort((a, b) => a.displayIndex - b.displayIndex)
        );
    }

    let itemCounter = 0;

    const renderItemRow = (row: LaborRow, counter: number, indent: number) => (
        <TableRow key={String(row._id)} sx={{ '&:hover': { backgroundColor: '#f5fdfe' } }}>
            <TableCell sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>{counter}</TableCell>
            <TableCell sx={{ pl: indent }}>
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
            {acts.map((_, actIdx) => {
                const vals = actsData[actIdx]?.[String(row._id)];
                return (
                    <>
                        <TableCell key={`act-${actIdx}-up-${row._id}`} sx={{ textAlign: 'right', px: 1 }}>
                            <InputBase
                                value={vals?.unitPrice ?? ''}
                                onChange={e => handleActValue(actIdx, String(row._id), 'unitPrice', e.target.value)}
                                placeholder='0'
                                sx={editableCellSx}
                            />
                        </TableCell>
                        <TableCell key={`act-${actIdx}-qty-${row._id}`} sx={{ textAlign: 'right', px: 1 }}>
                            <InputBase
                                value={vals?.quantity ?? ''}
                                onChange={e => handleActValue(actIdx, String(row._id), 'quantity', e.target.value)}
                                placeholder='0'
                                sx={editableCellSx}
                            />
                        </TableCell>
                    </>
                );
            })}
        </TableRow>
    );

    return (
        <Box sx={{ mb: 4 }}>
            {/* Add Performance button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Button
                    variant='outlined'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={handleAddAct}
                    sx={{
                        borderRadius: '20px',
                        borderColor: mainPrimaryColor,
                        color: mainPrimaryColor,
                        fontWeight: 600,
                        '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                    }}
                >
                    {t('Add Performance')}
                </Button>
            </Box>

            <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'auto' }}>
                <Table size='small' sx={{ '& .MuiTableCell-root': { borderColor: '#e8f7f9' } }}>
                    <TableHead>
                        {/* Row 1: base column headers (rowSpan=2) + ACT group headers */}
                        <TableRow>
                            <TableCell rowSpan={acts.length > 0 ? 2 : 1} sx={{ ...colHeaderSx, width: 48, textAlign: 'center' }}>{t('No.')}</TableCell>
                            <TableCell rowSpan={acts.length > 0 ? 2 : 1} sx={colHeaderSx}>{t('Description of Work')}</TableCell>
                            <TableCell rowSpan={acts.length > 0 ? 2 : 1} sx={{ ...colHeaderSx, textAlign: 'center' }}>{t('Unit')}</TableCell>
                            <TableCell rowSpan={acts.length > 0 ? 2 : 1} sx={{ ...colHeaderSx, textAlign: 'right' }}>{t('Quantity')}</TableCell>
                            <TableCell rowSpan={acts.length > 0 ? 2 : 1} sx={{ ...colHeaderSx, textAlign: 'right' }}>{t('Unit Price')}</TableCell>
                            <TableCell rowSpan={acts.length > 0 ? 2 : 1} sx={{ ...colHeaderSx, textAlign: 'right' }}>{t('Total')}</TableCell>
                            {acts.map(label => (
                                <TableCell key={label} colSpan={2} sx={{ ...actHeaderSx, borderLeft: '2px solid #b2e8ed' }}>
                                    {label}
                                </TableCell>
                            ))}
                        </TableRow>

                        {/* Row 2: sub-headers for each ACT's two columns (only when acts exist) */}
                        {acts.length > 0 && (
                            <TableRow>
                                {acts.map(label => (
                                    <>
                                        <TableCell key={`${label}-up`} sx={{ ...actSubHeaderSx, borderLeft: '2px solid #b2e8ed' }}>{t('Unit Price')}</TableCell>
                                        <TableCell key={`${label}-qty`} sx={actSubHeaderSx}>{t('Quantity')}</TableCell>
                                    </>
                                ))}
                            </TableRow>
                        )}
                    </TableHead>

                    <TableBody>
                        {sections.map((section, sectionIdx) => {
                            const sectionItems = rows.filter(r => r.sectionName === section.name);
                            if (sectionItems.length === 0) return null;

                            const subs = subsectionsBySection.get(String(section._id)) ?? [];
                            const sectionTotal = sectionItems.reduce((sum, r) => sum + (r.cost ?? 0), 0);
                            const baseColCount = 6 + acts.length * 2;

                            return (
                                <>
                                    {/* Section header */}
                                    <TableRow key={`section-${section._id}`} sx={{ backgroundColor: '#e6f7f9' }}>
                                        <TableCell
                                            colSpan={baseColCount}
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                color: '#00818f',
                                                py: 1.2,
                                                pl: 2,
                                                borderTop: sectionIdx > 0 ? '2px solid #b2e8ed' : undefined,
                                                letterSpacing: '0.03em',
                                            }}
                                        >
                                            {sectionIdx + 1}. {section.name.toUpperCase()}
                                        </TableCell>
                                    </TableRow>

                                    {subs.length > 0
                                        ? subs.map((sub, subIdx) => {
                                            const subItems = sectionItems.filter(r => r.subsectionName === sub.name);
                                            if (subItems.length === 0) return null;
                                            return (
                                                <>
                                                    {/* Subsection label */}
                                                    <TableRow key={`sub-${sub._id}`} sx={{ backgroundColor: '#f7fdfe' }}>
                                                        <TableCell
                                                            colSpan={baseColCount}
                                                            sx={{ pl: 4, py: 0.8, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}
                                                        >
                                                            {sectionIdx + 1}.{subIdx + 1}. {sub.name}
                                                        </TableCell>
                                                    </TableRow>
                                                    {subItems.map(row => renderItemRow(row, ++itemCounter, 5))}
                                                </>
                                            );
                                        })
                                        : sectionItems.map(row => renderItemRow(row, ++itemCounter, 3))
                                    }

                                    {/* Section subtotal */}
                                    <TableRow sx={{ backgroundColor: '#eaf8fa' }}>
                                        <TableCell
                                            colSpan={5 + acts.length * 2}
                                            sx={{ fontWeight: 700, textAlign: 'right', color: '#00818f', fontSize: '0.8rem', py: 1, pr: 2 }}
                                        >
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
                            <TableCell
                                colSpan={5 + acts.length * 2}
                                sx={{ fontWeight: 800, textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}`, color: mainPrimaryColor, fontSize: '0.85rem', py: 1.2, pr: 2 }}
                            >
                                {t('Total')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, textAlign: 'right', borderTop: `2px solid ${mainPrimaryColor}`, whiteSpace: 'nowrap', color: mainPrimaryColor, py: 1.2 }}>
                                {formatCurrencyRounded(grandTotal)} AMD
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}
