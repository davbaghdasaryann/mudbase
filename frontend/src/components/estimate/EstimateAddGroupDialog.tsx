'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem,
    Stack, CircularProgress, OutlinedInput,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';

interface Section {
    _id: string;
    name: string;
}

interface Props {
    estimateId: string;
    onClose: () => void;
    onConfirm: () => void;
}

function toId(v: any): string {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v.$oid ?? v.oid ?? String(v);
}

export default function EstimateAddGroupDialog({ estimateId, onClose, onConfirm }: Props) {
    const { t } = useTranslation();
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } })
            .then(data => { setSections(data ?? []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [estimateId]);

    const handleConfirm = useCallback(async () => {
        if (!selectedSectionId || !groupName.trim()) return;
        setSubmitting(true);
        try {
            const subsection = await Api.requestSession<any>({
                command: 'estimate/add_subsection',
                args: { estimateSectionId: selectedSectionId, estimateSubsectionName: groupName.trim() },
            });
            const newSubsectionId = toId(subsection?._id);
            if (newSubsectionId) {
                await Api.requestSession<any>({
                    command: 'estimate/add_custom_labor_item',
                    args: { estimateSubsectionId: newSubsectionId },
                });
            }
            onConfirm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    }, [selectedSectionId, groupName, onConfirm, onClose]);

    return (
        <Dialog open onClose={() => { if (!submitting) onClose(); }} maxWidth='sm' fullWidth>
            <DialogTitle>{t('Create Group')}</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <FormControl fullWidth disabled={loading}>
                        <InputLabel>{t('Section')}</InputLabel>
                        <Select
                            value={selectedSectionId}
                            onChange={e => { setSelectedSectionId(e.target.value); setGroupName(''); }}
                            label={t('Section')}
                        >
                            {sections.map(s => (
                                <MenuItem key={toId((s as any)._id)} value={toId((s as any)._id)}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={!selectedSectionId || submitting}>
                        <InputLabel shrink={!!groupName}>{t('Group Name')}</InputLabel>
                        <OutlinedInput
                            label={t('Group Name')}
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                            placeholder={selectedSectionId ? t('Enter group name') : ''}
                            autoFocus={!!selectedSectionId}
                        />
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>{t('Cancel')}</Button>
                <Button
                    variant='contained'
                    onClick={handleConfirm}
                    disabled={!selectedSectionId || !groupName.trim() || submitting}
                    startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                >
                    {t('Create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
