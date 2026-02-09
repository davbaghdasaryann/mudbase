'use client';

import React from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
    liveSnapshots?: LiveSnapshot[];
    onClearLiveSnapshot?: (widgetId: string) => void;
}

export default function WidgetGroupCard({ group, onUpdate, liveSnapshots = [], onClearLiveSnapshot }: Props) {
    const [t] = useTranslation();

    const handleDeleteGroup = async () => {
        if (!confirm(t('Delete this widget group and all its widgets?'))) return;

        try {
            await Api.requestSession({
                command: 'dashboard/group/delete',
                args: { groupId: group._id }
            });
            onUpdate();
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant='h5' fontWeight='bold'>{group.name}</Typography>
                <IconButton onClick={handleDeleteGroup} size='small' color='error'>
                    <DeleteIcon />
                </IconButton>
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
                                        ? { flex: '1 1 48%', minWidth: 400, maxWidth: 560 }
                                        : { flex: '1 1 auto', minWidth: 280, maxWidth: 360 })
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
