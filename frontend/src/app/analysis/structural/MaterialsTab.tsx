'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { mainPrimaryColor } from '@/theme';
import { useTranslation } from 'react-i18next';

interface MaterialRow {
    _id: string;
    estimatedLaborId: string;
    materialItemId: string;
    laborCatalogName: string;
    laborFullCode: string;
    laborOfferItemName: string;
    materialCatalogName: string;
    materialCatalogFullCode: string;
    materialOfferItemName: string;
    unitSymbol: string;
    quantity: number;
    changableAveragePrice: number;
    cost: number;
}

interface GroupedByMaterial {
    materialItemId: string;
    materialFullCode: string;
    materialName: string;
    unitSymbol: string;
    totalCost: number;
    totalQuantity: number;
    items: MaterialRow[];
}

export default function MaterialsTab({ estimate }: { estimate: EstimatesApi.ApiEstimate }) {
    const { t } = useTranslation();
    const [groups, setGroups] = useState<GroupedByMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const estimateId = String(estimate._id);
    const totalMaterialCost = estimate.materialTotalCost ?? 1;

    useEffect(() => {
        setLoading(true);
        setGroups([]);
        setExpanded({});

        Api.requestSession<MaterialRow[]>({ command: 'estimate/fetch_materials_for_analysis', args: { estimateId } })
            .then((rows) => {
                const map = new Map<string, GroupedByMaterial>();
                for (const row of (rows ?? [])) {
                    const key = String(row.materialItemId);
                    if (!map.has(key)) {
                        map.set(key, {
                            materialItemId: key,
                            materialFullCode: row.materialCatalogFullCode,
                            materialName: row.materialCatalogName || row.materialOfferItemName,
                            unitSymbol: row.unitSymbol ?? '',
                            totalCost: 0,
                            totalQuantity: 0,
                            items: [],
                        });
                    }
                    const g = map.get(key)!;
                    g.totalCost += row.cost;
                    g.totalQuantity += Number(row.quantity ?? 0);
                    g.items.push(row);
                }
                const grouped = Array.from(map.values());
                setGroups(grouped);
                const openAll: Record<string, boolean> = {};
                grouped.forEach(g => { openAll[g.materialItemId] = false; });
                setExpanded(openAll);
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    }, [estimateId]);

    const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    const pct = (cost: number) => totalMaterialCost > 0 ? ((cost / totalMaterialCost) * 100).toFixed(1) + '%' : '0%';

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
                    <TableCell sx={{ fontWeight: 600, pl: 1.5 }}>{t('Name')}</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Unit')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Quantity')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Cost')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, width: 60 }}>%</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {groups.map((group) => {
                    const isOpen = !!expanded[group.materialItemId];

                    return (
                        <React.Fragment key={group.materialItemId}>
                            <TableRow
                                onClick={() => toggle(group.materialItemId)}
                                sx={{ cursor: 'pointer', backgroundColor: '#fafafa', '&:hover': { backgroundColor: '#f0f9fb' } }}
                            >
                                <TableCell sx={{ pl: 1, py: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {isOpen
                                            ? <ExpandLessIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} />
                                            : <ExpandMoreIcon fontSize='small' sx={{ color: 'text.secondary', fontSize: 18 }} />
                                        }
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {group.materialFullCode && <Box component='span' sx={{ color: mainPrimaryColor, mr: 1 }}>{group.materialFullCode}</Box>}
                                            {group.materialName}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align='center' sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 1.5, color: 'text.secondary' }}>
                                    {group.unitSymbol}
                                </TableCell>
                                <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 1.5 }}>
                                    {group.totalQuantity.toLocaleString()}
                                </TableCell>
                                <TableCell align='right' sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 1.5 }}>
                                    {formatCurrencyRounded(group.totalCost)} AMD
                                </TableCell>
                                <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>
                                    {pct(group.totalCost)}
                                </TableCell>
                            </TableRow>

                            {isOpen && group.items.map((item, i) => (
                                <TableRow key={String(item._id)} sx={{ backgroundColor: '#ffffff', '&:hover': { backgroundColor: '#f5fdfe' } }}>
                                    <TableCell sx={{ pl: 5, py: 1.5 }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            {i + 1}. {item.laborCatalogName || item.laborOfferItemName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align='center' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>
                                        {item.unitSymbol}
                                    </TableCell>
                                    <TableCell align='right' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>
                                        {Number(item.quantity ?? 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell align='right' sx={{ whiteSpace: 'nowrap', color: 'text.secondary', py: 1.5 }}>
                                        {formatCurrencyRounded(item.cost)} AMD
                                    </TableCell>
                                    <TableCell align='right' sx={{ color: 'text.secondary', fontSize: '0.8rem', py: 1.5 }}>
                                        {pct(item.cost)}
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
