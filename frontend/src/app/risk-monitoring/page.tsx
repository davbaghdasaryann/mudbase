'use client';

import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import RiskMonitorBuilderDialog, { type RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import { mainPrimaryColor } from '@/theme';

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

export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [builderOpen, setBuilderOpen] = useState(false);
    const [config, setConfig] = useState<RiskMonitorConfig | null>(null);

    const handleConfirm = (cfg: RiskMonitorConfig) => {
        setConfig(cfg);
        setBuilderOpen(false);
    };

    return (
        <PageContents title={t('Risk Monitoring')} current='risk-monitoring' sx={{ background: '#F5F9F9' }}>

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!config && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                    <MonitorHeartOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {'Մոնիթորինգի ենթակա տվյալներ չկան'}
                    </Typography>
                    <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setBuilderOpen(true)} />
                </Box>
            )}

            {/* ── Monitoring widget (Step 4+ placeholder) ──────────────────── */}
            {config && (
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon fontSize='small' />}
                        size='small'
                        onClick={() => setConfig(null)}
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

            {builderOpen && (
                <RiskMonitorBuilderDialog
                    onClose={() => setBuilderOpen(false)}
                    onConfirm={handleConfirm}
                />
            )}
        </PageContents>
    );
}
