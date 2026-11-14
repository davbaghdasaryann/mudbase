'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Divider, CircularProgress, Tooltip, TextField,
    Menu, MenuItem, ListItemIcon, ListItemText, Popover, InputAdornment, Select, FormControl, InputLabel,
    Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderOffOutlinedIcon from '@mui/icons-material/FolderOffOutlined';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import LinkIcon from '@mui/icons-material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TuneIcon from '@mui/icons-material/Tune';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
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
const NAME_COL_W = 365;
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
    laborItemId?: string;
    isGroupRow?: boolean;
    catalogName?: string;
    fullCode?: string;
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
    return Math.max(0.125, qty / lh);
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
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [volumeMonitorOpen, setVolumeMonitorOpen] = useState(false);
    const [laborRowsLoaded, setLaborRowsLoaded] = useState(false);
    const [vmExpanded, setVmExpanded] = useState<Record<string, boolean>>({});
    const [hoursPerDay, setHoursPerDay] = useState<number>(() => {
        if (typeof window === 'undefined') return 8;
        return parseInt(localStorage.getItem('schedule_hoursPerDay') ?? '8', 10) || 8;
    });
    const [hoursInput, setHoursInput] = useState('');
    const [laborRows, setLaborRows] = useState<LaborRow[]>([]);
    const [laborLoading, setLaborLoading] = useState(false);
    // Which group the "Choose a work" dialog is adding to (null = ungrouped, undefined = not open)
    const [addWorkForGroupId, setAddWorkForGroupId] = useState<string | null | undefined>(undefined);

    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    // Time dialog for adding a labor item with custom duration
    const [qtyDialogRow, setQtyDialogRow] = useState<LaborRow | null>(null);
    const [timeInput, setTimeInput] = useState('');
    // Maps laborRow._id → { scheduleItemId, addedQty }
    const [addedLaborMap, setAddedLaborMap] = useState<Record<string, { scheduleItemId: string; addedQty: number }>>({});

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
    const [popoverUnit, setPopoverUnit] = useState<'hour' | 'day' | 'week' | 'month'>('day');
    const [popoverStartDay, setPopoverStartDay] = useState(1);
    const [popoverEndDay, setPopoverEndDay] = useState(1);
    const [popoverEndTime, setPopoverEndTime] = useState('00:00');
    const [barContextMenu, setBarContextMenu] = useState<{ mouseX: number; mouseY: number; item: ScheduleItem; anchorEl: HTMLElement } | null>(null);
    const [splitMode, setSplitMode] = useState<{ item: ScheduleItem; markers: number[] } | null>(null);
    const splitMarkerDragRef = useRef<{ index: number; startX: number; origOffset: number; hasMoved: boolean } | null>(null);

    const [splitDialogItem, setSplitDialogItem] = useState<ScheduleItem | null>(null);
    const [uniteSelectMode, setUniteSelectMode] = useState<{ parentItemId: string; selectedIds: Set<string> } | null>(null);
    const [splitPartsCount, setSplitPartsCount] = useState(2);
    const [splitEqualMode, setSplitEqualMode] = useState(true);
    const [splitPartDays, setSplitPartDays] = useState<string[]>([]);
    const [splitByHours, setSplitByHours] = useState(false);
    const [splitPartStartDays, setSplitPartStartDays] = useState<number[]>([]);

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

        const addItemWithSegments = (item: ScheduleItem, groupId: string | null) => {
            result.push({ type: 'item', item, groupId });
        };

        // Ungrouped items at top (no label — they're the default state)
        const ungroupedItems = scheduleItems
            .filter(i => !i.groupId && !i.parentItemId)
            .sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
        for (const item of ungroupedItems) {
            addItemWithSegments(item, null);
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
                    addItemWithSegments(item, group._id);
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
        for (const arr of map.values()) arr.sort((a, b) => (a.startDay ?? 1) - (b.startDay ?? 1));
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
        const isSubItem = (row: FlatRow) => row.type === 'item' && !!row.item.parentItemId;
        const onMove = (e: MouseEvent) => {
            const d = rowDraggingRef.current;
            if (!d) return;
            const deltaRows = Math.round((e.clientY - d.mouseStartY) / ROW_H);
            let newTarget = Math.max(0, Math.min(d.totalRows - 1, d.fromFlatIndex + deltaRows));
            // Snap away from group header rows and sub-item rows
            const dl = displayListRef.current;
            let attempts = 0;
            while (
                attempts++ < d.totalRows &&
                newTarget >= 0 && newTarget < d.totalRows &&
                (dl[newTarget]?.type === 'group' || isSubItem(dl[newTarget]))
            ) {
                const dir = newTarget >= d.fromFlatIndex ? 1 : -1;
                const next = newTarget + dir;
                if (next < 0 || next >= d.totalRows || dl[next]?.type === 'group' || isSubItem(dl[next])) break;
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

            // Build reordered flat list (parent items only — sub-items follow their parent)
            const arr = [...dl];
            const [draggedRow] = arr.splice(d.fromFlatIndex, 1);
            if (draggedRow.type !== 'item' || draggedRow.item.parentItemId) {
                setRowDragging(null);
                document.body.style.cursor = '';
                return;
            }
            let insertAt = d.toFlatIndex > d.fromFlatIndex ? d.toFlatIndex - 1 : d.toFlatIndex;
            insertAt = Math.max(0, Math.min(arr.length, insertAt));
            // If landing on a group header, insert after it (first slot in group)
            if (arr[insertAt]?.type === 'group') insertAt = Math.min(arr.length, insertAt + 1);
            arr.splice(insertAt, 0, draggedRow);

            // Extract group assignments from new order — skip sub-items (they stay with their parent)
            let currentGroupId: string | null = null;
            const groupCounters: Record<string, number> = {};
            const updates: { id: string; groupId: string | null; displayIndex: number }[] = [];

            for (const row of arr) {
                if (row.type === 'group') {
                    currentGroupId = row.group._id;
                } else if (row.type === 'item' && !row.item.parentItemId) {
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

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSplitMode(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Shift + wheel → horizontal scroll on Gantt
    useEffect(() => {
        const el = ganttScrollRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (e.shiftKey) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [ganttScrollRef.current]);

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

    const fetchLaborRows = (onDone?: () => void) => {
        if (!selected) return;
        setLaborLoading(true);
        Api.requestSession<LaborRow[]>({
            command: 'estimate/fetch_labor_for_analysis',
            args: { estimateId: selected.estimateId },
        })
            .then(rows => {
                const fetched = rows ?? [];
                setLaborRows(fetched);
                setLaborRowsLoaded(true);
                const items = scheduleItemsRef.current;
                const newMap: Record<string, { scheduleItemId: string; addedQty: number }> = {};
                for (const row of fetched) {
                    const match = items.find(i => !i.parentItemId && i.laborOfferItemName === row.laborOfferItemName);
                    if (match) newMap[row._id] = { scheduleItemId: match._id, addedQty: match.quantity };
                }
                setAddedLaborMap(newMap);
                onDone?.();
            })
            .catch(() => setLaborRows([]))
            .finally(() => setLaborLoading(false));
    };

    const handleChooseWork = (groupId: string | null) => {
        if (!selected) return;
        setAddWorkForGroupId(groupId);
        setWorksOpen(true);
        fetchLaborRows();
    };

    const handleOpenQtyDialog = (row: LaborRow) => {
        setQtyDialogRow(row);
        const lh = row.laborHours ?? 0;
        const displayVal = lh > 0 ? row.quantity / lh : row.quantity;
        setTimeInput(String(+displayVal.toFixed(2)));
    };

    const handleConfirmQtyAdd = async () => {
        const row = qtyDialogRow;
        if (!row || !selected) return;
        const val = parseFloat(timeInput);
        if (isNaN(val) || val <= 0) return;
        const lh = row.laborHours ?? 0;
        const qty = lh > 0 ? val * lh : val;
        setQtyDialogRow(null);
        setAddingId(row._id);
        const targetGroupId = addWorkForGroupId;
        try {
            const startDay = 1;
            const args: Record<string, unknown> = {
                scheduleId: selected._id,
                laborOfferItemName: row.laborOfferItemName,
                quantity: qty,
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
                setAddedLaborMap(prev => ({ ...prev, [row._id]: { scheduleItemId: created._id, addedQty: qty } }));
            }
        } finally {
            setAddingId(null);
        }
    };

    const handleRemoveLaborItem = async (row: LaborRow) => {
        const entry = addedLaborMap[row._id];
        if (!entry) return;
        await handleDeleteItem(entry.scheduleItemId);
        setAddedLaborMap(prev => { const copy = { ...prev }; delete copy[row._id]; return copy; });
    };

    const handleUniteScheduleItem = async (itemId: string, selectedIds?: Set<string>) => {
        const parentItem = scheduleItems.find(i => i._id === itemId);
        if (!parentItem) return;
        const subItems = scheduleItems.filter(i => i.parentItemId === itemId);
        const toDelete = selectedIds ? subItems.filter(si => selectedIds.has(si._id)) : subItems;
        const restoredQty = (parentItem.quantity ?? 0) + toDelete.reduce((s, si) => s + (si.quantity ?? 0), 0);
        await Promise.all(toDelete.map(si => Api.requestSession({ command: 'schedule/item_delete', args: { id: si._id } })));
        const deleteIds = new Set(toDelete.map(si => si._id));
        setScheduleItems(prev => prev
            .filter(i => !deleteIds.has(i._id))
            .map(i => i._id === itemId ? { ...i, quantity: restoredQty } : i)
        );
        await Api.requestSession({ command: 'schedule/item_update', args: { id: itemId, quantity: restoredQty } });
    };

    const startUniteSelect = (itemId: string) => {
        const subItems = scheduleItems.filter(i => i.parentItemId === itemId);
        if (subItems.length === 0) return;
        if (subItems.length === 1) { handleUniteScheduleItem(itemId); return; }
        setUniteSelectMode({ parentItemId: itemId, selectedIds: new Set() });
    };

    const handleDeleteScheduleItemWithSubs = async (itemId: string) => {
        const subItems = scheduleItems.filter(i => i.parentItemId === itemId);
        await Promise.all(subItems.map(si => Api.requestSession({ command: 'schedule/item_delete', args: { id: si._id } })));
        await handleDeleteItem(itemId);
        setAddedLaborMap(prev => {
            const copy = { ...prev };
            for (const key of Object.keys(copy)) { if (copy[key].scheduleItemId === itemId) delete copy[key]; }
            return copy;
        });
    };

    const handleUniteItem = (row: LaborRow) => {
        const entry = addedLaborMap[row._id];
        if (!entry) return;
        startUniteSelect(entry.scheduleItemId);
    };

    const handleDeleteWithSubItems = async (row: LaborRow) => {
        const entry = addedLaborMap[row._id];
        if (!entry) return;
        await handleDeleteScheduleItemWithSubs(entry.scheduleItemId);
        setAddedLaborMap(prev => { const copy = { ...prev }; delete copy[row._id]; return copy; });
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
        const parentId = item.parentItemId ?? item._id;
        const groupSiblings = scheduleItems.filter(i =>
            i._id !== item._id && (i._id === parentId || i.parentItemId === parentId)
        );

        setDragging({ id: itemId, origStart, origStartHour, deltaX: 0, mouseStartX: mouseDownX });

        // Start auto-scroll rAF loop immediately
        const loop = () => {
            const scroller = ganttScrollRef.current;
            if (scroller && dragMovedRef.current) {
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
            if (!dragMovedRef.current) {
                setDragging(null);
                return;
            }
            const origFrac = (origStart - 1) + origStartHour / 24;
            const candidateFrac = origFrac + dragDeltaRef.current / DAY_W;
            const myDur = itemDuration(item);
            const SNAP_THRESHOLD = 1.0;
            let bestSnapFrac: number | null = null;
            let bestDist = SNAP_THRESHOLD;
            for (const sib of groupSiblings) {
                const sibFrac = ((sib.startDay ?? 1) - 1) + ((sib.startHour ?? 0) / 24);
                const sibEndFrac = sibFrac + itemDuration(sib);
                const dStart = Math.abs(candidateFrac - sibEndFrac);
                if (dStart < bestDist) { bestDist = dStart; bestSnapFrac = sibEndFrac; }
                const dEnd = Math.abs(candidateFrac + myDur - sibFrac);
                if (dEnd < bestDist) { bestDist = dEnd; bestSnapFrac = sibFrac - myDur; }
            }
            let newStartDay: number;
            let newStartHour: number | undefined;
            if (bestSnapFrac !== null) {
                newStartDay = Math.max(1, bestSnapFrac + 1);
                newStartHour = 0;
            } else {
                newStartDay = Math.max(1, Math.round(candidateFrac) + 1);
                newStartHour = undefined;
            }
            setScheduleItems(prev => prev.map(i => i._id === itemId
                ? { ...i, startDay: newStartDay, ...(newStartHour !== undefined ? { startHour: newStartHour } : {}) }
                : i));
            setDragging(null);
            Api.requestSession({ command: 'schedule/item_update', args: { id: itemId, startDay: newStartDay, ...(newStartHour !== undefined ? { startHour: newStartHour } : {}) } });
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
            const newQuantity = lh > 0 ? newDuration * lh : 0;
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
        if (!barContextMenu || !selected) return;
        const item = barContextMenu.item;
        const h = item.startHour ?? 0;
        const startDay = Math.max(1, Math.round(item.startDay ?? 1));
        const durationDays = itemDuration(item);
        const endFrac = (startDay - 1) + h / 24 + durationDays;
        const endDay = Math.max(1, Math.floor(endFrac) + 1);
        const endH = Math.round((endFrac % 1) * 24) % 24;
        setPopoverStartDay(startDay);
        setPopoverTime(`${String(h).padStart(2, '0')}:00`);
        setPopoverEndDay(endDay);
        setPopoverEndTime(`${String(endH).padStart(2, '0')}:00`);
        setBarPopover({ itemId: item._id, anchorEl: barContextMenu.anchorEl, startHour: h });
        setBarContextMenu(null);
    };

    const handleBarPopoverSave = async () => {
        if (!barPopover || !selected) return;
        const item = scheduleItems.find(i => i._id === barPopover.itemId);
        if (!item) return;
        const [sHStr] = popoverTime.split(':');
        const [eHStr] = popoverEndTime.split(':');
        const startH = Math.min(23, Math.max(0, parseInt(sHStr) || 0));
        const endH = Math.min(23, Math.max(0, parseInt(eHStr) || 0));
        const newStartDay = Math.max(1, popoverStartDay);
        const newStartHour = startH;
        const durationDays = Math.max(0.125, (popoverEndDay - popoverStartDay) + (endH - startH) / 24);
        const lh = item.laborHours ?? 0;
        const newQuantity = lh > 0 ? durationDays * lh : undefined;
        setScheduleItems(prev => prev.map(i => i._id === barPopover.itemId
            ? { ...i, startDay: newStartDay, startHour: newStartHour, ...(newQuantity !== undefined ? { quantity: newQuantity } : {}) }
            : i));
        setBarPopover(null);
        const updateArgs: Record<string, unknown> = { id: barPopover.itemId, startDay: newStartDay, startHour: newStartHour };
        if (newQuantity !== undefined) updateArgs.quantity = newQuantity;
        await Api.requestSession({ command: 'schedule/item_update', args: updateArgs });
    };

    const handleSplitItem = () => {
        if (!barContextMenu) return;
        const item = barContextMenu.item;
        setBarContextMenu(null);
        const existingSegs = segmentsByParent.get(item._id) ?? [];
        const totalDays = itemDuration(item) + existingSegs.reduce((s, seg) => s + itemDuration(seg), 0);
        const lh = item.laborHours ?? 0;
        const n = 2;
        const eachDays = totalDays / n;
        setSplitPartsCount(n);
        setSplitEqualMode(true);
        setSplitPartDays(Array.from({ length: n }, () => String(+eachDays.toFixed(2))));
        setSplitByHours(false);
        // Initialize start days for parts 2+ sequentially
        const initStarts: number[] = [];
        let sf = (item.startDay - 1) + (item.startHour ?? 0) / 24;
        for (let i = 0; i < n - 1; i++) { sf += eachDays; initStarts.push(Math.floor(sf) + 1); }
        setSplitPartStartDays(initStarts);
        // Pass item with restored full quantity so dialog and confirm see correct total
        setSplitDialogItem(lh > 0 ? { ...item, quantity: lh * totalDays } : item);
    };

    const handleSplitConfirm = async () => {
        if (!splitMode || !selected) return;
        const item = splitMode.item;
        const sortedMarkers = [...splitMode.markers].sort((a, b) => a - b);
        setSplitMode(null);
        if (sortedMarkers.length === 0) return;
        const lh = item.laborHours ?? 0;
        const totalQ = item.quantity ?? 0;
        if (totalQ <= 0) return;
        const barWidthPx = Math.max(itemDuration(item) * DAY_W - 3, 12);
        const totalDuration = itemDuration(item);
        const fractions = [0, ...sortedMarkers.map(m => Math.max(0.001, Math.min(0.999, m / barWidthPx))), 1];
        const parentItemId = item.parentItemId ?? item._id;
        const baseStartFrac = (item.startDay - 1) + (item.startHour ?? 0) / 24;
        // Delete any existing sub-items before re-splitting
        for (const seg of (segmentsByParent.get(item._id) ?? [])) {
            setScheduleItems(prev => prev.filter(i => i._id !== seg._id));
            await Api.requestSession({ command: 'schedule/item_delete', args: { id: seg._id } });
        }
        const firstQ = totalQ * (fractions[1] - fractions[0]);
        setScheduleItems(prev => prev.map(i => i._id === item._id ? { ...i, quantity: firstQ } : i));
        await Api.requestSession({ command: 'schedule/item_update', args: { id: item._id, quantity: firstQ } });
        for (let i = 1; i < fractions.length - 1; i++) {
            const segQ = totalQ * (fractions[i + 1] - fractions[i]);
            const startFracAbs = baseStartFrac + fractions[i] * totalDuration;
            const startDay = Math.floor(startFracAbs) + 1;
            const startHour = Math.round((startFracAbs % 1) * 24) % 24;
            const newItem = await Api.requestSession<ScheduleItem>({ command: 'schedule/item_add', args: {
                scheduleId: selected._id,
                laborOfferItemName: item.laborOfferItemName,
                quantity: segQ, laborHours: lh,
                unitSymbol: item.unitSymbol ?? '',
                sectionName: item.sectionName ?? '',
                subsectionName: item.subsectionName ?? '',
                startDay, startHour, parentItemId,
                ...(item.groupId ? { groupId: item.groupId } : {}),
            }});
            setScheduleItems(prev => [...prev, { ...newItem, startDay: newItem.startDay ?? startDay, startHour: newItem.startHour ?? startHour, parentItemId }]);
        }
    };

    const handleConfirmSplitDialog = async () => {
        if (!splitDialogItem || !selected) return;
        const item = splitDialogItem;
        setSplitDialogItem(null);
        const lh = item.laborHours ?? 0;
        const totalQty = item.quantity ?? 0;
        const totalDays = itemDuration(item);
        const rawDays = splitEqualMode
            ? Array.from({ length: splitPartsCount }, () => totalDays / splitPartsCount)
            : splitPartDays.map(d => parseFloat(d) || 0);
        const partDaysArr = !splitEqualMode && splitByHours && lh > 0 ? rawDays.map(h => h / lh) : rawDays;
        const quantities = lh > 0
            ? partDaysArr.map(d => d * lh)
            : partDaysArr.map(d => totalQty * (totalDays > 0 ? d / totalDays : 1 / splitPartsCount));
        const newParentId = item.parentItemId ?? item._id;
        // Delete existing sub-items before re-splitting
        for (const seg of (segmentsByParent.get(item._id) ?? [])) {
            setScheduleItems(prev => prev.filter(i => i._id !== seg._id));
            await Api.requestSession({ command: 'schedule/item_delete', args: { id: seg._id } });
        }
        setScheduleItems(prev => prev.map(i => i._id === item._id ? { ...i, quantity: quantities[0] } : i));
        await Api.requestSession({ command: 'schedule/item_update', args: { id: item._id, quantity: quantities[0] } });
        let startFrac = (item.startDay - 1) + (item.startHour ?? 0) / 24;
        for (let i = 1; i < quantities.length; i++) {
            // Use custom start day if set for this part (parts 2+ are index i-1 in splitPartStartDays)
            const customStart = !splitEqualMode && splitPartStartDays[i - 1] > 0 ? splitPartStartDays[i - 1] : null;
            startFrac += partDaysArr[i - 1];
            const nextStartDay = customStart ?? (Math.floor(startFrac) + 1);
            const nextStartHour = customStart ? 0 : Math.round((startFrac % 1) * 24) % 24;
            const newItem = await Api.requestSession<ScheduleItem>({ command: 'schedule/item_add', args: {
                scheduleId: selected._id,
                laborOfferItemName: item.laborOfferItemName,
                quantity: quantities[i],
                laborHours: lh,
                unitSymbol: item.unitSymbol ?? '',
                sectionName: item.sectionName ?? '',
                subsectionName: item.subsectionName ?? '',
                startDay: nextStartDay,
                startHour: nextStartHour,
                parentItemId: newParentId,
                ...(item.groupId ? { groupId: item.groupId } : {}),
            }});
            if (newItem) {
                setScheduleItems(prev => [...prev, {
                    ...newItem,
                    startDay: newItem.startDay ?? nextStartDay,
                    startHour: newItem.startHour ?? nextStartHour,
                    parentItemId: newParentId,
                }]);
            }
        }
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
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        minHeight: '65vh', gap: 2, position: 'relative', overflow: 'hidden',
                        background: 'radial-gradient(ellipse 55% 45% at 50% 48%, rgba(0,171,190,0.06) 0%, transparent 100%)',
                        animation: 'fadeSlideUp 0.5s ease both',
                        '@keyframes fadeSlideUp': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                    }}>
                        {/* decorative floating dots */}
                        {[
                            { top: '12%', left: '18%', size: 6, delay: '0s', opacity: 0.18 },
                            { top: '20%', right: '14%', size: 4, delay: '0.3s', opacity: 0.13 },
                            { bottom: '22%', left: '12%', size: 5, delay: '0.6s', opacity: 0.15 },
                            { bottom: '15%', right: '20%', size: 7, delay: '0.2s', opacity: 0.12 },
                            { top: '38%', left: '6%', size: 3, delay: '0.5s', opacity: 0.1 },
                            { top: '35%', right: '7%', size: 4, delay: '0.4s', opacity: 0.1 },
                        ].map((dot, i) => (
                            <Box key={i} sx={{
                                position: 'absolute', borderRadius: '50%', bgcolor: mainPrimaryColor,
                                width: dot.size, height: dot.size, opacity: dot.opacity,
                                top: dot.top, left: (dot as any).left, right: (dot as any).right, bottom: (dot as any).bottom,
                                animation: `floatDot 4s ease-in-out ${dot.delay} infinite alternate`,
                                '@keyframes floatDot': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-8px)' } },
                            }} />
                        ))}

                        {/* pulsing rings + icon */}
                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            {[1, 2, 3].map(i => (
                                <Box key={i} sx={{
                                    position: 'absolute', borderRadius: '50%',
                                    border: `1.5px solid ${mainPrimaryColor}`,
                                    width: 72 + i * 36, height: 72 + i * 36,
                                    opacity: 0,
                                    animation: `pulseRing 2.8s ease-out ${i * 0.7}s infinite`,
                                    '@keyframes pulseRing': {
                                        '0%': { transform: 'scale(0.82)', opacity: 0.28 },
                                        '100%': { transform: 'scale(1.18)', opacity: 0 },
                                    },
                                }} />
                            ))}
                            <Box sx={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: `radial-gradient(circle, rgba(0,171,190,0.12) 0%, rgba(0,171,190,0.04) 70%)`,
                                border: `1.5px solid rgba(0,171,190,0.2)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                animation: 'iconFloat 3.5s ease-in-out infinite',
                                '@keyframes iconFloat': {
                                    '0%, 100%': { transform: 'translateY(0)' },
                                    '50%': { transform: 'translateY(-7px)' },
                                },
                            }}>
                                <CalendarMonthIcon sx={{ fontSize: 40, color: mainPrimaryColor, opacity: 0.85 }} />
                            </Box>
                        </Box>

                        <Typography variant='h6' sx={{ fontWeight: 600, color: '#2d3748', mt: 1.5, animation: 'fadeSlideUp 0.5s 0.1s ease both' }}>
                            {t('No schedules created yet')}
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#8a9ab0', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.6, animation: 'fadeSlideUp 0.5s 0.2s ease both' }}>
                            {t('Create a schedule to track your project timeline')}
                        </Typography>
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => setDialogOpen(true)}
                            sx={{
                                borderRadius: '25px', height: '40px', mt: 1,
                                borderColor: mainPrimaryColor, color: mainPrimaryColor,
                                '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                                animation: 'popIn 0.45s 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                                '@keyframes popIn': {
                                    '0%': { opacity: 0, transform: 'scale(0.82)' },
                                    '100%': { opacity: 1, transform: 'scale(1)' },
                                },
                            }}
                        >
                            {t('Create')}
                        </Button>
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
            </Box>

            {/* Action buttons — sticky at top when scrolling */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, position: 'sticky', top: 0, zIndex: 10, background: '#f6f9fa', py: 0.5 }}>
                <Box onClick={handleGroupCreate} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 110, height: 72, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: 'rgba(96,125,139,0.06)' }, '&:hover svg': { opacity: '1 !important' } }}>
                    <CreateNewFolderOutlinedIcon sx={{ fontSize: 22, color: '#ff9800', opacity: 0.8 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{t('Add Group')}</Typography>
                </Box>
                <Box onClick={() => handleChooseWork(null)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 110, height: 72, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: `rgba(0,171,190,0.06)` }, '&:hover svg': { opacity: '1 !important' } }}>
                    <WorkOutlineIcon sx={{ fontSize: 22, color: mainPrimaryColor, opacity: 0.55 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{t('Choose a work')}</Typography>
                </Box>
                <Box onClick={() => { if (!laborRowsLoaded) fetchLaborRows(() => setVolumeMonitorOpen(true)); else setVolumeMonitorOpen(true); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 110, height: 72, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: 'rgba(76,175,80,0.06)' }, '&:hover svg': { opacity: '1 !important' } }}>
                    <AssessmentOutlinedIcon sx={{ fontSize: 22, color: '#4caf50', opacity: 0.7 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{t('Volume Monitor')}</Typography>
                </Box>
                <Box onClick={() => { setHoursInput(String(hoursPerDay)); setSettingsOpen(true); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: 110, height: 72, px: 1, py: 1, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0, transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: 'rgba(96,125,139,0.06)' }, '&:hover svg': { opacity: '1 !important' } }}>
                    <TuneIcon sx={{ fontSize: 22, color: '#607d8b', opacity: 0.55 }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>{t('Settings')}</Typography>
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
                            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, background: '#fff', borderBottom: `1px solid ${mainPrimaryColor}18` }}>
                                <Box sx={{ width: nameColW, flexShrink: 0, position: 'sticky', left: 0, zIndex: 4, background: '#fff', borderRight: `1px solid ${mainPrimaryColor}22` }} />
                                {monthGroups.map((group, gi) => (
                                    <Box key={gi} sx={{ width: group.dayCount * DAY_W, flexShrink: 0, px: 1, py: 0.6, borderRight: `1px solid ${mainPrimaryColor}22`, background: gi % 2 === 0 ? 'rgba(0,171,190,0.04)' : 'transparent' }}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: mainPrimaryColor, letterSpacing: '0.05em' }}>
                                            {t('Month')} {gi + 1}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Day number header row */}
                            <Box sx={{ display: 'flex', position: 'sticky', top: 28, zIndex: 3, background: '#fff', borderBottom: `2px solid ${mainPrimaryColor}22` }}>
                                <Box sx={{ width: nameColW, flexShrink: 0, px: 2, py: 0.8, position: 'sticky', left: 0, zIndex: 4, background: '#fff', borderRight: `1px solid ${mainPrimaryColor}22`, overflow: 'visible' }}>
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
                                                background: isGroupDragging ? `#e8f8f9` : `#f0fbfc`,
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
                                const hasSegs = (segmentsByParent.get(item._id) ?? []).length > 0;
                                const baseBarWidth = Math.max(duration * DAY_W - (hasSegs ? 1 : 3), 12);
                                const barWidth = isResizingThis ? Math.max(12, resizing!.origBarWidth + resizing!.deltaX) : baseBarWidth;
                                const isSplitTarget = splitMode?.item._id === item._id;
                                const isUniteTarget = uniteSelectMode?.parentItemId === item._id;
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
                                        onContextMenu={e => { e.preventDefault(); setBarContextMenu({ mouseX: e.clientX, mouseY: e.clientY, item, anchorEl: e.currentTarget as HTMLElement }); }}
                                        sx={{
                                            display: 'flex', minHeight: ROW_H, alignItems: 'stretch',
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
                                            background: fi % 2 === 0 ? '#ffffff' : '#f8fdfe',
                                            display: 'flex', alignItems: 'center',
                                            borderRight: `1px solid ${mainPrimaryColor}18`,
                                            overflow: 'hidden', py: 0.5,
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
                                                overflow: 'hidden', whiteSpace: 'normal',
                                                wordBreak: 'break-word', lineHeight: 1.25,
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
                                        <Box sx={{ position: 'relative', flex: 1, height: ROW_H, overflow: 'hidden' }}>
                                            {days.map(d => {
                                                const date = addDays(projectStartDate, d - 1);
                                                const dayNum = date.getDate();
                                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                return (
                                                    <Box key={d} sx={{ position: 'absolute', left: (d - 1) * DAY_W, top: 0, bottom: 0, width: isWeekend ? DAY_W : 1, background: 'transparent', zIndex: 0 }} />
                                                );
                                            })}
                                            <Tooltip title={isSplitTarget ? '' : tooltipLabel} placement='top' arrow>
                                                <Box
                                                    onMouseDown={isSplitTarget || isUniteTarget ? (e => e.preventDefault()) : (e => handleBarMouseDown(e, item))}
                                                    onClick={isUniteTarget ? (e => { e.stopPropagation(); setUniteSelectMode(prev => {
                                                        if (!prev) return prev;
                                                        const next = new Set(prev.selectedIds);
                                                        if (next.has(item._id)) next.delete(item._id); else next.add(item._id);
                                                        return { ...prev, selectedIds: next };
                                                    }); }) : isSplitTarget ? (e => {
                                                        e.stopPropagation();
                                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                        const offset = Math.round(e.clientX - rect.left);
                                                        setSplitMode(prev => prev ? { ...prev, markers: [...prev.markers, Math.max(2, Math.min(barWidth - 2, offset))] } : prev);
                                                    }) : (e => handleBarClick(e, item))}
                                                    onContextMenu={e => e.preventDefault()}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: startOffset + 2,
                                                        top: 6, height: ROW_H - 12,
                                                        width: barWidth,
                                                        background: isSplitTarget
                                                            ? `linear-gradient(90deg, ${barColor}bb 0%, ${barColor}88 100%)`
                                                            : isUniteTarget
                                                                ? (uniteSelectMode!.selectedIds.has(item._id)
                                                                    ? `linear-gradient(90deg, #fff 0%, #f0fffe 100%)`
                                                                    : `linear-gradient(90deg, ${barColor}99 0%, ${barColor}66 100%)`)
                                                                : `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                                        borderRadius: '5px',
                                                        display: 'flex', alignItems: 'center',
                                                        px: 1, overflow: 'visible',
                                                        boxShadow: isSplitTarget ? `0 0 0 2px rgba(255,255,255,0.8), 0 4px 20px ${barColor}88` : (isUniteTarget && uniteSelectMode!.selectedIds.has(item._id)) ? `0 0 0 2.5px ${mainPrimaryColor}, 0 4px 16px ${mainPrimaryColor}44` : (isDraggingThis || isResizingThis) ? `0 4px 16px ${barColor}88` : `0 2px 8px ${barColor}55`,
                                                        opacity: isUniteTarget && !uniteSelectMode!.selectedIds.has(item._id) ? 0.6 : (isDraggingThis || isResizingThis) ? 0.9 : 1,
                                                        transition: isUniteTarget ? 'box-shadow 0.1s, opacity 0.1s, background 0.1s' : (isDraggingThis || isResizingThis) ? 'none' : 'box-shadow 0.15s',
                                                        zIndex: isSplitTarget ? 10 : (isDraggingThis || isResizingThis) ? 10 : 1,
                                                        outline: isSplitTarget ? '2px dashed rgba(255,255,255,0.7)' : isUniteTarget ? (uniteSelectMode!.selectedIds.has(item._id) ? `2.5px solid ${barColor}` : `2px dashed ${barColor}88`) : 'none',
                                                        outlineOffset: '2px',
                                                        cursor: isUniteTarget ? 'pointer' : isSplitTarget ? 'crosshair' : (isDraggingThis ? 'grabbing' : 'grab'),
                                                    }}
                                                >
                                                    <Typography sx={{ color: isSplitTarget ? 'rgba(255,255,255,0.6)' : (isUniteTarget && uniteSelectMode!.selectedIds.has(item._id)) ? mainPrimaryColor : '#fff', fontSize: '0.63rem', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', flex: 1, overflow: 'hidden' }}>
                                                        {(() => { const d = isResizingThis ? Math.max(0.125, Math.max(12, resizing!.origBarWidth + resizing!.deltaX) / DAY_W) : duration; return d >= 1 ? `${Math.round(d * 10) / 10}${t('day_short')}` : `${Math.round(d * 8)}h`; })()}
                                                    </Typography>
                                                    {/* Resize handle — hidden in split mode */}
                                                    {!isSplitTarget && (
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
                                                    )}
                                                    {/* Split markers */}
                                                    {isSplitTarget && splitMode!.markers.map((m, mi) => (
                                                        <Box
                                                            key={mi}
                                                            onMouseDown={e => {
                                                                e.stopPropagation();
                                                                splitMarkerDragRef.current = { index: mi, startX: e.clientX, origOffset: m, hasMoved: false };
                                                                const onMove = (ev: MouseEvent) => {
                                                                    if (!splitMarkerDragRef.current) return;
                                                                    const delta = ev.clientX - splitMarkerDragRef.current.startX;
                                                                    if (Math.abs(delta) > 3) splitMarkerDragRef.current.hasMoved = true;
                                                                    const newOff = Math.max(2, Math.min(barWidth - 2, splitMarkerDragRef.current.origOffset + delta));
                                                                    const idx = splitMarkerDragRef.current.index;
                                                                    setSplitMode(prev => {
                                                                        if (!prev) return prev;
                                                                        const markers = [...prev.markers];
                                                                        markers[idx] = newOff;
                                                                        return { ...prev, markers };
                                                                    });
                                                                };
                                                                const onUp = () => {
                                                                    window.removeEventListener('mousemove', onMove);
                                                                    window.removeEventListener('mouseup', onUp);
                                                                    if (splitMarkerDragRef.current && !splitMarkerDragRef.current.hasMoved) {
                                                                        const idx = splitMarkerDragRef.current.index;
                                                                        setSplitMode(prev => prev ? { ...prev, markers: prev.markers.filter((_, i) => i !== idx) } : prev);
                                                                    }
                                                                    splitMarkerDragRef.current = null;
                                                                };
                                                                window.addEventListener('mousemove', onMove);
                                                                window.addEventListener('mouseup', onUp);
                                                            }}
                                                            onClick={e => e.stopPropagation()}
                                                            sx={{
                                                                position: 'absolute',
                                                                left: m - 1,
                                                                top: -4, bottom: -4,
                                                                width: 3,
                                                                background: '#fff',
                                                                cursor: 'ew-resize',
                                                                zIndex: 6,
                                                                borderRadius: 1,
                                                                boxShadow: '0 0 4px rgba(0,0,0,0.4)',
                                                                '&::before': {
                                                                    content: '""',
                                                                    position: 'absolute',
                                                                    top: 0, left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    width: 0, height: 0,
                                                                    borderLeft: '5px solid transparent',
                                                                    borderRight: '5px solid transparent',
                                                                    borderBottom: '6px solid #fff',
                                                                },
                                                                '&::after': {
                                                                    content: '""',
                                                                    position: 'absolute',
                                                                    bottom: 0, left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    width: 0, height: 0,
                                                                    borderLeft: '5px solid transparent',
                                                                    borderRight: '5px solid transparent',
                                                                    borderTop: '6px solid #fff',
                                                                },
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Tooltip>
                                            {/* Independent segment bars from split — each fully draggable and resizable */}
                                            {!isSplitTarget && (segmentsByParent.get(item._id) ?? []).map((seg) => {
                                                const segDur = itemDuration(seg);
                                                const segBaseOff = ((seg.startDay ?? 1) - 1) * DAY_W + ((seg.startHour ?? 0) / 24) * DAY_W;
                                                const inUniteMode = uniteSelectMode?.parentItemId === item._id;
                                                const isSegSelected = inUniteMode && uniteSelectMode!.selectedIds.has(seg._id);
                                                const isDraggingThisSeg = !inUniteMode && dragging?.id === seg._id;
                                                const isResizingThisSeg = !inUniteMode && resizing?.id === seg._id;
                                                const segOff = isDraggingThisSeg ? Math.max(0, segBaseOff + dragging!.deltaX) : segBaseOff;
                                                const segBaseW = Math.max(segDur * DAY_W - 1, 12);
                                                const segW = isResizingThisSeg ? Math.max(12, resizing!.origBarWidth + resizing!.deltaX) : segBaseW;
                                                return (
                                                    <Box
                                                        key={seg._id}
                                                        onMouseDown={inUniteMode ? e => e.preventDefault() : e => handleBarMouseDown(e, seg)}
                                                        onClick={inUniteMode ? (e => { e.stopPropagation(); setUniteSelectMode(prev => {
                                                            if (!prev) return prev;
                                                            const next = new Set(prev.selectedIds);
                                                            if (next.has(seg._id)) next.delete(seg._id); else next.add(seg._id);
                                                            return { ...prev, selectedIds: next };
                                                        }); }) : (e => { if (!dragMovedRef.current) { e.stopPropagation(); setBarContextMenu({ mouseX: e.clientX, mouseY: e.clientY, item: seg, anchorEl: e.currentTarget as HTMLElement }); } })}
                                                        onContextMenu={inUniteMode ? e => e.preventDefault() : e => { e.preventDefault(); e.stopPropagation(); setBarContextMenu({ mouseX: e.clientX, mouseY: e.clientY, item: seg, anchorEl: e.currentTarget as HTMLElement }); }}
                                                        sx={{
                                                            position: 'absolute',
                                                            left: segOff + 2, top: 6, height: ROW_H - 12, width: segW,
                                                            background: isSegSelected
                                                                ? `linear-gradient(90deg, #fff 0%, #f0fffe 100%)`
                                                                : inUniteMode
                                                                    ? `linear-gradient(90deg, ${barColor}99 0%, ${barColor}66 100%)`
                                                                    : `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                                            borderRadius: '5px',
                                                            display: 'flex', alignItems: 'center', px: 1, overflow: 'visible',
                                                            boxShadow: isSegSelected
                                                                ? `0 0 0 2.5px ${mainPrimaryColor}, 0 4px 16px ${mainPrimaryColor}44`
                                                                : (isDraggingThisSeg || isResizingThisSeg) ? `0 4px 16px ${barColor}88` : `0 2px 8px ${barColor}55`,
                                                            zIndex: isSegSelected ? 5 : (isDraggingThisSeg || isResizingThisSeg) ? 10 : 1,
                                                            cursor: inUniteMode ? 'pointer' : (isDraggingThisSeg ? 'grabbing' : 'grab'),
                                                            opacity: inUniteMode && !isSegSelected ? 0.6 : (isDraggingThisSeg || isResizingThisSeg) ? 0.9 : 1,
                                                            transition: inUniteMode ? 'box-shadow 0.1s, opacity 0.1s' : (isDraggingThisSeg || isResizingThisSeg) ? 'none' : 'box-shadow 0.15s',
                                                        }}>
                                                        <Typography sx={{ color: isSegSelected ? mainPrimaryColor : '#fff', fontSize: '0.63rem', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', flex: 1, overflow: 'hidden' }}>
                                                            {(() => { const d = isResizingThisSeg ? Math.max(0.125, segW / DAY_W) : segDur; return d >= 1 ? `${Math.round(d * 10) / 10}${t('day_short')}` : `${Math.round(d * 8)}h`; })()}
                                                        </Typography>
                                                        {!inUniteMode && (
                                                            <Box
                                                                onMouseDown={e => handleResizeMouseDown(e, seg)}
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
                                                        )}
                                                    </Box>
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
                    ) : (() => {
                        // Group by sectionName → subsectionName
                        const sections = new Map<string, Map<string, typeof laborRows>>();
                        for (const row of laborRows) {
                            const sec = row.sectionName || '';
                            const sub = row.subsectionName || '';
                            if (!sections.has(sec)) sections.set(sec, new Map());
                            const subsMap = sections.get(sec)!;
                            if (!subsMap.has(sub)) subsMap.set(sub, []);
                            subsMap.get(sub)!.push(row);
                        }

                        const renderRow = (row: LaborRow, index: number) => (
                            <Box
                                key={row._id}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.2,
                                    bgcolor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                                    borderBottom: '1px solid #E3E6E6',
                                    '&:hover': { bgcolor: `${mainPrimaryColor}0d` },
                                }}
                            >
                                <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600, minWidth: 24 }}>{index + 1}</Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {row.laborOfferItemName}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                                    {row.laborHours != null && row.laborHours > 0 && (
                                        <>
                                            <Tooltip title={t('Labor Time')} placement='top' arrow>
                                                <Typography sx={{ fontSize: '0.82rem', color: addedLaborMap[row._id] ? mainPrimaryColor : '#555', fontWeight: addedLaborMap[row._id] ? 600 : 400, cursor: 'default' }}>
                                                    {addedLaborMap[row._id]
                                                        ? `${+((row.quantity - addedLaborMap[row._id].addedQty) / row.laborHours).toFixed(2)} ${t('day_short')}`
                                                        : `${(row.quantity / row.laborHours).toFixed(2)} ${t('day_short')}`}
                                                </Typography>
                                            </Tooltip>
                                            <Typography sx={{ fontSize: '0.82rem', color: '#bbb' }}>/</Typography>
                                        </>
                                    )}
                                    <Tooltip title={addedLaborMap[row._id] ? t('Remaining') : t('Quantity')} placement='top' arrow>
                                        <Typography sx={{ fontSize: '0.82rem', color: addedLaborMap[row._id] ? mainPrimaryColor : '#555', fontWeight: addedLaborMap[row._id] ? 600 : 400, cursor: 'default' }}>
                                            {addedLaborMap[row._id]
                                                ? `${+(row.quantity - addedLaborMap[row._id].addedQty).toFixed(3)} ${row.unitSymbol}`
                                                : `${row.quantity} ${row.unitSymbol}`}
                                        </Typography>
                                    </Tooltip>
                                </Box>
                                <IconButton
                                    size='small'
                                    onClick={() => addedLaborMap[row._id] ? handleRemoveLaborItem(row) : handleOpenQtyDialog(row)}
                                    disabled={addingId === row._id}
                                    sx={{
                                        color: addedLaborMap[row._id] ? '#e53935' : mainPrimaryColor,
                                        '&:hover': { bgcolor: addedLaborMap[row._id] ? 'rgba(229,57,53,0.08)' : `${mainPrimaryColor}15` },
                                    }}
                                >
                                    {addingId === row._id
                                        ? <CircularProgress size={16} sx={{ color: mainPrimaryColor }} />
                                        : addedLaborMap[row._id]
                                            ? <RemoveCircleOutlineIcon sx={{ fontSize: 20 }} />
                                            : <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                                    }
                                </IconButton>
                            </Box>
                        );

                        return (
                            <Box sx={{ border: '1px solid #E3E6E6', borderRadius: 1.5, overflow: 'hidden' }}>
                                {Array.from(sections.entries()).map(([secName, subsMap]) => (
                                    <Accordion
                                        key={secName}
                                        disableGutters
                                        elevation={0}
                                        sx={{ bgcolor: '#fff', '&::before': { display: 'none' }, borderBottom: '1px solid #E3E6E6', '&:last-child': { borderBottom: 'none' } }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#607d8b' }} />}
                                            sx={{
                                                flexDirection: 'row-reverse', gap: 1, px: 1.5, minHeight: 40,
                                                bgcolor: '#f5f9f9',
                                                '&:hover': { bgcolor: '#E8EFEF' },
                                                '& .MuiAccordionSummary-content': { margin: '8px 0' },
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>
                                                {secName || t('General')}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.76rem', color: '#aaa', ml: 1 }}>
                                                ({Array.from(subsMap.values()).flat().length})
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0, bgcolor: '#F5F9F9', pl: 2, borderLeft: '1px solid #D9D9D9', ml: '22px' }}>
                                            {Array.from(subsMap.entries()).map(([subName, rows]) =>
                                                subName ? (
                                                    <Accordion
                                                        key={subName}
                                                        disableGutters
                                                        elevation={0}
                                                        sx={{ bgcolor: 'transparent', '&::before': { display: 'none' }, borderBottom: '1px solid #E3E6E6', '&:last-child': { borderBottom: 'none' } }}
                                                    >
                                                        <AccordionSummary
                                                            expandIcon={<ExpandMoreIcon sx={{ fontSize: 16, color: '#90a4ae' }} />}
                                                            sx={{
                                                                flexDirection: 'row-reverse', gap: 1, px: 1.5, minHeight: 36,
                                                                '&:hover': { bgcolor: '#E8EFEF' },
                                                                '& .MuiAccordionSummary-content': { margin: '6px 0' },
                                                            }}
                                                        >
                                                            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#444' }}>
                                                                {subName}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.74rem', color: '#aaa', ml: 1 }}>
                                                                ({rows.length})
                                                            </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails sx={{ p: 0 }}>
                                                            {rows.map((row, i) => renderRow(row, i))}
                                                        </AccordionDetails>
                                                    </Accordion>
                                                ) : (
                                                    <Box key='__nosub'>
                                                        {rows.map((row, i) => renderRow(row, i))}
                                                    </Box>
                                                )
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        );
                    })()}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setWorksOpen(false); setAddWorkForGroupId(undefined); }} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                </DialogActions>
            </Dialog>

            {/* Quantity input dialog */}
            <Dialog
                open={!!qtyDialogRow}
                onClose={() => setQtyDialogRow(null)}
                maxWidth='xs'
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${mainPrimaryColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.2 }}>
                            <AddCircleOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Enter Duration')}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {qtyDialogRow?.laborOfferItemName}
                            </Typography>
                        </Box>
                        <IconButton size='small' onClick={() => setQtyDialogRow(null)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />
                <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                    {(() => {
                        const lh = qtyDialogRow?.laborHours ?? 0;
                        const maxVal = lh > 0 ? (qtyDialogRow?.quantity ?? 0) / lh : 0;
                        const maxValRounded = +maxVal.toFixed(2);
                        const val = parseFloat(timeInput);
                        const exceedsMax = !isNaN(val) && val > 0 && maxValRounded > 0 && val > maxValRounded;
                        return (
                            <>
                                <TextField
                                    autoFocus
                                    type='number'
                                    fullWidth
                                    size='small'
                                    label={t('Days')}
                                    value={timeInput}
                                    onChange={e => setTimeInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleConfirmQtyAdd(); }}
                                    error={exceedsMax}
                                    helperText={exceedsMax ? t('Exceeds available time') : ''}
                                    InputProps={{
                                        endAdornment: <InputAdornment position='end'>{t('day_short')}</InputAdornment>,
                                    }}
                                    inputProps={{ min: 0, step: 'any' }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                                {maxVal > 0 && (
                                    <Typography variant='caption' sx={{ color: '#aaa', mt: exceedsMax ? 0 : 1, display: 'block' }}>
                                        {t('Available')}: {+maxVal.toFixed(2)} {t('day_short')}
                                    </Typography>
                                )}
                            </>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setQtyDialogRow(null)} sx={{ borderRadius: '20px', color: '#888', textTransform: 'none' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={handleConfirmQtyAdd}
                        disabled={(() => {
                            const val = parseFloat(timeInput);
                            if (isNaN(val) || val <= 0) return true;
                            const lh = qtyDialogRow?.laborHours ?? 0;
                            const maxVal = lh > 0 ? +(((qtyDialogRow?.quantity ?? 0) / lh).toFixed(2)) : Infinity;
                            return val > maxVal;
                        })()}
                        sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#009aab' }, '&.Mui-disabled': { bgcolor: `${mainPrimaryColor}44` } }}
                    >
                        {t('Add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Settings dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(96,125,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <TuneIcon sx={{ fontSize: 20, color: '#607d8b' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', flex: 1 }}>{t('Settings')}</Typography>
                        <IconButton size='small' onClick={() => setSettingsOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />
                <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Parameter row: Hours per working day */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1.5, py: 1.25, borderRadius: 2, border: '1px solid rgba(96,125,139,0.18)', bgcolor: '#f9fafb' }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a' }}>{t('Hours per working day')}</Typography>
                                <Typography sx={{ fontSize: '0.74rem', color: '#aaa', mt: 0.2 }}>{t('Used to convert days to hours')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(96,125,139,0.3)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                                <Box
                                    onClick={() => { const v = Math.max(1, parseInt(hoursInput, 10) - 1); setHoursInput(String(v)); }}
                                    sx={{ px: 1.2, py: 0.6, cursor: parseInt(hoursInput, 10) <= 1 ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 700, color: parseInt(hoursInput, 10) <= 1 ? '#ccc' : '#607d8b', userSelect: 'none', '&:hover': { bgcolor: parseInt(hoursInput, 10) <= 1 ? 'transparent' : 'rgba(96,125,139,0.08)' } }}
                                >−</Box>
                                <Box sx={{ px: 1.5, borderLeft: '1px solid rgba(96,125,139,0.2)', borderRight: '1px solid rgba(96,125,139,0.2)', minWidth: 44, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a1a' }}>{hoursInput}{t('hr_short')}</Typography>
                                </Box>
                                <Box
                                    onClick={() => { const v = Math.min(24, parseInt(hoursInput, 10) + 1); setHoursInput(String(v)); }}
                                    sx={{ px: 1.2, py: 0.6, cursor: parseInt(hoursInput, 10) >= 24 ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 700, color: parseInt(hoursInput, 10) >= 24 ? '#ccc' : '#607d8b', userSelect: 'none', '&:hover': { bgcolor: parseInt(hoursInput, 10) >= 24 ? 'transparent' : 'rgba(96,125,139,0.08)' } }}
                                >+</Box>
                            </Box>
                        </Box>
                        {/* Future parameters go here */}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setSettingsOpen(false)} sx={{ borderRadius: '20px', color: '#888', textTransform: 'none' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={() => {
                            const v = parseInt(hoursInput, 10);
                            if (v > 0 && v <= 24) {
                                setHoursPerDay(v);
                                localStorage.setItem('schedule_hoursPerDay', String(v));
                                setSettingsOpen(false);
                            }
                        }}
                        disabled={(() => { const v = parseInt(hoursInput, 10); return isNaN(v) || v <= 0 || v > 24; })()}
                        sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#009aab' }, '&.Mui-disabled': { bgcolor: `${mainPrimaryColor}44` } }}
                    >
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Volume Monitor modal */}
            <Dialog open={volumeMonitorOpen} onClose={() => setVolumeMonitorOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(76,175,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AssessmentOutlinedIcon sx={{ fontSize: 20, color: '#4caf50' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', flex: 1 }}>{t('Volume Monitor')}</Typography>
                        <IconButton size='small' onClick={() => setVolumeMonitorOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />
                <DialogContent sx={{ px: 3, pt: 1.5, pb: 2, maxHeight: '70vh', overflowY: 'auto' }}>
                    {laborLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                        </Box>
                    ) : laborRows.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <Typography variant='body2' color='text.secondary'>{t('No works found')}</Typography>
                        </Box>
                    ) : (() => {
                        // Group by laborItemId (same as structural analysis labor tab)
                        const groupMap = new Map<string, { name: string; unitSymbol: string; rows: LaborRow[] }>();
                        for (const row of laborRows) {
                            const key = row.laborItemId ?? row._id;
                            if (!groupMap.has(key)) {
                                const name = row.isGroupRow ? (row.laborOfferItemName || row.catalogName || '') : (row.catalogName || row.laborOfferItemName || '');
                                groupMap.set(key, { name, unitSymbol: row.unitSymbol ?? '', rows: [] });
                            }
                            groupMap.get(key)!.rows.push(row);
                        }
                        const groups = Array.from(groupMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
                        const colHdr = { fontSize: '0.72rem', fontWeight: 700, color: '#607d8b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
                        return (
                            <Box sx={{ border: '1px solid #E3E6E6', borderRadius: 1.5, overflow: 'hidden' }}>
                                {/* Table header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, bgcolor: '#f5f9f9', borderBottom: '1px solid #E3E6E6' }}>
                                    <Typography sx={{ flex: 1, ...colHdr }}>{t('Work')}</Typography>
                                    <Typography sx={{ width: 100, textAlign: 'right', ...colHdr }}>{t('Total')}</Typography>
                                    <Typography sx={{ width: 110, textAlign: 'right', ...colHdr }}>{t('Scheduled')}</Typography>
                                    <Typography sx={{ width: 110, textAlign: 'right', ...colHdr }}>{t('Remaining')}</Typography>
                                </Box>
                                {groups.map(([key, group], gi) => {
                                    const isOpen = vmExpanded[key] ?? false;
                                    // Aggregate totals for the group
                                    const totalQty = group.rows.reduce((s, r) => s + r.quantity, 0);
                                    const scheduledQty = group.rows.reduce((s, r) => s + (addedLaborMap[r._id]?.addedQty ?? 0), 0);
                                    const remainingQty = Math.max(0, totalQty - scheduledQty);
                                    const pct = totalQty > 0 ? scheduledQty / totalQty : 0;
                                    const isDone = remainingQty <= 0;
                                    const isPartial = !isDone && scheduledQty > 0;
                                    const remainColor = isDone ? '#9e9e9e' : isPartial ? '#ff9800' : '#e53935';
                                    return (
                                        <Box key={key} sx={{ borderBottom: gi < groups.length - 1 ? '1px solid #E3E6E6' : 'none' }}>
                                            {/* Group header row */}
                                            <Box
                                                onClick={() => setVmExpanded(prev => ({ ...prev, [key]: !isOpen }))}
                                                sx={{ display: 'flex', alignItems: 'flex-start', px: 2, py: 1.1, bgcolor: '#f9fbfb', cursor: 'pointer', '&:hover': { bgcolor: '#f0f7f7' } }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0, pr: 2, gap: 0.75 }}>
                                                    <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                                                        {isOpen
                                                            ? <ExpandMoreIcon sx={{ fontSize: 16, color: mainPrimaryColor }} />
                                                            : <ChevronRightIcon sx={{ fontSize: 16, color: '#90a4ae' }} />}
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.35 }}>
                                                            {group.name}
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: '#ececec', overflow: 'hidden' }}>
                                                            <Box sx={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, bgcolor: mainPrimaryColor, borderRadius: 2, opacity: isDone ? 1 : isPartial ? 0.65 : 0.25 }} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <Typography sx={{ width: 100, textAlign: 'right', fontSize: '0.82rem', color: '#555', flexShrink: 0 }}>
                                                    {+totalQty.toFixed(3)}&thinsp;<span style={{ color: '#aaa', fontSize: '0.72rem' }}>{group.unitSymbol}</span>
                                                </Typography>
                                                <Typography sx={{ width: 110, textAlign: 'right', fontSize: '0.82rem', color: scheduledQty > 0 ? mainPrimaryColor : '#bbb', fontWeight: scheduledQty > 0 ? 600 : 400, flexShrink: 0 }}>
                                                    {+scheduledQty.toFixed(3)}&thinsp;<span style={{ color: scheduledQty > 0 ? `${mainPrimaryColor}99` : '#ccc', fontSize: '0.72rem' }}>{group.unitSymbol}</span>
                                                </Typography>
                                                <Typography sx={{ width: 110, textAlign: 'right', fontSize: '0.82rem', color: remainColor, fontWeight: !isDone ? 600 : 400, flexShrink: 0 }}>
                                                    {+remainingQty.toFixed(3)}&thinsp;<span style={{ color: '#aaa', fontSize: '0.72rem' }}>{group.unitSymbol}</span>
                                                </Typography>
                                            </Box>
                                            {/* Sub-items */}
                                            {isOpen && group.rows.map((row, ri) => {
                                                const sc = addedLaborMap[row._id]?.addedQty ?? 0;
                                                const rem = Math.max(0, row.quantity - sc);
                                                const rDone = rem <= 0;
                                                const rPartial = !rDone && sc > 0;
                                                const rColor = rDone ? '#9e9e9e' : rPartial ? '#ff9800' : '#e53935';
                                                return (
                                                    <Box key={row._id} sx={{ display: 'flex', alignItems: 'flex-start', pl: 5, pr: 1, py: 0.9, bgcolor: ri % 2 === 0 ? '#fff' : '#f8fdfe', borderTop: '1px solid #f0f0f0' }}>
                                                        <Typography sx={{ flex: 1, minWidth: 0, pr: 2, fontSize: '0.80rem', color: '#444', lineHeight: 1.35 }}>
                                                            {row.catalogName || row.laborOfferItemName}
                                                        </Typography>
                                                        <Typography sx={{ width: 100, textAlign: 'right', fontSize: '0.80rem', color: '#555', flexShrink: 0 }}>
                                                            {+row.quantity.toFixed(3)}&thinsp;<span style={{ color: '#aaa', fontSize: '0.70rem' }}>{row.unitSymbol}</span>
                                                        </Typography>
                                                        <Typography sx={{ width: 110, textAlign: 'right', fontSize: '0.80rem', color: sc > 0 ? mainPrimaryColor : '#bbb', fontWeight: sc > 0 ? 600 : 400, flexShrink: 0 }}>
                                                            {+sc.toFixed(3)}&thinsp;<span style={{ color: sc > 0 ? `${mainPrimaryColor}99` : '#ccc', fontSize: '0.70rem' }}>{row.unitSymbol}</span>
                                                        </Typography>
                                                        <Typography sx={{ width: 110, textAlign: 'right', fontSize: '0.80rem', color: rColor, fontWeight: !rDone ? 600 : 400, flexShrink: 0 }}>
                                                            {+rem.toFixed(3)}&thinsp;<span style={{ color: '#aaa', fontSize: '0.70rem' }}>{row.unitSymbol}</span>
                                                        </Typography>
                                                        <Box sx={{ width: 16, flexShrink: 0 }} />
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })()}
                </DialogContent>
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

            {/* Split Work dialog */}
            <Dialog open={!!splitDialogItem} onClose={() => setSplitDialogItem(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,152,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.2 }}>
                            <CallSplitIcon sx={{ fontSize: 20, color: '#ff9800' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Split Work')}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {splitDialogItem?.laborOfferItemName}
                            </Typography>
                        </Box>
                        <IconButton size='small' onClick={() => setSplitDialogItem(null)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />
                <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                    {splitDialogItem && (() => {
                        const lhD = splitDialogItem.laborHours ?? 0;
                        const totalDays = itemDuration(splitDialogItem);
                        const totalHrs = totalDays * lhD;
                        const unitSym = splitDialogItem.unitSymbol || (lhD > 0 ? t('hr_short') : t('day_short'));
                        // helper: convert a "days or hours" input value to days
                        const toDays = (v: string) => { const n = parseFloat(v) || 0; return splitByHours ? (lhD > 0 ? n / lhD : n) : n; };
                        const toDisplay = (days: number) => splitByHours ? +(days * lhD).toFixed(2) : +days.toFixed(2);
                        const sumRaw = splitPartDays.reduce((s, v) => s + toDays(v), 0);
                        const sumOk = Math.abs(sumRaw - totalDays) < 0.015;
                        // helpers for month/day conversion
                        const dayToMD = (day: number) => {
                            let rem = day - 1;
                            for (let m = 0; m < monthGroups.length; m++) {
                                if (rem < monthGroups[m].dayCount) return { m: m + 1, d: rem + 1 };
                                rem -= monthGroups[m].dayCount;
                            }
                            return { m: monthGroups.length, d: monthGroups[monthGroups.length - 1]?.dayCount ?? 1 };
                        };
                        const mdToDay = (m: number, d: number) => {
                            let result = 0;
                            for (let i = 0; i < m - 1; i++) result += monthGroups[i]?.dayCount ?? 30;
                            return result + d;
                        };
                        const changePartsCount = (n: number) => {
                            setSplitPartsCount(n);
                            const each = totalDays / n;
                            setSplitPartDays(Array.from({ length: n }, () => String(toDisplay(each))));
                            const starts: number[] = [];
                            let sf = (splitDialogItem.startDay - 1) + (splitDialogItem.startHour ?? 0) / 24;
                            for (let i = 0; i < n - 1; i++) { sf += each; starts.push(Math.floor(sf) + 1); }
                            setSplitPartStartDays(starts);
                        };
                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {/* Total + split-by toggle */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#888', flex: 1 }}>
                                        {t('Total')}: <strong>{+totalDays.toFixed(2)} {t('day_short')}{lhD > 0 ? ` (${+totalHrs.toFixed(2)} ${unitSym})` : ''}</strong>
                                    </Typography>
                                    {lhD > 0 && (
                                        <Box sx={{ display: 'flex', borderRadius: '20px', border: `1px solid rgba(0,171,190,0.4)`, overflow: 'hidden' }}>
                                            {[false, true].map(byH => (
                                                <Box key={String(byH)} onClick={() => { setSplitByHours(byH); const each = totalDays / splitPartsCount; const displayVal = byH ? +(each * lhD).toFixed(2) : +each.toFixed(2); setSplitPartDays(Array.from({ length: splitPartsCount }, () => String(displayVal))); }}
                                                    sx={{ px: 1.2, py: 0.3, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, userSelect: 'none', transition: 'all 0.15s',
                                                        bgcolor: splitByHours === byH ? mainPrimaryColor : 'transparent',
                                                        color: splitByHours === byH ? '#fff' : mainPrimaryColor,
                                                    }}>
                                                    {byH ? unitSym : t('day_short')}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                                {/* Parts count + Equal/Unequal */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid rgba(0,171,190,0.4)`, borderRadius: 2, overflow: 'hidden' }}>
                                        <Box onClick={() => changePartsCount(Math.max(2, splitPartsCount - 1))}
                                            sx={{ px: 1.2, py: 0.5, cursor: splitPartsCount <= 2 ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 700, color: splitPartsCount <= 2 ? '#ccc' : mainPrimaryColor, userSelect: 'none', '&:hover': { bgcolor: splitPartsCount <= 2 ? 'transparent' : `${mainPrimaryColor}11` } }}>−</Box>
                                        <Typography sx={{ px: 1.5, fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a', minWidth: 24, textAlign: 'center', borderLeft: `1px solid rgba(0,171,190,0.2)`, borderRight: `1px solid rgba(0,171,190,0.2)` }}>
                                            {splitPartsCount}
                                        </Typography>
                                        <Box onClick={() => changePartsCount(Math.min(10, splitPartsCount + 1))}
                                            sx={{ px: 1.2, py: 0.5, cursor: splitPartsCount >= 10 ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 700, color: splitPartsCount >= 10 ? '#ccc' : mainPrimaryColor, userSelect: 'none', '&:hover': { bgcolor: splitPartsCount >= 10 ? 'transparent' : `${mainPrimaryColor}11` } }}>+</Box>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>{t('parts')}</Typography>
                                    <Box sx={{ flex: 1 }} />
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {(['equal', 'unequal'] as const).map(mode => (
                                            <Button key={mode} size='small'
                                                variant={splitEqualMode === (mode === 'equal') ? 'contained' : 'outlined'}
                                                onClick={() => { setSplitEqualMode(mode === 'equal'); setSplitPartDays(Array.from({ length: splitPartsCount }, () => String(toDisplay(totalDays / splitPartsCount)))); }}
                                                sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.78rem', px: 1.5, py: 0.4, minWidth: 0,
                                                    ...(splitEqualMode === (mode === 'equal') ? { bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#009aab' } } : { borderColor: mainPrimaryColor, color: mainPrimaryColor }) }}>
                                                {mode === 'equal' ? t('Equal') : t('Unequal')}
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                                {splitEqualMode ? (
                                    <Typography sx={{ fontSize: '0.82rem', color: '#666', pl: 0.5 }}>
                                        {t('Each part')}: <strong>{toDisplay(totalDays / splitPartsCount)} {splitByHours ? unitSym : t('day_short')}</strong>
                                        {lhD > 0 && !splitByHours && <span style={{ color: '#aaa' }}> ({+(totalDays / splitPartsCount * lhD).toFixed(2)} {unitSym})</span>}
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {Array.from({ length: splitPartsCount }, (_, i) => {
                                            const md = i > 0 ? dayToMD(splitPartStartDays[i - 1] ?? 1) : dayToMD(splitDialogItem.startDay ?? 1);
                                            return (
                                                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, p: 1, borderRadius: 2, bgcolor: 'rgba(0,171,190,0.04)', border: `1px solid rgba(0,171,190,0.12)` }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontSize: '0.76rem', color: '#888', minWidth: 48, flexShrink: 0, fontWeight: 600 }}>{t('Part')} {i + 1}</Typography>
                                                        <TextField type='number' size='small'
                                                            value={splitPartDays[i] ?? ''}
                                                            onChange={e => {
                                                                const u = [...splitPartDays];
                                                                u[i] = e.target.value;
                                                                if (splitPartsCount > 1) {
                                                                    const compIdx = i === splitPartsCount - 1 ? i - 1 : i + 1;
                                                                    const totalDisp = toDisplay(totalDays);
                                                                    const others = u.reduce((s, v, j) => j !== i && j !== compIdx ? s + (parseFloat(v) || 0) : s, 0);
                                                                    const newComp = totalDisp - (parseFloat(e.target.value) || 0) - others;
                                                                    u[compIdx] = String(+Math.max(0.01, newComp).toFixed(2));
                                                                }
                                                                setSplitPartDays(u);
                                                            }}
                                                            InputProps={{ endAdornment: <InputAdornment position='end'>{splitByHours ? unitSym : t('day_short')}</InputAdornment> }}
                                                            inputProps={{ min: 0.01, step: 0.01 }}
                                                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& .MuiInputBase-input': { py: 0.6 } }} />
                                                        {lhD > 0 && (
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', flexShrink: 0 }}>
                                                                {splitByHours
                                                                    ? `${+(toDays(splitPartDays[i] ?? '0')).toFixed(2)}${t('day_short')}`
                                                                    : `${+(toDays(splitPartDays[i] ?? '0') * lhD).toFixed(2)}${unitSym}`}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {/* Start day row */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#aaa', minWidth: 48, flexShrink: 0 }}>{t('Start')}:</Typography>
                                                        {i === 0 ? (
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                                                                {t('Month')} {md.m}, {t('Day')} {md.d}
                                                            </Typography>
                                                        ) : (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Typography sx={{ fontSize: '0.72rem', color: '#666' }}>{t('Month')}</Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid rgba(0,171,190,0.3)`, borderRadius: 1.5, overflow: 'hidden' }}>
                                                                    <Box onClick={() => { const nd = mdToDay(Math.max(1, md.m - 1), 1); const u = [...splitPartStartDays]; u[i - 1] = nd; setSplitPartStartDays(u); }}
                                                                        sx={{ px: 0.8, py: 0.2, cursor: md.m <= 1 ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 700, color: md.m <= 1 ? '#ccc' : mainPrimaryColor, userSelect: 'none' }}>‹</Box>
                                                                    <Typography sx={{ px: 0.75, fontSize: '0.72rem', fontWeight: 600, color: '#1a1a1a', minWidth: 16, textAlign: 'center', borderLeft: `1px solid rgba(0,171,190,0.2)`, borderRight: `1px solid rgba(0,171,190,0.2)` }}>{md.m}</Typography>
                                                                    <Box onClick={() => { const nd = mdToDay(Math.min(monthGroups.length, md.m + 1), 1); const u = [...splitPartStartDays]; u[i - 1] = nd; setSplitPartStartDays(u); }}
                                                                        sx={{ px: 0.8, py: 0.2, cursor: md.m >= monthGroups.length ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 700, color: md.m >= monthGroups.length ? '#ccc' : mainPrimaryColor, userSelect: 'none' }}>›</Box>
                                                                </Box>
                                                                <Typography sx={{ fontSize: '0.72rem', color: '#666' }}>{t('Day')}</Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid rgba(0,171,190,0.3)`, borderRadius: 1.5, overflow: 'hidden' }}>
                                                                    <Box onClick={() => { const nd = mdToDay(md.m, Math.max(1, md.d - 1)); const u = [...splitPartStartDays]; u[i - 1] = nd; setSplitPartStartDays(u); }}
                                                                        sx={{ px: 0.8, py: 0.2, cursor: md.d <= 1 ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 700, color: md.d <= 1 ? '#ccc' : mainPrimaryColor, userSelect: 'none' }}>‹</Box>
                                                                    <Typography sx={{ px: 0.75, fontSize: '0.72rem', fontWeight: 600, color: '#1a1a1a', minWidth: 16, textAlign: 'center', borderLeft: `1px solid rgba(0,171,190,0.2)`, borderRight: `1px solid rgba(0,171,190,0.2)` }}>{md.d}</Typography>
                                                                    <Box onClick={() => { const nd = mdToDay(md.m, Math.min(monthGroups[md.m - 1]?.dayCount ?? 30, md.d + 1)); const u = [...splitPartStartDays]; u[i - 1] = nd; setSplitPartStartDays(u); }}
                                                                        sx={{ px: 0.8, py: 0.2, cursor: md.d >= (monthGroups[md.m - 1]?.dayCount ?? 30) ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 700, color: md.d >= (monthGroups[md.m - 1]?.dayCount ?? 30) ? '#ccc' : mainPrimaryColor, userSelect: 'none' }}>›</Box>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                        <Typography sx={{ fontSize: '0.76rem', color: sumOk ? '#43a047' : '#e53935', mt: 0.25, pl: 0.5 }}>
                                            {t('Sum')}: {+(splitByHours ? sumRaw * lhD : sumRaw).toFixed(2)} / {+(splitByHours ? totalDays * lhD : totalDays).toFixed(2)} {splitByHours ? unitSym : t('day_short')} {sumOk ? '✓' : `(${t('must equal total')})`}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setSplitDialogItem(null)} sx={{ borderRadius: '20px', color: '#888', textTransform: 'none' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={handleConfirmSplitDialog}
                        disabled={!splitEqualMode && splitDialogItem !== null && (() => {
                            const lhCheck = splitDialogItem.laborHours ?? 0;
                            const sumDays = splitPartDays.reduce((s, v) => {
                                const n = parseFloat(v) || 0;
                                return s + (splitByHours && lhCheck > 0 ? n / lhCheck : n);
                            }, 0);
                            return Math.abs(sumDays - itemDuration(splitDialogItem)) >= 0.015;
                        })()}
                        sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' }, '&.Mui-disabled': { bgcolor: '#ff980044' } }}
                    >
                        {t('Split')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bar right-click context menu */}
            <Menu
                open={!!barContextMenu}
                onClose={() => setBarContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={barContextMenu ? { top: barContextMenu.mouseY, left: barContextMenu.mouseX } : undefined}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
            >
                <MenuItem onClick={handleSplitItem} sx={{ fontSize: '0.85rem', py: 0.9 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><CallSplitIcon sx={{ fontSize: 18, color: '#555' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }}>Բաժանել</ListItemText>
                </MenuItem>
                <MenuItem disabled sx={{ fontSize: '0.85rem', py: 0.9 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><LinkIcon sx={{ fontSize: 18, color: '#bbb' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }}>Կապել</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenTimePopover} sx={{ fontSize: '0.85rem', py: 0.9 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><AccessTimeIcon sx={{ fontSize: 18, color: '#555' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }}>Ժամանակ</ListItemText>
                </MenuItem>
                <MenuItem disabled sx={{ fontSize: '0.85rem', py: 0.9 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><TuneIcon sx={{ fontSize: 18, color: '#bbb' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }}>Կարգավորումներ</ListItemText>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {!barContextMenu?.item.parentItemId && (() => {
                    const hasSplit = barContextMenu ? scheduleItems.some(i => i.parentItemId === barContextMenu.item._id) : false;
                    return (
                        <MenuItem
                            disabled={!hasSplit}
                            onClick={() => { if (barContextMenu) { startUniteSelect(barContextMenu.item._id); setBarContextMenu(null); } }}
                            sx={{ fontSize: '0.85rem', py: 0.9 }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <CallSplitIcon sx={{ fontSize: 18, color: hasSplit ? mainPrimaryColor : '#bbb', transform: 'rotate(180deg)' }} />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', color: hasSplit ? 'inherit' : '#bbb' }}>Միացնել</ListItemText>
                        </MenuItem>
                    );
                })()}
                <MenuItem
                    onClick={() => { if (barContextMenu) { handleDeleteScheduleItemWithSubs(barContextMenu.item._id); setBarContextMenu(null); } }}
                    sx={{ fontSize: '0.85rem', py: 0.9 }}
                >
                    <ListItemIcon sx={{ minWidth: 32 }}><DeleteOutlineIcon sx={{ fontSize: 18, color: '#e53935' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', color: '#e53935' }}>Ջնջել</ListItemText>
                </MenuItem>
            </Menu>

            {/* Bar time dialog */}
            <Dialog open={!!barPopover} onClose={() => setBarPopover(null)} maxWidth='sm' fullWidth
                PaperProps={{ sx: { borderRadius: 3, maxWidth: 480 } }}>
                {barPopover && (() => {
                    const item = scheduleItems.find(i => i._id === barPopover.itemId);
                    const sH = parseInt(popoverTime.split(':')[0]) || 0;
                    const eH = parseInt(popoverEndTime.split(':')[0]) || 0;
                    const dur = (popoverEndDay - popoverStartDay) + (eH - sH) / 24;
                    const durVal = !isFinite(dur) || dur <= 0 ? '—'
                        : popoverUnit === 'month' ? `${+(dur / 30).toFixed(1)}`
                        : popoverUnit === 'week' ? `${+(dur / 7).toFixed(1)}`
                        : popoverUnit === 'hour' ? `${+(dur * 24).toFixed(1)}`
                        : `${+dur.toFixed(2)}`;
                    // dayToMD / mdToDay helpers (project-relative)
                    const pDayToMD = (day: number) => {
                        let rem = day - 1;
                        for (let m = 0; m < monthGroups.length; m++) {
                            if (rem < monthGroups[m].dayCount) return { m: m + 1, d: rem + 1 };
                            rem -= monthGroups[m].dayCount;
                        }
                        return { m: monthGroups.length, d: monthGroups[monthGroups.length - 1]?.dayCount ?? 1 };
                    };
                    const pMDToDay = (m: number, d: number) => {
                        let r = 0;
                        for (let i = 0; i < m - 1; i++) r += monthGroups[i]?.dayCount ?? 30;
                        return r + d;
                    };
                    const sMD = pDayToMD(popoverStartDay);
                    const eMD = pDayToMD(popoverEndDay);
                    const FieldRow = ({ label, md, setDay, timeVal, setTimeVal }: { label: string; md: { m: number; d: number }; setDay: (d: number) => void; timeVal: string; setTimeVal: (v: string) => void }) => (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mb: 0.75 }}>{label}</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ flex: 1.4, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#aaa', mb: 0.3 }}>{t('Month')}</Typography>
                                    <Select size='small' fullWidth value={md.m}
                                        onChange={e => { const nm = Number(e.target.value); const nd = Math.min(md.d, monthGroups[nm - 1]?.dayCount ?? 30); setDay(pMDToDay(nm, nd)); }}
                                        sx={{ fontSize: '0.82rem', height: '40px' }}>
                                        {monthGroups.map((_, mi) => (
                                            <MenuItem key={mi} value={mi + 1} sx={{ fontSize: '0.82rem' }}>{t('Month')} {mi + 1}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ flex: 0.7, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#aaa', mb: 0.3 }}>{t('Day')}</Typography>
                                    <TextField size='small' type='number' fullWidth value={md.d}
                                        onChange={e => { const nd = Math.max(1, Math.min(monthGroups[md.m - 1]?.dayCount ?? 30, parseInt(e.target.value) || 1)); setDay(pMDToDay(md.m, nd)); }}
                                        inputProps={{ min: 1, max: monthGroups[md.m - 1]?.dayCount ?? 30, style: { textAlign: 'center' } }}
                                        sx={{ '& .MuiInputBase-root': { height: '40px' } }} />
                                </Box>
                                <Box sx={{ flex: 1.1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#aaa', mb: 0.3 }}>{t('Time')}</Typography>
                                    <TextField type='time' size='small' fullWidth value={timeVal}
                                        onChange={e => setTimeVal(e.target.value)}
                                        inputProps={{ step: 3600 }}
                                        sx={{ '& .MuiInputBase-root': { height: '40px' } }} />
                                </Box>
                            </Box>
                        </Box>
                    );
                    return (
                        <>
                            <DialogTitle sx={{ pb: 0.5, fontSize: '0.95rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item?.laborOfferItemName}
                            </DialogTitle>
                            <DialogContent sx={{ pt: 1.5 }}>
                                <FieldRow label={t('Start')} md={sMD} setDay={setPopoverStartDay} timeVal={popoverTime} setTimeVal={setPopoverTime} />
                                <FieldRow label={t('End')} md={eMD} setDay={setPopoverEndDay} timeVal={popoverEndTime} setTimeVal={setPopoverEndTime} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>{t('Duration')}:</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#333' }}>{durVal}</Typography>
                                    <Select size='small' value={popoverUnit}
                                        onChange={e => setPopoverUnit(e.target.value as 'hour' | 'day' | 'week' | 'month')}
                                        sx={{ fontSize: '0.75rem', height: 28, '.MuiSelect-select': { py: '4px', px: '8px' } }}>
                                        <MenuItem value='month' sx={{ fontSize: '0.8rem' }}>{t('Month')}</MenuItem>
                                        <MenuItem value='week' sx={{ fontSize: '0.8rem' }}>{t('Week')}</MenuItem>
                                        <MenuItem value='day' sx={{ fontSize: '0.8rem' }}>{t('Day')}</MenuItem>
                                        <MenuItem value='hour' sx={{ fontSize: '0.8rem' }}>{t('Hour')}</MenuItem>
                                    </Select>
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ px: 2, pb: 1.5 }}>
                                <Button size='small' onClick={() => setBarPopover(null)} sx={{ borderRadius: '20px', color: '#888', textTransform: 'none' }}>{t('Cancel')}</Button>
                                <Button size='small' variant='contained' onClick={handleBarPopoverSave}
                                    sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#009aab' } }}>
                                    {t('Save')}
                                </Button>
                            </DialogActions>
                        </>
                    );
                })()}
            </Dialog>

            {/* Split mode floating toolbar */}
            {splitMode && (
                <Box sx={{
                    position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: 'rgba(28,28,28,0.93)', borderRadius: 3,
                    px: 3, py: 1.2, boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(10px)',
                }}>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', mr: 0.5 }}>
                        {splitMode.markers.length === 0
                            ? 'Click on the bar to add split points'
                            : `${splitMode.markers.length} split point${splitMode.markers.length > 1 ? 's' : ''} · ${splitMode.markers.length + 1} parts`}
                    </Typography>
                    <Button onClick={() => setSplitMode(null)}
                        size='small'
                        sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none', fontSize: '0.8rem', minWidth: 0 }}>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={handleSplitConfirm}
                        size='small'
                        disabled={splitMode.markers.length === 0}
                        variant='contained'
                        sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.8rem',
                            backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: mainPrimaryColor },
                            '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' } }}>
                        {t('Split')}
                    </Button>
                </Box>
            )}

            {/* Unite select mode floating toolbar */}
            {uniteSelectMode && (
                <Box sx={{
                    position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: 'rgba(28,28,28,0.93)', borderRadius: 3,
                    px: 3, py: 1.2, boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(10px)',
                }}>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', mr: 0.5 }}>
                        {uniteSelectMode.selectedIds.size === 0
                            ? t('Click parts to select')
                            : `${uniteSelectMode.selectedIds.size} ${t('parts')} ${t('selected')}`}
                    </Typography>
                    <Button onClick={() => setUniteSelectMode(null)}
                        size='small'
                        sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none', fontSize: '0.8rem', minWidth: 0 }}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        size='small'
                        disabled={[...uniteSelectMode.selectedIds].filter(id => id !== uniteSelectMode.parentItemId).length < 1}
                        variant='contained'
                        onClick={() => { handleUniteScheduleItem(uniteSelectMode.parentItemId, uniteSelectMode.selectedIds); setUniteSelectMode(null); }}
                        sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.8rem',
                            backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: mainPrimaryColor },
                            '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' } }}>
                        {t('Merge parts')}
                    </Button>
                </Box>
            )}
        </PageContents>
    );
}
