'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Divider, CircularProgress, Tooltip,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

const DAY_W = 38;
const ROW_H = 38;
const NAME_COL_W = 280;
const BAR_COLORS = ['#00ABBE', '#0097a7', '#26c6da', '#00b8cc', '#4db6c4', '#0091a5'];

const MONTH_NAMES_AM = ['Հնվ', 'Փտր', 'Մրտ', 'Ապր', 'Մյս', 'Հնս', 'Հլս', 'Ոգս', 'Սպտ', 'Հկտ', 'Նոյ', 'Դեկ'];

interface ScheduleRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
    projectStartDate?: string;
    createdAt?: string;
}

interface LaborRow {
    _id: string;
    laborOfferItemName: string;
    quantity: number;
    laborHours?: number;
    unitSymbol?: string;
    sectionName?: string;
    subsectionName?: string;
}

interface ScheduleItem {
    _id: string;
    laborOfferItemName: string;
    quantity: number;
    laborHours?: number;
    unitSymbol?: string;
    sectionName?: string;
    subsectionName?: string;
    startDay: number;
}

interface DragState {
    id: string;
    origStart: number;
    currentStart: number;
    mouseStartX: number;
}

interface RowDragState {
    id: string;
    fromIndex: number;
    toIndex: number;
    mouseStartY: number;
    maxIndex: number;
}

function itemDuration(item: ScheduleItem): number {
    const lh = item.laborHours ?? 0;
    const hours = lh > 0 ? (item.quantity ?? 0) / lh : 0;
    return Math.max(1, Math.ceil(hours / 8));
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
}

interface MonthGroup {
    label: string;
    dayCount: number;
}

function buildMonthGroups(startDate: Date, totalDays: number): MonthGroup[] {
    const groups: MonthGroup[] = [];
    let current = new Date(startDate);
    let remaining = totalDays;
    while (remaining > 0) {
        const month = current.getMonth();
        const year = current.getFullYear();
        const label = `${MONTH_NAMES_AM[month]} ${year}`;
        let count = 0;
        while (remaining > 0 && current.getMonth() === month) {
            count++;
            remaining--;
            current = addDays(current, 1);
        }
        groups.push({ label, dayCount: count });
    }
    return groups;
}

export default function SchedulePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [records, setRecords] = useState<ScheduleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ScheduleRecord | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [worksOpen, setWorksOpen] = useState(false);
    const [laborRows, setLaborRows] = useState<LaborRow[]>([]);
    const [laborLoading, setLaborLoading] = useState(false);

    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    // Horizontal bar drag state
    const [dragging, setDragging] = useState<DragState | null>(null);
    const draggingRef = useRef<DragState | null>(null);
    draggingRef.current = dragging;

    // Vertical row reorder drag state
    const [rowDragging, setRowDragging] = useState<RowDragState | null>(null);
    const rowDraggingRef = useRef<RowDragState | null>(null);
    rowDraggingRef.current = rowDragging;
    const scheduleItemsRef = useRef<ScheduleItem[]>([]);
    scheduleItemsRef.current = scheduleItems;

    const dateInputRef = useRef<HTMLInputElement>(null);

    const selectRecord = useCallback((rec: ScheduleRecord | null) => {
        setSelected(rec);
        if (rec) {
            router.replace(`?scheduleId=${rec._id}`);
        } else {
            router.replace('?');
        }
    }, [router]);

    useEffect(() => {
        const scheduleId = searchParams.get('scheduleId');
        Api.requestSession<ScheduleRecord[]>({ command: 'schedule/fetch_all', args: {} })
            .then(data => {
                const list = data ?? [];
                setRecords(list);
                if (scheduleId) {
                    const match = list.find(r => r._id === scheduleId);
                    if (match) setSelected(match);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selected) { setScheduleItems([]); return; }
        setItemsLoading(true);
        Api.requestSession<ScheduleItem[]>({ command: 'schedule/item_fetch_all', args: { scheduleId: selected._id } })
            .then(data => setScheduleItems((data ?? []).map(i => ({ ...i, startDay: i.startDay ?? 1 }))))
            .catch(() => {})
            .finally(() => setItemsLoading(false));
    }, [selected]);

    // Horizontal bar drag
    useEffect(() => {
        if (!dragging) return;
        const onMove = (e: MouseEvent) => {
            const d = draggingRef.current;
            if (!d) return;
            const deltaX = e.clientX - d.mouseStartX;
            const deltaDays = Math.round(deltaX / DAY_W);
            const newStart = Math.max(1, d.origStart + deltaDays);
            if (newStart !== d.currentStart) {
                setDragging(prev => prev ? { ...prev, currentStart: newStart } : null);
            }
        };
        const onUp = async () => {
            const d = draggingRef.current;
            if (!d) return;
            setScheduleItems(prev => prev.map(i => i._id === d.id ? { ...i, startDay: d.currentStart } : i));
            setDragging(null);
            await Api.requestSession({ command: 'schedule/item_update', args: { id: d.id, startDay: d.currentStart } });
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [dragging]);

    // Vertical row reorder drag
    useEffect(() => {
        if (!rowDragging) return;
        document.body.style.cursor = 'grabbing';
        const onMove = (e: MouseEvent) => {
            const d = rowDraggingRef.current;
            if (!d) return;
            const deltaRows = Math.round((e.clientY - d.mouseStartY) / ROW_H);
            const newToIndex = Math.max(0, Math.min(d.maxIndex, d.fromIndex + deltaRows));
            if (newToIndex !== d.toIndex) setRowDragging(prev => prev ? { ...prev, toIndex: newToIndex } : null);
        };
        const onUp = async () => {
            const d = rowDraggingRef.current;
            if (!d) return;
            const arr = [...scheduleItemsRef.current];
            const [item] = arr.splice(d.fromIndex, 1);
            arr.splice(d.toIndex, 0, item);
            setScheduleItems(arr);
            setRowDragging(null);
            document.body.style.cursor = '';
            await Api.requestSession({ command: 'schedule/item_reorder', values: { ids: arr.map(i => i._id) } });
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
        };
    }, [rowDragging]);

    // Live-reorder items during row drag
    const displayedItems = useMemo(() => {
        if (!rowDragging || rowDragging.fromIndex === rowDragging.toIndex) return scheduleItems;
        const arr = [...scheduleItems];
        const [item] = arr.splice(rowDragging.fromIndex, 1);
        arr.splice(rowDragging.toIndex, 0, item);
        return arr;
    }, [scheduleItems, rowDragging]);

    const handleCreate = async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        const created = await Api.requestSession<ScheduleRecord>({
            command: 'schedule/create',
            args: { estimateId: String(estimate._id), estimateName: estimate.name ?? '' },
        });
        if (created) {
            setRecords(prev => [created, ...prev]);
            selectRecord(created);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'schedule/delete', args: { id } });
        setRecords(prev => prev.filter(r => r._id !== id));
    };

    const handleChooseWork = async () => {
        if (!selected) return;
        setWorksOpen(true);
        setLaborLoading(true);
        try {
            const rows = await Api.requestSession<LaborRow[]>({
                command: 'estimate/fetch_labor_for_analysis',
                args: { estimateId: selected.estimateId },
            });
            setLaborRows(rows ?? []);
        } catch {
            setLaborRows([]);
        } finally {
            setLaborLoading(false);
        }
    };

    const handleAddItem = async (row: LaborRow) => {
        if (!selected || addingId === row._id) return;
        setAddingId(row._id);
        try {
            const startDay = scheduleItems.reduce((max, item) => {
                return Math.max(max, item.startDay + itemDuration(item));
            }, 1);
            const created = await Api.requestSession<ScheduleItem>({
                command: 'schedule/item_add',
                args: {
                    scheduleId: selected._id,
                    laborOfferItemName: row.laborOfferItemName,
                    quantity: row.quantity,
                    laborHours: row.laborHours ?? 0,
                    unitSymbol: row.unitSymbol ?? '',
                    sectionName: row.sectionName ?? '',
                    subsectionName: row.subsectionName ?? '',
                    startDay,
                },
            });
            if (created) setScheduleItems(prev => [...prev, { ...created, startDay: created.startDay ?? startDay }]);
        } finally {
            setAddingId(null);
        }
    };

    const handleDeleteItem = async (id: string) => {
        await Api.requestSession({ command: 'schedule/item_delete', args: { id } });
        setScheduleItems(prev => prev.filter(i => i._id !== id));
    };

    const handleBarMouseDown = (e: React.MouseEvent, item: ScheduleItem) => {
        if (rowDragging) return;
        e.preventDefault();
        setDragging({ id: item._id, origStart: item.startDay, currentStart: item.startDay, mouseStartX: e.clientX });
    };

    const handleRowDragStart = (e: React.MouseEvent, item: ScheduleItem, index: number) => {
        if (dragging) return;
        e.preventDefault();
        setRowDragging({ id: item._id, fromIndex: index, toIndex: index, mouseStartY: e.clientY, maxIndex: scheduleItems.length - 1 });
    };

    const handleStartDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selected) return;
        const newDate = e.target.value;
        setSelected(prev => prev ? { ...prev, projectStartDate: newDate } : null);
        setRecords(prev => prev.map(r => r._id === selected._id ? { ...r, projectStartDate: newDate } : r));
        await Api.requestSession({ command: 'schedule/update_start_date', args: { id: selected._id, projectStartDate: newDate } });
    };

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    if (!selected) {
        return (
            <PageContents title='Schedule' sx={{ pb: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                    </Box>
                ) : records.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                        <CalendarMonthIcon sx={{ fontSize: 90, color: mainPrimaryColor, opacity: 0.25 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                            {t('No schedules created yet')}
                        </Typography>
                        <PageButton
                            variant='outlined'
                            label='Create'
                            size='large'
                            sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor } }}
                            onClick={() => setDialogOpen(true)}
                        />
                    </Box>
                ) : (
                    <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0, mb: 3 }}>
                        <PageButton variant='outlined' label='Create' size='large' sx={{ borderRadius: '25px', height: '40px', '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor } }} onClick={() => setDialogOpen(true)} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {records.map(rec => (
                            <Box
                                key={rec._id}
                                onClick={() => selectRecord(rec)}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    px: 2.5, py: 1.8, borderRadius: 2,
                                    border: '1px solid #e0f5f7', backgroundColor: '#fafeff',
                                    cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                                    '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CalendarMonthIcon sx={{ color: mainPrimaryColor, opacity: 0.7, fontSize: 22 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>{rec.estimateName}</Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                            {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton size='small' onClick={e => handleDelete(rec._id, e)} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                    <DeleteOutlineIcon fontSize='small' />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                    </>
                )}
                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleCreate} />
            </PageContents>
        );
    }

    // ── DETAIL VIEW ───────────────────────────────────────────────────────────
    const projectStartDate = selected.projectStartDate
        ? new Date(selected.projectStartDate)
        : new Date(new Date().toDateString());

    const totalDays = Math.max(scheduleItems.reduce((max, item) => {
        const start = dragging?.id === item._id ? dragging.currentStart : (item.startDay ?? 1);
        return Math.max(max, start + itemDuration(item) - 1);
    }, 20), 20);

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const monthGroups = buildMonthGroups(projectStartDate, totalDays);

    const dateInputValue = toDateInputValue(projectStartDate);

    return (
        <PageContents title='Schedule' sx={{ pb: 1 }}>
            {/* Back + header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <IconButton size='small' onClick={() => selectRecord(null)} sx={{ color: mainPrimaryColor }}>
                    <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{selected.estimateName}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t('Start')}:</Typography>
                        <Box
                            onClick={() => dateInputRef.current?.showPicker?.()}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { '& .edit-icon': { opacity: 1 } } }}
                        >
                            <Typography sx={{ fontSize: '0.72rem', color: mainPrimaryColor, fontWeight: 600 }}>
                                {projectStartDate.toLocaleDateString()}
                            </Typography>
                            <EditCalendarIcon className='edit-icon' sx={{ fontSize: 13, color: mainPrimaryColor, opacity: 0.4, transition: 'opacity 0.15s' }} />
                        </Box>
                        <input
                            ref={dateInputRef}
                            type='date'
                            value={dateInputValue}
                            onChange={handleStartDateChange}
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                        />
                    </Box>
                </Box>
                <Button
                    variant='outlined'
                    size='medium'
                    startIcon={<WorkOutlineIcon sx={{ fontSize: 18 }} />}
                    onClick={handleChooseWork}
                    sx={{
                        borderRadius: '25px', height: '38px', textTransform: 'none', flexShrink: 0,
                        borderColor: mainPrimaryColor, color: mainPrimaryColor,
                        '&:hover': { bgcolor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                    }}
                >
                    {t('Choose a work')}
                </Button>
            </Box>

            {/* Gantt table */}
            {itemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
                </Box>
            ) : scheduleItems.length > 0 && (
                <Box sx={{
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(0,171,190,0.18)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    userSelect: 'none',
                }}>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box sx={{ display: 'inline-flex', flexDirection: 'column', minWidth: NAME_COL_W + totalDays * DAY_W }}>

                            {/* Month header row */}
                            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: 'rgba(255,255,255,0.97)', borderBottom: `1px solid ${mainPrimaryColor}18` }}>
                                <Box sx={{ width: NAME_COL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 4, background: 'rgba(255,255,255,0.97)', borderRight: `1px solid ${mainPrimaryColor}22` }} />
                                {monthGroups.map((group, gi) => (
                                    <Box key={gi} sx={{ width: group.dayCount * DAY_W, flexShrink: 0, px: 1, py: 0.6, borderRight: `1px solid ${mainPrimaryColor}22`, background: gi % 2 === 0 ? 'rgba(0,171,190,0.04)' : 'transparent' }}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: mainPrimaryColor, letterSpacing: '0.05em' }}>
                                            {group.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Day number header row */}
                            <Box sx={{ display: 'flex', position: 'sticky', top: 28, zIndex: 3, background: 'rgba(255,255,255,0.95)', borderBottom: `2px solid ${mainPrimaryColor}22` }}>
                                <Box sx={{ width: NAME_COL_W, flexShrink: 0, px: 2, py: 0.8, position: 'sticky', left: 0, zIndex: 4, background: 'rgba(255,255,255,0.97)', borderRight: `1px solid ${mainPrimaryColor}22` }}>
                                    <Typography variant='caption' sx={{ color: mainPrimaryColor, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {t('Task')}
                                    </Typography>
                                </Box>
                                {days.map(d => {
                                    const date = addDays(projectStartDate, d - 1);
                                    const dayNum = date.getDate();
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    const show = dayNum === 1 || d === 1 || dayNum % 5 === 0;
                                    return (
                                        <Box key={d} sx={{
                                            width: DAY_W, flexShrink: 0, textAlign: 'center', py: 0.8,
                                            borderRight: dayNum === 1 ? `1px solid ${mainPrimaryColor}44` : dayNum % 5 === 0 ? `1px solid ${mainPrimaryColor}22` : `1px solid rgba(0,0,0,0.04)`,
                                            color: isWeekend ? '#94a3b8' : dayNum % 5 === 0 || dayNum === 1 ? mainPrimaryColor : '#bbb',
                                            fontSize: '0.63rem',
                                            fontWeight: dayNum === 1 || dayNum % 5 === 0 ? 700 : 400,
                                            bgcolor: isWeekend ? 'rgba(148,163,184,0.07)' : 'transparent',
                                        }}>
                                            {show ? dayNum : ''}
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Item rows */}
                            {displayedItems.map((item, ri) => {
                                const isDraggingThis = dragging?.id === item._id;
                                const isRowDraggingThis = rowDragging?.id === item._id;
                                const startDay = isDraggingThis ? dragging!.currentStart : (item.startDay ?? 1);
                                const duration = itemDuration(item);
                                const barColor = BAR_COLORS[ri % BAR_COLORS.length];
                                const startOffset = (startDay - 1) * DAY_W;
                                const barWidth = duration * DAY_W - 3;
                                const rowBg = isRowDraggingThis
                                    ? `rgba(0,171,190,0.06)`
                                    : ri % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(248,253,254,0.9)';
                                const startDate = addDays(projectStartDate, startDay - 1);
                                const endDate = addDays(projectStartDate, startDay + duration - 2);
                                const tooltipLabel = `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`;
                                return (
                                    <Box
                                        key={item._id}
                                        sx={{
                                            display: 'flex', height: ROW_H, alignItems: 'center',
                                            background: rowBg,
                                            borderBottom: `1px solid ${mainPrimaryColor}08`,
                                            opacity: isRowDraggingThis ? 0.55 : 1,
                                            transition: isRowDraggingThis ? 'none' : 'opacity 0.1s',
                                            '& .gantt-row-delete': { opacity: 0 },
                                            '&:hover .gantt-row-delete': { opacity: 1 },
                                            '&:hover': { background: isRowDraggingThis ? rowBg : `rgba(0,171,190,0.04)` },
                                        }}
                                    >
                                        {/* Sticky name column */}
                                        <Box sx={{
                                            width: NAME_COL_W, flexShrink: 0,
                                            position: 'sticky', left: 0, zIndex: 2,
                                            background: rowBg, height: '100%',
                                            display: 'flex', alignItems: 'center',
                                            borderRight: `1px solid ${mainPrimaryColor}18`,
                                            overflow: 'hidden',
                                            pl: 0.5, pr: 0.5,
                                        }}>
                                            {/* Drag handle */}
                                            <Box
                                                onMouseDown={e => handleRowDragStart(e, item, ri)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', flexShrink: 0,
                                                    color: '#ccc', cursor: 'grab', px: 0.25,
                                                    '&:hover': { color: '#aaa' },
                                                    ...(isRowDraggingThis ? { cursor: 'grabbing', color: mainPrimaryColor } : {}),
                                                }}
                                            >
                                                <DragIndicatorIcon sx={{ fontSize: 16 }} />
                                            </Box>
                                            {/* Name */}
                                            <Typography variant='caption' sx={{
                                                color: '#444', fontSize: '0.75rem',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                flex: 1, mx: 0.75,
                                            }}>
                                                {item.laborOfferItemName || '—'}
                                            </Typography>
                                            {/* Delete — hover-revealed */}
                                            <IconButton
                                                className='gantt-row-delete'
                                                size='small'
                                                onClick={() => handleDeleteItem(item._id)}
                                                sx={{
                                                    flexShrink: 0, color: '#ccc',
                                                    transition: 'opacity 0.15s, color 0.15s',
                                                    '&:hover': { color: '#e53935' },
                                                    p: '3px',
                                                }}
                                            >
                                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Box>

                                        {/* Bar area */}
                                        <Box sx={{ position: 'relative', flex: 1, height: '100%' }}>
                                            {days.map(d => {
                                                const date = addDays(projectStartDate, d - 1);
                                                const dayNum = date.getDate();
                                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                return (
                                                    <Box key={d} sx={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, bottom: 0, width: isWeekend ? DAY_W : 1, background: dayNum === 1 ? `${mainPrimaryColor}30` : isWeekend ? 'rgba(148,163,184,0.08)' : dayNum % 5 === 0 ? `${mainPrimaryColor}15` : 'rgba(0,0,0,0.025)', zIndex: 0 }} />
                                                );
                                            })}
                                            <Tooltip title={tooltipLabel} placement='top' arrow>
                                                <Box
                                                    onMouseDown={e => handleBarMouseDown(e, item)}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: startOffset + 2,
                                                        top: 6, height: ROW_H - 12,
                                                        width: barWidth,
                                                        background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                                        borderRadius: '5px',
                                                        display: 'flex', alignItems: 'center',
                                                        px: 1, overflow: 'hidden',
                                                        boxShadow: isDraggingThis ? `0 4px 16px ${barColor}88` : `0 2px 8px ${barColor}55`,
                                                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                                                        opacity: isDraggingThis ? 0.9 : 1,
                                                        transition: isDraggingThis ? 'none' : 'box-shadow 0.15s',
                                                        zIndex: isDraggingThis ? 10 : 1,
                                                    }}
                                                >
                                                    <Typography sx={{ color: '#fff', fontSize: '0.63rem', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                                        {duration}{t('day_short')}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Works modal */}
            <Dialog open={worksOpen} onClose={() => setWorksOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${mainPrimaryColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <WorkOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Choose a work')}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.1 }}>{selected.estimateName}</Typography>
                        </Box>
                        <IconButton size='small' onClick={() => setWorksOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

                <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
                    {laborLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                        </Box>
                    ) : laborRows.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <Typography variant='body2' color='text.secondary'>{t('No works found')}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {laborRows.map((row, index) => (
                                <Box
                                    key={row._id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.2,
                                        bgcolor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                                        borderRadius: 1.5,
                                        border: '1px solid transparent',
                                        '&:hover': { bgcolor: `${mainPrimaryColor}0d`, border: `1px solid ${mainPrimaryColor}33` },
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600, minWidth: 24 }}>{index + 1}</Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row.laborOfferItemName}
                                        </Typography>
                                        {(row.sectionName || row.subsectionName) && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {[row.sectionName, row.subsectionName].filter(Boolean).join(' › ')}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                                        {row.laborHours != null && row.laborHours > 0 && (
                                            <>
                                                <Tooltip title={t('Labor Time')} placement='top' arrow>
                                                    <Typography sx={{ fontSize: '0.82rem', color: '#555', cursor: 'default' }}>
                                                        {(row.quantity / row.laborHours).toFixed(2)}
                                                    </Typography>
                                                </Tooltip>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#bbb' }}>/</Typography>
                                            </>
                                        )}
                                        <Tooltip title={t('Quantity')} placement='top' arrow>
                                            <Typography sx={{ fontSize: '0.82rem', color: '#555', cursor: 'default' }}>
                                                {row.quantity} {row.unitSymbol}
                                            </Typography>
                                        </Tooltip>
                                    </Box>
                                    <IconButton
                                        size='small'
                                        onClick={() => handleAddItem(row)}
                                        disabled={addingId === row._id}
                                        sx={{ color: mainPrimaryColor, '&:hover': { bgcolor: `${mainPrimaryColor}15` } }}
                                    >
                                        {addingId === row._id
                                            ? <CircularProgress size={16} sx={{ color: mainPrimaryColor }} />
                                            : <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                        }
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setWorksOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
