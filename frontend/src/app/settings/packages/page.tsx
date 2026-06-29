'use client';

import React from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Switch, Divider, Toolbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageContents from '@/components/PageContents';
import SpacerComponent from '@/components/SpacerComponent';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';

const BRAND = '#00abbe';

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 48 }}>
            <Typography sx={{ width: 180, flexShrink: 0, fontSize: '0.95rem', color: 'text.primary' }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1 }}>{children}</Box>
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

export default function PackagesPage() {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [numberOfUsers, setNumberOfUsers] = React.useState('');
    const [numberOfEstimations, setNumberOfEstimations] = React.useState('');
    const [worksCatalog, setWorksCatalog] = React.useState(false);
    const [materialsCatalog, setMaterialsCatalog] = React.useState(false);
    const [aggregatedCatalog, setAggregatedCatalog] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
        setNumberOfUsers('');
        setNumberOfEstimations('');
        setWorksCatalog(false);
        setMaterialsCatalog(false);
        setAggregatedCatalog(false);
    };

    return (
        <PageContents title='Packages'>
            <Toolbar disableGutters sx={{ px: 2, backgroundColor: 'inherit' }}>
                <SpacerComponent />
                <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{
                        borderRadius: '25px',
                        height: '40px',
                        borderColor: mainPrimaryColor,
                        color: mainPrimaryColor,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                    }}
                >
                    {t('Create')}
                </Button>
            </Toolbar>

            <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>
                    {t('Package Settings')}
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FieldRow label={t('Number of Users')}>
                            <TextField
                                type='number'
                                value={numberOfUsers}
                                onChange={e => setNumberOfUsers(e.target.value)}
                                inputProps={{ min: 0 }}
                                size='small'
                                fullWidth
                                sx={numberFieldSx}
                            />
                        </FieldRow>

                        <FieldRow label={t('Number of Estimations')}>
                            <TextField
                                type='number'
                                value={numberOfEstimations}
                                onChange={e => setNumberOfEstimations(e.target.value)}
                                inputProps={{ min: 0 }}
                                size='small'
                                fullWidth
                                sx={numberFieldSx}
                            />
                        </FieldRow>
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>
                        {t('Library Access')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('Works Catalog')} checked={worksCatalog} onChange={setWorksCatalog} />
                        <SwitchRow label={t('Materials Catalog')} checked={materialsCatalog} onChange={setMaterialsCatalog} />
                        <SwitchRow label={t('Aggregated Catalog')} checked={aggregatedCatalog} onChange={setAggregatedCatalog} />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={handleClose} sx={{ color: 'text.secondary', textTransform: 'none' }}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        variant='contained'
                        onClick={handleClose}
                        sx={{ borderRadius: '8px', bgcolor: BRAND, '&:hover': { bgcolor: '#009aaa' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
