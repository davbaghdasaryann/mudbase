'use client';

import { useState } from 'react';
import {
    Box, Typography, InputAdornment, OutlinedInput, Stack, Button, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import ImgElement from '@/tsui/DomElements/ImgElement';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';
import { formatCurrencyRounded } from '@/lib/format_currency';

const CARD_SX = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 3,
    border: '1px solid rgba(0,171,190,0.18)',
    boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
};

const outlinedCreateSx = {
    borderRadius: '25px',
    height: '40px',
    mt: 1,
    '&:hover': {
        backgroundColor: mainPrimaryColor,
        color: '#ffffff',
        borderColor: mainPrimaryColor,
    },
};

type Phase = 'empty' | 'monitoring';

interface RiskConfig {
    estimate: EstimatesApi.ApiEstimate;
    budget: number;
}

export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [phase, setPhase] = useState<Phase>('empty');
    const [estimateDialogOpen, setEstimateDialogOpen] = useState(false);
    const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
    const [estimate, setEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [budgetInput, setBudgetInput] = useState('');
    const [config, setConfig] = useState<RiskConfig | null>(null);

    const marketBaseline = estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? 0;
    const budgetValue = parseFloat(budgetInput.replace(/[^0-9.]/g, '')) || 0;
    const budgetPct = marketBaseline > 0 && budgetValue > 0
        ? Math.round((budgetValue / marketBaseline) * 100)
        : null;

    const handleEstimateSelect = async (est: EstimatesApi.ApiEstimate) => {
        setEstimateDialogOpen(false);
        try {
            const full = await Api.requestSession<EstimatesApi.ApiEstimate>({
                command: 'estimate/get',
                args: { estimateId: String(est._id) },
            });
            setEstimate(full ?? est);
        } catch {
            setEstimate(est);
        }
        setBudgetInput('');
        setBudgetDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!estimate || budgetValue <= 0) return;
        setConfig({ estimate, budget: budgetValue });
        setBudgetDialogOpen(false);
        setPhase('monitoring');
    };

    const handleBudgetClose = () => {
        setBudgetDialogOpen(false);
        setEstimate(null);
        setBudgetInput('');
    };

    const handleReset = () => {
        setPhase('empty');
        setEstimate(null);
        setBudgetInput('');
        setConfig(null);
    };

    return (
        <PageContents title={t('Risk Monitoring')} current='risk-monitoring' sx={{ background: '#F5F9F9' }}>

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {phase === 'empty' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                    <MonitorHeartOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {'Մոնիթորինգի ենթակա տվյալներ չկան'}
                    </Typography>
                    <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setEstimateDialogOpen(true)} />
                </Box>
            )}

            {/* ── Monitoring widget (Step 3 placeholder) ──────────────────── */}
            {phase === 'monitoring' && config && (
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon fontSize='small' />}
                        size='small'
                        onClick={handleReset}
                        sx={{ color: 'text.secondary', pl: 0, mb: 2, '&:hover': { background: 'transparent', color: mainPrimaryColor } }}
                    >
                        {t('Back')}
                    </Button>
                    <Box sx={{ ...CARD_SX, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#bbb' }}>
                        <MonitorHeartOutlinedIcon sx={{ fontSize: '3rem', mb: 1, opacity: 0.35 }} />
                        <Typography sx={{ fontSize: '0.85rem' }}>{t('Risk gauge widget — coming next')}</Typography>
                    </Box>
                </Box>
            )}

            {/* ── Step 1: Choose estimation ────────────────────────────────── */}
            <ChooseEstimationDialog
                open={estimateDialogOpen}
                onClose={() => setEstimateDialogOpen(false)}
                onSelect={handleEstimateSelect}
            />

            {/* ── Step 2: Budget modal ─────────────────────────────────────── */}
            <Dialog
                open={budgetDialogOpen}
                onClose={handleBudgetClose}
                maxWidth='xs'
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ pb: 1.5 }}>
                    <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                        <ImgElement src='/images/logo_square.svg' sx={{ height: 28, width: 28 }} />
                        <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '1rem' }}>
                            {t('Enter Project Budget')}
                        </Typography>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
                    <Stack spacing={2.5}>
                        {/* Selected estimation chip */}
                        {estimate && (
                            <Box sx={{ px: 2, py: 1.2, borderRadius: 2, background: `${mainPrimaryColor}0D`, border: `1px solid ${mainPrimaryColor}30` }}>
                                <Typography sx={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.3 }}>
                                    {t('Estimation')}
                                </Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                                    {estimate.name}
                                </Typography>
                            </Box>
                        )}

                        {/* Budget input */}
                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                                {t('Total Budget')}
                            </Typography>
                            <OutlinedInput
                                fullWidth
                                size='small'
                                autoFocus
                                value={budgetInput}
                                onChange={e => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>AMD</Typography>
                                    </InputAdornment>
                                }
                                onKeyDown={e => { if (e.key === 'Enter' && budgetValue > 0) handleConfirm(); }}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontSize: '1.05rem',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5eef0' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mainPrimaryColor },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: mainPrimaryColor },
                                }}
                            />
                        </Box>

                        {/* Live comparison */}
                        {marketBaseline > 0 && (
                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(0,171,190,0.05)', border: '1px solid rgba(0,171,190,0.12)' }}>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#00ABBE', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.78rem', color: '#555' }}>
                                                {t('Market Average Baseline')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>
                                                {formatCurrencyRounded(marketBaseline)} AMD
                                            </Typography>
                                            <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, background: '#e0f7fa', minWidth: 38, textAlign: 'center' }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#00838f' }}>100%</Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ borderColor: 'rgba(0,171,190,0.1)' }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                background: budgetPct == null ? '#ddd' : budgetPct > 100 ? '#e53935' : '#43a047',
                                            }} />
                                            <Typography sx={{ fontSize: '0.78rem', color: '#555' }}>
                                                {t('Your Budget')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>
                                                {budgetValue > 0 ? `${formatCurrencyRounded(budgetValue)} AMD` : '—'}
                                            </Typography>
                                            <Box sx={{
                                                px: 0.8, py: 0.2, borderRadius: 1, minWidth: 38, textAlign: 'center',
                                                background: budgetPct == null ? '#f5f5f5' : budgetPct > 100 ? 'rgba(229,57,53,0.1)' : 'rgba(67,160,71,0.1)',
                                            }}>
                                                <Typography sx={{
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                    color: budgetPct == null ? '#ccc' : budgetPct > 100 ? '#c62828' : '#2e7d32',
                                                }}>
                                                    {budgetPct != null ? `${budgetPct}%` : '—'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button onClick={handleBudgetClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        variant='contained'
                        disabled={budgetValue <= 0}
                        onClick={handleConfirm}
                        sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#006f7a' } }}
                    >
                        {t('Confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
