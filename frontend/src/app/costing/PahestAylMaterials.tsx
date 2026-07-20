'use client';

import React, { useState } from 'react';
import {
    Box, Button, Typography, IconButton, Tooltip, InputBase,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';

export interface AylEntry {
    id: string;
    name: string;
    unit: string;
    mutq: string;
    tsakh: string;
}

interface Props {
    entries: AylEntry[];
    onChange: (entries: AylEntry[]) => void;
}

const newRow = (): AylEntry => ({
    id: String(Date.now() + Math.random()),
    name: '',
    unit: '',
    mutq: '',
    tsakh: '',
});

const COLS = '1fr 80px 110px 110px 36px';

export default function PahestAylMaterials({ entries, onChange }: Props) {
    const { t } = useTranslation();

    const addRow = () => onChange([...entries, newRow()]);

    const update = (id: string, field: keyof AylEntry, val: string) =>
        onChange(entries.map(e => e.id === id ? { ...e, [field]: val } : e));

    const remove = (id: string) => onChange(entries.filter(e => e.id !== id));

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant='outlined'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={addRow}
                    sx={{ borderRadius: '20px', textTransform: 'none', borderColor: mainPrimaryColor, color: mainPrimaryColor, fontWeight: 600, '&:hover': { bgcolor: 'rgba(0,171,190,0.06)' } }}
                >
                    {t('Add')}
                </Button>
            </Box>

            {entries.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                    <Typography variant='body2' color='text.secondary'>{t('No materials added yet.')}</Typography>
                </Box>
            ) : (
                <Box sx={{ border: '1px solid #e0f5f7', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: COLS, bgcolor: '#edf9fb', px: 2, py: 0.8 }}>
                        {[t('Material'), t('Unit'), 'Մուտքագրված', 'Ծախսագրված', ''].map((h, i) => (
                            <Typography key={i} sx={{ fontSize: '0.72rem', fontWeight: 700, color: mainPrimaryColor, textAlign: i === 0 ? 'left' : i < 4 ? 'right' : 'center' }}>{h}</Typography>
                        ))}
                    </Box>
                    {entries.map((e, idx) => (
                        <Box key={e.id} sx={{ display: 'grid', gridTemplateColumns: COLS, px: 2, py: 0.5, alignItems: 'center', borderTop: '1px solid #f0fbfc', bgcolor: idx % 2 === 0 ? '#fff' : '#fbfeff', '&:hover': { bgcolor: '#f2fcfd' } }}>
                            <InputBase
                                value={e.name}
                                onChange={ev => update(e.id, 'name', ev.target.value)}
                                placeholder={t('Material name') + '...' }
                                sx={{ fontSize: '0.84rem', color: '#222', '& input': { p: 0, pr: 1 } }}
                            />
                            <InputBase
                                value={e.unit}
                                onChange={ev => update(e.id, 'unit', ev.target.value)}
                                placeholder={t('Unit')}
                                inputProps={{ style: { textAlign: 'right', padding: 0 } }}
                                sx={{ fontSize: '0.84rem', color: '#888' }}
                            />
                            <InputBase
                                value={e.mutq}
                                onChange={ev => update(e.id, 'mutq', ev.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                inputProps={{ style: { textAlign: 'right', padding: 0 } }}
                                sx={{ fontSize: '0.9rem', fontWeight: 700, color: mainPrimaryColor }}
                            />
                            <InputBase
                                value={e.tsakh}
                                onChange={ev => update(e.id, 'tsakh', ev.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                inputProps={{ style: { textAlign: 'right', padding: 0 } }}
                                sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#555' }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Tooltip title={t('Remove')}>
                                    <IconButton size='small' onClick={() => remove(e.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
