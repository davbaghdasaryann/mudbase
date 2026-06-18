'use client';

import React, { useState, useRef } from 'react';
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
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
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
                <Tooltip title={t('Add widget to this group')} placement="top">
                    <IconButton
                        onClick={() => onAddWidget?.(group._id)}
                        sx={{
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

            {group.widgets && group.widgets.length > 0 ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        alignItems: 'stretch'
                    }}
                >
                    {group.widgets.map((widget: any) => (
                        <Box
                            key={widget._id}
                            sx={{
                                overflow: 'visible',
                                pt: '8px',
                                pr: '8px',
                                ...(widget.widgetType === '1-day'
                                    ? { width: '100%' }
                                    : widget.widgetType === '30-day'
                                        ? { flex: '1 1 60%', minWidth: 400, maxWidth: 750 }
                                        : { flex: '1 1 48%', minWidth: 400, maxWidth: 560 })
                            }}
                        >
                            {widget.widgetType === '1-day' && (
                                <Widget1Day
                                    widget={widget}
                                    onUpdate={onUpdate}
                                    liveSnapshots={liveSnapshots}
                                    onClearLiveSnapshot={onClearLiveSnapshot}
                                />
                            )}
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
            ) : (
                <Typography variant='body2' color='textSecondary'>
                    {t('No widgets in this group yet.')}
                </Typography>
            )}
        </Box>
    );
}
