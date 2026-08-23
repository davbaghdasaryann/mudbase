'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Button, Typography, IconButton, Tooltip, InputBase,
} from '@mui/material';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';

export interface OverheadEntry {
    id: string;
    name: string;
    total: number;
    history: { id: string; amount: number; addedAt: Date }[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    entries: OverheadEntry[];
    onChange: (entries: OverheadEntry[]) => void;
    onHistoryEntry: (e: { id: string; workName: string; amount: number; overheadEntryId: string }) => void;
    onRemoveEntry: (entryId: string) => void;
    onRemoveHistoryRecord: (historyId: string) => void;
}

const ACCENT = '#546e7a';
const PRIMARY = '#00A390';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
const parse = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;

export default function OverheadCostsDialog({ open, onClose, entries, onChange, onHistoryEntry, onRemoveEntry, onRemoveHistoryRecord }: Props) {
    const { t } = useTranslation();
    const [addOpen, setAddOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addAmount, setAddAmount] = useState('');
    const [plusEntryId, setPlusEntryId] = useState<string | null>(null);
    const [plusAmount, setPlusAmount] = useState('');
    const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);

    const histEntry = historyEntryId ? entries.find(e => e.id === historyEntryId) ?? null : null;

    const handleAdd = () => {
        const amount = parse(addAmount);
        if (!addName.trim() || amount <= 0) return;
        const entryId = String(Date.now() + Math.random());
        const histId = String(Date.now() + Math.random() + 1);
        const now = new Date();
        onChange([...entries, { id: entryId, name: addName.trim(), total: amount, history: [{ id: histId, amount, addedAt: now }] }]);
        onHistoryEntry({ id: histId, workName: addName.trim(), amount, overheadEntryId: entryId });
        setAddName('');
        setAddAmount('');
        setAddOpen(false);
    };

    const handlePlus = (entryId: string) => {
        const amount = parse(plusAmount);
        if (amount <= 0) return;
        const histId = String(Date.now() + Math.random());
        const now = new Date();
        const entryName = entries.find(e => e.id === entryId)?.name ?? '';
        onChange(entries.map(e => e.id === entryId
            ? { ...e, total: e.total + amount, history: [...e.history, { id: histId, amount, addedAt: now }] }
            : e
        ));
        onHistoryEntry({ id: histId, workName: entryName, amount, overheadEntryId: entryId });
        setPlusEntryId(null);
        setPlusAmount('');
    };

    const handleDelete = (entryId: string) => {
        onChange(entries.filter(e => e.id !== entryId));
        onRemoveEntry(entryId);
    };

    const handleDeleteHistory = (entry: OverheadEntry, histId: string) => {
        const rec = entry.history.find(h => h.id === histId);
        if (!rec) return;
        const newTotal = entry.total - rec.amount;
        const newHistory = entry.history.filter(h => h.id !== histId);
        if (newTotal <= 0 || newHistory.length === 0) {
            onChange(entries.filter(e => e.id !== entry.id));
            onRemoveEntry(entry.id);
            setHistoryEntryId(null);
        } else {
            onChange(entries.map(e => e.id === entry.id ? { ...e, total: Math.max(0, newTotal), history: newHistory } : e));
        }
        onRemoveHistoryRecord(histId);
    };

    const inputSx = {
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        px: 1.5,
        py: 0.5,
        fontSize: '0.88rem',
        bgcolor: '#fafafa',
        '&:focus-within': { borderColor: ACCENT, bgcolor: '#fff' },
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#1a1a1a', pb: 1 }}>
                {histEntry ? (
                    <>
                        <IconButton size='small' onClick={() => setHistoryEntryId(null)} sx={{ color: ACCENT, mr: 0.5 }}>
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: ACCENT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {histEntry.name}
                        </Typography>
                    </>
                ) : (
                    <>
                        <TuneOutlinedIcon sx={{ fontSize: 22, color: ACCENT, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>Վերադիր ծախսեր</span>
                        <IconButton size='small' onClick={onClose} sx={{ color: '#aaa' }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                    </>
                )}
            </DialogTitle>

            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                {histEntry ? (
                    /* History panel */
                    <Box sx={{ px: 3, pb: 2 }}>
                        {histEntry.history.length === 0 ? (
                            <Typography sx={{ color: '#bbb', textAlign: 'center', py: 4, fontSize: '0.85rem' }}>No history</Typography>
                        ) : [...histEntry.history].reverse().map(rec => (
                            <Box key={rec.id} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid #f5f5f5' }}>
                                <Typography sx={{ flex: 1, fontSize: '0.88rem', fontWeight: 700, color: PRIMARY }}>{fmt(rec.amount)} AMD</Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: '#999', mr: 1.5 }}>{rec.addedAt.toLocaleDateString()}</Typography>
                                <Tooltip title={t('Remove')}>
                                    <IconButton size='small' onClick={() => handleDeleteHistory(histEntry, rec.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.3 }}>
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    /* Main panel */
                    <Box sx={{ px: 2.5, pb: 2 }}>
                        {/* Add row */}
                        {!addOpen ? (
                            <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant='outlined'
                                    startIcon={<AddIcon />}
                                    onClick={() => setAddOpen(true)}
                                    sx={{ borderRadius: '20px', textTransform: 'none', borderColor: ACCENT, color: ACCENT, fontWeight: 600, px: 2.5, '&:hover': { bgcolor: 'rgba(84,110,122,0.06)', borderColor: ACCENT } }}
                                >
                                    {t('Add')}
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', pt: 1.5, pb: 1 }}>
                                <InputBase
                                    value={addName}
                                    onChange={e => setAddName(e.target.value)}
                                    placeholder='Ծախսի անվանումը'
                                    sx={{ ...inputSx, flex: 2, minWidth: 160 }}
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAddOpen(false); setAddName(''); setAddAmount(''); } }}
                                />
                                <InputBase
                                    value={addAmount}
                                    onChange={e => setAddAmount(e.target.value)}
                                    placeholder='AMD'
                                    type='number'
                                    sx={{ ...inputSx, flex: 1, minWidth: 100 }}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                                />
                                <Tooltip title={t('Confirm')}>
                                    <span>
                                        <IconButton size='small' onClick={handleAdd} disabled={!addName.trim() || parse(addAmount) <= 0} sx={{ color: PRIMARY, '&.Mui-disabled': { color: '#e0e0e0' } }}>
                                            <CheckIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title={t('Cancel')}>
                                    <IconButton size='small' onClick={() => { setAddOpen(false); setAddName(''); setAddAmount(''); }} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                        <CloseIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}

                        {/* Entry list */}
                        {entries.length === 0 ? (
                            <Typography sx={{ color: '#bbb', textAlign: 'center', py: 5, fontSize: '0.85rem' }}>
                                Ծախսեր դեռ չեն ավելացվել
                            </Typography>
                        ) : entries.map((e, idx) => (
                            <Box key={e.id} sx={{ borderBottom: '1px solid #f0f0f0', bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', py: 1.2, gap: 1, px: 1 }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: PRIMARY, whiteSpace: 'nowrap' }}>
                                        {fmt(e.total)} AMD
                                    </Typography>
                                    <Tooltip title={t('History')}>
                                        <IconButton size='small' onClick={() => setHistoryEntryId(e.id)} sx={{ color: '#bbb', '&:hover': { color: ACCENT } }}>
                                            <HistoryIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('Add')}>
                                        <IconButton size='small' onClick={() => { setPlusEntryId(plusEntryId === e.id ? null : e.id); setPlusAmount(''); }} sx={{ color: '#bbb', '&:hover': { color: '#4caf50' } }}>
                                            <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('Remove')}>
                                        <IconButton size='small' onClick={() => handleDelete(e.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                {plusEntryId === e.id && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pb: 1.5, pl: 0.5 }}>
                                        <InputBase
                                            value={plusAmount}
                                            onChange={ev => setPlusAmount(ev.target.value)}
                                            placeholder='AMD'
                                            type='number'
                                            sx={{ ...inputSx, width: 130 }}
                                            autoFocus
                                            onKeyDown={ev => { if (ev.key === 'Enter') handlePlus(e.id); if (ev.key === 'Escape') { setPlusEntryId(null); setPlusAmount(''); } }}
                                        />
                                        <Tooltip title={t('Confirm')}>
                                            <span>
                                                <IconButton size='small' onClick={() => handlePlus(e.id)} disabled={parse(plusAmount) <= 0} sx={{ color: PRIMARY, '&.Mui-disabled': { color: '#e0e0e0' } }}>
                                                    <CheckIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <IconButton size='small' onClick={() => { setPlusEntryId(null); setPlusAmount(''); }} sx={{ color: '#bbb' }}>
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
