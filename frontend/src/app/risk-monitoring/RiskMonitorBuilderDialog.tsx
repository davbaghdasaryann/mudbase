'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions, Box, Stack, Typography,
    Button, TextField, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StraightenIcon from '@mui/icons-material/Straighten';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as Api from '@/api';
import { useTranslation } from 'react-i18next';
import WidgetItemHierarchyPicker from '@/components/dashboard/WidgetItemHierarchyPicker';
import WidgetEstimatesListPicker from '@/components/dashboard/WidgetEstimatesListPicker';
import WidgetEciHierarchyPicker from '@/components/dashboard/WidgetEciHierarchyPicker';

const TEAL = '#00ABBE';
const STEP_COUNT = 3;

const CATALOG_SOURCES = [
    { id: 'labor',     labelKey: 'Labor Catalog',       descKey: 'Shows the list of available works in the catalog',          icon: MenuBookIcon,      iconColor: TEAL },
    { id: 'materials', labelKey: 'Materials Catalog',    descKey: 'Shows the list of available materials in the catalog',      icon: LocalFloristIcon,  iconColor: '#6b8e6b' },
    { id: 'estimates', labelKey: 'Estimations List',     descKey: 'Shows the list of estimates created by you',                icon: StraightenIcon,    iconColor: '#5eb8e0' },
    { id: 'eci',       labelKey: 'Aggregated Catalog',   descKey: 'Shows the list of consolidated estimates in the catalog',   icon: AssignmentIcon,    iconColor: '#9b7ec8' },
];

interface Group { _id: string; name: string; }

export interface RiskMonitorConfig {
    groupId: string;
    groupName: string;
    dataSource: string;
    dataSourceLabel: string;
    selectedItem: any;
}

interface Props {
    onClose: () => void;
    onConfirm: (config: RiskMonitorConfig) => void;
}

export default function RiskMonitorBuilderDialog({ onClose, onConfirm }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);

    // Step 0 — group
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [newGroupName, setNewGroupName] = useState('');

    // Step 1 — catalog
    const [dataSource, setDataSource] = useState('');

    // Step 2 — item picker
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        Api.requestSession<Group[]>({ command: 'dashboard/groups/fetch' })
            .then(d => setGroups(d ?? []))
            .catch(() => {});
    }, []);

    const resolvedGroupName = selectedGroupId
        ? (groups.find(g => g._id === selectedGroupId)?.name ?? '')
        : newGroupName;

    const canProceed = () => {
        if (step === 0) return !!selectedGroupId || !!newGroupName.trim();
        if (step === 1) return !!dataSource;
        if (step === 2) return selectedItem != null;
        return false;
    };

    const handleNext = () => { if (step < STEP_COUNT - 1) setStep(s => s + 1); };
    const handleBack = () => { if (step > 0) setStep(s => s - 1); };

    const handleFinish = () => {
        const src = CATALOG_SOURCES.find(s => s.id === dataSource);
        onConfirm({
            groupId: selectedGroupId,
            groupName: resolvedGroupName,
            dataSource,
            dataSourceLabel: src ? t(src.labelKey) : dataSource,
            selectedItem,
        });
    };

    const stepLabel = ['Group Name', 'Select Catalog', 'Preliminary View'][step];
    const primaryLabel = step === STEP_COUNT - 1 ? t('Confirm') : t('Continue');
    const secondaryLabel = step > 0 ? t('Previous') : t('Cancel');

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth={step === 2 ? 'md' : 'md'}
            fullWidth
            PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minHeight: step === 2 ? 520 : undefined } }}
        >
            {/* ── Header / stepper ─────────────────────────────────────────── */}
            <Box sx={{ position: 'relative', pt: 2.5, px: 3, pb: 1 }}>
                <IconButton onClick={onClose} size='small'
                    sx={{ position: 'absolute', right: 12, top: 12, color: 'grey.500' }}>
                    <CloseIcon fontSize='small' />
                </IconButton>
                <Typography variant='h6' fontWeight='bold' color='text.primary'>
                    {t('Configuration')}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.25 }}>
                    {t('Step {{current}} of {{total}}', { current: step + 1, total: STEP_COUNT })} — {t(stepLabel)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {Array.from({ length: STEP_COUNT }).map((_, i) => (
                        <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 1, bgcolor: i <= step ? TEAL : 'grey.300', transition: 'background-color 0.3s' }} />
                    ))}
                </Box>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>

                {/* ── Step 0: Groups ──────────────────────────────────────── */}
                {step === 0 && (
                    <Stack spacing={2.5}>
                        <Box>
                            <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 0.75 }}>
                                {t('Group Name')}
                            </Typography>
                            <TextField
                                fullWidth size='small'
                                placeholder={t('Enter name for new group or select existing below')}
                                value={selectedGroupId ? (groups.find(g => g._id === selectedGroupId)?.name ?? '') : newGroupName}
                                onChange={e => { setSelectedGroupId(''); setNewGroupName(e.target.value); }}
                                onFocus={() => setSelectedGroupId('')}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#d5eef0' }, '&:hover fieldset': { borderColor: TEAL }, '&.Mui-focused fieldset': { borderColor: TEAL } } }}
                            />
                        </Box>
                        {groups.length > 0 && (
                            <Box>
                                <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
                                    {t('Select Existing Group')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                    {groups.map(g => {
                                        const sel = selectedGroupId === g._id;
                                        return (
                                            <Button key={g._id} size='small'
                                                variant={sel ? 'contained' : 'outlined'}
                                                onClick={() => { setSelectedGroupId(g._id); setNewGroupName(''); }}
                                                sx={{ borderRadius: '24px', py: 0.8, px: 1.5, fontSize: '0.8125rem', textTransform: 'none', whiteSpace: 'nowrap', bgcolor: sel ? TEAL : 'transparent', color: sel ? 'white' : TEAL, borderColor: TEAL, '&:hover': { bgcolor: sel ? TEAL : 'rgba(0,171,190,0.08)', borderColor: TEAL } }}>
                                                {g.name}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Step 1: Catalog ─────────────────────────────────────── */}
                {step === 1 && (
                    <Stack spacing={1.5}>
                        {CATALOG_SOURCES.map(src => {
                            const Icon = src.icon;
                            const sel = dataSource === src.id;
                            return (
                                <Box key={src.id} onClick={() => { setDataSource(src.id); setSelectedItem(null); }}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: sel ? TEAL : 'grey.300', bgcolor: sel ? 'rgba(0,171,190,0.04)' : 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'border-color 0.2s, background-color 0.2s', '&:hover': { borderColor: TEAL, bgcolor: 'rgba(0,171,190,0.04)' } }}>
                                    <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon sx={{ color: src.iconColor, fontSize: 24 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='subtitle2' fontWeight={700}>{t(src.labelKey)}</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.78rem' }}>{t(src.descKey)}</Typography>
                                    </Box>
                                    {sel && <CheckCircleIcon sx={{ color: TEAL, fontSize: 22, flexShrink: 0 }} />}
                                </Box>
                            );
                        })}
                    </Stack>
                )}

                {/* ── Step 2: Preview summary ─────────────────────────────── */}
                {step === 2 && (
                    <Box sx={{ pt: 0.5 }}>
                        {/* Item picker */}
                        <Box sx={{ minHeight: 320, mb: 3 }}>
                            {(dataSource === 'labor' || dataSource === 'materials') && (
                                <WidgetItemHierarchyPicker
                                    catalogType={dataSource as 'labor' | 'material'}
                                    selectedId={selectedItem?._id ?? null}
                                    onSelect={setSelectedItem}
                                />
                            )}
                            {dataSource === 'estimates' && (
                                <WidgetEstimatesListPicker
                                    selectedId={selectedItem?._id ?? null}
                                    onSelect={setSelectedItem}
                                />
                            )}
                            {dataSource === 'eci' && (
                                <WidgetEciHierarchyPicker
                                    selectedId={selectedItem?._id ?? null}
                                    onSelect={setSelectedItem}
                                    filterEmpty
                                />
                            )}
                        </Box>

                        {/* Configuration summary card */}
                        {selectedItem && (
                            <Box sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${TEAL}30`, bgcolor: `${TEAL}06` }}>
                                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
                                    <MonitorHeartOutlinedIcon sx={{ color: TEAL, fontSize: '1.2rem' }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                                        {t('Preliminary View')}
                                    </Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>{t('Group')}</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>{resolvedGroupName}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>{t('Catalog')}</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>
                                            {CATALOG_SOURCES.find(s => s.id === dataSource) ? t(CATALOG_SOURCES.find(s => s.id === dataSource)!.labelKey) : dataSource}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>{t('Selected Item')}</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: TEAL, maxWidth: 260, textAlign: 'right' }}>
                                            {selectedItem.name ?? selectedItem.estimateNumber ?? selectedItem.title ?? '—'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button onClick={step > 0 ? handleBack : onClose} sx={{ color: TEAL, textTransform: 'none', fontWeight: 600 }}>
                    {secondaryLabel}
                </Button>
                <Button variant='contained' disabled={!canProceed()}
                    onClick={step === STEP_COUNT - 1 ? handleFinish : handleNext}
                    sx={{ borderRadius: '20px', px: 3, bgcolor: TEAL, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#006f7a' } }}>
                    {primaryLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
