'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Divider, CircularProgress, Tooltip, TextField,
    Menu, MenuItem, ListItemIcon, ListItemText, Popover,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderOffOutlinedIcon from '@mui/icons-material/FolderOffOutlined';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

const DAY_W = 38;
const ROW_H = 46;
const GROUP_ROW_H = 46;
const NAME_COL_W = 280;
const BAR_COLORS = ['#26c6da', '#4dd0e1', '#4db6c4', '#80deea', '#00bcd4', '#b2ebf2'];
const GROUP_COLORS = ['#f44336', '#4caf50', '#ffc107', '#2196f3', '#9c27b0', '#ff9800', '#009688', '#e91e63'];
const UNGROUPED_COLOR = '#90a4ae';

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

interface ScheduleGroup {
    _id: string;
    name: string;
    displayIndex: number;
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
    startHour?: number; // 0-23, hour within startDay
    displayIndex?: number;
    groupId?: string;
    parentItemId?: string; // set on segment items — they render within parent's row
}

interface DragState {
    id: string;
    origStart: number;
    origStartHour: number;
    deltaX: number;
    mouseStartX: number;
}

interface RowDragState {
    id: string;
    fromFlatIndex: number;
    toFlatIndex: number;
    mouseStartY: number;
    totalRows: number;
}

interface GroupDragState {
    id: string;
    fromIndex: number;
    toIndex: number;
    mouseStartY: number;
    maxIndex: number;
}

type FlatRow =
    | { type: 'group'; group: ScheduleGroup; items: ScheduleItem[] }
    | { type: 'item'; item: ScheduleItem; groupId: string | null };

function itemDuration(item: ScheduleItem): number {
    const lh = item.laborHours ?? 0;
    const qty = item.quantity;
    if (!qty || !lh || !isFinite(qty / lh)) return 1;
    return Math.max(0.125, (qty / lh) / 8);
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
    // Which group the "Choose a work" dialog is adding to (null = ungrouped, undefined = not open)
    const [addWorkForGroupId, setAddWorkForGroupId] = useState<string | null | undefined>(undefined);

    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    const [groups, setGroups] = useState<ScheduleGroup[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
    const [moveGroupMenu, setMoveGroupMenu] = useState<{ anchor: HTMLElement; itemId: string } | null>(null);

    // Horizontal bar drag state
    const [dragging, setDragging] = useState<DragState | null>(null);
    const draggingRef = useRef<DragState | null>(null);
    draggingRef.current = dragging;

    // Vertical row reorder drag state
    const [rowDragging, setRowDragging] = useState<RowDragState | null>(null);
    const rowDraggingRef = useRef<RowDragState | null>(null);
    rowDraggingRef.current = rowDragging;

    // Group reorder drag state
    const [groupDragging, setGroupDragging] = useState<GroupDragState | null>(null);
    const groupDraggingRef = useRef<GroupDragState | null>(null);
    groupDraggingRef.current = groupDragging;

    const scheduleItemsRef = useRef<ScheduleItem[]>([]);
    scheduleItemsRef.current = scheduleItems;
    const groupsRef = useRef<ScheduleGroup[]>([]);
    groupsRef.current = groups;

    const ganttScrollRef = useRef<HTMLDivElement | null>(null);
    const dragMovedRef = useRef(false);
    const mouseXRef = useRef(0);
    const prevMouseXRef = useRef(0);
    const dragDeltaRef = useRef(0); // mutable, always in sync — avoids render-lag in onUp
    const autoScrollRafRef = useRef<number | null>(null);

    // Bar resize state
    const [resizing, setResizing] = useState<{ id: string; origBarWidth: number; deltaX: number } | null>(null);
    const resizeDeltaRef = useRef(0);

    // Name column width (resizable)
    const [nameColW, setNameColW] = useState(NAME_COL_W);
    const [barPopover, setBarPopover] = useState<{ itemId: string; anchorEl: HTMLElement; startHour: number } | null>(null);
    const [popoverTime, setPopoverTime] = useState('00:00');
    const [barContextMenu, setBarContextMenu] = useState<{ mouseX: number; mouseY: number; item: ScheduleItem; anchorEl: HTMLElement } | null>(null);

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
        if (!selected) { setScheduleItems([]); setGroups([]); return; }
        setItemsLoading(true);
        Promise.all([
            Api.requestSession<ScheduleItem[]>({ command: 'schedule/item_fetch_all', args: { scheduleId: selected._id } }),
            Api.requestSession<ScheduleGroup[]>({ command: 'schedule/group_fetch_all', args: { scheduleId: selected._id } }),
        ])
            .then(([items, grps]) => {
                setScheduleItems((items ?? []).map(i => ({ ...i, startDay: i.startDay ?? 1 })));
                setGroups((grps ?? []).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0)));
            })
            .catch(() => {})
            .finally(() => setItemsLoading(false));
    }, [selected]);

    // Build flat display list for Gantt rows: ungrouped items first, then groups
    const displayList = useMemo<FlatRow[]>(() => {
        const result: FlatRow[] = [];

        // Ungrouped items at top (no label — they're the default state)
        const ungroupedItems = scheduleItems
            .filter(i => !i.groupId && !i.parentItemId)
            .sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
        for (const item of ungroupedItems) {
            result.push({ type: 'item', item, groupId: null });
        }

        // Groups below
        const sortedGroups = [...groups].sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
        for (const group of sortedGroups) {
            const groupItems = scheduleItems
                .filter(i => i.groupId === group._id && !i.parentItemId)
                .sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
            result.push({ type: 'group', group, items: groupItems });
            if (!collapsedGroups.has(group._id)) {
                for (const item of groupItems) {
                    result.push({ type: 'item', item, groupId: group._id });
                }
            }
        }

        return result;
    }, [groups, scheduleItems, collapsedGroups]);

    const displayListRef = useRef<FlatRow[]>([]);
    displayListRef.current = displayList;

    const segmentsByParent = useMemo(() => {
        const map = new Map<string, ScheduleItem[]>();
        for (const item of scheduleItems) {
            if (item.parentItemId) {
                const arr = map.get(item.parentItemId) ?? [];
                arr.push(item);
                map.set(item.parentItemId, arr);
            }
        }
        return map;
    }, [scheduleItems]);

    // Live preview during row drag
    const displayedFlatRows = useMemo<FlatRow[]>(() => {
        if (!rowDragging || rowDragging.fromFlatIndex === rowDragging.toFlatIndex) return displayList;
        const arr = [...displayList];
        const [row] = arr.splice(rowDragging.fromFlatIndex, 1);
        let insertAt = rowDragging.toFlatIndex > rowDragging.fromFlatIndex
            ? rowDragging.toFlatIndex - 1
            : rowDragging.toFlatIndex;
        insertAt = Math.max(0, Math.min(arr.length, insertAt));
        if (arr[insertAt]?.type === 'group') insertAt = Math.min(arr.length, insertAt + 1);
        arr.splice(insertAt, 0, row);
        return arr;
    }, [displayList, rowDragging]);

    // Live preview during group drag
    const displayedGroups = useMemo<ScheduleGroup[]>(() => {
        if (!groupDragging || groupDragging.fromIndex === groupDragging.toIndex) return groups;
        const arr = [...groups].sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
        const [g] = arr.splice(groupDragging.fromIndex, 1);
        arr.splice(groupDragging.toIndex, 0, g);
        return arr;
    }, [groups, groupDragging]);

    // Vertical row reorder drag
    useEffect(() => {
        if (!rowDragging) return;
        document.body.style.cursor = 'grabbing';
        const onMove = (e: MouseEvent) => {
            const d = rowDraggingRef.current;
            if (!d) return;
            const deltaRows = Math.round((e.clientY - d.mouseStartY) / ROW_H);
            let newTarget = Math.max(0, Math.min(d.totalRows - 1, d.fromFlatIndex + deltaRows));
            // Snap away from group header rows
            const dl = displayListRef.current;
            let attempts = 0;
            while (
                attempts++ < d.totalRows &&
                newTarget >= 0 && newTarget < d.totalRows &&
                dl[newTarget]?.type === 'group'
            ) {
                const dir = newTarget >= d.fromFlatIndex ? 1 : -1;
                const next = newTarget + dir;
                if (next < 0 || next >= d.totalRows || dl[next]?.type === 'group') break;
                newTarget = next;
            }
            newTarget = Math.max(0, Math.min(d.totalRows - 1, newTarget));
            if (newTarget !== d.toFlatIndex) setRowDragging(prev => prev ? { ...prev, toFlatIndex: newTarget } : null);
        };
        const onUp = async () => {
            const d = rowDraggingRef.current;
            if (!d || d.fromFlatIndex === d.toFlatIndex) {
                setRowDragging(null);
                document.body.style.cursor = '';
                return;
            }
            const dl = displayListRef.current;

            // Build reordered flat list
            const arr = [...dl];
            const [draggedRow] = arr.splice(d.fromFlatIndex, 1);
            if (draggedRow.type !== 'item') {
                setRowDragging(null);
                document.body.style.cursor = '';
                return;
            }
            let insertAt = d.toFlatIndex > d.fromFlatIndex ? d.toFlatIndex - 1 : d.toFlatIndex;
            insertAt = Math.max(0, Math.min(arr.length, insertAt));
            // If landing on a group header, insert after it (first slot in group)
            if (arr[insertAt]?.type === 'group') insertAt = Math.min(arr.length, insertAt + 1);
            arr.splice(insertAt, 0, draggedRow);

            // Extract group assignments from new order
            // Ungrouped items appear before any group header (currentGroupId starts null)
            let currentGroupId: string | null = null;
            const groupCounters: Record<string, number> = {};
            const updates: { id: string; groupId: string | null; displayIndex: number }[] = [];

            for (const row of arr) {
                if (row.type === 'group') {
                    currentGroupId = row.group._id;
                } else if (row.type === 'item') {
                    const key = currentGroupId ?? '__ungrouped__';
                    const idx = groupCounters[key] ?? 0;
                    groupCounters[key] = idx + 1;
                    updates.push({ id: row.item._id, groupId: currentGroupId, displayIndex: idx });
                }
            }

            setScheduleItems(prev => prev.map(item => {
                const u = updates.find(x => x.id === item._id);
                return u ? { ...item, groupId: u.groupId ?? undefined, displayIndex: u.displayIndex } : item;
            }));
            setRowDragging(null);
            document.body.style.cursor = '';
            await Api.requestSession({ command: 'schedule/item_reorder', values: { items: updates } });
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
        };
    }, [rowDragging]);

    // Group reorder drag
    useEffect(() => {
        if (!groupDragging) return;
        document.body.style.cursor = 'grabbing';
        const onMove = (e: MouseEvent) => {
            const d = groupDraggingRef.current;
            if (!d) return;
            const deltaRows = Math.round((e.clientY - d.mouseStartY) / GROUP_ROW_H);
            const newTo = Math.max(0, Math.min(d.maxIndex, d.fromIndex + deltaRows));
            if (newTo !== d.toIndex) setGroupDragging(prev => prev ? { ...prev, toIndex: newTo } : null);
        };
        const onUp = async () => {
            const d = groupDraggingRef.current;
            if (!d) { setGroupDragging(null); document.body.style.cursor = ''; return; }
            const arr = [...groupsRef.current].sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
            const [g] = arr.splice(d.fromIndex, 1);
            arr.splice(d.toIndex, 0, g);
            const reindexed = arr.map((grp, i) => ({ ...grp, displayIndex: i }));
            setGroups(reindexed);
            setGroupDragging(null);
            document.body.style.cursor = '';
            await Api.requestSession({ command: 'schedule/group_reorder', values: { ids: reindexed.map(g => g._id) } });
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
        };
    }, [groupDragging]);

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

    const handleChooseWork = (groupId: string | null) => {
        if (!selected) return;
        setAddWorkForGroupId(groupId);
        setWorksOpen(true);
        setLaborLoading(true);
        Api.requestSession<LaborRow[]>({
            command: 'estimate/fetch_labor_for_analysis',
            args: { estimateId: selected.estimateId },
        })
            .then(rows => setLaborRows(rows ?? []))
            .catch(() => setLaborRows([]))
            .finally(() => setLaborLoading(false));
    };

    const handleAddItem = async (row: LaborRow) => {
        if (!selected || addingId === row._id) return;
        setAddingId(row._id);
        const targetGroupId = addWorkForGroupId;
        try {
            const startDay = 1;
            const args: Record<string, unknown> = {
                scheduleId: selected._id,
                laborOfferItemName: row.laborOfferItemName,
                quantity: row.quantity,
                laborHours: row.laborHours ?? 0,
                unitSymbol: row.unitSymbol ?? '',
                sectionName: row.sectionName ?? '',
                subsectionName: row.subsectionName ?? '',
                startDay,
            };
            if (targetGroupId) args.groupId = targetGroupId;
            const created = await Api.requestSession<ScheduleItem>({ command: 'schedule/item_add', args });
            if (created) {
                setScheduleItems(prev => [...prev, {
                    ...created,
                    startDay: created.startDay ?? startDay,
                    groupId: (created as ScheduleItem & { groupId?: string }).groupId ?? targetGroupId ?? undefined,
                }]);
            }
        } finally {
            setAddingId(null);
        }
    };

    const handleDeleteItem = async (id: string) => {
        await Api.requestSession({ command: 'schedule/item_delete', args: { id } });
        setScheduleItems(prev => prev.filter(i => i._id !== id));
    };

    const handleGroupCreate = async () => {
        if (!selected) return;
        const name = `Group ${groups.length + 1}`;
        const created = await Api.requestSession<ScheduleGroup>({
            command: 'schedule/group_create',
            args: { scheduleId: selected._id, name },
        });
        if (created) {
            setGroups(prev => [...prev, created]);
            setEditingGroup({ id: created._id, name: created.name });
        }
    };

    const handleGroupDelete = async (id: string) => {
        await Api.requestSession({ command: 'schedule/group_delete', args: { id } });
        setGroups(prev => prev.filter(g => g._id !== id));
        // Ungroup items locally
        setScheduleItems(prev => prev.map(i => i.groupId === id ? { ...i, groupId: undefined } : i));
    };

    const handleGroupRenameCommit = async () => {
        if (!editingGroup) return;
        const { id, name } = editingGroup;
        const trimmed = name.trim();
        if (!trimmed) { setEditingGroup(null); return; }
        setGroups(prev => prev.map(g => g._id === id ? { ...g, name: trimmed } : g));
        setEditingGroup(null);
        await Api.requestSession({ command: 'schedule/group_rename', args: { id, name: trimmed } });
    };

    const handleMoveToGroup = async (itemId: string, targetGroupId: string | null) => {
        setMoveGroupMenu(null);
        const targetItems = scheduleItemsRef.current.filter(i =>
            targetGroupId ? i.groupId === targetGroupId : !i.groupId
        );
        const displayIndex = targetItems.filter(i => i._id !== itemId).length;
        setScheduleItems(prev => prev.map(i =>
            i._id === itemId ? { ...i, groupId: targetGroupId ?? undefined, displayIndex } : i
        ));
        await Api.requestSession({
            command: 'schedule/item_reorder',
            values: { items: [{ id: itemId, groupId: targetGroupId, displayIndex }] },
        });
    };

    const handleBarMouseDown = (e: React.MouseEvent, item: ScheduleItem) => {
        if (rowDragging) return;
        e.preventDefault();
        dragMovedRef.current = false;
        dragDeltaRef.current = 0;
        prevMouseXRef.current = e.clientX;
        mouseXRef.current = e.clientX;

        // Capture in closure — draggingRef won't be set until after async React render
        const origStart = (item.startDay != null && isFinite(item.startDay)) ? item.startDay : 1;
        const origStartHour = (item.startHour != null && isFinite(item.startHour)) ? item.startHour : 0;
        const itemId = item._id;
        const origOffsetPx = (origStart - 1) * DAY_W + (origStartHour / 24) * DAY_W;
        const mouseDownX = e.clientX;

        setDragging({ id: itemId, origStart, origStartHour, deltaX: 0, mouseStartX: mouseDownX });

        // Start auto-scroll rAF loop immediately
        const loop = () => {
            const scroller = ganttScrollRef.current;
            if (scroller) {
                const rect = scroller.getBoundingClientRect();
                const mx = mouseXRef.current;
                const ZONE = 80;
                let speed = 0;
                if (mx < rect.left + ZONE) speed = -((rect.left + ZONE - mx) / ZONE) * 14;
                else if (mx > rect.right - ZONE) speed = ((mx - (rect.right - ZONE)) / ZONE) * 14;
                if (speed !== 0) {
                    const before = scroller.scrollLeft;
                    scroller.scrollLeft += speed;
                    const actual = scroller.scrollLeft - before;
                    if (actual !== 0) {
                        dragDeltaRef.current += actual;
                        setDragging(prev => prev ? { ...prev, deltaX: dragDeltaRef.current } : null);
                    }
                }
            }
            autoScrollRafRef.current = requestAnimationFrame(loop);
        };
        autoScrollRafRef.current = requestAnimationFrame(loop);

        const onMove = (ev: MouseEvent) => {
            mouseXRef.current = ev.clientX;
            const incr = ev.clientX - prevMouseXRef.current;
            prevMouseXRef.current = ev.clientX;
            if (Math.abs(ev.clientX - mouseDownX) > 2) dragMovedRef.current = true;
            if (incr !== 0) {
                dragDeltaRef.current = Math.max(-origOffsetPx, dragDeltaRef.current + incr);
                setDragging(prev => prev ? { ...prev, deltaX: dragDeltaRef.current } : null);
            }
        };

        const onUp = () => {
            if (autoScrollRafRef.current !== null) {
                cancelAnimationFrame(autoScrollRafRef.current);
                autoScrollRafRef.current = null;
            }
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const origFrac = (origStart - 1) + origStartHour / 24;
            const newStartDay = Math.max(1, Math.round(origFrac + dragDeltaRef.current / DAY_W) + 1);
            setScheduleItems(prev => prev.map(i => i._id === itemId ? { ...i, startDay: newStartDay } : i));
            setDragging(null);
            Api.requestSession({ command: 'schedule/item_update', args: { id: itemId, startDay: newStartDay } });
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleBarClick = (e: React.MouseEvent, item: ScheduleItem) => {
        if (dragMovedRef.current) return;
        e.preventDefault();
        setBarContextMenu({ mouseX: e.clientX, mouseY: e.clientY, item, anchorEl: e.currentTarget as HTMLElement });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, item: ScheduleItem) => {
        e.preventDefault();
        e.stopPropagation();
        const lh = item.laborHours ?? 0;
        const origBarWidth = Math.max(itemDuration(item) * DAY_W - 3, 12);
        const mouseStartX = e.clientX;
        const itemId = item._id;
        resizeDeltaRef.current = 0;
        setResizing({ id: itemId, origBarWidth, deltaX: 0 });

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - mouseStartX;
            resizeDeltaRef.current = delta;
            setResizing(prev => prev ? { ...prev, deltaX: delta } : null);
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const newWidth = Math.max(12, origBarWidth + resizeDeltaRef.current);
            const newDuration = Math.max(0.125, newWidth / DAY_W);
            const newQuantity = lh > 0 ? newDuration * lh * 8 : 0;
            setScheduleItems(prev => prev.map(i => i._id === itemId ? { ...i, quantity: newQuantity } : i));
            setResizing(null);
            if (lh > 0) {
                Api.requestSession({ command: 'schedule/item_update', args: { id: itemId, quantity: newQuantity } });
            }
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleOpenTimePopover = () => {
        if (!barContextMenu) return;
        const item = barContextMenu.item;
        const h = item.startHour ?? 0;
        setPopoverTime(`${String(h).padStart(2, '0')}:00`);
        setBarPopover({ itemId: item._id, anchorEl: barContextMenu.anchorEl, startHour: h });
        setBarContextMenu(null);
    };

    const handleBarPopoverSave = async () => {
        if (!barPopover) return;
        const [hStr] = popoverTime.split(':');
        const newHour = Math.min(23, Math.max(0, parseInt(hStr) || 0));
        setScheduleItems(prev => prev.map(i => i._id === barPopover.itemId ? { ...i, startHour: newHour } : i));
        setBarPopover(null);
        await Api.requestSession({ command: 'schedule/item_update', args: { id: barPopover.itemId, startHour: newHour } });
    };

    const handleSplitItem = async () => {
        if (!barContextMenu || !selected) return;
        const item = barContextMenu.item;
        setBarContextMenu(null);
        const lh = item.laborHours ?? 0;
        if (lh <= 0 || (item.quantity ?? 0) <= 0) return;
        const q1 = (item.quantity ?? 0) / 2;
        const q2 = (item.quantity ?? 0) / 2;
        // Second part starts where first part's bar ends (in fractional Gantt days)
        const duration1 = q1 / lh / 8;
        const origFrac = (item.startDay - 1) + (item.startHour ?? 0) / 24;
        const endFrac = origFrac + duration1;
        const startDay2 = Math.floor(endFrac) + 1;
        const startHour2 = Math.round((endFrac % 1) * 24) % 24;
        const parentItemId = item.parentItemId ?? item._id;
        const newItem = await Api.requestSession<ScheduleItem>({ command: 'schedule/item_add', args: {
            scheduleId: selected._id,
            laborOfferItemName: item.laborOfferItemName,
            quantity: q2,
            laborHours: lh,
            unitSymbol: item.unitSymbol ?? '',
            sectionName: item.sectionName ?? '',
            subsectionName: item.subsectionName ?? '',
            startDay: startDay2,
            startHour: startHour2,
            parentItemId,
            ...(item.groupId ? { groupId: item.groupId } : {}),
        }});
        setScheduleItems(prev => [
            ...prev.map(i => i._id === item._id ? { ...i, quantity: q1 } : i),
            { ...newItem, startDay: newItem.startDay ?? startDay2, startHour: newItem.startHour ?? startHour2, parentItemId },
        ]);
        await Api.requestSession({ command: 'schedule/item_update', args: { id: item._id, quantity: q1 } });
    };

    const handleColDividerMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startW = nameColW;
        const onMove = (ev: MouseEvent) => {
            setNameColW(Math.max(140, Math.min(600, startW + ev.clientX - startX)));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleRowDragStart = (e: React.MouseEvent, item: ScheduleItem, flatIndex: number) => {
        if (dragging) return;
        e.preventDefault();
        setRowDragging({
            id: item._id,
            fromFlatIndex: flatIndex,
            toFlatIndex: flatIndex,
            mouseStartY: e.clientY,
            totalRows: displayListRef.current.length,
        });
    };

    const handleGroupDragStart = (e: React.MouseEvent, group: ScheduleGroup, index: number) => {
        e.preventDefault();
        setGroupDragging({ id: group._id, fromIndex: index, toIndex: index, mouseStartY: e.clientY, maxIndex: groups.length - 1 });
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
        const start = dragging?.id === item._id
            ? Math.floor(((item.startDay - 1) + (item.startHour ?? 0) / 24 + dragging.deltaX / DAY_W)) + 1
            : (item.startDay ?? 1);
        return Math.max(max, start + itemDuration(item) - 1);
    }, 20), 20);

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const monthGroups = buildMonthGroups(projectStartDate, totalDays);
    const dateInputValue = toDateInputValue(projectStartDate);

    const sortedDisplayedGroups = groupDragging
        ? displayedGroups
        : [...groups].sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));

    const hasAnyRows = displayList.length > 0;

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
                <Box onClick={handleGroupCreate} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 90, height: 72, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: 'rgba(96,125,139,0.06)' }, '&:hover svg': { opacity: '1 !important' } }}>
                    <CreateNewFolderOutlinedIcon sx={{ fontSize: 22, color: '#607d8b', opacity: 0.55 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{t('Add Group')}</Typography>
                </Box>
                <Box onClick={() => handleChooseWork(null)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 90, height: 72, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: `rgba(0,171,190,0.06)` }, '&:hover svg': { opacity: '1 !important' } }}>
                    <WorkOutlineIcon sx={{ fontSize: 22, color: mainPrimaryColor, opacity: 0.55 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{t('Choose a work')}</Typography>
                </Box>
            </Box>

            {/* Gantt table */}
            {itemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: mainPrimaryColor }} />
                </Box>
            ) : hasAnyRows && (
                <Box sx={{
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(0,171,190,0.18)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    userSelect: 'none',
                }}>
                    <Box ref={ganttScrollRef} sx={{ overflowX: 'auto', overflowY: 'auto', height: 'calc(100vh - 155px)' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: nameColW + totalDays * DAY_W }}>

                            {/* Month header row */}
                            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: 'rgba(255,255,255,0.97)', borderBottom: `1px solid ${mainPrimaryColor}18` }}>
                                <Box sx={{ width: nameColW, flexShrink: 0, position: 'sticky', left: 0, zIndex: 4, background: 'rgba(255,255,255,0.97)', borderRight: `1px solid ${mainPrimaryColor}22` }} />
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
                                <Box sx={{ width: nameColW, flexShrink: 0, px: 2, py: 0.8, position: 'sticky', left: 0, zIndex: 4, background: 'rgba(255,255,255,0.97)', borderRight: `1px solid ${mainPrimaryColor}22`, overflow: 'visible' }}>
                                    <Typography variant='caption' sx={{ color: mainPrimaryColor, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {t('Task')}
                                    </Typography>
                                    {/* Column resize divider */}
                                    <Box
                                        onMouseDown={handleColDividerMouseDown}
                                        sx={{
                                            position: 'absolute', right: -3, top: 0, bottom: 0, width: 6,
                                            cursor: 'col-resize', zIndex: 5,
                                            '&:hover': { background: `${mainPrimaryColor}44` },
                                        }}
                                    />
                                </Box>
                                {days.map(d => {
                                    const date = addDays(projectStartDate, d - 1);
                                    const dayNum = date.getDate();
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    return (
                                        <Box key={d} sx={{
                                            width: DAY_W, flexShrink: 0, textAlign: 'center', py: 0.8,
                                            borderRight: dayNum === 1 ? `1px solid ${mainPrimaryColor}44` : dayNum % 5 === 0 ? `1px solid ${mainPrimaryColor}22` : `1px solid rgba(0,0,0,0.04)`,
                                            color: isWeekend ? '#94a3b8' : dayNum === 1 ? mainPrimaryColor : '#bbb',
                                            fontSize: '0.63rem',
                                            fontWeight: dayNum === 1 ? 700 : 400,
                                            bgcolor: isWeekend ? 'rgba(148,163,184,0.07)' : 'transparent',
                                        }}>
                                            {dayNum}
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Flat rows: groups + items + ungrouped */}
                            {displayedFlatRows.map((row, fi) => {
                                if (row.type === 'group') {
                                    const { group, items: groupItems } = row;
                                    const groupIdx = sortedDisplayedGroups.findIndex(g => g._id === group._id);
                                    const isCollapsed = collapsedGroups.has(group._id);
                                    const isGroupDragging = groupDragging?.id === group._id;
                                    const groupColor = GROUP_COLORS[groupIdx % GROUP_COLORS.length];

                                    // Summary bar for this group
                                    let summaryStart = 0;
                                    let summaryEnd = 0;
                                    if (groupItems.length > 0) {
                                        summaryStart = Math.min(...groupItems.map(i => i.startDay ?? 1));
                                        summaryEnd = Math.max(...groupItems.map(i => (i.startDay ?? 1) + itemDuration(i) - 1));
                                    }

                                    return (
                                        <Box
                                            key={`group-${group._id}`}
                                            sx={{
                                                display: 'flex', height: GROUP_ROW_H, alignItems: 'center',
                                                background: isGroupDragging ? `rgba(0,171,190,0.08)` : `rgba(0,171,190,0.05)`,
                                                borderBottom: `1px solid ${mainPrimaryColor}20`,
                                                borderTop: fi > 0 ? `1px solid ${mainPrimaryColor}15` : 'none',
                                                opacity: isGroupDragging ? 0.6 : 1,
                                                '& .group-actions': { opacity: 0 },
                                                '&:hover .group-actions': { opacity: 1 },
                                            }}
                                        >
                                            {/* Sticky name column */}
                                            <Box sx={{
                                                width: nameColW, flexShrink: 0,
                                                position: 'sticky', left: 0, zIndex: 2,
                                                background: isGroupDragging ? `rgba(0,171,190,0.08)` : `rgba(0,171,190,0.05)`,
                                                height: '100%',
                                                display: 'flex', alignItems: 'center',
                                                borderRight: `1px solid ${mainPrimaryColor}22`,
                                                pl: 0.5, pr: 0.5,
                                                gap: 0.25,
                                            }}>
                                                {/* Group drag handle */}
                                                <Box
                                                    onMouseDown={e => handleGroupDragStart(e, group, groupIdx)}
                                                    sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: '#bbb', cursor: 'grab', px: 0.25, '&:hover': { color: '#888' } }}
                                                >
                                                    <DragIndicatorIcon sx={{ fontSize: 14 }} />
                                                </Box>
                                                {/* Expand/collapse */}
                                                <IconButton
                                                    size='small'
                                                    onClick={() => setCollapsedGroups(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(group._id)) next.delete(group._id); else next.add(group._id);
                                                        return next;
                                                    })}
                                                    sx={{ p: '2px', color: '#333', flexShrink: 0 }}
                                                >
                                                    {isCollapsed
                                                        ? <ChevronRightIcon sx={{ fontSize: 16 }} />
                                                        : <ExpandMoreIcon sx={{ fontSize: 16 }} />
                                                    }
                                                </IconButton>
                                                {/* Group color dot */}
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: groupColor, flexShrink: 0, mr: 0.5 }} />
                                                {/* Group name / edit */}
                                                {editingGroup?.id === group._id ? (
                                                    <TextField
                                                        autoFocus
                                                        size='small'
                                                        value={editingGroup.name}
                                                        onChange={e => setEditingGroup(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                        onBlur={handleGroupRenameCommit}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleGroupRenameCommit(); if (e.key === 'Escape') setEditingGroup(null); }}
                                                        sx={{
                                                            flex: 1,
                                                            '& .MuiInputBase-input': { fontSize: '0.78rem', fontWeight: 700, py: 0.3, px: 0.5, color: '#1a1a1a' },
                                                            '& .MuiOutlinedInput-root': { borderRadius: 1 },
                                                        }}
                                                        inputProps={{ onClick: (e: React.MouseEvent) => e.stopPropagation() }}
                                                    />
                                                ) : (
                                                    <Typography
                                                        onClick={() => setEditingGroup({ id: group._id, name: group.name })}
                                                        sx={{
                                                            flex: 1, fontSize: '0.78rem', fontWeight: 700,
                                                            color: '#1a1a1a', cursor: 'text',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            mx: 0.5,
                                                        }}
                                                    >
                                                        {group.name}
                                                        <Typography component='span' sx={{ fontSize: '0.65rem', color: '#aaa', ml: 0.5, fontWeight: 400 }}>
                                                            ({groupItems.length})
                                                        </Typography>
                                                    </Typography>
                                                )}
                                                {/* Add task to group + delete group */}
                                                <Box className='group-actions' sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'opacity 0.15s' }}>
                                                    <Tooltip title={t('Add task to group')} placement='top' arrow>
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => handleChooseWork(group._id)}
                                                            sx={{ p: '3px', color: '#ccc', '&:hover': { color: mainPrimaryColor } }}
                                                        >
                                                            <AddCircleOutlineIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t('Delete group')} placement='top' arrow>
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => handleGroupDelete(group._id)}
                                                            sx={{ p: '3px', color: '#ccc', '&:hover': { color: '#e53935' } }}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            {/* Group summary bar area */}
                                            <Box sx={{ position: 'relative', flex: 1, height: '100%' }}>
                                                {days.map(d => {
                                                    const date = addDays(projectStartDate, d - 1);
                                                    const dayNum = date.getDate();
                                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                    return (
                                                        <Box key={d} sx={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, bottom: 0, width: isWeekend ? DAY_W : 1, background: 'transparent', zIndex: 0 }} />
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    );
                                }

                                // Item row
                                const { item, groupId } = row;
                                const isDraggingThis = dragging?.id === item._id;
                                const isRowDraggingThis = rowDragging?.id === item._id;
                                const isResizingThis = resizing?.id === item._id;
                                const startDay = item.startDay ?? 1;
                                const startHour = item.startHour ?? 0;
                                const duration = itemDuration(item);
                                const barColor = BAR_COLORS[fi % BAR_COLORS.length];
                                const baseOffset = (startDay - 1) * DAY_W + (startHour / 24) * DAY_W;
                                const startOffset = isDraggingThis ? Math.max(0, baseOffset + dragging!.deltaX) : baseOffset;
                                const baseBarWidth = Math.max(duration * DAY_W - 3, 12);
                                const barWidth = isResizingThis ? Math.max(12, resizing!.origBarWidth + resizing!.deltaX) : baseBarWidth;
                                const rowBg = isRowDraggingThis
                                    ? `rgba(0,171,190,0.06)`
                                    : fi % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(248,253,254,0.9)';
                                const startDate = addDays(projectStartDate, startDay - 1);
                                if (startHour > 0) startDate.setHours(startHour);
                                const endDate = addDays(projectStartDate, startDay + duration - 2);
                                const timeLabel = startHour > 0 ? ` ${String(startHour).padStart(2, '0')}:00` : '';
                                const tooltipLabel = `${startDate.toLocaleDateString()}${timeLabel} → ${endDate.toLocaleDateString()}`;

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
                                            width: nameColW, flexShrink: 0,
                                            position: 'sticky', left: 0, zIndex: 2,
                                            background: rowBg, height: '100%',
                                            display: 'flex', alignItems: 'center',
                                            borderRight: `1px solid ${mainPrimaryColor}18`,
                                            overflow: 'hidden',
                                            pl: groupId ? 2.5 : 0.5, pr: 0.5,
                                        }}>
                                            {/* Drag handle */}
                                            <Box
                                                onMouseDown={e => handleRowDragStart(e, item, fi)}
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
                                            {/* Move to group — hover-revealed */}
                                            {groups.length > 0 && (
                                                <Tooltip title={t('Move to group')} placement='top' arrow>
                                                    <IconButton
                                                        className='gantt-row-delete'
                                                        size='small'
                                                        onClick={e => setMoveGroupMenu({ anchor: e.currentTarget, itemId: item._id })}
                                                        sx={{ flexShrink: 0, color: groupId ? barColor : '#ccc', transition: 'opacity 0.15s', p: '3px' }}
                                                    >
                                                        <FolderOutlinedIcon sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
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
                                                    <Box key={d} sx={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, bottom: 0, width: isWeekend ? DAY_W : 1, background: 'transparent', zIndex: 0 }} />
                                                );
                                            })}
                                            <Tooltip title={tooltipLabel} placement='top' arrow>
                                                <Box
                                                    onMouseDown={e => handleBarMouseDown(e, item)}
                                                    onClick={e => handleBarClick(e, item)}
                                                    onContextMenu={e => e.preventDefault()}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: startOffset + 2,
                                                        top: 6, height: ROW_H - 12,
                                                        width: barWidth,
                                                        background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                                        borderRadius: '5px',
                                                        display: 'flex', alignItems: 'center',
                                                        px: 1, overflow: 'hidden',
                                                        boxShadow: (isDraggingThis || isResizingThis) ? `0 4px 16px ${barColor}88` : `0 2px 8px ${barColor}55`,
                                                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                                                        opacity: (isDraggingThis || isResizingThis) ? 0.9 : 1,
                                                        transition: (isDraggingThis || isResizingThis) ? 'none' : 'box-shadow 0.15s',
                                                        zIndex: (isDraggingThis || isResizingThis) ? 10 : 1,
                                                    }}
                                                >
                                                    <Typography sx={{ color: '#fff', fontSize: '0.63rem', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', flex: 1, overflow: 'hidden' }}>
                                                        {(() => { const d = isResizingThis ? Math.max(0.125, Math.max(12, resizing!.origBarWidth + resizing!.deltaX) / DAY_W) : duration; return d >= 1 ? `${Math.round(d * 10) / 10}${t('day_short')}` : `${Math.round(d * 8)}h`; })()}
                                                    </Typography>
                                                    {/* Resize handle */}
                                                    <Box
                                                        onMouseDown={e => handleResizeMouseDown(e, item)}
                                                        onClick={e => e.stopPropagation()}
                                                        sx={{
                                                            position: 'absolute', right: 0, top: 0, bottom: 0,
                                                            width: 10, cursor: 'ew-resize',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            borderRadius: '0 5px 5px 0',
                                                            '&:hover': { background: 'rgba(255,255,255,0.15)' },
                                                        }}
                                                    >
                                                        <Box sx={{ width: 2, height: '55%', background: 'rgba(255,255,255,0.55)', borderRadius: 1, pointerEvents: 'none' }} />
                                                    </Box>
                                                </Box>
                                            </Tooltip>
                                            {/* Segment bars (split parts) */}
                                            {(segmentsByParent.get(item._id) ?? []).map(seg => {
                                                const segIsDragging = dragging?.id === seg._id;
                                                const segBaseOffset = (seg.startDay - 1) * DAY_W + ((seg.startHour ?? 0) / 24) * DAY_W;
                                                const segOffset = segIsDragging ? Math.max(0, segBaseOffset + dragging!.deltaX) : segBaseOffset;
                                                const segDuration = itemDuration(seg);
                                                const segWidth = Math.max(segDuration * DAY_W - 3, 12);
                                                const segLabel = segDuration >= 1 ? `${Math.round(segDuration * 10) / 10}${t('day_short')}` : `${Math.round(segDuration * 8)}h`;
                                                return (
                                                    <Tooltip key={seg._id} title={seg.laborOfferItemName} placement='top' arrow>
                                                        <Box
                                                            onMouseDown={e => handleBarMouseDown(e, seg)}
                                                            onClick={e => handleBarClick(e, seg)}
                                                            onContextMenu={e => e.preventDefault()}
                                                            sx={{
                                                                position: 'absolute',
                                                                left: segOffset + 2,
                                                                top: 6, height: ROW_H - 12,
                                                                width: segWidth,
                                                                background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                                                borderRadius: '5px',
                                                                display: 'flex', alignItems: 'center',
                                                                px: 1, overflow: 'hidden',
                                                                boxShadow: segIsDragging ? `0 4px 16px ${barColor}88` : `0 2px 8px ${barColor}55`,
                                                                cursor: segIsDragging ? 'grabbing' : 'grab',
                                                                opacity: segIsDragging ? 0.9 : 1,
                                                                transition: segIsDragging ? 'none' : 'box-shadow 0.15s',
                                                                zIndex: segIsDragging ? 10 : 1,
                                                            }}
                                                        >
                                                            <Typography sx={{ color: '#fff', fontSize: '0.63rem', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                                                {segLabel}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Works modal */}
            <Dialog open={worksOpen} onClose={() => { setWorksOpen(false); setAddWorkForGroupId(undefined); }} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${mainPrimaryColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <WorkOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Choose a work')}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.1 }}>
                                {addWorkForGroupId
                                    ? (groups.find(g => g._id === addWorkForGroupId)?.name ?? selected.estimateName)
                                    : selected.estimateName}
                            </Typography>
                        </Box>
                        <IconButton size='small' onClick={() => { setWorksOpen(false); setAddWorkForGroupId(undefined); }} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
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
                    <Button onClick={() => { setWorksOpen(false); setAddWorkForGroupId(undefined); }} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                </DialogActions>
            </Dialog>

            {/* Move-to-group menu */}
            <Menu
                anchorEl={moveGroupMenu?.anchor}
                open={Boolean(moveGroupMenu)}
                onClose={() => setMoveGroupMenu(null)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
            >
                {sortedDisplayedGroups.map((g, gi) => (
                    <MenuItem
                        key={g._id}
                        selected={moveGroupMenu ? scheduleItems.find(i => i._id === moveGroupMenu.itemId)?.groupId === g._id : false}
                        onClick={() => moveGroupMenu && handleMoveToGroup(moveGroupMenu.itemId, g._id)}
                        sx={{ fontSize: '0.82rem', py: 0.8 }}
                    >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: GROUP_COLORS[gi % GROUP_COLORS.length] }} />
                        </ListItemIcon>
                        <ListItemText primary={g.name} primaryTypographyProps={{ fontSize: '0.82rem' }} />
                    </MenuItem>
                ))}
                {moveGroupMenu && scheduleItems.find(i => i._id === moveGroupMenu.itemId)?.groupId && (
                    <MenuItem
                        onClick={() => moveGroupMenu && handleMoveToGroup(moveGroupMenu.itemId, null)}
                        sx={{ fontSize: '0.82rem', py: 0.8, borderTop: '1px solid #f0f0f0', mt: 0.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                            <FolderOffOutlinedIcon sx={{ fontSize: 14, color: '#90a4ae' }} />
                        </ListItemIcon>
                        <ListItemText primary={t('Remove from group')} primaryTypographyProps={{ fontSize: '0.82rem', color: '#90a4ae' }} />
                    </MenuItem>
                )}
            </Menu>

            {/* Bar right-click context menu */}
            <Menu
                open={!!barContextMenu}
                onClose={() => setBarContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={barContextMenu ? { top: barContextMenu.mouseY, left: barContextMenu.mouseX } : undefined}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
            >
                <MenuItem onClick={handleSplitItem} sx={{ fontSize: '0.85rem', py: 0.9 }}>Բաժանել</MenuItem>
                <MenuItem disabled sx={{ fontSize: '0.85rem', py: 0.9 }}>Կապել</MenuItem>
                <MenuItem onClick={handleOpenTimePopover} sx={{ fontSize: '0.85rem', py: 0.9 }}>Ժամանակ</MenuItem>
            </Menu>

            {/* Bar time popover */}
            <Popover
                open={!!barPopover}
                anchorEl={barPopover?.anchorEl}
                onClose={() => setBarPopover(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                PaperProps={{ sx: { borderRadius: 2.5, p: 2, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.14)' } }}
            >
                {barPopover && (() => {
                    const item = scheduleItems.find(i => i._id === barPopover.itemId);
                    const startDay = item?.startDay ?? 1;
                    const startDate = addDays(projectStartDate, startDay - 1);
                    return (
                        <Box>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                                {startDate.toLocaleDateString()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#444', mb: 1.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                {item?.laborOfferItemName}
                            </Typography>
                            <TextField
                                label={t('Start') + ' ' + t('Labor Time')}
                                type='time'
                                size='small'
                                value={popoverTime}
                                onChange={e => setPopoverTime(e.target.value)}
                                inputProps={{ step: 3600 }}
                                fullWidth
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button size='small' onClick={() => setBarPopover(null)} sx={{ borderRadius: '20px', color: '#888', textTransform: 'none' }}>{t('Cancel')}</Button>
                                <Button size='small' variant='contained' onClick={handleBarPopoverSave} sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#009aab' } }}>{t('Save')}</Button>
                            </Box>
                        </Box>
                    );
                })()}
            </Popover>
        </PageContents>
    );
}
