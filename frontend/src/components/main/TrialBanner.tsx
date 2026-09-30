'use client';

import { Box, Typography } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { i18n } = useTranslation();
    const isAm = i18n.language === 'am';
    const labels = isAm
        ? { d: 'օր', h: 'ժ', m: 'ր', s: 'վ' }
        : { d: 'd', h: 'h', m: 'm', s: 's' };

    const [trial, setTrial] = useState<TrialStatus | null>(null);
    const [hovered, setHovered] = useState(false);

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

    const summaryText = d > 0 ? `${d} ${labels.d}` : `${pad(h)}${labels.h} ${pad(m)}${labels.m}`;
    const detailText = `${pad(h)}${labels.h} ${pad(m)}${labels.m} ${pad(s)}${labels.s}`;

    return (
        <Box
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.4,
                borderRadius: '8px',
                backgroundColor: urgent ? 'rgba(220,53,69,0.07)' : 'rgba(0,171,190,0.07)',
                border: `1px solid ${urgent ? 'rgba(220,53,69,0.2)' : 'rgba(0,171,190,0.2)'}`,
                cursor: 'default',
                flexShrink: 0,
                overflow: 'hidden',
            }}
        >
            <AccessTimeOutlinedIcon sx={{ fontSize: 13, color, flexShrink: 0 }} />

            <Typography sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}>
                {summaryText}
            </Typography>

            <Box sx={{
                overflow: 'hidden',
                maxWidth: hovered ? '120px' : '0px',
                opacity: hovered ? 1 : 0,
                transition: 'max-width 0.35s ease, opacity 0.2s ease',
            }}>
                <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    pl: 0.5,
                }}>
                    {detailText}
                </Typography>
            </Box>
        </Box>
    );
}
