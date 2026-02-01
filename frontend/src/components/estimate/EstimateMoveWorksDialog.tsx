'use client';

import React, { useCallback, useEffect, useState } from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';

import { useTranslation } from 'react-i18next';
import * as Api from '@/api';

export interface EstimateSection {
    _id: string;
    name: string;
    displayIndex?: number;
    totalCost?: number;
}

export interface EstimateSubsection {
    _id: string;
    estimateSectionId: string;
    estimateId: string;
    name: string;
    displayIndex?: number;
    totalCost?: number;
}

interface EstimateMoveWorksDialogProps {
    open: boolean;
    estimateId: string;
    selectedLaborIds: string[];
    onClose: () => void;
    onConfirm: () => void;
}

export default function EstimateMoveWorksDialog(props: EstimateMoveWorksDialogProps) {
    const { open, estimateId, selectedLaborIds, onClose, onConfirm } = props;
    const { t } = useTranslation();

    const [sections, setSections] = useState<EstimateSection[]>([]);
    const [subsections, setSubsections] = useState<EstimateSubsection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSubsectionId, setSelectedSubsectionId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadSections = useCallback(async () => {
        if (!estimateId) return;
        setLoading(true);
        try {
            const data = await Api.requestSession<EstimateSection[]>({
                command: 'estimate/fetch_sections',
                args: { estimateId },
            });
            setSections(data ?? []);
            setSelectedSectionId('');
            setSelectedSubsectionId('');
            setSubsections([]);
        } finally {
            setLoading(false);
        }
    }, [estimateId]);

    useEffect(() => {
        if (open) {
            loadSections();
        }
    }, [open, loadSections]);

    const handleSectionChange = useCallback(
        async (sectionId: string) => {
            setSelectedSectionId(sectionId);
            setSelectedSubsectionId('');
            if (!sectionId) {
                setSubsections([]);
                return;
            }
            setLoading(true);
            try {
                const data = await Api.requestSession<EstimateSubsection[]>({
                    command: 'estimate/fetch_subsections',
                    args: { estimateSectionId: sectionId },
                });
                setSubsections(data ?? []);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const moveToSectionOnly = subsections.length === 0 && !!selectedSectionId;

    const handleMove = useCallback(async () => {
        if (selectedLaborIds.length === 0) return;
        if (!moveToSectionOnly && !selectedSubsectionId) return;
        setSubmitting(true);
        try {
            const body: { estimatedLaborIds: string[]; targetEstimateSubsectionId?: string; targetEstimateSectionId?: string } = {
                estimatedLaborIds: selectedLaborIds,
            };
            if (moveToSectionOnly) {
                body.targetEstimateSectionId = selectedSectionId;
            } else {
                body.targetEstimateSubsectionId = selectedSubsectionId;
            }
            await Api.requestSession({
                command: 'estimate/move_labor_items',
                args: { estimateId },
                json: body,
            });
            onConfirm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    }, [estimateId, selectedSectionId, selectedSubsectionId, moveToSectionOnly, selectedLaborIds, onConfirm, onClose]);

    const handleClose = useCallback(() => {
        if (!submitting) onClose();
    }, [onClose, submitting]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('Move works')}</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <FormControl fullWidth disabled={loading}>
                        <InputLabel>{t('Section')}</InputLabel>
                        <Select
                            value={selectedSectionId}
                            onChange={(e) => handleSectionChange(e.target.value)}
                            label={t('Section')}
                        >
                            {sections.map((sec) => (
                                <MenuItem key={sec._id} value={sec._id}>
                                    {sec.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {subsections.length > 0 && (
                        <FormControl fullWidth disabled={!selectedSectionId || loading}>
                            <InputLabel>{t('Subsection')}</InputLabel>
                            <Select
                                value={selectedSubsectionId}
                                onChange={(e) => setSelectedSubsectionId(e.target.value)}
                                label={t('Subsection')}
                            >
                                {subsections.map((sub) => (
                                    <MenuItem key={sub._id} value={sub._id}>
                                        {sub.name || t('(no name)')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {subsections.length === 0 && selectedSectionId && (
                        <Typography variant="body2" color="text.secondary">
                            {t('This section has no subsections. Works will be moved directly here.')}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleMove}
                    disabled={(!selectedSectionId || (!moveToSectionOnly && !selectedSubsectionId)) || submitting}
                >
                    {t('Move')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
