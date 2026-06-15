'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead, IconButton } from '@mui/material';
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
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const estimateId = String(estimate._id);

    useEffect(() => {
        setLoading(true);
        setSections([]);
        setSubsections([]);

        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } })
            .then((sects) => {
                const sorted = (sects ?? []).sort((a, b) => a.displayIndex - b.displayIndex);
                setSections(sorted);
                setExpanded(new Set(sorted.map(s => String(s._id))));
            })
            .catch((e) => setError(String(e)));

        Api.requestSession<Subsection[]>({ command: 'estimate/fetch_all_subsections', args: { estimateId } })
            .then((subs) => { setSubsections(subs ?? []); })
            .catch(() => {})
            .finally(() => setLoading(false));

    }, [estimateId]);

    const toggle = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
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
                        .filter(s => String(s.estimateSectionId) === String(section._id))
                        .sort((a, b) => a.displayIndex - b.displayIndex);
                    const isOpen = expanded.has(String(section._id));

                    return (
                        <React.Fragment key={section._id}>
                            <TableRow
                                key={section._id}
                                onClick={() => toggle(String(section._id))}
                                sx={{ cursor: 'pointer', backgroundColor: '#fafafa', '&:hover': { backgroundColor: '#f0f9fb' } }}
                            >
                                <TableCell sx={{ pl: 1, fontWeight: 600 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <IconButton size='small' sx={{ p: 0.25, color: 'text.secondary' }}>
                                            {isOpen ? <ExpandLessIcon fontSize='small' /> : <ExpandMoreIcon fontSize='small' />}
                                        </IconButton>
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {si + 1}. {section.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    AMD {formatCurrencyRounded(section.totalCost)}
                                </TableCell>
                                <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                    {pct(section.totalCost)}
                                </TableCell>
                            </TableRow>

                            {isOpen && sectionSubs.map((sub, subI) => (
                                <TableRow
                                    key={sub._id}
                                    sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}
                                >
                                    <TableCell sx={{ pl: 5 }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            {subI + 1}. {sub.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align='right' sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                        AMD {formatCurrencyRounded(sub.totalCost)}
                                    </TableCell>
                                    <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
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
