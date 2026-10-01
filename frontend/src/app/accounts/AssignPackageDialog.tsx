'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, MenuItem, Select, FormControl, InputLabel, CircularProgress, Typography, TextField, Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from 'api';

interface Package {
    _id: string;
    name: string;
    price: number;
    numberOfUsers: number;
}

interface Props {
    accountId: string;
    accountName: string;
    currentPackageId?: string;
    currentPackageStartDate?: string;
    currentPackageEndDate?: string;
    onClose: () => void;
    onSaved: () => void;
}

const toInputDate = (d?: string) => d ? new Date(d).toISOString().split('T')[0] : '';
const today = () => new Date().toISOString().split('T')[0];
const nextYear = () => new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

export default function AssignPackageDialog({ accountId, accountName, currentPackageId, currentPackageStartDate, currentPackageEndDate, onClose, onSaved }: Props) {
    const { t } = useTranslation();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState<string>(currentPackageId ?? '');
    const [startDate, setStartDate] = useState<string>(toInputDate(currentPackageStartDate) || today());
    const [endDate, setEndDate] = useState<string>(toInputDate(currentPackageEndDate) || nextYear());

    useEffect(() => {
        Api.requestSession<Package[]>({ command: 'packages/fetch' })
            .then(setPackages)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Api.requestSession({
                command: 'packages/assign',
                args: { accountId },
                json: {
                    packageId: selected || null,
                    packageStartDate: selected ? startDate : undefined,
                    packageEndDate: selected ? endDate : undefined,
                },
            });
            onSaved();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': { borderRadius: '8px', '&.Mui-focused fieldset': { borderColor: '#00abbe' } },
        '& .MuiInputLabel-root.Mui-focused': { color: '#00abbe' },
    };

    return (
        <Dialog open onClose={onClose} PaperProps={{ sx: { borderRadius: '14px', width: 420 } }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.05rem', pb: 1 }}>
                {t('Assign Package')}
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Typography variant='body2' color='text.secondary'>{accountName}</Typography>
                {loading ? (
                    <CircularProgress size={24} />
                ) : (
                    <>
                        <FormControl fullWidth size='small' sx={fieldSx}>
                            <InputLabel>{t('Package')}</InputLabel>
                            <Select
                                value={selected}
                                label={t('Package')}
                                onChange={e => setSelected(e.target.value)}
                            >
                                <MenuItem value=''><em>{t('No package')}</em></MenuItem>
                                {packages.map(pkg => (
                                    <MenuItem key={pkg._id} value={pkg._id}>
                                        {pkg.name} — {pkg.numberOfUsers} {t('users')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selected && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                    label={t('Start Date')}
                                    type='date'
                                    size='small'
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldSx}
                                />
                                <TextField
                                    label={t('End Date')}
                                    type='date'
                                    size='small'
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={fieldSx}
                                />
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} disabled={saving} sx={{ color: 'text.secondary', textTransform: 'none' }}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || loading}
                    sx={{ borderRadius: '8px', bgcolor: '#00abbe', '&:hover': { bgcolor: '#009aaa' }, textTransform: 'none', fontWeight: 600 }}
                >
                    {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
