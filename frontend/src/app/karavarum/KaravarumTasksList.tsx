'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, IconButton, CircularProgress, MenuItem,
    Select, FormControl, InputLabel, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import * as Api from '@/api';
import { KaravarumTask } from './KaravarumCalendar';

const ACCENT = '#00A390';
const TASK_COLORS = ['#00A390', '#4A90D9', '#E67E22', '#9B59B6', '#E74C3C', '#27AE60', '#F39C12', '#1ABC9C', '#2C3E50', '#8E44AD'];

interface Props {
    projectId: string;
    tasks: KaravarumTask[];
    loading: boolean;
    onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = { pending: 'Սpasum', in_progress: 'Yntʿatsqi mej', done: 'Katarvaд' };
const STATUS_COLORS: Record<string, string> = { pending: '#888', in_progress: '#4A90D9', done: '#27AE60' };
const STATUS_BG: Record<string, string> = { pending: 'rgba(0,0,0,0.05)', in_progress: 'rgba(74,144,217,0.1)', done: 'rgba(39,174,96,0.1)' };

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('hy-AM', { day: 'numeric', month: 'short' });
}

export default function KaravarumTasksList({ projectId, tasks, loading, onRefresh }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTask, setEditTask] = useState<KaravarumTask | null>(null);
    const [form, setForm] = useState({ title: '', description: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', color: TASK_COLORS[0], status: 'pending' });
    const [saving, setSaving] = useState(false);

    function openCreate() {
        setEditTask(null);
        setForm({ title: '', description: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', color: TASK_COLORS[0], status: 'pending' });
        setDialogOpen(true);
    }

    function openEdit(task: KaravarumTask) {
        setEditTask(task);
        setForm({ title: task.title, description: task.description ?? '', startDate: task.startDate.slice(0, 10), endDate: task.endDate ? task.endDate.slice(0, 10) : '', color: task.color ?? TASK_COLORS[0], status: task.status ?? 'pending' });
        setDialogOpen(true);
    }

    async function save() {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            if (editTask) {
                await Api.requestSession({ command: 'karavarum/task_update', json: { id: editTask._id, title: form.title, description: form.description, startDate: form.startDate, endDate: form.endDate || null, color: form.color, status: form.status } });
            } else {
                await Api.requestSession({ command: 'karavarum/task_create', json: { title: form.title, description: form.description, startDate: form.startDate, endDate: form.endDate || null, color: form.color, status: form.status, projectId } });
            }
            setDialogOpen(false);
            onRefresh();
        } finally { setSaving(false); }
    }

    async function remove(id: string) {
        await Api.requestSession({ command: 'karavarum/task_delete', args: { id } });
        onRefresh();
    }

    async function toggleStatus(task: KaravarumTask) {
        const next = task.status === 'done' ? 'pending' : 'done';
        await Api.requestSession({ command: 'karavarum/task_update', json: { id: task._id, status: next } });
        onRefresh();
    }

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: ACCENT }} /></Box>;

    return (
        <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant='outlined' startIcon={<AddIcon />} onClick={openCreate}
                    sx={{ borderRadius: '22px', textTransform: 'none', borderColor: ACCENT, color: ACCENT, fontWeight: 600, px: 2.5, '&:hover': { bgcolor: ACCENT, color: '#fff', borderColor: ACCENT } }}>
                    Ававелацнел аrajаdrаnq
                </Button>
            </Box>

            {tasks.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1.5 }}>
                    <AssignmentOutlinedIcon sx={{ fontSize: 52, color: '#e0e0e0' }} />
                    <Typography sx={{ color: '#bbb', fontSize: '0.9rem' }}>Առաջadranqner չkаn</Typography>
                    <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate}
                        sx={{ mt: 1, borderRadius: '22px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}>
                        Ававелацнел аrajаdrаnq
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {tasks.map(task => (
                        <Box key={task._id} sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.4,
                            border: '1px solid rgba(0,0,0,0.07)', borderRadius: 2, bgcolor: '#fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            transition: 'box-shadow 0.15s',
                            '&:hover': { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
                            borderLeft: `3px solid ${task.color ?? ACCENT}`,
                            opacity: task.status === 'done' ? 0.65 : 1,
                        }}>
                            {/* status toggle */}
                            <IconButton size='small' onClick={() => toggleStatus(task)} sx={{ color: task.status === 'done' ? '#27AE60' : '#ccc', p: 0.25, flexShrink: 0 }}>
                                {task.status === 'done' ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />}
                            </IconButton>

                            {/* content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a', textDecoration: task.status === 'done' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {task.title}
                                </Typography>
                                {task.description && (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</Typography>
                                )}
                            </Box>

                            {/* dates */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                <Chip size='small' label={fmtDate(task.startDate)} sx={{ fontSize: '0.7rem', bgcolor: 'rgba(0,163,144,0.07)', color: ACCENT, height: 22 }} />
                                {task.endDate && <Chip size='small' label={`→ ${fmtDate(task.endDate)}`} sx={{ fontSize: '0.7rem', bgcolor: 'rgba(0,0,0,0.04)', color: '#777', height: 22 }} />}
                            </Box>

                            {/* status chip */}
                            <Chip size='small'
                                label={task.status === 'done' ? 'Կատ.' : task.status === 'in_progress' ? 'Ընթ.' : 'Սpас.'}
                                sx={{ fontSize: '0.7rem', bgcolor: STATUS_BG[task.status ?? 'pending'], color: STATUS_COLORS[task.status ?? 'pending'], height: 22, flexShrink: 0 }} />

                            {/* actions */}
                            <IconButton size='small' onClick={() => openEdit(task)} sx={{ color: '#bbb', '&:hover': { color: ACCENT }, flexShrink: 0 }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                            <IconButton size='small' onClick={() => remove(task._id)} sx={{ color: '#bbb', '&:hover': { color: '#e74c3c' }, flexShrink: 0 }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Create / Edit dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{editTask ? 'Խmbagrел' : 'Nоr аrаjаdrаnq'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                    <TextField label='Аnvаnuм' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} size='small' fullWidth autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); }} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <TextField label='Nkаrаgrуtyun' value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} size='small' fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <TextField label='Sks. аmѕаtyv' type='date' value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} size='small' fullWidth InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <TextField label='Аvаrti аmѕ. (yntɾ.)' type='date' value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} size='small' fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: form.startDate }} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <FormControl size='small' fullWidth>
                        <InputLabel sx={{ '&.Mui-focused': { color: ACCENT } }}>Каrg.</InputLabel>
                        <Select value={form.status} label='Каrg.' onChange={e => setForm(f => ({ ...f, status: e.target.value }))} sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT } }}>
                            <MenuItem value='pending'>Spasум</MenuItem>
                            <MenuItem value='in_progress'>Yntʿatsqi mej</MenuItem>
                            <MenuItem value='done'>Katarvaд</MenuItem>
                        </Select>
                    </FormControl>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.75 }}>Guyn</Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {TASK_COLORS.map(c => (
                                <Box key={c} onClick={() => setForm(f => ({ ...f, color: c }))} sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: 2, transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.2)' } }} />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#888' }}>Chgл.</Button>
                    <Button onClick={save} disabled={!form.title.trim() || saving} variant='contained' sx={{ textTransform: 'none', bgcolor: ACCENT, fontWeight: 600, '&:hover': { bgcolor: '#009070' }, borderRadius: 2, px: 2.5 }}>
                        {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : editTask ? 'Pahel' : 'Stvarel'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
