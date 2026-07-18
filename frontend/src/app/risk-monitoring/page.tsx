'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import RiskMonitorBuilderDialog, { type RiskMonitorConfig } from './RiskMonitorBuilderDialog';
import RiskGaugeWidget from './RiskGaugeWidget';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

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

function useLivePrice(config: RiskMonitorConfig | null): number {
    const [price, setPrice] = useState<number>(0);

    useEffect(() => {
        if (!config) return;
        // Use baseline as initial price — fetch live price from catalog
        setPrice(config.baselinePrice);

        const fetchPrice = async () => {
            try {
                if (config.dataSource === 'labor' || config.dataSource === 'materials') {
                    const type = config.dataSource === 'labor' ? 'labor' : 'material';
                    const data = await Api.requestSession<any>({
                        command: `${type}/fetch_item_price`,
                        args: { itemId: config.selectedItem._id },
                    });
                    if (data?.price) setPrice(data.price);
                    else if (data?.averagePrice) setPrice(data.averagePrice);
                } else if (config.dataSource === 'estimates' || config.dataSource === 'eci') {
                    const data = await Api.requestSession<any>({
                        command: 'estimate/get',
                        args: { estimateId: config.selectedItem._id },
                    });
                    const p = data?.totalCostWithOtherExpenses ?? data?.totalCost;
                    if (p) setPrice(p);
                }
            } catch {
                // keep baseline if fetch fails
            }
        };

        fetchPrice();
    }, [config]);

    return price;
}

export default function RiskMonitoringPage() {
    const { t } = useTranslation();
    const [builderOpen, setBuilderOpen] = useState(false);
    const [config, setConfig] = useState<RiskMonitorConfig | null>(null);

    const currentPrice = useLivePrice(config);

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

            {/* ── Gauge widget ─────────────────────────────────────────────── */}
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
                    <Box sx={{ maxWidth: 480 }}>
                        <RiskGaugeWidget config={config} currentPrice={currentPrice} />
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
