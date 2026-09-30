'use client';

import { Box, Typography } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { useEffect, useState } from 'react';
import * as Api from 'api';

interface TrialStatus {
    isTrial: boolean;
    isTrialActive?: boolean;
    trialEndDate?: string;
    daysLeft?: number;
}

function useCountdown(endDate: string | undefined) {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        if (!endDate) return;
        const end = new Date(endDate).getTime();

        const tick = () => {
            const diff = Math.max(0, end - Date.now());
            setTimeLeft({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endDate]);

    return timeLeft;
}

export default function TrialBanner() {
    const [trial, setTrial] = useState<TrialStatus | null>(null);

    useEffect(() => {
        Api.requestSession<TrialStatus>({ command: 'account/trial_status' })
            .then(res => setTrial(res))
            .catch(() => {});
    }, []);

    const { d, h, m, s } = useCountdown(trial?.trialEndDate);

    if (!trial?.isTrial || !trial?.isTrialActive) return null;

    const urgent = (trial.daysLeft ?? 0) <= 3;
    const color = urgent ? '#dc3545' : '#00ABBE';

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.4,
            borderRadius: '8px',
            backgroundColor: urgent ? 'rgba(220,53,69,0.07)' : 'rgba(0,171,190,0.07)',
            border: `1px solid ${urgent ? 'rgba(220,53,69,0.2)' : 'rgba(0,171,190,0.2)'}`,
            flexShrink: 0,
        }}>
            <AccessTimeOutlinedIcon sx={{ fontSize: 13, color }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {d > 0 ? `${d}d ` : ''}{pad(h)}h {pad(m)}m {pad(s)}s
            </Typography>
        </Box>
    );
}
