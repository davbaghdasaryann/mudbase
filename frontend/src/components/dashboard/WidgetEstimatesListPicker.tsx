'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Radio,
    List,
    ListItemButton,
    ListItemText,
} from '@mui/material';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

const TEAL = '#00ABBE';
const TEAL_LIGHT = 'rgba(0, 171, 190, 0.08)';

interface Props {
    selectedId: string | null;
    onSelect: (item: { _id: string; name?: string; estimateNumber?: string;[k: string]: any }) => void;
}

export default function WidgetEstimatesListPicker({ selectedId, onSelect }: Props) {
    const { t } = useTranslation();
    const [items, setItems] = useState<any[]>([]);
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
                if (mounted) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Failed to fetch estimates', e);
                if (mounted) setItems([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: TEAL }} />
            </Box>
        );
    }

    return (
        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
                {items.map((item) => {
                    const id = typeof item._id === 'string' ? item._id : (item._id?.$oid ?? String(item._id));
                    const selected = selectedId === id;
                    const label = item.name ?? item.estimateNumber ?? item.title ?? t('Unnamed');
                    return (
                        <ListItemButton
                            key={id}
                            selected={selected}
                            onClick={() => onSelect(item)}
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                bgcolor: selected ? TEAL_LIGHT : undefined,
                                '&:last-child': { borderBottom: 'none' },
                                '&.Mui-selected': { bgcolor: TEAL_LIGHT },
                            }}
                        >
                            <ListItemText
                                primary={label}
                                secondary={item.estimateNumber ? (item.name ? item.estimateNumber : undefined) : undefined}
                                primaryTypographyProps={{ fontWeight: selected ? 600 : 400 }}
                            />
                            <Radio
                                checked={selected}
                                sx={{ color: TEAL, '&.Mui-checked': { color: TEAL } }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
            {items.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('No estimates found')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
