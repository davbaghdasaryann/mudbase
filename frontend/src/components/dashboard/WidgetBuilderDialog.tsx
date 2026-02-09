'use client';

import React, { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    Box,
    Stack,
    Typography,
    CircularProgress,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StraightenIcon from '@mui/icons-material/Straighten';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import WidgetItemHierarchyPicker from './WidgetItemHierarchyPicker';
import WidgetEstimatesListPicker from './WidgetEstimatesListPicker';
import WidgetEciHierarchyPicker from './WidgetEciHierarchyPicker';
import Widget1Day from './widgets/Widget1Day';
import Widget15Day from './widgets/Widget15Day';
import Widget30Day from './widgets/Widget30Day';

const TEAL = '#00ABBE';
const STEP_COUNT = 4;

const WIDGET_TYPES = [
    { id: '1-day', labelKey: '1-Day (Line)', descKey: 'Visualizes price changes over the last 24 hours', icon: TimelineIcon },
    { id: '15-day', labelKey: '15-Day (Line)', descKey: 'Shows min, average, and max values for 15 days', icon: ShowChartIcon },
    { id: '30-day', labelKey: '30-Day (Averaged)', descKey: 'Visualizes averaged price indicators using 30-day data', icon: BarChartIcon },
];

const DATA_SOURCES = [
    { id: 'labor', labelKey: 'Work repository', descKey: 'Shows the list of available works in the repository', icon: MenuBookIcon, iconColor: TEAL },
    { id: 'materials', labelKey: 'Materials repository', descKey: 'Shows the list of available materials in the repository', icon: LocalFloristIcon, iconColor: '#6b8e6b' },
    { id: 'estimates', labelKey: 'List of estimates', descKey: 'Shows the list of estimates created by you', icon: StraightenIcon, iconColor: '#5eb8e0' },
    { id: 'eci', labelKey: 'Consolidated estimates', descKey: 'Shows the list of consolidated estimates in the repository', icon: AssignmentIcon, iconColor: '#6b8e6b' },
];

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export default function WidgetBuilderDialog({ onClose, onSuccess }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState('');
    const [widgetType, setWidgetType] = useState<string>('');
    const [dataSource, setDataSource] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [groups, setGroups] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);


    const fetchGroups = async () => {
        try {
            const data = await Api.requestSession<any[]>({ command: 'dashboard/groups/fetch' });
            setGroups(data || []);
        } catch (e) {
            console.error('Failed to fetch groups', e);
        }
    };

    const handleNext = () => {
        if (step < STEP_COUNT - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let groupId = selectedGroup;
            if (!groupId && newGroupName.trim()) {
                const result = await Api.requestSession<{ insertedId: string }>({
                    command: 'dashboard/group/create',
                    args: { name: newGroupName.trim() },
                });
                groupId = result.insertedId;
            }

            const config: any = {
                field: dataSource === 'estimates' || dataSource === 'eci' ? 'cost' : 'price',
            };
            if (dataSource === 'estimates' || dataSource === 'eci') {
                config.estimateId = selectedItem._id;
            } else {
                config.itemId = selectedItem._id;
            }

            const widgetName =
                selectedItem?.name ??
                selectedItem?.estimateNumber ??
                selectedItem?.title ??
                'Widget';
            await Api.requestSession({
                command: 'dashboard/widget/widget_create',
                args: { groupId, name: widgetName, widgetType, dataSource },
                json: { dataSourceConfig: config },
            });
            onSuccess();
        } catch (e) {
            console.error('Failed to create widget', e);
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                return !!selectedGroup || !!newGroupName.trim();
            case 1:
                return !!dataSource;
            case 2:
                return selectedItem != null;
            case 3:
                return !!widgetType;
            default:
                return false;
        }
    };

    const primaryButtonLabel = step === STEP_COUNT - 1 ? t('Finish') : t('Continue');
    const secondaryLabel = step > 0 ? t('Previous') : t('Cancel');

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth={step === 3 ? 'lg' : 'md'}
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    overflow: 'visible',
                    minHeight: step === 2 ? 520 : undefined,
                },
            }}
        >
            <Box sx={{ position: 'relative', pt: 2, px: 3, pb: 1 }}>
                <IconButton
                    aria-label={t('Close')}
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'grey.200',
                        color: 'grey.700',
                        '&:hover': { bgcolor: 'grey.300' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                    {t('Configuration')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {t('Step {{current}} of {{total}}', { current: step + 1, total: STEP_COUNT })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {Array.from({ length: STEP_COUNT }).map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: 1,
                                bgcolor: i <= step ? TEAL : 'grey.300',
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <DialogContent sx={{ px: 3, pt: 1, pb: 3 }}>
                {step === 0 && (
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                                {t('Group Name')}
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder={t('Enter name for new group or select existing below')}
                                value={selectedGroup ? (groups.find((g) => g._id === selectedGroup)?.name ?? '') : newGroupName}
                                onChange={(e) => {
                                    setSelectedGroup('');
                                    setNewGroupName(e.target.value);
                                }}
                                onFocus={() => setSelectedGroup('')}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        borderColor: TEAL,
                                        '& fieldset': { borderColor: TEAL },
                                        '&:hover fieldset': { borderColor: TEAL },
                                    },
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                {t('Select Existing Group')}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.75,
                                }}
                            >
                                {groups.map((g) => {
                                    const selected = selectedGroup === g._id;
                                    return (
                                        <Button
                                            key={g._id}
                                            size="small"
                                            variant={selected ? 'contained' : 'outlined'}
                                            onClick={() => {
                                                setSelectedGroup(g._id);
                                                setNewGroupName('');
                                            }}
                                            sx={{
                                                borderRadius: '24px',
                                                py: 0.8,
                                                px: 1.5,
                                                minHeight: 32,
                                                fontSize: '0.8125rem',
                                                whiteSpace: 'nowrap',
                                                bgcolor: selected ? TEAL : 'transparent',
                                                color: selected ? 'white' : TEAL,
                                                borderColor: TEAL,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: selected ? TEAL : 'rgba(0,171,190,0.08)',
                                                    borderColor: TEAL,
                                                },
                                            }}
                                        >
                                            {g.name}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>
                    </Stack>
                )}

                {step === 1 && (
                    <Stack spacing={1.5} sx={{ pt: 1 }}>
                        {DATA_SOURCES.map((src) => {
                            const Icon = src.icon;
                            const selected = dataSource === src.id;
                            return (
                                <Box
                                    key={src.id}
                                    onClick={() => setDataSource(src.id)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: selected ? TEAL : 'grey.300',
                                        bgcolor: 'white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        cursor: 'pointer',
                                        '&:hover': { borderColor: TEAL, bgcolor: 'grey.50' },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 1.5,
                                            bgcolor: 'grey.200',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon sx={{ color: src.iconColor, fontSize: 24 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {t(src.labelKey)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t(src.descKey)}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                )}

                {step === 2 && (
                    <Box sx={{ pt: 1, minHeight: 400 }}>
                        {dataSource === 'labor' || dataSource === 'materials' ? (
                            <WidgetItemHierarchyPicker
                                catalogType={dataSource as 'labor' | 'material'}
                                selectedId={selectedItem?._id ?? null}
                                onSelect={(item) => setSelectedItem(item)}
                            />
                        ) : dataSource === 'estimates' ? (
                            <WidgetEstimatesListPicker
                                selectedId={selectedItem?._id ?? null}
                                onSelect={(item) => setSelectedItem(item)}
                            />
                        ) : dataSource === 'eci' ? (
                            <WidgetEciHierarchyPicker
                                selectedId={selectedItem?._id ?? null}
                                onSelect={(item) => setSelectedItem(item)}
                            />
                        ) : null}
                    </Box>
                )}

                {step === 3 && (
                    <Box sx={{ display: 'flex', gap: 3, pt: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 280px', minWidth: 280 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: 'block' }}>
                                {t('Select Visualization Type')}
                            </Typography>
                            {WIDGET_TYPES.map((type) => {
                                const Icon = type.icon;
                                const selected = widgetType === type.id;
                                return (
                                    <Box
                                        key={type.id}
                                        onClick={() => setWidgetType(type.id)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 2,
                                            border: '2px solid',
                                            borderColor: selected ? TEAL : 'grey.300',
                                            bgcolor: selected ? 'rgba(0,171,190,0.04)' : 'grey.50',
                                            cursor: 'pointer',
                                            '&:hover': { borderColor: TEAL },
                                        }}
                                    >
                                        <Box sx={{ color: selected ? TEAL : 'grey.500' }}>
                                            <Icon sx={{ fontSize: 28 }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {t(type.labelKey)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t(type.descKey)}
                                            </Typography>
                                        </Box>
                                        {selected && (
                                            <CheckCircleIcon sx={{ color: TEAL, fontSize: 24 }} />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                        <Box sx={{ flex: '1 1 320px', minWidth: 320 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {t('Preliminary View')}
                            </Typography>
                            <Box
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    overflow: 'hidden',
                                    bgcolor: '#fafafa',
                                    minHeight: 360,
                                    p: 2,
                                }}
                            >
                                {widgetType === '1-day' && (
                                    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', p: 2, minHeight: 320 }}>
                                        <Widget1Day
                                            widget={{
                                                _id: 'preview',
                                                name: selectedItem?.name ?? selectedItem?.estimateNumber ?? selectedItem?.title ?? t('Widget'),
                                                widgetType: '1-day',
                                                dataSource,
                                                dataSourceConfig: (dataSource === 'estimates' || dataSource === 'eci') ? { estimateId: selectedItem?._id } : { itemId: selectedItem?._id },
                                            }}
                                            onUpdate={() => { }}
                                        />
                                    </Box>
                                )}
                                {widgetType === '15-day' && (
                                    <Box sx={{ minHeight: 320 }}>
                                        <Widget15Day
                                            widget={{
                                                _id: 'preview',
                                                name: selectedItem?.name ?? selectedItem?.estimateNumber ?? selectedItem?.title ?? t('Widget'),
                                                widgetType: '15-day',
                                                dataSource,
                                                dataSourceConfig: (dataSource === 'estimates' || dataSource === 'eci') ? { estimateId: selectedItem?._id } : { itemId: selectedItem?._id },
                                            }}
                                            onUpdate={() => { }}
                                        />
                                    </Box>
                                )}
                                {widgetType === '30-day' && (
                                    <Box sx={{ minHeight: 320 }}>
                                        <Widget30Day
                                            widget={{
                                                _id: 'preview',
                                                name: selectedItem?.name ?? selectedItem?.estimateNumber ?? selectedItem?.title ?? t('Widget'),
                                                widgetType: '30-day',
                                                dataSource,
                                                dataSourceConfig: (dataSource === 'estimates' || dataSource === 'eci') ? { estimateId: selectedItem?._id } : { itemId: selectedItem?._id },
                                            }}
                                            onUpdate={() => { }}
                                        />
                                    </Box>
                                )}
                                {!widgetType && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Select a visualization type to preview')}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pt: 3, pb: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    onClick={step > 0 ? handleBack : onClose}
                    sx={{ color: TEAL, textTransform: 'none' }}
                >
                    {secondaryLabel}
                </Button>
                <Button
                    variant="contained"
                    onClick={step === STEP_COUNT - 1 ? handleSubmit : handleNext}
                    disabled={!canProceed() || submitting}
                    sx={{
                        bgcolor: TEAL,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#0097a7' },
                    }}
                >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : primaryButtonLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
