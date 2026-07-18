'use client';

import { useState } from 'react';
import {
    Box, Typography, InputAdornment, OutlinedInput, Stack, Button, Divider,
} from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
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

type Phase = 'empty' | 'setup' | 'monitoring';

interface RiskConfig {
    estimate: EstimatesApi.ApiEstimate;
    budget: number;
}

export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [phase, setPhase] = useState<Phase>('empty');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [estimate, setEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [budgetInput, setBudgetInput] = useState('');
    const [config, setConfig] = useState<RiskConfig | null>(null);

    const marketBaseline = estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? 0;
    const budgetValue = parseFloat(budgetInput.replace(/[^0-9.]/g, '')) || 0;
    const budgetPct = marketBaseline > 0 && budgetValue > 0
        ? Math.round((budgetValue / marketBaseline) * 100)
        : null;

    const handleEstimateSelect = async (est: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
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
        setPhase('setup');
    };

    const handleConfirm = () => {
        if (!estimate || budgetValue <= 0) return;
        setConfig({ estimate, budget: budgetValue });
        setPhase('monitoring');
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
                        {t('No Risk Monitor created yet')}
                    </Typography>
                    <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                </Box>
            )}

            {/* ── Setup form (inline transition) ──────────────────────────── */}
            {phase === 'setup' && estimate && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 6 }}>
                    <Box sx={{ width: '100%', maxWidth: 520 }}>
                        {/* Back */}
                        <Button
                            startIcon={<ArrowBackIcon fontSize='small' />}
                            size='small'
                            onClick={handleReset}
                            sx={{ color: 'text.secondary', pl: 0, mb: 2, '&:hover': { background: 'transparent', color: mainPrimaryColor } }}
                        >
                            {t('Back')}
                        </Button>

                        {/* Card */}
                        <Box sx={{ ...CARD_SX, p: 3.5 }}>
                            {/* Card header */}
                            <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 3 }}>
                                <Box sx={{ width: 38, height: 38, borderRadius: '50%', background: `${mainPrimaryColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <MonitorHeartOutlinedIcon sx={{ fontSize: '1.15rem', color: mainPrimaryColor }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', lineHeight: 1.2 }}>
                                        {t('Enter Project Budget & Set Baseline')}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.2 }}>
                                        {estimate.name}
                                    </Typography>
                                </Box>
                            </Stack>

                            {/* Budget input */}
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                                {t('Total Budget')}
                            </Typography>
                            <OutlinedInput
                                fullWidth
                                size='small'
                                value={budgetInput}
                                onChange={e => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder='0'
                                endAdornment={<InputAdornment position='end'><Typography sx={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>AMD</Typography></InputAdornment>}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontSize: '1.05rem',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5eef0' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mainPrimaryColor },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: mainPrimaryColor },
                                }}
                            />

                            {/* Instant comparison */}
                            {marketBaseline > 0 && (
                                <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, background: 'rgba(0,171,190,0.05)', border: '1px solid rgba(0,171,190,0.12)' }}>
                                    <Stack spacing={1}>
                                        {/* Market average row */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#00ABBE' }} />
                                                <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>
                                                    {t('Market Average Baseline')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>
                                                    {formatCurrencyRounded(marketBaseline)} AMD
                                                </Typography>
                                                <Box sx={{ px: 1, py: 0.25, borderRadius: 1, background: '#e0f7fa', minWidth: 42, textAlign: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#00838f' }}>100%</Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ borderColor: 'rgba(0,171,190,0.1)' }} />

                                        {/* Your budget row */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    width: 10, height: 10, borderRadius: '50%',
                                                    background: budgetPct == null ? '#ccc' : budgetPct > 100 ? '#e53935' : '#43a047',
                                                }} />
                                                <Typography sx={{ fontSize: '0.8rem', color: '#555' }}>
                                                    {t('Your Budget')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>
                                                    {budgetValue > 0 ? `${formatCurrencyRounded(budgetValue)} AMD` : '—'}
                                                </Typography>
                                                <Box sx={{
                                                    px: 1, py: 0.25, borderRadius: 1, minWidth: 42, textAlign: 'center',
                                                    background: budgetPct == null ? '#f5f5f5' : budgetPct > 100 ? 'rgba(229,57,53,0.1)' : 'rgba(67,160,71,0.1)',
                                                }}>
                                                    <Typography sx={{
                                                        fontSize: '0.72rem', fontWeight: 700,
                                                        color: budgetPct == null ? '#bbb' : budgetPct > 100 ? '#c62828' : '#2e7d32',
                                                    }}>
                                                        {budgetPct != null ? `${budgetPct}%` : '—'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            )}

                            {/* Confirm */}
                            <Button
                                variant='contained'
                                fullWidth
                                disabled={budgetValue <= 0}
                                onClick={handleConfirm}
                                sx={{
                                    mt: 3,
                                    borderRadius: '25px',
                                    py: 1.2,
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    backgroundColor: mainPrimaryColor,
                                    '&:hover': { backgroundColor: '#006f7a' },
                                    '&.Mui-disabled': { backgroundColor: '#e0e0e0', color: '#aaa' },
                                }}
                            >
                                {t('Confirm')}
                            </Button>
                        </Box>
                    </Box>
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

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleEstimateSelect}
            />
        </PageContents>
    );
}
