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
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';
import * as Api from 'api';
import { usePermissions } from '@/api/auth';

const BRAND = '#00abbe';

interface Package {
    _id?: string;
    name: string;
    nameAm?: string;
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
    startDate?: string;
    endDate?: string;
}

const EMPTY_PKG: Package = {
    name: '', nameAm: '', price: 0, numberOfUsers: 0, numberOfEstimations: 0,
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
    const { t, i18n } = useTranslation();
    const { session, permissionsSet } = usePermissions();
    const isSuperAdmin = !!(session?.user && (
        permissionsSet?.has('ALL') || permissionsSet?.has('USR_FCH_ALL') || permissionsSet?.has('ACC_FCH')
    ));

    const [packages, setPackages] = useState<Package[]>([]);
    const [allPackages, setAllPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [myPackage, setMyPackage] = useState<Package | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<'annual' | 'monthly'>('annual');
    const [carouselPage, setCarouselPage] = useState(0);
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

    const fetchMyPackage = useCallback(async () => {
        try {
            const data = await Api.requestSession<Package | null>({ command: 'packages/my' });
            setMyPackage(data ?? null);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchAllPackages = useCallback(async () => {
        try {
            const data = await Api.requestSession<Package[]>({ command: 'packages/list' });
            setAllPackages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSuperAdmin) fetchPackages();
        else { fetchAllPackages(); fetchMyPackage(); }
    }, [isSuperAdmin, fetchPackages, fetchMyPackage, fetchAllPackages]);

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

    if (!isSuperAdmin) {
        const pkgIdStr = (p: Package) => {
            const id = p._id as any;
            if (!id) return '';
            if (typeof id === 'string') return id;
            if (id.$oid) return id.$oid;
            return String(id);
        };

        // Active first, then by price asc, zero-price (trial) last
        const myId = myPackage ? pkgIdStr(myPackage) : null;
        const sorted = [...allPackages].sort((a, b) => {
            const aActive = myId ? pkgIdStr(a) === myId : false;
            const bActive = myId ? pkgIdStr(b) === myId : false;
            if (aActive) return -1;
            if (bActive) return 1;
            if (!a.price && b.price) return 1;
            if (a.price && !b.price) return -1;
            return (a.price || 0) - (b.price || 0);
        });
        const maxOffset = Math.max(0, sorted.length - 3);
        const safeOffset = Math.min(carouselPage, maxOffset);
        const totalPages = maxOffset + 1;
        const safePage = safeOffset;
        const visible = sorted.slice(safeOffset, safeOffset + 3);

        return (
            <PageContents title={t('Packages')} sx={{ pb: { xs: 7, md: 9 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 'calc(100vh - 220px)' }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4, mt: 1 }}>
                    <Typography variant='h5' fontWeight={700} sx={{ mb: 0.5 }}>
                        {t('Subscription Plans')}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 2.5 }}>
                        {t('Choose the best plan for you')}
                    </Typography>

                    {/* Annual / Monthly toggle */}
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: '50px', p: '3px', gap: 0 }}>
                        {(['annual', 'monthly'] as const).map(period => (
                            <Box
                                key={period}
                                onClick={() => setBillingPeriod(period)}
                                sx={{
                                    px: 2.5, py: 0.6,
                                    borderRadius: '50px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: billingPeriod === period ? 600 : 400,
                                    bgcolor: billingPeriod === period ? BRAND : 'transparent',
                                    color: billingPeriod === period ? '#fff' : 'text.secondary',
                                    boxShadow: billingPeriod === period ? `0 2px 8px ${BRAND}44` : 'none',
                                    transition: 'all 0.18s ease',
                                    userSelect: 'none',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {period === 'annual' ? t('Annual') : t('Monthly')}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
                ) : allPackages.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 1 }}>
                        <Inventory2OutlinedIcon sx={{ fontSize: 48, color: '#d1d5db' }} />
                        <Typography color='text.secondary'>{t('No packages available')}</Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, width: '100%' }}>
                        {/* Left arrow */}
                        <Box onClick={() => setCarouselPage(p => Math.max(0, p - 1))} sx={{
                            width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: safePage === 0 ? 'default' : 'pointer',
                            opacity: safePage === 0 ? 0.3 : 1,
                            pointerEvents: safePage === 0 ? 'none' : 'auto',
                            bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                            transition: 'all 0.18s ease', flexShrink: 0, color: '#6b7280',
                            '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: 'rgba(255,255,255,0.9)' },
                        }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </Box>
                        <Box sx={{ maxWidth: 1080, width: '100%' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                            {visible.map(pkg => {
                                const displayName = i18n.language === 'am' && pkg.nameAm ? pkg.nameAm : pkg.name;
                                const active = myId ? pkgIdStr(pkg) === myId : false;
                                const monthly = pkg.price ? Math.round(pkg.price / 12) : 0;
                                const displayPrice = billingPeriod === 'annual' ? pkg.price : monthly;
                                const displaySuffix = `AMD /${billingPeriod === 'annual' ? t('year') : t('month')}`;
                                const secondaryPrice = billingPeriod === 'annual'
                                    ? (monthly > 0 ? `${monthly.toLocaleString()} AMD /${t('month')}` : null)
                                    : (pkg.price > 0 ? `${pkg.price.toLocaleString()} AMD /${t('year')}` : null);
                                const secondaryColor = billingPeriod === 'annual' ? '#1CA461' : BRAND;

                                const features: string[] = [];
                                if (pkg.numberOfUsers) features.push(`${pkg.numberOfUsers} ${t('Users')}`);
                                if (pkg.numberOfEstimations === 0) features.push(t('Unlimited Estimations'));
                                else if (pkg.numberOfEstimations) features.push(`${pkg.numberOfEstimations} ${t('Estimations')}`);
                                if (pkg.worksCatalog) features.push(t('Works Catalog'));
                                if (pkg.materialsCatalog) features.push(t('Materials Catalog'));
                                if (pkg.aggregatedCatalog) features.push(t('Aggregated Catalog'));
                                if (pkg.costing) features.push('Ծախսագրում');
                                if (pkg.analysis) features.push('Վերլուծություն');
                                if (pkg.performance) features.push('Կատարողական');
                                if (pkg.seeOffers) features.push(t('See Offers'));
                                if (pkg.exportEstimation) features.push(t('Export Estimation'));
                                if (pkg.shareEstimations) features.push(t('Share Estimation'));

                                return (
                                    <Card key={pkgIdStr(pkg)} variant='outlined' sx={{
                                        borderRadius: 3,
                                        border: `1px solid ${active ? BRAND + '66' : 'rgba(0,0,0,0.10)'}`,
                                        background: active
                                            ? 'linear-gradient(145deg, #ffffff 0%, rgba(0,171,190,0.02) 65%, rgba(0,171,190,0.06) 100%)'
                                            : 'rgba(255,255,255,0.80)',
                                        backdropFilter: 'blur(14px)',
                                        WebkitBackdropFilter: 'blur(14px)',
                                        boxShadow: active
                                            ? `0 4px 24px ${BRAND}22, 0 1px 4px rgba(0,0,0,0.04)`
                                            : '0 2px 8px rgba(0,0,0,0.06)',
                                        position: 'relative', overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column',
                                        height: 560,
                                        transition: 'box-shadow 0.18s ease, background 0.18s ease',
                                        '&:hover': {
                                            boxShadow: active ? `0 8px 32px ${BRAND}33` : '0 4px 18px rgba(0,0,0,0.10)',
                                            background: active
                                                ? 'linear-gradient(145deg, #f7f7f7 0%, rgba(0,171,190,0.03) 65%, rgba(0,171,190,0.07) 100%)'
                                                : 'rgba(245,245,245,0.95)',
                                        },
                                    }}>
                                        {active && (
                                            <Chip
                                                label={t('Active')}
                                                size='small'
                                                sx={{
                                                    position: 'absolute', top: 12, right: 12,
                                                    bgcolor: BRAND, color: '#fff',
                                                    fontWeight: 700, fontSize: '0.7rem',
                                                    height: 22, borderRadius: '6px',
                                                }}
                                            />
                                        )}
                                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: '20px !important' }}>
                                            <Typography variant='h6' fontWeight={700} sx={{ lineHeight: 1.2, pr: active ? 7 : 0 }}>
                                                {displayName}
                                            </Typography>
                                            {displayPrice ? (
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, color: 'text.primary' }}>
                                                            {displayPrice.toLocaleString()}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{displaySuffix}</Typography>
                                                    </Box>
                                                    {secondaryPrice && (
                                                        <Typography sx={{ fontSize: '0.8rem', color: secondaryColor, fontWeight: 600, mt: 0.25 }}>
                                                            {secondaryPrice}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: 'text.secondary' }}>—</Typography>
                                            )}
                                            <Divider sx={{ my: 0.5 }} />
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {t('Features')}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
                                                {features.map(f => (
                                                    <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CheckIcon sx={{ fontSize: 15, color: BRAND, flexShrink: 0 }} />
                                                        <Typography sx={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>{f}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                        </Box>
                        {/* Right arrow */}
                        <Box onClick={() => setCarouselPage(p => Math.min(totalPages - 1, p + 1))} sx={{
                            width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: safePage >= totalPages - 1 ? 'default' : 'pointer',
                            opacity: safePage >= totalPages - 1 ? 0.3 : 1,
                            pointerEvents: safePage >= totalPages - 1 ? 'none' : 'auto',
                            bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                            transition: 'all 0.18s ease', flexShrink: 0, color: '#6b7280',
                            '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: 'rgba(255,255,255,0.9)' },
                        }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </Box>
                        </Box>
                    </>
                )}
                </Box>
            </PageContents>
        );
    }

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
                    {packages.map(pkg => {
                        const now = new Date();
                        const end = pkg.endDate ? new Date(pkg.endDate) : null;
                        const isExpired = end ? end < now : false;
                        const expiringSoon = end && !isExpired ? (end.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000 : false;
                        const accentColor = isExpired ? '#9ca3af' : expiringSoon ? '#f59e0b' : BRAND;
                        const displayName = i18n.language === 'am' && pkg.nameAm ? pkg.nameAm : pkg.name;

                        type FeatureGroup = { heading: string; items: { label: string; enabled: boolean }[] };
                        const featureGroups: FeatureGroup[] = [
                            {
                                heading: t('Library Access'),
                                items: [
                                    { label: t('Works Catalog'), enabled: pkg.worksCatalog },
                                    { label: t('Materials Catalog'), enabled: pkg.materialsCatalog },
                                    { label: t('Aggregated Catalog'), enabled: pkg.aggregatedCatalog },
                                ],
                            },
                            {
                                heading: 'Բաժինների հասանելիություն',
                                items: [
                                    { label: 'Ծախսագրում', enabled: pkg.costing },
                                    { label: 'Վերլուծություն', enabled: pkg.analysis },
                                    { label: 'Կատարողական', enabled: pkg.performance },
                                ],
                            },
                            {
                                heading: t('Offer Permissions'),
                                items: [
                                    { label: t('See Offers'), enabled: pkg.seeOffers },
                                    { label: t('Export Estimation'), enabled: pkg.exportEstimation },
                                    { label: t('Share Estimation'), enabled: pkg.shareEstimations },
                                ],
                            },
                        ];

                        return (
                            <Card key={pkg._id} variant='outlined' sx={{ borderRadius: 3, border: `1px solid ${accentColor}22`, background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: `0 4px 24px ${accentColor}14, 0 1px 4px rgba(0,0,0,0.04)`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease, box-shadow 0.25s ease', '&:hover': { transform: 'scale(1.015)', boxShadow: `0 12px 36px ${accentColor}28, 0 4px 12px rgba(0,0,0,0.07)` } }}>
                                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, pb: '16px !important' }}>
                                    {/* Header — name + price + actions all inline */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant='h6' fontWeight={700} sx={{ lineHeight: 1.2, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: accentColor, flexShrink: 0 }}>
                                            {pkg.price ? `${pkg.price.toLocaleString()} AMD` : '—'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <IconButton size='small' onClick={() => openEdit(pkg)} sx={{ color: '#c4c9d4', transition: 'color 0.15s', '&:hover': { color: '#374151', bgcolor: 'transparent' }, '&:active': { color: '#111827' } }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                                            <IconButton size='small' onClick={() => handleDelete(pkg)} sx={{ color: '#c4c9d4', transition: 'color 0.15s', '&:hover': { color: '#ef4444', bgcolor: 'transparent' }, '&:active': { color: '#dc2626' } }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                                        </Box>
                                    </Box>

                                    {/* Users / estimations */}
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip icon={<PeopleOutlinedIcon />} label={`${pkg.numberOfUsers} ${t('Users')}`} size='small' sx={{ bgcolor: `${accentColor}12`, color: accentColor, fontWeight: 600, '& .MuiChip-icon': { color: accentColor } }} />
                                        <Chip icon={<CalculateOutlinedIcon />} label={`${pkg.numberOfEstimations} ${t('Estimations')}`} size='small' sx={{ bgcolor: `${accentColor}12`, color: accentColor, fontWeight: 600, '& .MuiChip-icon': { color: accentColor } }} />
                                    </Box>

                                    <Divider sx={{ my: 0.25 }} />

                                    {/* Feature checklist — single column, groups separated by divider */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        {featureGroups.map((group, gi) => (
                                            <React.Fragment key={group.heading}>
                                                {gi > 0 && <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', my: 0.75 }} />}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {group.items.map(f => (
                                                        <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            {f.enabled
                                                                ? <CheckIcon sx={{ fontSize: 14, color: '#22c55e', flexShrink: 0 }} />
                                                                : <RemoveIcon sx={{ fontSize: 14, color: '#d1d5db', flexShrink: 0 }} />}
                                                            <Typography sx={{ fontSize: '0.75rem', color: f.enabled ? '#374151' : '#9ca3af', lineHeight: 1.3 }}>{f.label}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </React.Fragment>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth={false} PaperProps={{ sx: { borderRadius: '14px', width: 660, maxHeight: '90vh' } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>
                    {editingId ? t('Edit Package') : t('Package Settings')}
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    {/* Name — full width */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2, mb: 2 }}>
                        <TextField
                            label={t('Package Name')}
                            value={form.name}
                            onChange={e => set('name')(e.target.value)}
                            fullWidth
                            sx={numberFieldSx}
                        />
                        <TextField
                            label='Անվանում (հայ.)'
                            value={form.nameAm || ''}
                            onChange={e => set('nameAm')(e.target.value)}
                            fullWidth
                            sx={numberFieldSx}
                        />
                    </Box>
                    {/* Start / End dates */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                        <TextField
                            label={t('Start Date')}
                            type='date'
                            value={form.startDate ? new Date(form.startDate).toISOString().split('T')[0] : ''}
                            onChange={e => set('startDate')(e.target.value || undefined)}
                            InputLabelProps={{ shrink: true }}
                            sx={numberFieldSx}
                        />
                        <TextField
                            label={t('End Date')}
                            type='date'
                            value={form.endDate ? new Date(form.endDate).toISOString().split('T')[0] : ''}
                            onChange={e => set('endDate')(e.target.value || undefined)}
                            InputLabelProps={{ shrink: true }}
                            sx={numberFieldSx}
                        />
                    </Box>
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
