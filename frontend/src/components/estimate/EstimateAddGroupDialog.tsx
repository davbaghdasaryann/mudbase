"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, FormControl, InputLabel, Box, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
    const [t] = useTranslation();
    const form = F.useForm({ type: 'input' });
    const [sections, setSections] = useState<Section[]>([]);
    const [sectionId, setSectionId] = useState('');

    useEffect(() => {
        Api.requestSession<Section[]>({ command: 'estimate/fetch_sections', args: { estimateId } })
            .then(data => {
                setSections(data ?? []);
                if (data?.length) setSectionId(toId((data[0] as any)._id));
            })
            .catch(console.error);
    }, [estimateId]);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;
        if (!evt.data?.group || !sectionId) { onClose(); return; }
        const subsection = await Api.requestSession<any>({
            command: 'estimate/add_subsection',
            args: { estimateSectionId: sectionId, estimateSubsectionName: evt.data.group },
        });
        const newSubsectionId = toId(subsection?._id);
        if (newSubsectionId) {
            await Api.requestSession<any>({
                command: 'estimate/add_custom_labor_item',
                args: { estimateSubsectionId: newSubsectionId },
            });
        }
        onConfirm();
    }, [sectionId, form, onClose, onConfirm]);

    return (
        <F.PageFormDialog title={t('Create Group')} form={form} size='sm' onSubmit={onSubmit} onClose={onClose}>
            {/* Section selector */}
            <Box sx={{ mb: 1 }}>
                <Typography variant='caption' sx={{ color: '#888', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {t('Section')}
                </Typography>
                <FormControl fullWidth size='small' sx={{ mt: 0.5 }}>
                    <Select
                        value={sectionId}
                        onChange={e => setSectionId(e.target.value)}
                        displayEmpty
                    >
                        {sections.map(s => (
                            <MenuItem key={toId((s as any)._id)} value={toId((s as any)._id)}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Arrow indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1, color: '#bbb' }}>
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
                <Typography variant='caption' sx={{ color: '#888', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {t('Subsection')}
                </Typography>
            </Box>

            <F.InputText xsMax id='group' label={t('Enter group name')} placeholder={t('Group Name')} />
        </F.PageFormDialog>
    );
}
