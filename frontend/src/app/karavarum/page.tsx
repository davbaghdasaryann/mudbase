'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, IconButton, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

const ACCENT = '#00A390';

export default function KaravariumPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState('');

    const handleCreate = () => {
        setName('');
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!name.trim()) return;
        // to be wired up
        setDialogOpen(false);
    };

    return (
        <PageContents title={t('Karavarium')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 2 }}>
                <ManageAccountsOutlinedIcon sx={{ fontSize: 100, color: ACCENT, opacity: 0.2 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No records yet')}</Typography>
                <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ borderRadius: '25px', height: '40px', mt: 1, borderColor: ACCENT, color: ACCENT, '&:hover': { backgroundColor: ACCENT, color: '#fff', borderColor: ACCENT } }}
                >
                    {t('Create')}
                </Button>
            </Box>

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
