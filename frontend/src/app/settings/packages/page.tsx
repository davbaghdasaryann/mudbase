'use client';

import React from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Switch, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';

const BRAND = '#00abbe';

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 48 }}>
            <Typography sx={{ width: 230, flexShrink: 0, fontSize: '0.95rem', color: 'text.primary' }}>
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

const createButtonSx = {
    borderRadius: '25px',
    height: '40px',
    borderColor: mainPrimaryColor,
    color: mainPrimaryColor,
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
} as const;

export default function PackagesPage() {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [packageName, setPackageName] = React.useState('');
    const [numberOfUsers, setNumberOfUsers] = React.useState('');
    const [numberOfEstimations, setNumberOfEstimations] = React.useState('');
    const [worksCatalog, setWorksCatalog] = React.useState(false);
    const [materialsCatalog, setMaterialsCatalog] = React.useState(false);
    const [aggregatedCatalog, setAggregatedCatalog] = React.useState(false);
    const [seeOffers, setSeeOffers] = React.useState(false);
    const [archiveEstimations, setArchiveEstimations] = React.useState(false);
    const [shareEstimations, setShareEstimations] = React.useState(false);
    const [exportEstimation, setExportEstimation] = React.useState(false);
    const [exportBoQ, setExportBoQ] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
        setPackageName('');
        setNumberOfUsers('');
        setNumberOfEstimations('');
        setWorksCatalog(false);
        setMaterialsCatalog(false);
        setAggregatedCatalog(false);
        setSeeOffers(false);
        setArchiveEstimations(false);
        setShareEstimations(false);
        setExportEstimation(false);
        setExportBoQ(false);
    };

    return (
        <PageContents title='Packages'>
            {/* Empty state — centered illustration + text + button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 2 }}>
                <Inventory2OutlinedIcon sx={{ fontSize: 130, color: BRAND, opacity: 0.10 }} />
                <Typography variant='h6' sx={{ fontWeight: 600, color: 'text.secondary', mt: -1 }}>
                    {t('No packages yet')}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.disabled', mb: 1 }}>
                    {t('Create your first package to get started')}
                </Typography>
                <Button variant='outlined' startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={createButtonSx}>
                    {t('Create')}
                </Button>
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth={false} PaperProps={{ sx: { borderRadius: '14px', width: 520 } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>
                    {t('Package Settings')}
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FieldRow label={t('Package Name')}>
                            <TextField
                                value={packageName}
                                onChange={e => setPackageName(e.target.value)}
                                size='small'
                                fullWidth
                                sx={numberFieldSx}
                            />
                        </FieldRow>

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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <MenuBookOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('Library Access')}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('Works Catalog')} checked={worksCatalog} onChange={setWorksCatalog} />
                        <SwitchRow label={t('Materials Catalog')} checked={materialsCatalog} onChange={setMaterialsCatalog} />
                        <SwitchRow label={t('Aggregated Catalog')} checked={aggregatedCatalog} onChange={setAggregatedCatalog} />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <SellOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('Offer Permissions')}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('See Offers')} checked={seeOffers} onChange={setSeeOffers} />
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CalculateOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('Estimation Permissions')}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <SwitchRow label={t('Archive Estimations')} checked={archiveEstimations} onChange={setArchiveEstimations} />
                        <SwitchRow label={t('Share Estimations')} checked={shareEstimations} onChange={setShareEstimations} />
                        <SwitchRow label={t('Export Estimation')} checked={exportEstimation} onChange={setExportEstimation} />
                        <SwitchRow label={t('Export BoQ')} checked={exportBoQ} onChange={setExportBoQ} />
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
