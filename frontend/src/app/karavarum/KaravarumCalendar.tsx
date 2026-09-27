'use client';

import React, { useState } from 'react';
import {
    Box, Typography, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Button, CircularProgress, MenuItem, Select,
    FormControl, InputLabel, Chip,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import * as Api from '@/api';

const ACCENT = '#00A390';
const DAY_NAMES = ['Կիր', 'Երկ', 'Եր', 'Չոր', 'Հին', 'Ուր', 'Շաբ'];
const MONTH_NAMES = [
    'Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս',
    'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր',
];
const TASK_COLORS = [
    '#00A390', '#4A90D9', '#E67E22', '#9B59B6', '#E74C3C',
    '#27AE60', '#F39C12', '#1ABC9C', '#2C3E50', '#8E44AD',
];

export interface KaravarumTask {
    _id: string;
    projectId?: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    color?: string;
    status?: 'pending' | 'in_progress' | 'done';
}

interface Props {
    tasks: KaravarumTask[];
    loading: boolean;
    onRefresh: () => void;
}

function isoDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

function taskSpansDay(task: KaravarumTask, dayKey: string): boolean {
    const start = task.startDate.slice(0, 10);
    const end = task.endDate ? task.endDate.slice(0, 10) : start;
    return dayKey >= start && dayKey <= end;
}

export default function KaravarumCalendar({ tasks, loading, onRefresh }: Props) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const [detailTask, setDetailTask] = useState<KaravarumTask | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editTask, setEditTask] = useState<KaravarumTask | null>(null);
    const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', color: TASK_COLORS[0], status: 'pending' as string });
    const [saving, setSaving] = useState(false);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < totalCells; i++) {
        const d = i - startOffset + 1;
        cells.push(d < 1 || d > lastDay.getDate() ? null : new Date(year, month, d));
    }

    function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
    function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

    function openEdit(task: KaravarumTask) {
        setDetailTask(null);
        setEditTask(task);
        setForm({
            title: task.title,
            description: task.description ?? '',
            startDate: task.startDate.slice(0, 10),
            endDate: task.endDate ? task.endDate.slice(0, 10) : '',
            color: task.color ?? TASK_COLORS[0],
            status: task.status ?? 'pending',
        });
        setEditOpen(true);
    }

    async function saveEdit() {
        if (!editTask || !form.title.trim()) return;
        setSaving(true);
        try {
            await Api.requestSession({
                command: 'karavarum/task_update',
                json: { id: editTask._id, title: form.title, description: form.description, startDate: form.startDate, endDate: form.endDate || null, color: form.color, status: form.status },
            });
            setEditOpen(false);
            onRefresh();
        } finally { setSaving(false); }
    }

    async function deleteTask(id: string) {
        await Api.requestSession({ command: 'karavarum/task_delete', args: { id } });
        setDetailTask(null);
        setEditOpen(false);
        onRefresh();
    }

    async function toggleStatus(task: KaravarumTask) {
        const next = task.status === 'done' ? 'pending' : 'done';
        await Api.requestSession({ command: 'karavarum/task_update', json: { id: task._id, status: next } });
        onRefresh();
    }

    const todayKey = isoDate(today);

    return (
        <Box sx={{ pt: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton onClick={prevMonth} size='small'><ChevronLeftIcon /></IconButton>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', minWidth: 180, textAlign: 'center' }}>
                    {MONTH_NAMES[month]} {year}
                </Typography>
                <IconButton onClick={nextMonth} size='small'><ChevronRightIcon /></IconButton>
                <Button size='small' startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
                    onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
                    sx={{ ml: 1, textTransform: 'none', color: ACCENT, fontWeight: 500, fontSize: '0.82rem' }}>
                    Այսօր
                </Button>
                <Box sx={{ flex: 1 }} />
                {loading && <CircularProgress size={16} sx={{ color: ACCENT }} />}
            </Box>

            {/* Day names */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
                {DAY_NAMES.map(d => (
                    <Box key={d} sx={{ textAlign: 'center', py: 0.75 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {cells.map((day, idx) => {
                    if (!day) return (
                        <Box key={idx} sx={{ minHeight: 110, bgcolor: '#fafafa', borderRight: idx % 7 !== 6 ? '1px solid rgba(0,0,0,0.06)' : 'none', borderBottom: idx < cells.length - 7 ? '1px solid rgba(0,0,0,0.06)' : 'none' }} />
                    );
                    const key = isoDate(day);
                    const isToday = key === todayKey;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const dayTasks = tasks.filter(t => taskSpansDay(t, key));

                    return (
                        <Box key={idx} sx={{
                            minHeight: 110, p: 0.75,
                            bgcolor: isToday ? 'rgba(0,163,144,0.04)' : isWeekend ? 'rgba(0,0,0,0.015)' : '#fff',
                            borderRight: idx % 7 !== 6 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                            borderBottom: idx < cells.length - 7 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                        }}>
                            <Box sx={{ mb: 0.5 }}>
                                <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isToday ? ACCENT : 'transparent' }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : isWeekend ? '#aaa' : '#333', lineHeight: 1 }}>
                                        {day.getDate()}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                {dayTasks.slice(0, 3).map(task => (
                                    <Box key={task._id} onClick={() => setDetailTask(task)} sx={{
                                        px: 0.75, py: 0.25, borderRadius: 1,
                                        bgcolor: task.color ? `${task.color}22` : 'rgba(0,163,144,0.12)',
                                        borderLeft: `3px solid ${task.color ?? ACCENT}`,
                                        cursor: 'pointer', transition: 'filter 0.15s',
                                        '&:hover': { filter: 'brightness(0.93)' },
                                        opacity: task.status === 'done' ? 0.5 : 1,
                                    }}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                                            {task.title}
                                        </Typography>
                                    </Box>
                                ))}
                                {dayTasks.length > 3 && (
                                    <Typography sx={{ fontSize: '0.65rem', color: '#aaa', pl: 0.5 }}>+{dayTasks.length - 3} ևս</Typography>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Detail dialog */}
            <Dialog open={!!detailTask} onClose={() => setDetailTask(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {detailTask && <>
                    <DialogTitle sx={{ pb: 1, pr: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: detailTask.color ?? ACCENT, flexShrink: 0 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{detailTask.title}</Typography>
                        </Box>
                        <IconButton onClick={() => setDetailTask(null)} size='small' sx={{ position: 'absolute', top: 12, right: 12, color: '#aaa' }}><CloseIcon fontSize='small' /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 0 }}>
                        {detailTask.description && <Typography sx={{ fontSize: '0.85rem', color: '#666', mb: 1.5 }}>{detailTask.description}</Typography>}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip size='small' label={new Date(detailTask.startDate).toLocaleDateString('hy-AM', { day: 'numeric', month: 'short' })} sx={{ fontSize: '0.72rem', bgcolor: 'rgba(0,163,144,0.08)', color: ACCENT }} />
                            {detailTask.endDate && <Chip size='small' label={`→ ${new Date(detailTask.endDate).toLocaleDateString('hy-AM', { day: 'numeric', month: 'short' })}`} sx={{ fontSize: '0.72rem', bgcolor: 'rgba(0,0,0,0.05)', color: '#555' }} />}
                            <Chip size='small'
                                label={detailTask.status === 'done' ? 'Կատ.' : detailTask.status === 'in_progress' ? 'Ընթ.' : 'Սպաս.'}
                                sx={{ fontSize: '0.72rem', bgcolor: detailTask.status === 'done' ? 'rgba(39,174,96,0.1)' : detailTask.status === 'in_progress' ? 'rgba(74,144,217,0.1)' : 'rgba(0,0,0,0.05)', color: detailTask.status === 'done' ? '#27AE60' : detailTask.status === 'in_progress' ? '#4A90D9' : '#888' }} />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 2, pb: 2, gap: 0.5 }}>
                        <IconButton size='small' onClick={() => toggleStatus(detailTask)} sx={{ color: detailTask.status === 'done' ? '#27AE60' : '#bbb' }}>
                            {detailTask.status === 'done' ? <CheckCircleOutlineIcon fontSize='small' /> : <RadioButtonUncheckedIcon fontSize='small' />}
                        </IconButton>
                        <Box sx={{ flex: 1 }} />
                        <IconButton size='small' onClick={() => deleteTask(detailTask._id)} sx={{ color: '#e74c3c' }}><DeleteOutlineIcon fontSize='small' /></IconButton>
                        <Button size='small' startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => openEdit(detailTask)} sx={{ textTransform: 'none', color: ACCENT, fontWeight: 500, fontSize: '0.82rem' }}>Խմբ.</Button>
                    </DialogActions>
                </>}
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>Խմբագրել առաջադրանք</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                    <TextField label='Անվ.' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} size='small' fullWidth autoFocus sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <TextField label='Նկ.' value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} size='small' fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <TextField label='Սկ.' type='date' value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} size='small' fullWidth InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <TextField label='Ավ. (ըnտ.)' type='date' value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} size='small' fullWidth InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT }, '& .MuiInputLabel-root.Mui-focused': { color: ACCENT } }} />
                    <FormControl size='small' fullWidth>
                        <InputLabel sx={{ '&.Mui-focused': { color: ACCENT } }}>Կարգ.</InputLabel>
                        <Select value={form.status} label='Կարգ.' onChange={e => setForm(f => ({ ...f, status: e.target.value }))} sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT } }}>
                            <MenuItem value='pending'>Սպասում</MenuItem>
                            <MenuItem value='in_progress'>Ընթացքի մեջ</MenuItem>
                            <MenuItem value='done'>Կատarված</MenuItem>
                        </Select>
                    </FormControl>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.75 }}>Գույն</Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {TASK_COLORS.map(c => (
                                <Box key={c} onClick={() => setForm(f => ({ ...f, color: c }))} sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: 2, transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.2)' } }} />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
                    {editTask && <IconButton size='small' onClick={() => deleteTask(editTask._id)} sx={{ color: '#e74c3c', mr: 'auto' }}><DeleteOutlineIcon fontSize='small' /></IconButton>}
                    <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', color: '#888' }}>Չ.</Button>
                    <Button onClick={saveEdit} disabled={!form.title.trim() || saving} variant='contained' sx={{ textTransform: 'none', bgcolor: ACCENT, fontWeight: 600, '&:hover': { bgcolor: '#009070' }, borderRadius: 2, px: 2.5 }}>
                        {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Պահ.'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
