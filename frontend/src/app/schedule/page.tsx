'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
const DELETE_COL_W = 40;
const BAR_COLORS = ['#00ABBE', '#0096a8', '#00c4d4', '#007f8c', '#00d4e8', '#006a78'];

interface ScheduleRecord {
    _id: string;
    estimateId: string;
    estimateName: string;
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

function itemDuration(item: ScheduleItem): number {
    const lh = item.laborHours ?? 0;
    const hours = lh > 0 ? (item.quantity ?? 0) / lh : 0;
    return Math.max(1, Math.ceil(hours / 8));
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

    const [dragging, setDragging] = useState<DragState | null>(null);
    const draggingRef = useRef<DragState | null>(null);
    draggingRef.current = dragging;

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

    // Global drag handlers
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
            // Calculate startDay: after the last existing item
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
        e.preventDefault();
        setDragging({ id: item._id, origStart: item.startDay, currentStart: item.startDay, mouseStartX: e.clientX });
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
    const totalDays = scheduleItems.reduce((max, item) => {
        const start = dragging?.id === item._id ? dragging.currentStart : (item.startDay ?? 1);
        return Math.max(max, start + itemDuration(item) - 1);
    }, 20);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
        <PageContents title='Schedule' sx={{ pb: 1 }}>
            {/* Back + header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                <IconButton size='small' onClick={() => selectRecord(null)} sx={{ color: mainPrimaryColor, mt: 0.3 }}>
                    <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{selected.estimateName}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                        {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : ''}
                    </Typography>
                    <Button
                        variant='outlined'
                        size='large'
                        onClick={handleChooseWork}
                        sx={{
                            borderRadius: '25px', height: '40px', mt: 1.5, textTransform: 'none',
                            borderColor: mainPrimaryColor, color: mainPrimaryColor,
                            '&:hover': { bgcolor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                        }}
                    >
                        {t('Choose a work')}
                    </Button>
                </Box>
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
                        <Box sx={{ display: 'inline-flex', flexDirection: 'column', minWidth: NAME_COL_W + totalDays * DAY_W + DELETE_COL_W }}>

                            {/* Day header */}
                            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: 'rgba(255,255,255,0.95)', borderBottom: `2px solid ${mainPrimaryColor}22` }}>
                                <Box sx={{ width: NAME_COL_W, flexShrink: 0, px: 2, py: 1, position: 'sticky', left: 0, zIndex: 4, background: 'rgba(255,255,255,0.97)', borderRight: `1px solid ${mainPrimaryColor}22` }}>
                                    <Typography variant='caption' sx={{ color: mainPrimaryColor, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {t('Task')}
                                    </Typography>
                                </Box>
                                {days.map(d => (
                                    <Box key={d} sx={{ width: DAY_W, flexShrink: 0, textAlign: 'center', py: 1, borderRight: d % 5 === 0 ? `1px solid ${mainPrimaryColor}33` : `1px solid rgba(0,0,0,0.04)`, color: d % 5 === 0 ? mainPrimaryColor : '#bbb', fontSize: '0.63rem', fontWeight: d % 5 === 0 ? 700 : 400 }}>
                                        {d % 5 === 0 || d === 1 ? d : ''}
                                    </Box>
                                ))}
                                <Box sx={{ width: DELETE_COL_W, flexShrink: 0 }} />
                            </Box>

                            {/* Item rows */}
                            {scheduleItems.map((item, ri) => {
                                const isDraggingThis = dragging?.id === item._id;
                                const startDay = isDraggingThis ? dragging!.currentStart : (item.startDay ?? 1);
                                const duration = itemDuration(item);
                                const barColor = BAR_COLORS[ri % BAR_COLORS.length];
                                const startOffset = (startDay - 1) * DAY_W;
                                const barWidth = duration * DAY_W - 3;
                                const rowBg = ri % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(248,253,254,0.9)';
                                return (
                                    <Box key={item._id} sx={{ display: 'flex', height: ROW_H, alignItems: 'center', background: rowBg, borderBottom: `1px solid ${mainPrimaryColor}08`, '&:hover': { background: `rgba(0,171,190,0.04)` } }}>
                                        <Box sx={{ width: NAME_COL_W, flexShrink: 0, px: 2, position: 'sticky', left: 0, zIndex: 2, background: rowBg, height: '100%', display: 'flex', alignItems: 'center', borderRight: `1px solid ${mainPrimaryColor}18` }}>
                                            <Typography variant='caption' sx={{ color: '#444', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.laborOfferItemName || '—'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ position: 'relative', flex: 1, height: '100%' }}>
                                            {days.map(d => (
                                                <Box key={d} sx={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, bottom: 0, width: 1, background: d % 5 === 0 ? `${mainPrimaryColor}25` : 'rgba(0,0,0,0.035)' }} />
                                            ))}
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
                                        </Box>
                                        <Box sx={{ width: DELETE_COL_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IconButton size='small' onClick={() => handleDeleteItem(item._id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
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
