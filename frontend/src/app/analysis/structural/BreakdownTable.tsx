'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { useTranslation } from 'react-i18next';

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

interface Props {
    estimate: EstimatesApi.ApiEstimate;
}

export default function BreakdownTable({ estimate }: Props) {
    const { t } = useTranslation();
    const [sections, setSections] = useState<Section[]>([]);
    const [subsections, setSubsections] = useState<Subsection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const estimateId = String(estimate._id);

    useEffect(() => {
        setLoading(true);
        setSections([]);
        setSubsections([]);
        setExpanded({});

        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } })
            .then(async (sects) => {
                const sorted = (sects ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sorted);
                const openAll: Record<string, boolean> = {};
                sorted.forEach(s => { openAll[String(s._id)] = true; });
                setExpanded(openAll);

                // Fetch subsections per section using the proven endpoint
                const arrays = await Promise.all(
                    sorted.map(s =>
                        Api.requestSession<Subsection[]>({
                            command: 'estimate/fetch_subsections',
                            args: { estimateSectionId: String(s._id) },
                        }).catch(() => [] as Subsection[])
                    )
                );
                setSubsections(arrays.flat());
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));

    }, [estimateId]);

    const toggle = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const totalCost = estimate.totalCostWithOtherExpenses ?? estimate.totalCost ?? 1;
    const pct = (cost: number) => totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) + '%' : '0%';

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
        </Box>
    );

    if (error) return (
        <Typography variant='body2' color='error' sx={{ py: 2 }}>Error: {error}</Typography>
    );

    if (sections.length === 0) return null;

    return (
        <Table size='small' sx={{ mt: 2, '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
            <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell sx={{ fontWeight: 600, pl: 1.5 }}>{t('Name')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Cost')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, width: 60 }}>%</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {sections.map((section, si) => {
                    const sectionSubs = subsections
                        .filter(s => String(s.estimateSectionId) === String(section._id) && s.name?.trim())
                        .sort((a, b) => a.displayIndex - b.displayIndex);
                    const isOpen = !!expanded[String(section._id)];

                    const hasSubsections = sectionSubs.length > 0;

                    return (
                        <React.Fragment key={String(section._id)}>
                            <TableRow
                                onClick={() => hasSubsections && toggle(String(section._id))}
                                sx={{ cursor: hasSubsections ? 'pointer' : 'default', backgroundColor: '#fafafa', '&:hover': { backgroundColor: hasSubsections ? '#f0f9fb' : '#fafafa' } }}
                            >
                                <TableCell sx={{ pl: 1, fontWeight: 600, py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {hasSubsections && (isOpen
                                            ? <ExpandLessIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} />
                                            : <ExpandMoreIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} />
                                        )}
                                        {!hasSubsections && <Box sx={{ width: 18 }} />}
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {si + 1}. {section.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 1.5 }}>
                                    {formatCurrencyRounded(section.totalCost)} AMD
                                </TableCell>
                                <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>
                                    {pct(section.totalCost)}
                                </TableCell>
                            </TableRow>

                            {isOpen && sectionSubs.map((sub, subI) => (
                                <TableRow
                                    key={String(sub._id)}
                                    sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}
                                >
                                    <TableCell sx={{ pl: 5, py: 1.5 }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            {subI + 1}. {sub.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align='right' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>
                                        {formatCurrencyRounded(sub.totalCost)} AMD
                                    </TableCell>
                                    <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>
                                        {pct(sub.totalCost)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
}
