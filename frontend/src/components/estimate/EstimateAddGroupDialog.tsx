"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, FormControl, InputLabel, Box } from '@mui/material';

interface Section {
    _id: string;
    name: string;
}

interface Props {
    estimateId: string;
    onClose: () => void;
    onConfirm: () => void;
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
                if (data?.length) setSectionId(String((data[0] as any)._id?.$oid ?? data[0]._id));
            })
            .catch(console.error);
    }, [estimateId]);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;
        if (!evt.data?.group || !sectionId) { onClose(); return; }
        await Api.requestSession<any>({
            command: 'estimate/add_subsection',
            args: { estimateSectionId: sectionId, estimateSubsectionName: evt.data.group },
        });
        onConfirm();
    }, [sectionId, onClose, onConfirm]);

    return (
        <F.PageFormDialog title={t('Create Group')} form={form} size='sm' onSubmit={onSubmit} onClose={onClose}>
            <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size='small'>
                    <InputLabel>{t('Choose section')}</InputLabel>
                    <Select
                        value={sectionId}
                        label={t('Choose section')}
                        onChange={e => setSectionId(e.target.value)}
                    >
                        {sections.map(s => (
                            <MenuItem key={String((s as any)._id?.$oid ?? s._id)} value={String((s as any)._id?.$oid ?? s._id)}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <F.InputText xsMax id='group' label={t('Enter group name')} placeholder={t('Group Name')} />
        </F.PageFormDialog>
    );
}
