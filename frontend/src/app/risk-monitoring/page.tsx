'use client';

import { useState } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Divider,
    InputAdornment, OutlinedInput, FormControl, InputLabel, Stack, IconButton, Tooltip,
} from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';
import { formatCurrencyRounded } from '@/lib/format_currency';

interface RiskSetup {
    estimate: EstimatesApi.ApiEstimate;
    budget: number;
}

export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [budgetInput, setBudgetInput] = useState('');
    const [setup, setSetup] = useState<RiskSetup | null>(null);

    const handleEstimateSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setSelectedEstimate(estimate);
        setDialogOpen(false);
        setBudgetInput('');
    };

    const handleConfirm = () => {
        if (!selectedEstimate) return;
        const budget = parseFloat(budgetInput.replace(/,/g, ''));
        if (!budget || budget <= 0) return;
        setSetup({ estimate: selectedEstimate, budget });
    };

    const handleReset = () => {
        setSetup(null);
        setSelectedEstimate(null);
        setBudgetInput('');
    };

    const budgetValue = parseFloat(budgetInput.replace(/,/g, '')) || 0;
    const canConfirm = !!selectedEstimate && budgetValue > 0;

    return (
        <PageContents title={t('Risk Monitoring')} current='risk-monitoring'>
            <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#111', mb: 0.5 }}>
                    {t('Risk Monitoring')}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#777', mb: 3 }}>
                    {t('Track cost variances and budget overruns against your approved ceiling.')}
                </Typography>
            </Box>

            {!setup ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 6, pb: 4 }}>
                    <Card
                        elevation={0}
                        sx={{
                            width: '100%',
                            maxWidth: 520,
                            border: '1px solid #e0e0e0',
                            borderRadius: 3,
                            overflow: 'visible',
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 3,
                                py: 2.5,
                                borderBottom: '1px solid #f0f0f0',
                                background: `linear-gradient(135deg, ${mainPrimaryColor}10 0%, #f8fffe 100%)`,
                                borderRadius: '12px 12px 0 0',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: `${mainPrimaryColor}18`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <MonitorHeartOutlinedIcon sx={{ fontSize: '1.3rem', color: mainPrimaryColor }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', lineHeight: 1.2 }}>
                                    {t('Set Up Risk Monitoring')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.3 }}>
                                    {t('Select an estimation and define your maximum approved budget')}
                                </Typography>
                            </Box>
                        </Box>

                        <CardContent sx={{ px: 3, py: 3 }}>
                            <Stack spacing={3}>
                                {/* Estimation selector */}
                                <Box>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#555', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('Estimation')}
                                    </Typography>
                                    {selectedEstimate ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                px: 2,
                                                py: 1.5,
                                                border: `1.5px solid ${mainPrimaryColor}`,
                                                borderRadius: 2,
                                                background: `${mainPrimaryColor}08`,
                                            }}
                                        >
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#111' }}>
                                                    {selectedEstimate.name}
                                                </Typography>
                                                {selectedEstimate.totalCostWithOtherExpenses > 0 && (
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#666', mt: 0.2 }}>
                                                        {t('Total Cost')}: {formatCurrencyRounded(selectedEstimate.totalCostWithOtherExpenses)} AMD
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Tooltip title={t('Change')} placement='top'>
                                                <IconButton
                                                    size='small'
                                                    onClick={() => setDialogOpen(true)}
                                                    sx={{ color: '#aaa', '&:hover': { color: mainPrimaryColor } }}
                                                >
                                                    <SearchOutlinedIcon sx={{ fontSize: '1.1rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : (
                                        <Button
                                            variant='outlined'
                                            startIcon={<SearchOutlinedIcon />}
                                            onClick={() => setDialogOpen(true)}
                                            fullWidth
                                            sx={{
                                                borderRadius: 2,
                                                borderColor: '#d0d0d0',
                                                color: '#555',
                                                justifyContent: 'flex-start',
                                                py: 1.5,
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                                '&:hover': {
                                                    borderColor: mainPrimaryColor,
                                                    color: mainPrimaryColor,
                                                    backgroundColor: `${mainPrimaryColor}08`,
                                                },
                                            }}
                                        >
                                            {t('Choose an Estimation')}
                                        </Button>
                                    )}
                                </Box>

                                <Divider />

                                {/* Budget input */}
                                <Box>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#555', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('Maximum Approved Budget')}
                                    </Typography>
                                    <FormControl fullWidth variant='outlined' size='small'>
                                        <OutlinedInput
                                            value={budgetInput}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/[^0-9.]/g, '');
                                                setBudgetInput(v);
                                            }}
                                            placeholder='0'
                                            endAdornment={
                                                <InputAdornment position='end'>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>AMD</Typography>
                                                </InputAdornment>
                                            }
                                            sx={{
                                                borderRadius: 2,
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mainPrimaryColor },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: mainPrimaryColor },
                                            }}
                                        />
                                    </FormControl>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.8 }}>
                                        {t('This defines the ceiling — the system will alert you when costs exceed this amount.')}
                                    </Typography>
                                </Box>

                                <Button
                                    variant='contained'
                                    fullWidth
                                    disabled={!canConfirm}
                                    onClick={handleConfirm}
                                    sx={{
                                        borderRadius: '25px',
                                        py: 1.2,
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        backgroundColor: mainPrimaryColor,
                                        '&:hover': { backgroundColor: '#006f7a' },
                                        '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#aaa' },
                                    }}
                                >
                                    {t('Generate Risk Monitor')}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            ) : (
                /* Setup summary banner — widget placeholder for next step */
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2.5,
                            py: 1.5,
                            mb: 3,
                            border: `1px solid ${mainPrimaryColor}40`,
                            borderRadius: 2,
                            background: `${mainPrimaryColor}08`,
                        }}
                    >
                        <Stack direction='row' alignItems='center' spacing={2}>
                            <MonitorHeartOutlinedIcon sx={{ color: mainPrimaryColor, fontSize: '1.2rem' }} />
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                                    {setup.estimate.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                    {t('Budget ceiling')}: <strong>{formatCurrencyRounded(setup.budget)} AMD</strong>
                                </Typography>
                            </Box>
                        </Stack>
                        <Tooltip title={t('Change setup')} placement='top'>
                            <IconButton size='small' onClick={handleReset} sx={{ color: '#aaa', '&:hover': { color: '#e53935' } }}>
                                <CloseIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Widget area — coming in next step */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 300,
                            border: '2px dashed #e0e0e0',
                            borderRadius: 3,
                            color: '#bbb',
                        }}
                    >
                        <MonitorHeartOutlinedIcon sx={{ fontSize: '3rem', mb: 1, opacity: 0.4 }} />
                        <Typography sx={{ fontSize: '0.85rem' }}>{t('Risk gauge widget — coming next')}</Typography>
                    </Box>
                </Box>
            )}

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleEstimateSelect}
            />
        </PageContents>
    );
}
