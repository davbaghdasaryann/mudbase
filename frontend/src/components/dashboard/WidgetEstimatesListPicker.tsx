'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Checkbox,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from '@mui/material';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';
import { formatDate } from '@/lib/format_date';

interface Props {
    selectedIds: string[];
    onSelect: (items: any[]) => void;
    disabledIds?: string[];
}

export default function WidgetEstimatesListPicker({ selectedIds, onSelect, disabledIds = [] }: Props) {
    const { t } = useTranslation();
    const [items, setItems] = useState<any[]>([]);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const data = await Api.requestSession<any[]>({
                    command: 'estimates/fetch',
                    args: { searchVal: 'empty' },
                });
                if (mounted) {
                    const all = Array.isArray(data) ? data : [];
                    setAllItems(all);
                    setItems(all.filter(e => e.inCosting === true));
                }
            } catch (e) {
                console.error('Failed to fetch estimates', e);
                if (mounted) { setAllItems([]); setItems([]); }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const getId = (item: any) =>
        typeof item._id === 'string' ? item._id : (item._id?.$oid ?? String(item._id));

    const handleToggle = (item: any) => {
        const id = getId(item);
        const isSelected = selectedIds.includes(id);
        const currentSelected = allItems.filter(i => selectedIds.includes(getId(i)));
        if (isSelected) {
            onSelect(currentSelected.filter(i => getId(i) !== id));
        } else {
            onSelect([...currentSelected, item]);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
            </Box>
        );
    }

    if (items.length === 0) {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {t('No estimates found')}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600, width: 48, color: 'text.secondary' }}>{t('No.')}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('Name')}</TableCell>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'text.secondary' }}>{t('Date of Creation')}</TableCell>
                        <TableCell sx={{ width: 48 }} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item, index) => {
                        const id = getId(item);
                        const selected = selectedIds.includes(id);
                        const disabled = disabledIds.includes(id);
                        const label = item.name ?? item.estimateNumber ?? t('Unnamed');
                        return (
                            <TableRow
                                key={id}
                                onClick={() => !disabled && handleToggle(item)}
                                hover={!disabled}
                                sx={{
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    opacity: disabled ? 0.45 : 1,
                                    backgroundColor: disabled
                                        ? (index % 2 === 1 ? '#F0F0F0' : '#F8F8F8')
                                        : selected
                                            ? `${mainPrimaryColor}22`
                                            : index % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                    '&.MuiTableRow-hover:hover': {
                                        backgroundColor: `${mainPrimaryColor}15 !important`,
                                    },
                                }}
                            >
                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: selected ? 600 : 400 }}>{label}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.82rem' }}>
                                    {item.createdAt ? formatDate(item.createdAt) : '—'}
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 1 }}>
                                    <Checkbox
                                        checked={selected || disabled}
                                        disabled={disabled}
                                        size="small"
                                        sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor }, p: 0.5 }}
                                        onClick={e => e.stopPropagation()}
                                        onChange={() => !disabled && handleToggle(item)}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    );
}
