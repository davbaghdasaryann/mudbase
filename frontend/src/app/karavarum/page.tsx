'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogContent,
    DialogActions, TextField, IconButton, Divider, CircularProgress, Tab,
    Checkbox, InputAdornment,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { useRouter, useSearchParams } from 'next/navigation';

const ACCENT = '#00A390';

interface Project { _id: string; name: string; createdAt: string; }
interface Estimate { _id: string; name?: string; estimateNumber?: string; totalCostWithOtherExpenses?: number; totalCost?: number; }

export default function KaravariumPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Project | null>(null);
    const [tab, setTab] = useState(() => { const t = searchParams.get('tab'); return ['costs', 'risks', 'tasks'].includes(t ?? '') ? t! : 'costs'; });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const [estModalOpen, setEstModalOpen] = useState(false);
    const [estStep, setEstStep] = useState<'view' | 'pick'>('view');
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [estLoading, setEstLoading] = useState(false);
    const [estSearch, setEstSearch] = useState('');
    const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<string>>(new Set());
    const [confirmedEsts, setConfirmedEsts] = useState<Estimate[]>([]);

    const openEstimations = () => { setEstModalOpen(true); setEstStep('view'); };

    const openPicker = async () => {
        setEstStep('pick');
        setEstSearch('');
        setPickerSelectedIds(new Set(confirmedEsts.map(e => e._id)));
        if (estimates.length === 0) {
            setEstLoading(true);
            try {
                const data = await Api.requestSession<Estimate[]>({ command: 'estimates/fetch', args: { searchVal: 'empty' } });
                setEstimates(data ?? []);
            } finally {
                setEstLoading(false);
            }
        }
    };

    const togglePicker = (id: string) => setPickerSelectedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const confirmPicker = () => {
        setConfirmedEsts(estimates.filter(e => pickerSelectedIds.has(e._id)));
        setEstStep('view');
    };

    const removeConfirmed = (id: string) => setConfirmedEsts(prev => prev.filter(e => e._id !== id));

    const filteredEsts = estimates.filter(e =>
        !estSearch.trim() ||
        (e.name ?? '').toLowerCase().includes(estSearch.toLowerCase()) ||
        (e.estimateNumber ?? '').toLowerCase().includes(estSearch.toLowerCase())
    );

    useEffect(() => {
        Api.requestSession<Project[]>({ command: 'karavarum/fetch_all', args: {} })
            .then(data => {
                setProjects(data ?? []);
                const id = searchParams.get('id');
                if (id && data) {
                    const found = data.find((p: Project) => p._id === id);
                    if (found) setSelected(found);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const openDialog = () => { setName(''); setDialogOpen(true); };

    const handleConfirm = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const created = await Api.requestSession<Project>({ command: 'karavarum/create', args: { name: name.trim() } });
            if (created) setProjects(prev => [created, ...prev]);
            setDialogOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setProjects(prev => prev.filter(p => p._id !== id));
        await Api.requestSession({ command: 'karavarum/delete', args: { id } });
    };

    // ── DETAIL VIEW ──────────────────────────────────────────────────────────
    if (selected) {
        return (
            <PageContents title={selected.name}>
                <TabContext value={tab}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton onClick={() => { setSelected(null); router.replace('/karavarum', { scroll: false }); }} size='small' sx={{ color: 'text.secondary', mr: 0.5, '&:hover': { color: ACCENT } }}>
                                    <ArrowBackIcon fontSize='small' />
                                </IconButton>
                                <TabList
                                    onChange={(_, v) => { setTab(v); const p = new URLSearchParams(searchParams.toString()); p.set('tab', v); router.replace(`/karavarum?${p.toString()}`, { scroll: false }); }}
                                    sx={{ '& .MuiTabs-indicator': { backgroundColor: ACCENT }, '& .MuiTab-root.Mui-selected': { color: ACCENT } }}
                                >
                                    <Tab
                                        label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />Ծախսերի կառավարում</Box>}
                                        value='costs'
                                    />
                                    <Tab
                                        label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><GppMaybeOutlinedIcon sx={{ fontSize: 18 }} />Ռիսկերի կառավարում</Box>}
                                        value='risks'
                                    />
                                    <Tab
                                        label={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><AssignmentOutlinedIcon sx={{ fontSize: 18 }} />Առաջադրանքներ</Box>}
                                        value='tasks'
                                    />
                                </TabList>
                            </Box>
                        </Box>
                        <TabPanel value='costs' sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', pt: 2 }}>
                                {[
                                    { label: t('Estimations'), icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 24, color: '#00A390', opacity: 0.55 }} />, hoverBg: 'rgba(0,163,144,0.06)', onClick: openEstimations },
                                    { label: 'Ժամանակացույցեր', icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 24, color: '#5B73E8', opacity: 0.55 }} />, hoverBg: 'rgba(91,115,232,0.06)', onClick: () => {} },
                                ].map((tile, i) => (
                                    <Box
                                        key={i}
                                        onClick={tile.onClick}
                                        sx={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            gap: 0.5, width: 118, height: 96, px: 1, py: 1,
                                            bgcolor: '#fff', borderRadius: 3,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            cursor: 'pointer',
                                            transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s',
                                            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.13)', transform: 'translateY(-2px)', bgcolor: tile.hoverBg },
                                            '&:hover svg': { opacity: '1 !important' },
                                        }}
                                    >
                                        {tile.icon}
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.25 }}>
                                            {tile.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Estimations total widget */}
                            {confirmedEsts.length > 0 && (() => {
                                const total = confirmedEsts.reduce((s, e) => s + (e.totalCostWithOtherExpenses ?? e.totalCost ?? 0), 0);
                                return (
                                    <Box
                                        sx={{
                                            mt: 3,
                                            borderRadius: 3,
                                            border: '1px solid rgba(245,124,0,0.22)',
                                            background: 'linear-gradient(135deg, #ffffff 0%, rgba(245,124,0,0.05) 100%)',
                                            boxShadow: '0 2px 12px rgba(245,124,0,0.10)',
                                            p: 2.5,
                                            display: 'flex', alignItems: 'center', gap: 2.5,
                                            cursor: 'pointer',
                                            transition: 'box-shadow 0.2s, transform 0.15s',
                                            '&:hover': { boxShadow: '0 6px 20px rgba(245,124,0,0.18)', transform: 'translateY(-2px)' },
                                        }}
                                        onClick={openEstimations}
                                    >
                                        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,124,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <RequestQuoteOutlinedIcon sx={{ fontSize: 26, color: '#F57C00' }} />
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#F57C00', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.4 }}>
                                                {t('Total Estimations Cost')}
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.45rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }}>
                                                {Math.round(total).toLocaleString()} <Typography component='span' sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#888' }}>AMD</Typography>
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#aaa', mt: 0.3 }}>
                                                {confirmedEsts.length} {confirmedEsts.length === 1 ? t('estimation') : t('estimations')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })()}
                        </TabPanel>
                        <TabPanel value='risks' sx={{ p: 0 }} />
                        <TabPanel value='tasks' sx={{ p: 0 }} />
                    </Box>
                </TabContext>

                {/* Estimations modal */}
                <Dialog open={estModalOpen} onClose={() => setEstModalOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.13)', maxWidth: 820, height: '88vh' } }}>
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                        <IconButton size='small' onClick={() => setEstModalOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* ── STEP 1: VIEW ── */}
                    {estStep === 'view' && <>
                        <DialogContent sx={{ px: 3.5, pt: 3.5, pb: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,163,144,0.15) 0%,rgba(0,163,144,0.06) 100%)', border: '1.5px solid rgba(0,163,144,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <RequestQuoteOutlinedIcon sx={{ fontSize: 22, color: ACCENT }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Estimations')}</Typography>
                                        {confirmedEsts.length > 0 && (
                                            <Typography sx={{ fontSize: '0.75rem', color: ACCENT, fontWeight: 500 }}>{confirmedEsts.length} {t('selected')}</Typography>
                                        )}
                                    </Box>
                                </Box>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={openPicker}
                                    variant='outlined'
                                    size='small'
                                    sx={{ borderRadius: '20px', textTransform: 'none', borderColor: ACCENT, color: ACCENT, fontWeight: 600, px: 2, '&:hover': { bgcolor: 'rgba(0,163,144,0.06)', borderColor: ACCENT } }}
                                >
                                    {t('Add')}
                                </Button>
                            </Box>

                            <Box sx={{ flex: 1, overflowY: 'auto', mx: -0.5 }}>
                                {confirmedEsts.length === 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5, py: 8 }}>
                                        <RequestQuoteOutlinedIcon sx={{ fontSize: 48, color: '#e0e0e0' }} />
                                        <Typography sx={{ color: '#bbb', fontSize: '0.9rem' }}>{t('No records yet')}</Typography>
                                        <Button
                                            startIcon={<AddIcon />}
                                            onClick={openPicker}
                                            variant='contained'
                                            sx={{ borderRadius: '22px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', px: 3, mt: 1, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                                        >
                                            {t('Add')}
                                        </Button>
                                    </Box>
                                ) : confirmedEsts.map(est => (
                                    <Box key={est._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.2, mx: 0.5, borderRadius: 2, border: '1px solid #e0f5f2', bgcolor: 'rgba(0,163,144,0.04)', mb: 0.75 }}>
                                        <RequestQuoteOutlinedIcon sx={{ fontSize: 18, color: ACCENT, opacity: 0.7, flexShrink: 0 }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{est.name || '—'}</Typography>
                                            {est.estimateNumber && <Typography variant='caption' sx={{ color: '#aaa' }}>#{est.estimateNumber}</Typography>}
                                        </Box>
                                        <IconButton size='small' onClick={() => removeConfirmed(est._id)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </DialogContent>
                        <Divider sx={{ mx: 3.5 }} />
                        <DialogActions sx={{ px: 3.5, py: 2, gap: 1 }}>
                            <Button onClick={() => setEstModalOpen(false)} sx={{ textTransform: 'none', color: '#aaa', fontSize: '0.85rem', '&:hover': { color: '#555', background: 'none' } }} disableRipple>{t('Cancel')}</Button>
                            <Box sx={{ flex: 1 }} />
                            <Button
                                variant='contained'
                                disabled={confirmedEsts.length === 0}
                                onClick={() => setEstModalOpen(false)}
                                sx={{ borderRadius: '22px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                            >
                                {t('Confirm')} {confirmedEsts.length > 0 ? `(${confirmedEsts.length})` : ''}
                            </Button>
                        </DialogActions>
                    </>}

                    {/* ── STEP 2: PICKER ── */}
                    {estStep === 'pick' && <>
                        <DialogContent sx={{ px: 3.5, pt: 3.5, pb: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                                <IconButton size='small' onClick={() => setEstStep('view')} sx={{ color: '#aaa', '&:hover': { color: ACCENT } }}>
                                    <ArrowBackIcon fontSize='small' />
                                </IconButton>
                                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{t('Select Estimations')}</Typography>
                                {pickerSelectedIds.size > 0 && (
                                    <Typography sx={{ fontSize: '0.75rem', color: ACCENT, fontWeight: 500, ml: 0.5 }}>{pickerSelectedIds.size} {t('selected')}</Typography>
                                )}
                            </Box>

                            <TextField
                                fullWidth size='small'
                                placeholder={t('Search...')}
                                value={estSearch}
                                onChange={e => setEstSearch(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon sx={{ fontSize: 18, color: '#bbb' }} /></InputAdornment> }}
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: ACCENT } } }}
                            />

                            <Box sx={{ flex: 1, overflowY: 'auto', mx: -0.5 }}>
                                {estLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                        <CircularProgress size={28} sx={{ color: ACCENT }} />
                                    </Box>
                                ) : filteredEsts.length === 0 ? (
                                    <Typography sx={{ textAlign: 'center', color: '#aaa', py: 5, fontSize: '0.88rem' }}>{t('No records yet')}</Typography>
                                ) : filteredEsts.map(est => {
                                    const checked = pickerSelectedIds.has(est._id);
                                    return (
                                        <Box key={est._id} onClick={() => togglePicker(est._id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.2, mx: 0.5, borderRadius: 2, cursor: 'pointer', transition: 'background 0.15s', background: checked ? 'rgba(0,163,144,0.06)' : 'transparent', '&:hover': { background: checked ? 'rgba(0,163,144,0.1)' : 'rgba(0,0,0,0.03)' } }}>
                                            <Checkbox checked={checked} size='small' disableRipple sx={{ p: 0, color: '#ccc', '&.Mui-checked': { color: ACCENT } }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: checked ? 600 : 400, fontSize: '0.9rem', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{est.name || '—'}</Typography>
                                                {est.estimateNumber && <Typography variant='caption' sx={{ color: '#aaa' }}>#{est.estimateNumber}</Typography>}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </DialogContent>
                        <Divider sx={{ mx: 3.5 }} />
                        <DialogActions sx={{ px: 3.5, py: 2, gap: 1 }}>
                            <Button onClick={() => setEstStep('view')} sx={{ textTransform: 'none', color: '#aaa', fontSize: '0.85rem', '&:hover': { color: '#555', background: 'none' } }} disableRipple>{t('Back')}</Button>
                            <Box sx={{ flex: 1 }} />
                            <Button
                                variant='contained'
                                disabled={pickerSelectedIds.size === 0}
                                onClick={confirmPicker}
                                sx={{ borderRadius: '22px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                            >
                                {t('Add')} {pickerSelectedIds.size > 0 ? `(${pickerSelectedIds.size})` : ''}
                            </Button>
                        </DialogActions>
                    </>}
                </Dialog>
            </PageContents>
        );
    }

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <PageContents title={t('Karavarium')}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={32} sx={{ color: ACCENT }} />
                </Box>
            ) : projects.length === 0 ? (
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '65vh', gap: 2, position: 'relative', overflow: 'hidden',
                    background: 'radial-gradient(ellipse 55% 45% at 50% 48%, rgba(0,163,144,0.06) 0%, transparent 100%)',
                    animation: 'fadeSlideUp 0.5s ease both',
                    '@keyframes fadeSlideUp': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                }}>
                    {/* decorative floating dots */}
                    {[
                        { top: '12%', left: '18%', size: 6, delay: '0s', opacity: 0.18 },
                        { top: '20%', right: '14%', size: 4, delay: '0.3s', opacity: 0.13 },
                        { bottom: '22%', left: '12%', size: 5, delay: '0.6s', opacity: 0.15 },
                        { bottom: '15%', right: '20%', size: 7, delay: '0.2s', opacity: 0.12 },
                        { top: '38%', left: '6%', size: 3, delay: '0.5s', opacity: 0.1 },
                        { top: '35%', right: '7%', size: 4, delay: '0.4s', opacity: 0.1 },
                    ].map((dot, i) => (
                        <Box key={i} sx={{
                            position: 'absolute', borderRadius: '50%', bgcolor: ACCENT,
                            width: dot.size, height: dot.size, opacity: dot.opacity,
                            top: dot.top, left: (dot as any).left, right: (dot as any).right, bottom: (dot as any).bottom,
                            animation: `floatDot 4s ease-in-out ${dot.delay} infinite alternate`,
                            '@keyframes floatDot': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-8px)' } },
                        }} />
                    ))}

                    {/* pulsing rings */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        {[1, 2, 3].map(i => (
                            <Box key={i} sx={{
                                position: 'absolute', borderRadius: '50%',
                                border: `1.5px solid ${ACCENT}`,
                                width: 72 + i * 36, height: 72 + i * 36,
                                opacity: 0,
                                animation: `pulseRing 2.8s ease-out ${i * 0.7}s infinite`,
                                '@keyframes pulseRing': {
                                    '0%': { transform: 'scale(0.82)', opacity: 0.28 },
                                    '100%': { transform: 'scale(1.18)', opacity: 0 },
                                },
                            }} />
                        ))}
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(0,163,144,0.12) 0%, rgba(0,163,144,0.04) 70%)`,
                            border: `1.5px solid rgba(0,163,144,0.2)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'iconFloat 3.5s ease-in-out infinite',
                            '@keyframes iconFloat': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-7px)' },
                            },
                        }}>
                            <ManageAccountsOutlinedIcon sx={{ fontSize: 40, color: ACCENT, opacity: 0.85 }} />
                        </Box>
                    </Box>

                    <Typography variant='h6' sx={{ fontWeight: 600, color: '#2d3748', mt: 1.5, animation: 'fadeSlideUp 0.5s 0.1s ease both' }}>
                        {t('No projects yet')}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#8a9ab0', textAlign: 'center', maxWidth: 300, lineHeight: 1.6, animation: 'fadeSlideUp 0.5s 0.2s ease both' }}>
                        {t('Create a project to manage costs and risks')}
                    </Typography>
                    <Button
                        variant='outlined'
                        startIcon={<AddIcon />}
                        onClick={openDialog}
                        sx={{
                            borderRadius: '25px', height: '40px', mt: 1,
                            borderColor: ACCENT, color: ACCENT,
                            '&:hover': { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT },
                            animation: 'popIn 0.45s 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                            '@keyframes popIn': {
                                '0%': { opacity: 0, transform: 'scale(0.82)' },
                                '100%': { opacity: 1, transform: 'scale(1)' },
                            },
                        }}
                    >
                        {t('New Project')}
                    </Button>
                </Box>
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={openDialog}
                            sx={{ borderRadius: '25px', height: '40px', borderColor: ACCENT, color: ACCENT, '&:hover': { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT } }}
                        >
                            {t('Create')}
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {projects.map(p => (
                            <Box
                                key={p._id}
                                onClick={() => { setSelected(p); setTab('costs'); router.replace(`/karavarum?id=${p._id}&tab=costs`, { scroll: false }); }}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    px: 2.5, py: 1.8, borderRadius: 2,
                                    border: '1px solid #e0f5f2', backgroundColor: '#fafffe',
                                    cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                                    '&:hover': { boxShadow: '0 2px 12px rgba(0,163,144,0.12)', borderColor: ACCENT },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ManageAccountsOutlinedIcon sx={{ color: ACCENT, opacity: 0.7, fontSize: 22 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>{p.name}</Typography>
                                        <Typography variant='caption' color='text.secondary'>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</Typography>
                                    </Box>
                                </Box>
                                <IconButton size='small' onClick={e => { e.stopPropagation(); handleDelete(p._id); }} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                    <DeleteOutlineIcon fontSize='small' />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </>
            )}

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.13)', maxWidth: 480 } }}>
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                    <IconButton size='small' onClick={() => setDialogOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
                <DialogContent sx={{ px: 4, pt: 4, pb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: `linear-gradient(135deg, rgba(0,163,144,0.15) 0%, rgba(0,163,144,0.06) 100%)`,
                            border: `1.5px solid rgba(0,163,144,0.22)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ManageAccountsOutlinedIcon sx={{ fontSize: 28, color: ACCENT }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a' }}>{t('New Project')}</Typography>
                    </Box>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t('Project name')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: ACCENT } }, '& label.Mui-focused': { color: ACCENT } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 3.5, pt: 0, flexDirection: 'column', gap: 1 }}>
                    <Button
                        onClick={handleConfirm}
                        disabled={!name.trim() || saving}
                        variant='contained'
                        fullWidth
                        sx={{ borderRadius: '22px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', py: 1.1, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                    >
                        {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Create Project')}
                    </Button>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#aaa', fontSize: '0.8rem', '&:hover': { color: '#555', background: 'none' } }} disableRipple>{t('Cancel')}</Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
