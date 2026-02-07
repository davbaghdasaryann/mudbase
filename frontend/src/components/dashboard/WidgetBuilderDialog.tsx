'use client';

import React, { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    Stack,
    Typography,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem,
    Select,
    InputLabel
} from '@mui/material';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const WIDGET_TYPES = [
    { id: '1-day', label: '1-Day Chart (Line)', description: 'Shows 24-hour trend with line chart' },
    { id: '15-day', label: '15-Day Analytics (Min/Avg/Max)', description: 'Shows minimum, average, and maximum values' },
    { id: '30-day', label: '30-Day Analytics (Average)', description: 'Shows average value over 30 days' }
];

const DATA_SOURCES = [
    { id: 'labor', label: 'Work Repository (Labor)', description: 'Track labor pricing trends' },
    { id: 'materials', label: 'Materials Repository', description: 'Track material pricing trends' },
    { id: 'estimates', label: 'Estimates', description: 'Track estimate costs' },
    { id: 'eci', label: 'ECI Repository (Aggregated)', description: 'Track aggregated construction indices' }
];

export default function WidgetBuilderDialog({ onClose, onSuccess }: Props) {
    const [t] = useTranslation();
    const [step, setStep] = useState(0);
    const [widgetName, setWidgetName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState('');
    const [creatingNewGroup, setCreatingNewGroup] = useState(false);
    const [widgetType, setWidgetType] = useState<string>('');
    const [dataSource, setDataSource] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [groups, setGroups] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const steps = ['Name & Group', 'Widget Type', 'Data Source', 'Select Item'];

    // Fetch groups on mount
    useEffect(() => {
        fetchGroups();
    }, []);

    // Fetch items when data source changes and step is 3
    useEffect(() => {
        if (dataSource && step === 3) {
            fetchItems();
        }
    }, [dataSource, step]);

    const fetchGroups = async () => {
        try {
            const data = await Api.requestSession<any[]>({
                command: 'dashboard/groups/fetch'
            });
            setGroups(data);
            if (data.length > 0) {
                setSelectedGroup(data[0]._id);
            } else {
                setCreatingNewGroup(true);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            let command = '';
            let args: any = {};

            switch (dataSource) {
                case 'estimates':
                    command = 'estimates/fetch';
                    args = { searchVal: 'empty' }; // Fetch all estimates
                    break;
                case 'materials':
                    command = 'material/fetch_items_with_average_price';
                    break;
                case 'labor':
                    command = 'labor/fetch_items_with_average_price';
                    break;
                case 'eci':
                    command = 'eci/fetch_estimates';
                    break;
            }

            const data = await Api.requestSession<any[]>({
                command,
                args
            });
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Create group if needed
            let groupId = selectedGroup;
            if (creatingNewGroup && newGroupName.trim()) {
                const result = await Api.requestSession<{ insertedId: string }>({
                    command: 'dashboard/group/create',
                    args: { name: newGroupName.trim() }
                });
                groupId = result.insertedId;
            }

            // Create widget
            const config: any = {
                field: dataSource === 'estimates' || dataSource === 'eci' ? 'cost' : 'price'
            };

            if (dataSource === 'estimates' || dataSource === 'eci') {
                config.estimateId = selectedItem._id;
            } else {
                config.itemId = selectedItem._id;
            }

            console.log('Creating widget with config:', config);

            await Api.requestSession({
                command: 'dashboard/widget/widget_create',
                args: {
                    groupId,
                    name: widgetName.trim(),
                    widgetType,
                    dataSource
                },
                json: {
                    dataSourceConfig: config
                }
            });

            onSuccess();
        } catch (error) {
            console.error('Failed to create widget:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                if (creatingNewGroup) {
                    return widgetName.trim().length > 0 && newGroupName.trim().length > 0;
                }
                return widgetName.trim().length > 0 && selectedGroup.length > 0;
            case 1:
                return widgetType.length > 0;
            case 2:
                return dataSource.length > 0;
            case 3:
                return selectedItem !== null;
            default:
                return false;
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>{t('Create Dashboard Widget')}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Stepper activeStep={step} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {step === 0 && (
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label={t('Widget Name')}
                                value={widgetName}
                                onChange={(e) => setWidgetName(e.target.value)}
                                required
                            />

                            <FormControl component='fieldset'>
                                <FormLabel component='legend'>{t('Widget Group')}</FormLabel>
                                <RadioGroup
                                    value={creatingNewGroup ? 'new' : selectedGroup}
                                    onChange={(e) => {
                                        if (e.target.value === 'new') {
                                            setCreatingNewGroup(true);
                                        } else {
                                            setCreatingNewGroup(false);
                                            setSelectedGroup(e.target.value);
                                        }
                                    }}
                                >
                                    {groups.map((group) => (
                                        <FormControlLabel
                                            key={group._id}
                                            value={group._id}
                                            control={<Radio />}
                                            label={group.name}
                                        />
                                    ))}
                                    <FormControlLabel
                                        value='new'
                                        control={<Radio />}
                                        label={t('+ Create New Group')}
                                    />
                                </RadioGroup>
                            </FormControl>

                            {creatingNewGroup && (
                                <TextField
                                    fullWidth
                                    label={t('New Group Name')}
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    required
                                />
                            )}
                        </Stack>
                    )}

                    {step === 1 && (
                        <FormControl component='fieldset' fullWidth>
                            <FormLabel component='legend' sx={{ mb: 2 }}>{t('Select Widget Type')}</FormLabel>
                            <RadioGroup
                                value={widgetType}
                                onChange={(e) => setWidgetType(e.target.value)}
                            >
                                {WIDGET_TYPES.map((type) => (
                                    <Box key={type.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                        <FormControlLabel
                                            value={type.id}
                                            control={<Radio />}
                                            label={
                                                <Box>
                                                    <Typography variant='subtitle1' fontWeight='bold'>
                                                        {type.label}
                                                    </Typography>
                                                    <Typography variant='caption' color='textSecondary'>
                                                        {type.description}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Box>
                                ))}
                            </RadioGroup>
                        </FormControl>
                    )}

                    {step === 2 && (
                        <FormControl component='fieldset' fullWidth>
                            <FormLabel component='legend' sx={{ mb: 2 }}>{t('Select Data Source')}</FormLabel>
                            <RadioGroup
                                value={dataSource}
                                onChange={(e) => setDataSource(e.target.value)}
                            >
                                {DATA_SOURCES.map((source) => (
                                    <Box key={source.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                        <FormControlLabel
                                            value={source.id}
                                            control={<Radio />}
                                            label={
                                                <Box>
                                                    <Typography variant='subtitle1' fontWeight='bold'>
                                                        {source.label}
                                                    </Typography>
                                                    <Typography variant='caption' color='textSecondary'>
                                                        {source.description}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Box>
                                ))}
                            </RadioGroup>
                        </FormControl>
                    )}

                    {step === 3 && (
                        <Box>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <FormControl fullWidth>
                                    <InputLabel>{t('Select Item')}</InputLabel>
                                    <Select
                                        value={selectedItem?._id || ''}
                                        onChange={(e) => {
                                            const item = items.find(i => i._id === e.target.value);
                                            setSelectedItem(item);
                                        }}
                                        label={t('Select Item')}
                                    >
                                        {items.map((item) => (
                                            <MenuItem key={item._id} value={item._id}>
                                                {item.name || item.estimateNumber || 'Unnamed'}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={step > 0 ? handleBack : onClose}>
                    {step > 0 ? t('Back') : t('Cancel')}
                </Button>
                <Button
                    variant='contained'
                    onClick={step === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={!canProceed() || submitting}
                >
                    {submitting ? <CircularProgress size={24} /> : step === steps.length - 1 ? t('Create Widget') : t('Next')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
