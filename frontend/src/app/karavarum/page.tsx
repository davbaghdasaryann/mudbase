'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, IconButton, Divider, CircularProgress, Tab,
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
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import { useRouter, useSearchParams } from 'next/navigation';

const ACCENT = '#00A390';

interface Project { _id: string; name: string; createdAt: string; }

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
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 1 }}>
                                <Box
                                    onClick={() => {}}
                                    sx={{
                                        width: 110, height: 110, borderRadius: 3,
                                        border: '1.5px solid #e0f5f2', bgcolor: '#f7fdfc',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                                        cursor: 'pointer', transition: 'all 0.18s ease',
                                        '&:hover': {
                                            borderColor: ACCENT,
                                            boxShadow: `0 4px 18px rgba(0,163,144,0.15)`,
                                            transform: 'translateY(-2px)',
                                            bgcolor: '#edfaf8',
                                        },
                                    }}
                                >
                                    <RequestQuoteOutlinedIcon sx={{ fontSize: 32, color: ACCENT, opacity: 0.85 }} />
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#2d3748', letterSpacing: '0.01em' }}>
                                        {t('Estimations')}
                                    </Typography>
                                </Box>
                            </Box>
                        </TabPanel>
                        <TabPanel value='risks' sx={{ p: 0 }} />
                        <TabPanel value='tasks' sx={{ p: 0 }} />
                    </Box>
                </TabContext>
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

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.13)' } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{t('New Project')}</Typography>
                        <IconButton size='small' onClick={() => setDialogOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' } }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2 }} />
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t('Name')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: ACCENT } }, '& label.Mui-focused': { color: ACCENT } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '20px', textTransform: 'none', color: '#888' }}>{t('Cancel')}</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!name.trim() || saving}
                        variant='contained'
                        sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                    >
                        {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
