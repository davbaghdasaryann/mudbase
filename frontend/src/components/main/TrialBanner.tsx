'use client';

import { Box, Typography } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { useEffect, useState } from 'react';
import * as Api from 'api';

interface TrialStatus {
    isTrial: boolean;
    isTrialActive?: boolean;
    daysLeft?: number;
}

export default function TrialBanner() {
    const [trial, setTrial] = useState<TrialStatus | null>(null);

    useEffect(() => {
        Api.requestSession<TrialStatus>({ command: 'account/trial_status' })
            .then(res => setTrial(res))
            .catch(() => {});
    }, []);

    if (!trial?.isTrial || !trial?.isTrialActive) return null;

    const days = trial.daysLeft ?? 0;
    const urgent = days <= 3;

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            px: 3,
            py: 0.75,
            backgroundColor: urgent ? 'rgba(220,53,69,0.07)' : 'rgba(0,171,190,0.07)',
            borderBottom: `1px solid ${urgent ? 'rgba(220,53,69,0.15)' : 'rgba(0,171,190,0.15)'}`,
        }}>
            <AccessTimeOutlinedIcon sx={{ fontSize: 15, color: urgent ? '#dc3545' : '#00ABBE' }} />
            <Typography sx={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: urgent ? '#dc3545' : '#00ABBE',
            }}>
                {days === 1
                    ? 'Ձեր անվճար փորձաշրջանը ավարտվում է վաղը'
                    : `Անվճար փորձաշրջան՝ ${days} օր`}
            </Typography>
        </Box>
    );
}
