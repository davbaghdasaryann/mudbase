'use client';

import React from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';

const BRAND = '#00abbe';

export default function PackagesPage() {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [numberOfUsers, setNumberOfUsers] = React.useState('');
    const [numberOfEstimations, setNumberOfEstimations] = React.useState('');

    const handleClose = () => {
        setOpen(false);
        setNumberOfUsers('');
        setNumberOfEstimations('');
    };

    return (
        <PageContents title='Packages'>
            <Box sx={{ p: 3 }}>
                <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{
                        borderRadius: '8px',
                        bgcolor: BRAND,
                        '&:hover': { bgcolor: '#009aaa' },
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    {t('Create')}
                </Button>
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>{t('Create Package')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            label={t('Number of Users')}
                            type='number'
                            value={numberOfUsers}
                            onChange={e => setNumberOfUsers(e.target.value)}
                            inputProps={{ min: 0 }}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '&.Mui-focused fieldset': { borderColor: BRAND },
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
                            }}
                        />
                        <TextField
                            label={t('Number of Estimations')}
                            type='number'
                            value={numberOfEstimations}
                            onChange={e => setNumberOfEstimations(e.target.value)}
                            inputProps={{ min: 0 }}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '&.Mui-focused fieldset': { borderColor: BRAND },
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={handleClose} sx={{ color: 'text.secondary', textTransform: 'none' }}>{t('Cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={handleClose}
                        sx={{ borderRadius: '8px', bgcolor: BRAND, '&:hover': { bgcolor: '#009aaa' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        {t('Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
