'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Typography, Switch, Divider, IconButton, Card, CardContent,
    Chip, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';
import * as Api from 'api';

const BRAND = '#00abbe';

interface Package {
    _id?: string;
    name: string;
    price: number;
    numberOfUsers: number;
    numberOfEstimations: number;
    worksCatalog: boolean;
    materialsCatalog: boolean;
    aggregatedCatalog: boolean;
    costing: boolean;
    analysis: boolean;
    performance: boolean;
    seeOffers: boolean;
    archiveEstimations: boolean;
    shareEstimations: boolean;
    duplicateEstimation: boolean;
    exportEstimation: boolean;
    exportBoQ: boolean;
}

const EMPTY_PKG: Package = {
    name: '', price: 0, numberOfUsers: 0, numberOfEstimations: 0,
    worksCatalog: false, materialsCatalog: false, aggregatedCatalog: false,
    costing: false, analysis: false, performance: false,
    seeOffers: false, archiveEstimations: false, shareEstimations: false,
    duplicateEstimation: false, exportEstimation: false, exportBoQ: false,
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 48 }}>
            <Typography sx={{ flex: 1, fontSize: '0.95rem', color: 'text.primary' }}>{label}</Typography>
            <Box sx={{ width: 275, flexShrink: 0 }}>{children}</Box>
        </Box>
    );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 1.2,
            border: '1px solid #e5e7eb', borderRadius: '8px',
            bgcolor: checked ? 'rgba(0,171,190,0.04)' : '#fafafa',
        }}>
            <Typography sx={{ fontSize: '0.95rem', color: 'text.primary' }}>{label}</Typography>
            <Switch
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND },
                }}
            />
        </Box>
    );
}

const numberFieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '&.Mui-focused fieldset': { borderColor: BRAND },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
};

function NumericField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <TextField
            value={value || ''}
            onChange={e => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
            size='small'
            fullWidth
            inputProps={{ inputMode: 'numeric' }}
            sx={numberFieldSx}
        />
    );
}

const createButtonSx = {
    borderRadius: '25px', height: '40px',
    borderColor: mainPrimaryColor, color: mainPrimaryColor,
    textTransform: 'none', fontWeight: 600,
    '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
} as const;

export default function PackagesPage() {
    const { t } = useTranslation();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Package>({ ...EMPTY_PKG });

    const fetchPackages = useCallback(async () => {
        try {
            const data = await Api.requestSession<Package[]>({ command: 'packages/fetch' });
            setPackages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPackages(); }, [fetchPackages]);

    const openCreate = () => { setForm({ ...EMPTY_PKG }); setEditingId(null); setOpen(true); };
    const openEdit = (pkg: Package) => { setForm({ ...pkg }); setEditingId(pkg._id!); setOpen(true); };

    const handleClose = () => { setOpen(false); setEditingId(null); setForm({ ...EMPTY_PKG }); };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await Api.requestSession({ command: 'packages/update', args: { _id: editingId }, json: form });
            } else {
                await Api.requestSession({ command: 'packages/create', json: form });
            }
            handleClose();
            fetchPackages();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (pkg: Package) => {
        if (!confirm(t('Delete this package?'))) return;
        try {
            await Api.requestSession({ command: 'packages/delete', args: { _id: pkg._id } });
            fetchPackages();
        } catch (e) {
            console.error(e);
        }
    };

    const set = (field: keyof Package) => (v: any) => setForm(f => ({ ...f, [field]: v }));

    return (
        <PageContents title={t('Packages')}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant='outlined' startIcon={<AddIcon />} onClick={openCreate} sx={createButtonSx}>
                    {t('Create')}
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
            ) : packages.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
                    <Inventory2OutlinedIcon sx={{ fontSize: 130, color: BRAND, opacity: 0.10 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, color: 'text.secondary', mt: -1 }}>{t('No packages yet')}</Typography>
                    <Typography variant='body2' sx={{ color: 'text.disabled', mb: 1 }}>{t('Create your first package to get started')}</Typography>
                    <Button variant='outlined' startIcon={<AddIcon />} onClick={openCreate} sx={createButtonSx}>{t('Create')}</Button>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                    {packages.map(pkg => (
                        <Card key={pkg._id} variant='outlined' sx={{ borderRadius: 3, borderColor: '#e5e7eb', position: 'relative' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant='h6' fontWeight={700} sx={{ flex: 1 }}>{pkg.name}</Typography>
                                    <Box>
                                        <IconButton size='small' onClick={() => openEdit(pkg)}><EditIcon fontSize='small' /></IconButton>
                                        <IconButton size='small' onClick={() => handleDelete(pkg)} color='error'><DeleteIcon fontSize='small' /></IconButton>
                                    </Box>
                                </Box>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                                    {pkg.price ? `${pkg.price.toLocaleString()} AMD` : '—'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip icon={<PeopleOutlinedIcon />} label={`${pkg.numberOfUsers} ${t('users')}`} size='small' />
                                    <Chip icon={<CalculateOutlinedIcon />} label={`${pkg.numberOfEstimations} ${t('est.')}`} size='small' />
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth={false} PaperProps={{ sx: { borderRadius: '14px', width: 660, maxHeight: '90vh' } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>
                    {editingId ? t('Edit Package') : t('Package Settings')}
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    {/* Name — full width */}
                    <TextField
                        label={t('Package Name')}
                        value={form.name}
                        onChange={e => set('name')(e.target.value)}
                        fullWidth
                        sx={{ ...numberFieldSx, mb: 2 }}
                    />
                    {/* Price / Users / Estimations — 3-column grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 0.5 }}>
                        <TextField
                            label={t('Price')}
                            value={form.price || ''}
                            onChange={e => set('price')(Number(e.target.value.replace(/\D/g, '')) || 0)}
                            inputProps={{ inputMode: 'numeric' }}
                            sx={numberFieldSx}
                        />
                        <TextField
                            label={t('Users')}
                            value={form.numberOfUsers || ''}
                            onChange={e => set('numberOfUsers')(Number(e.target.value.replace(/\D/g, '')) || 0)}
                            inputProps={{ inputMode: 'numeric' }}
                            sx={numberFieldSx}
                        />
                        <TextField
                            label={t('Estimations')}
                            value={form.numberOfEstimations || ''}
                            onChange={e => set('numberOfEstimations')(Number(e.target.value.replace(/\D/g, '')) || 0)}
                            inputProps={{ inputMode: 'numeric' }}
                            sx={numberFieldSx}
                        />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <MenuBookOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('Library Access')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('Works Catalog')} checked={form.worksCatalog} onChange={set('worksCatalog')} />
                        <SwitchRow label={t('Materials Catalog')} checked={form.materialsCatalog} onChange={set('materialsCatalog')} />
                        <SwitchRow label={t('Aggregated Catalog')} checked={form.aggregatedCatalog} onChange={set('aggregatedCatalog')} />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CategoryOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Բաժինների հասանելիություն</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label='Ծախսագրում' checked={form.costing} onChange={set('costing')} />
                        <SwitchRow label='Վերլուծություն' checked={form.analysis} onChange={set('analysis')} />
                        <SwitchRow label='Կատարողական' checked={form.performance} onChange={set('performance')} />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <SellOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('Offer Permissions')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('See Offers')} checked={form.seeOffers} onChange={set('seeOffers')} />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CalculateOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('Estimation Permissions')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('Archive Estimation')} checked={form.archiveEstimations} onChange={set('archiveEstimations')} />
                        <SwitchRow label={t('Share Estimation')} checked={form.shareEstimations} onChange={set('shareEstimations')} />
                        <SwitchRow label={t('Duplicate Estimation')} checked={form.duplicateEstimation} onChange={set('duplicateEstimation')} />
                        <SwitchRow label={t('Export Estimation')} checked={form.exportEstimation} onChange={set('exportEstimation')} />
                        <SwitchRow label={t('Export BoQ')} checked={form.exportBoQ} onChange={set('exportBoQ')} />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={handleClose} disabled={saving} sx={{ color: 'text.secondary', textTransform: 'none' }}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        variant='contained'
                        onClick={handleSave}
                        disabled={saving || !form.name.trim()}
                        sx={{ borderRadius: '8px', bgcolor: BRAND, '&:hover': { bgcolor: '#009aaa' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
