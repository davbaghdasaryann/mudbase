'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Button, Divider, Typography, IconButton, Tooltip, InputBase, Autocomplete, TextField,
} from '@mui/material';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export interface MechanismLaborRow {
    _id: string;
    laborOfferItemName: string;
    subsectionName?: string;
}

export interface MechanismEntry {
    id: string;
    name: string;
    laborItemId?: string;
    laborName?: string;
    total: number;
    history: { id: string; amount: number; addedAt: Date }[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    laborRows?: MechanismLaborRow[];
    entries: MechanismEntry[];
    onChange: (entries: MechanismEntry[]) => void;
    onHistoryEntry: (e: { id: string; workName: string; amount: number; mechanismEntryId: string; laborItemId?: string; laborName?: string }) => void;
    onRemoveEntry: (entryId: string) => void;
    onRemoveHistoryRecord: (histId: string) => void;
}

const ACCENT = '#795548';
const PRIMARY = '#00A390';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
const parse = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.')) || 0;

export default function MechanismCostsDialog({ open, onClose, laborRows = [], entries, onChange, onHistoryEntry, onRemoveEntry, onRemoveHistoryRecord }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addLabor, setAddLabor] = useState<MechanismLaborRow | null>(null);
    const [addAmount, setAddAmount] = useState('');
    const [plusEntryId, setPlusEntryId] = useState<string | null>(null);
    const [plusAmount, setPlusAmount] = useState('');
    const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);

    const histEntry = historyEntryId ? entries.find(e => e.id === historyEntryId) ?? null : null;
    const grandTotal = entries.reduce((s, e) => s + e.total, 0);

    const resetForm = () => { setAddName(''); setAddLabor(null); setAddAmount(''); setAddOpen(false); };

    const handleAdd = () => {
        const amount = parse(addAmount);
        if (!addName.trim() || amount <= 0) return;
        const entryId = String(Date.now() + Math.random());
        const histId = String(Date.now() + Math.random() + 1);
        const now = new Date();
        onChange([...entries, {
            id: entryId,
            name: addName.trim(),
            laborItemId: addLabor?._id,
            laborName: addLabor?.laborOfferItemName,
            total: amount,
            history: [{ id: histId, amount, addedAt: now }],
        }]);
        onHistoryEntry({ id: histId, workName: addName.trim(), amount, mechanismEntryId: entryId, laborItemId: addLabor?._id, laborName: addLabor?.laborOfferItemName });
        resetForm();
    };

    const handlePlus = (entryId: string) => {
        const amount = parse(plusAmount);
        if (amount <= 0) return;
        const histId = String(Date.now() + Math.random());
        const now = new Date();
        const entry = entries.find(e => e.id === entryId);
        onChange(entries.map(e => e.id === entryId
            ? { ...e, total: e.total + amount, history: [...e.history, { id: histId, amount, addedAt: now }] }
            : e
        ));
        onHistoryEntry({ id: histId, workName: entry?.name ?? '', amount, mechanismEntryId: entryId, laborItemId: entry?.laborItemId, laborName: entry?.laborName });
        setPlusEntryId(null);
        setPlusAmount('');
    };

    const handleDelete = (entryId: string) => {
        onChange(entries.filter(e => e.id !== entryId));
        onRemoveEntry(entryId);
    };

    const handleDeleteHistory = (entry: MechanismEntry, histId: string) => {
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
        py: 0.75,
        fontSize: '0.9rem',
        bgcolor: '#fff',
        '&:focus-within': { borderColor: ACCENT, boxShadow: `0 0 0 2px ${ACCENT}18` },
        transition: 'all 0.15s',
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '82vh', boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}
        >
            <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                {histEntry ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size='small' onClick={() => setHistoryEntryId(null)} sx={{ color: ACCENT, mr: 0.5 }}>
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {histEntry.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.1 }}>
                                Պատմություն · {fmt(histEntry.total)} AMD
                            </Typography>
                        </Box>
                        <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 20, color: ACCENT }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>Մեխանիզմի ծախսագրում</Typography>
                        </Box>
                        <IconButton size='small' onClick={onClose} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                )}
            </DialogTitle>

            <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                {histEntry ? (
                    <Box sx={{ px: 3, py: 2 }}>
                        {histEntry.history.length === 0 ? (
                            <Typography sx={{ color: '#bbb', textAlign: 'center', py: 6, fontSize: '0.88rem' }}>Пататмoтюoн чi кa</Typography>
                        ) : (
                            <Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 40px', gap: 1, px: 1.5, py: 0.75, bgcolor: '#f8f9fa', borderRadius: 1.5, mb: 1 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ամսաթիվ</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Գումար</Typography>
                                    <Box />
                                    <Box />
                                </Box>
                                {[...histEntry.history].reverse().map((rec, idx) => (
                                    <Box key={rec.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 40px', gap: 1, alignItems: 'center', px: 1.5, py: 1, borderRadius: 1.5, bgcolor: idx % 2 !== 0 ? '#fafafa' : '#fff', '&:hover': { bgcolor: '#f0f4f6' }, transition: 'background 0.12s' }}>
                                        <Typography sx={{ fontSize: '0.85rem', color: '#555' }}>
                                            {rec.addedAt.toLocaleDateString('hy-AM', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: PRIMARY, textAlign: 'right' }}>{fmt(rec.amount)} AMD</Typography>
                                        <Box />
                                        <Tooltip title='Ջնջել'>
                                            <IconButton size='small' onClick={() => handleDeleteHistory(histEntry, rec.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.4 }}>
                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1.5, mt: 1, borderTop: '1px solid #f0f0f0' }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#444' }}>
                                        Ընդհանուր:&nbsp;
                                        <Box component='span' sx={{ color: PRIMARY }}>{fmt(histEntry.total)} AMD</Box>
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ px: 3, pb: 3 }}>
                        <Box sx={{ pt: 2, pb: 1.5 }}>
                            {!addOpen ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant='outlined'
                                        size='small'
                                        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => setAddOpen(true)}
                                        sx={{ borderRadius: '20px', textTransform: 'none', borderColor: ACCENT, color: ACCENT, fontWeight: 600, px: 2, fontSize: '0.8rem', boxShadow: 'none', '&:hover': { bgcolor: ACCENT, color: '#fff', borderColor: ACCENT, boxShadow: 'none' } }}
                                    >
                                        Ավելացնել
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ bgcolor: `${ACCENT}08`, border: `1px solid ${ACCENT}22`, borderRadius: 2.5, p: 2 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                                        Нор ծakhS
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                                        <InputBase
                                            value={addName}
                                            onChange={e => setAddName(e.target.value)}
                                            placeholder='Ծախսի անվանումը'
                                            sx={{ ...inputSx, flex: 2 }}
                                            autoFocus
                                            onKeyDown={e => { if (e.key === 'Escape') resetForm(); }}
                                        />
                                        <InputBase
                                            value={addAmount}
                                            onChange={e => setAddAmount(e.target.value)}
                                            placeholder='0'
                                            type='number'
                                            sx={{ ...inputSx, flex: 1 }}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                        <Autocomplete
                                            options={laborRows}
                                            getOptionLabel={o => o.laborOfferItemName}
                                            value={addLabor}
                                            onChange={(_, v) => setAddLabor(v)}
                                            size='small'
                                            sx={{ flex: 1 }}
                                            renderInput={params => (
                                                <TextField
                                                    {...params}
                                                    placeholder='Կapel labor (optional)'
                                                    variant='outlined'
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            fontSize: '0.9rem',
                                                            bgcolor: '#fff',
                                                            '& fieldset': { borderColor: '#e0e0e0' },
                                                            '&:hover fieldset': { borderColor: ACCENT },
                                                            '&.Mui-focused fieldset': { borderColor: ACCENT, boxShadow: `0 0 0 2px ${ACCENT}18` },
                                                        },
                                                        '& .MuiInputBase-input': { py: 0.75 },
                                                    }}
                                                />
                                            )}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props} key={option._id} sx={{ fontSize: '0.85rem', py: '6px !important' }}>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.85rem', color: '#222', lineHeight: 1.3 }}>{option.laborOfferItemName}</Typography>
                                                        {option.subsectionName && (
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', lineHeight: 1.2 }}>{option.subsectionName}</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                            noOptionsText='Չի գtnvel'
                                        />
                                        <Tooltip title='Հաստատել'>
                                            <span>
                                                <IconButton
                                                    onClick={handleAdd}
                                                    disabled={!addName.trim() || parse(addAmount) <= 0}
                                                    sx={{ bgcolor: PRIMARY, color: '#fff', '&:hover': { bgcolor: '#008070' }, '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#bbb' }, borderRadius: 2, p: 0.9 }}
                                                >
                                                    <CheckIcon sx={{ fontSize: 20 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title='Չեղարկել'>
                                            <IconButton onClick={resetForm} sx={{ color: '#aaa', '&:hover': { color: '#e53935' }, borderRadius: 2, p: 0.9 }}>
                                                <CloseIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {entries.length > 0 && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 160px 120px', gap: 1, px: 1.5, py: 0.75, bgcolor: '#f8f9fa', borderRadius: 1.5, mb: 0.5 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>No</Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name / Labor</Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Գումար</Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}></Typography>
                            </Box>
                        )}

                        {entries.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
                                <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 40, color: '#e0e0e0' }} />
                                <Typography sx={{ color: '#bbb', fontSize: '0.88rem' }}>ծախսեր դեռ չեն ավելացվել</Typography>
                            </Box>
                        ) : entries.map((e, idx) => (
                            <Box key={e.id}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 160px 120px', gap: 1, alignItems: 'center', px: 1.5, py: 1.1, borderRadius: 1.5, bgcolor: idx % 2 !== 0 ? '#fafafa' : '#fff', '&:hover': { bgcolor: '#f0f4f6' }, transition: 'background 0.12s' }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#bbb', fontWeight: 600 }}>{idx + 1}</Typography>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</Typography>
                                        {e.laborName && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.1 }}>{e.laborName}</Typography>
                                        )}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: PRIMARY, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {fmt(e.total)} AMD
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                                        <Tooltip title='Պատմություն'>
                                            <IconButton size='small' onClick={() => setHistoryEntryId(e.id)} sx={{ color: '#bbb', '&:hover': { color: ACCENT }, p: 0.5 }}>
                                                <HistoryIcon sx={{ fontSize: 17 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title='Ավելացնել'>
                                            <IconButton size='small' onClick={() => { setPlusEntryId(plusEntryId === e.id ? null : e.id); setPlusAmount(''); }} sx={{ color: '#bbb', '&:hover': { color: '#4caf50' }, p: 0.5 }}>
                                                <AddCircleOutlineIcon sx={{ fontSize: 17 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title='Ջնջել'>
                                            <IconButton size='small' onClick={() => handleDelete(e.id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' }, p: 0.5 }}>
                                                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {plusEntryId === e.id && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', px: 1.5, py: 1, bgcolor: '#f0f7f6', borderRadius: 1.5, mx: 0, mb: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#888', flexShrink: 0 }}>Ավելացել:</Typography>
                                        <InputBase
                                            value={plusAmount}
                                            onChange={ev => setPlusAmount(ev.target.value)}
                                            placeholder='Գումար (AMD)'
                                            type='number'
                                            sx={{ ...inputSx, flex: 1 }}
                                            autoFocus
                                            onKeyDown={ev => { if (ev.key === 'Enter') handlePlus(e.id); if (ev.key === 'Escape') { setPlusEntryId(null); setPlusAmount(''); } }}
                                        />
                                        <Tooltip title='Հաստատել'>
                                            <span>
                                                <IconButton size='small' onClick={() => handlePlus(e.id)} disabled={parse(plusAmount) <= 0} sx={{ color: PRIMARY, '&.Mui-disabled': { color: '#e0e0e0' } }}>
                                                    <CheckIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <IconButton size='small' onClick={() => { setPlusEntryId(null); setPlusAmount(''); }} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        ))}

                        {entries.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1.5, mt: 1, borderTop: '2px solid #f0f0f0' }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#444' }}>
                                    Ընդհանուր:&nbsp;
                                    <Box component='span' sx={{ color: PRIMARY, fontSize: '1rem' }}>{fmt(grandTotal)} AMD</Box>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
