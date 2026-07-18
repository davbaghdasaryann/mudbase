'use client';

import { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, TextField, Stack } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import RiskMonitorBuilderDialog, { type RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import RiskGaugeWidget from './RiskGaugeWidget';
import { mainPrimaryColor } from '@/theme';

interface RiskMonitorGroup {
    id: string;
    name: string;
    configs: RiskMonitorConfig[];
}

const outlinedCreateSx = {
    borderRadius: '25px',
    height: '40px',
    mt: 1,
    '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor },
};

const iconSx = {
    color: '#c8c8c8',
    transition: 'color 0.18s',
    '&:hover': { color: '#424242' },
};

// ─── Per-group card (matches WidgetGroupCard layout) ─────────────────────────
function RiskGroupCard({
    group, onRename, onDeleteGroup, onDeleteConfig, onAddMore,
}: {
    group: RiskMonitorGroup;
    onRename: (id: string, name: string) => void;
    onDeleteGroup: (id: string) => void;
    onDeleteConfig: (groupId: string, cfgIdx: number) => void;
    onAddMore: (groupId: string) => void;
}) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const startEdit = () => { setEditName(group.name); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
    const commitEdit = () => { setEditing(false); if (editName.trim() && editName.trim() !== group.name) onRename(group.id, editName.trim()); };

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            {/* Left: header + gauges */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Group name header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3, minWidth: 0 }}>
                    {editing ? (
                        <TextField
                            inputRef={inputRef}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                            size='small' variant='standard'
                            sx={{ minWidth: 160 }}
                            inputProps={{ style: { fontSize: 20, fontWeight: 700 } }}
                        />
                    ) : (
                        <Typography variant='h5' fontWeight='bold' noWrap>{group.name}</Typography>
                    )}
                    <Tooltip title={t('Rename group')} placement='top'>
                        <IconButton size='small' onClick={startEdit} sx={iconSx}>
                            <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Delete group')} placement='top'>
                        <IconButton size='small' onClick={() => { if (confirm(t('Delete this group and all its monitors?'))) onDeleteGroup(group.id); }} sx={iconSx}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Gauge grid */}
                {group.configs.length > 0 ? (
                    <Box sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: '1fr',
                        '@media (min-width: 960px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                    }}>
                        {group.configs.map((cfg, idx) => (
                            <RiskGaugeWidget
                                key={idx}
                                config={cfg}
                                onDelete={() => onDeleteConfig(group.id, idx)}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant='body2' color='text.secondary'>
                        {t('No monitors in this group yet.')}
                    </Typography>
                )}
            </Box>

            {/* Right: green plus button */}
            <Tooltip title={t('Add monitor to this group')} placement='top'>
                <IconButton
                    onClick={() => onAddMore(group.id)}
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [groups, setGroups] = useState<RiskMonitorGroup[]>([]);
    const [builderOpen, setBuilderOpen] = useState(false);
    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

    const targetGroup = groups.find(g => g.id === targetGroupId);

    const openNewGroup = () => { setTargetGroupId(null); setBuilderOpen(true); };
    const openAddMore  = (groupId: string) => { setTargetGroupId(groupId); setBuilderOpen(true); };

    const handleConfirm = (cfg: RiskMonitorConfig) => {
        if (targetGroupId) {
            setGroups(prev => prev.map(g => g.id === targetGroupId ? { ...g, configs: [...g.configs, cfg] } : g));
        } else {
            setGroups(prev => [...prev, { id: crypto.randomUUID(), name: cfg.groupName, configs: [cfg] }]);
        }
        setBuilderOpen(false);
        setTargetGroupId(null);
    };

    const handleRename = (id: string, name: string) =>
        setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));

    const handleDeleteGroup = (id: string) =>
        setGroups(prev => prev.filter(g => g.id !== id));

    const handleDeleteConfig = (groupId: string, cfgIdx: number) =>
        setGroups(prev => prev.map(g => g.id === groupId
            ? { ...g, configs: g.configs.filter((_, i) => i !== cfgIdx) }
            : g
        ));

    return (
        <PageContents title={t('Risk Monitoring')} current='risk-monitoring' sx={{ background: '#F5F9F9' }}>
            {groups.length === 0 ? (
                /* Empty state */
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                    <MonitorHeartOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {'Մոնիթորինգի ենթակա տվյալներ չկան'}
                    </Typography>
                    <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={openNewGroup} />
                </Box>
            ) : (
                <Stack spacing={4}>
                    {/* Top-right create button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant='contained'
                            startIcon={<AddIcon />}
                            onClick={openNewGroup}
                            sx={{ borderRadius: '25px', height: '40px', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#007a6e' } }}
                        >
                            {t('Create')}
                        </Button>
                    </Box>

                    {groups.map(group => (
                        <RiskGroupCard
                            key={group.id}
                            group={group}
                            onRename={handleRename}
                            onDeleteGroup={handleDeleteGroup}
                            onDeleteConfig={handleDeleteConfig}
                            onAddMore={openAddMore}
                        />
                    ))}
                </Stack>
            )}

            {builderOpen && (
                <RiskMonitorBuilderDialog
                    presetGroupName={targetGroup?.name}
                    onClose={() => { setBuilderOpen(false); setTargetGroupId(null); }}
                    onConfirm={handleConfirm}
                />
            )}
        </PageContents>
    );
}
