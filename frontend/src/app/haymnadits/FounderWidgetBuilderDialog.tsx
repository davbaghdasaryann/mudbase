'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogActions, Box, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import WidgetEstimatesListPicker from '@/components/dashboard/WidgetEstimatesListPicker';

const TEAL = '#00ABBE';

export interface FounderWidgetConfig {
    type: 'costing_monitor';
    estimateId: string;
    estimateName: string;
}

interface Props {
    onClose: () => void;
    onConfirm: (config: FounderWidgetConfig) => void;
}

const WIDGET_TYPES = [
    { id: 'costing_monitor', label: 'Ծախսագրում monitoring', icon: AssessmentIcon, iconColor: TEAL },
];

export default function FounderWidgetBuilderDialog({ onClose, onConfirm }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [widgetType, setWidgetType] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const canProceed = step === 0 ? !!widgetType : selectedItem != null;

    const handleFinish = () => {
        if (!selectedItem) return;
        const id = typeof selectedItem._id === 'string' ? selectedItem._id : String(selectedItem._id);
        onConfirm({
            type: 'costing_monitor',
            estimateId: id,
            estimateName: selectedItem.name ?? selectedItem.estimateNumber ?? '—',
        });
    };

    return (
        <Dialog open onClose={onClose} maxWidth='sm' fullWidth
            PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minHeight: step === 1 ? 520 : undefined } }}>
            <Box sx={{ position: 'relative', pt: 2.5, px: 3, pb: 1 }}>
                <IconButton onClick={onClose} size='small' sx={{ position: 'absolute', right: 12, top: 12, color: 'grey.500' }}>
                    <CloseIcon fontSize='small' />
                </IconButton>
                <Typography variant='h6' fontWeight='bold'>{t('Create Widget')}</Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.25 }}>
                    {t('Step {{current}} of {{total}}', { current: step + 1, total: 2 })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {[0, 1].map(i => (
                        <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 1, bgcolor: i <= step ? TEAL : 'grey.300', transition: 'background-color 0.3s' }} />
                    ))}
                </Box>
            </Box>

            <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>
                {step === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {WIDGET_TYPES.map(wt => {
                            const Icon = wt.icon;
                            const sel = widgetType === wt.id;
                            return (
                                <Box key={wt.id} onClick={() => setWidgetType(wt.id)}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: sel ? TEAL : 'grey.300', bgcolor: sel ? 'rgba(0,171,190,0.04)' : 'white', cursor: 'pointer', transition: 'border-color 0.2s', '&:hover': { borderColor: TEAL } }}>
                                    <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon sx={{ color: wt.iconColor, fontSize: 24 }} />
                                    </Box>
                                    <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.92rem' }}>
                                        {wt.label}
                                    </Typography>
                                    {sel && <CheckCircleIcon sx={{ color: TEAL, fontSize: 22 }} />}
                                </Box>
                            );
                        })}
                    </Box>
                )}
                {step === 1 && (
                    <Box sx={{ minHeight: 360 }}>
                        <WidgetEstimatesListPicker
                            selectedId={selectedItem ? (typeof selectedItem._id === 'string' ? selectedItem._id : String(selectedItem._id)) : null}
                            onSelect={setSelectedItem}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button onClick={step > 0 ? () => setStep(0) : onClose} sx={{ color: TEAL, textTransform: 'none', fontWeight: 600 }}>
                    {step > 0 ? t('Previous') : t('Cancel')}
                </Button>
                <Button variant='contained' disabled={!canProceed}
                    onClick={step < 1 ? () => setStep(1) : handleFinish}
                    sx={{ borderRadius: '20px', px: 3, bgcolor: TEAL, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#006f7a' } }}>
                    {step < 1 ? t('Continue') : t('Confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
