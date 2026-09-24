'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, IconButton, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

const ACCENT = '#00A390';

interface Project { id: string; name: string; createdAt: Date; }

export default function KaravariumPage() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState('');

    const openDialog = () => { setName(''); setDialogOpen(true); };

    const handleConfirm = () => {
        if (!name.trim()) return;
        setProjects(prev => [...prev, { id: Date.now().toString(), name: name.trim(), createdAt: new Date() }]);
        setDialogOpen(false);
    };

    const handleDelete = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

    return (
        <PageContents title={t('Karavarium')}>
            {projects.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 2 }}>
                    <ManageAccountsOutlinedIcon sx={{ fontSize: 100, color: ACCENT, opacity: 0.2 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No records yet')}</Typography>
                    <Button
                        variant='outlined'
                        startIcon={<AddIcon />}
                        onClick={openDialog}
                        sx={{ borderRadius: '25px', height: '40px', mt: 1, borderColor: ACCENT, color: ACCENT, '&:hover': { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT } }}
                    >
                        {t('Create')}
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
                                key={p.id}
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
                                        <Typography variant='caption' color='text.secondary'>{p.createdAt.toLocaleDateString()}</Typography>
                                    </Box>
                                </Box>
                                <IconButton size='small' onClick={() => handleDelete(p.id)} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
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
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>{t('Create')}</Typography>
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
                        disabled={!name.trim()}
                        variant='contained'
                        sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, bgcolor: ACCENT, boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#008a79', boxShadow: 'none' } }}
                    >
                        {t('Confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
