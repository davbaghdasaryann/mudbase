'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Stack, Typography, TextField, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Widget1Day from './widgets/Widget1Day';
import Widget15Day from './widgets/Widget15Day';
import Widget30Day from './widgets/Widget30Day';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

export interface LiveSnapshot {
    widgetId: string;
    timestamp: string;
    value: number;
}

interface Props {
    group: any;
    onUpdate: () => void;
    onAddWidget?: (groupId: string) => void;
    liveSnapshots?: LiveSnapshot[];
    onClearLiveSnapshot?: (widgetId: string) => void;
}

export default function WidgetGroupCard({ group, onUpdate, onAddWidget, liveSnapshots = [], onClearLiveSnapshot }: Props) {
    const [t] = useTranslation();
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const [localWidgets, setLocalWidgets] = useState<any[]>(group.widgets ?? []);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    React.useEffect(() => { setLocalWidgets(group.widgets ?? []); }, [group.widgets]);

    const reorder = useCallback(async (reordered: any[]) => {
        setLocalWidgets(reordered);
        try {
            await Api.requestSession({
                command: 'dashboard/widget/reorder',
                json: { groupId: group._id, widgetIds: reordered.map((w: any) => w._id) },
            });
        } catch { onUpdate(); }
    }, [group._id, onUpdate]);

    const handleDragStart = (id: string) => setDragId(id);
    const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
    const handleDrop = (targetId: string) => {
        if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
        const arr = [...localWidgets];
        const fromIdx = arr.findIndex(w => w._id === dragId);
        const toIdx = arr.findIndex(w => w._id === targetId);
        if (fromIdx < 0 || toIdx < 0) return;
        arr.splice(toIdx, 0, arr.splice(fromIdx, 1)[0]);
        setDragId(null); setDragOverId(null);
        reorder(arr);
    };
    const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

    const handleDeleteGroup = async () => {
        if (!confirm(t('Delete this widget group and all its widgets?'))) return;
        try {
            await Api.requestSession({ command: 'dashboard/group/delete', args: { groupId: group._id } });
            onUpdate();
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    const handleStartEdit = () => {
        setEditName(group.name);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleRename = async () => {
        setEditing(false);
        if (!editName.trim() || editName.trim() === group.name) return;
        try {
            await Api.requestSession({ command: 'dashboard/group/rename', args: { groupId: group._id, name: editName.trim() } });
            onUpdate();
        } catch (error) {
            console.error('Failed to rename group:', error);
        }
    };

    const iconSx = {
        color: '#c8c8c8',
        transition: 'color 0.18s',
        '&:hover': { color: '#424242' },
        '&:active': { color: '#212121' },
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            {/* Left column: header row + card grid — naturally ends at plus button's left edge */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3, minWidth: 0 }}>
                    {editing ? (
                        <TextField
                            inputRef={inputRef}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
                            size="small"
                            variant="standard"
                            sx={{ fontSize: 20, fontWeight: 700, minWidth: 160 }}
                            inputProps={{ style: { fontSize: 20, fontWeight: 700 } }}
                        />
                    ) : (
                        <Typography variant='h5' fontWeight='bold' noWrap>{group.name}</Typography>
                    )}
                    <Tooltip title={t('Rename group')} placement="top">
                        <IconButton size='small' onClick={handleStartEdit} sx={iconSx}>
                            <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Delete group')} placement="top">
                        <IconButton size='small' onClick={handleDeleteGroup} sx={iconSx}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {localWidgets.length > 0 ? (
                    <>
                        {/* 1-day widgets: draggable stack */}
                        {localWidgets.filter((w: any) => w.widgetType === '1-day').length > 0 && (
                            <Box sx={{
                                background: 'rgba(255,255,255,0.72)',
                                backdropFilter: 'blur(18px)',
                                WebkitBackdropFilter: 'blur(18px)',
                                borderRadius: 3,
                                boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                                border: '1px solid rgba(0,171,190,0.14)',
                                overflow: 'hidden',
                                mb: 2,
                            }}>
                                {localWidgets.filter((w: any) => w.widgetType === '1-day').map((widget: any, idx: number, arr: any[]) => (
                                    <Box
                                        key={widget._id}
                                        draggable
                                        onDragStart={() => handleDragStart(widget._id)}
                                        onDragOver={e => handleDragOver(e, widget._id)}
                                        onDrop={() => handleDrop(widget._id)}
                                        onDragEnd={handleDragEnd}
                                        sx={{
                                            borderBottom: idx < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                                            cursor: 'grab',
                                            opacity: dragId === widget._id ? 0.4 : 1,
                                            outline: dragOverId === widget._id && dragId !== widget._id ? '2px solid #00ABBE' : 'none',
                                            transition: 'opacity 0.15s, outline 0.15s',
                                        }}
                                    >
                                        <Widget1Day
                                            widget={widget}
                                            onUpdate={onUpdate}
                                            liveSnapshots={liveSnapshots}
                                            onClearLiveSnapshot={onClearLiveSnapshot}
                                            grouped
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Chart widgets: draggable grid */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, '@media (min-width: 600px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, '@media (min-width: 1670px)': { gridTemplateColumns: 'repeat(3, 1fr)' } }}>
                            {localWidgets.filter((w: any) => w.widgetType !== '1-day').map((widget: any) => (
                                <Box
                                    key={widget._id}
                                    draggable
                                    onDragStart={() => handleDragStart(widget._id)}
                                    onDragOver={e => handleDragOver(e, widget._id)}
                                    onDrop={() => handleDrop(widget._id)}
                                    onDragEnd={handleDragEnd}
                                    sx={{
                                        overflow: 'visible', pt: '8px', pr: '8px',
                                        cursor: 'grab',
                                        opacity: dragId === widget._id ? 0.4 : 1,
                                        outline: dragOverId === widget._id && dragId !== widget._id ? '2px solid #00ABBE' : 'none',
                                        borderRadius: 2,
                                        transition: 'opacity 0.15s, outline 0.15s',
                                    }}
                                >
                                    {widget.widgetType === '15-day' && (
                                        <Widget15Day widget={widget} onUpdate={onUpdate} />
                                    )}
                                    {widget.widgetType === '30-day' && (
                                        <Widget30Day
                                            widget={widget}
                                            onUpdate={onUpdate}
                                            liveSnapshots={liveSnapshots}
                                            onClearLiveSnapshot={onClearLiveSnapshot}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </>
                ) : (
                    <Typography variant='body2' color='textSecondary'>
                        {t('No widgets in this group yet.')}
                    </Typography>
                )}
            </Box>

            {/* Right column: plus button, top-aligned */}
            <Tooltip title={t('Add widget to this group')} placement="top">
                <IconButton
                    onClick={() => onAddWidget?.(group._id)}
                    sx={{
                        flexShrink: 0,
                        bgcolor: 'rgba(65,162,64,0.40)',
                        borderRadius: '50%',
                        color: '#fff',
                        p: 0.4,
                        transition: 'background-color 0.18s',
                        '&:hover': { bgcolor: 'rgba(65,162,64,0.56)' },
                    }}
                >
                    <AddIcon sx={{ fontSize: 34 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}
