'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import * as Api from '@/api';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { useTranslation } from 'react-i18next';

const TEAL = '#00ABBE';
const RED = '#c62828';

interface Props {
    estimateId: string;
    estimateName: string;
    onDelete?: () => void;
}

export default function CostingMonitorWidget({ estimateId, estimateName, onDelete }: Props) {
    const { t } = useTranslation();
    const [budget, setBudget] = useState<number | null>(null);
    const [spent, setSpent] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [estimate, costing] = await Promise.all([
                    Api.requestSession<any>({ command: 'estimate/get', args: { estimateId } }),
                    Api.requestSession<any>({ command: 'costing/fetch', args: { estimateId } }),
                ]);
                if (!mounted) return;
                const total = estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? 0;
                const spentAmount = (costing?.costHistory ?? [])
                    .filter((e: any) => !e.paymentMethod?.startsWith('pahest_'))
                    .reduce((s: number, e: any) => s + (e.total ?? 0), 0);
                setBudget(total);
                setSpent(spentAmount);
            } catch {}
            finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
    }, [estimateId]);

    const pct = budget && budget > 0 ? Math.min(((spent ?? 0) / budget) * 100, 100) : 0;
    const isOver = (spent ?? 0) > (budget ?? 0);

    return (
        <Box
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                background: isOver
                    ? 'linear-gradient(135deg,rgba(198,40,40,0.06) 0%,rgba(255,255,255,0.92) 100%)'
                    : 'rgba(255,255,255,0.88)',
                borderRadius: 3,
                border: hovered
                    ? `1px solid ${isOver ? 'rgba(198,40,40,0.55)' : 'rgba(0,171,190,0.55)'}`
                    : `1px solid ${isOver ? 'rgba(198,40,40,0.18)' : 'rgba(0,171,190,0.18)'}`,
                boxShadow: hovered
                    ? `0 8px 32px ${isOver ? 'rgba(198,40,40,0.13)' : 'rgba(0,171,190,0.18)'}`
                    : '0 4px 24px rgba(0,171,190,0.08)',
                p: 2.5,
                transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                cursor: 'default',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#222', lineHeight: 1.3 }} noWrap>
                        {estimateName}
                    </Typography>
                </Box>
                {onDelete && (
                    <Tooltip title={t('Remove')}>
                        <IconButton size='small' onClick={onDelete} sx={{ color: '#d0d0d0', '&:hover': { color: RED }, ml: 1, flexShrink: 0 }}>
                            <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {loading ? (
                <LinearProgress sx={{ borderRadius: 1 }} />
            ) : (
                <>
                    <Box sx={{ mb: 1.5 }}>
                        <LinearProgress
                            variant='determinate'
                            value={pct}
                            sx={{
                                height: 10, borderRadius: 5,
                                bgcolor: 'rgba(0,0,0,0.07)',
                                '& .MuiLinearProgress-bar': { bgcolor: isOver ? RED : TEAL, borderRadius: 5 },
                            }}
                        />
                        <Typography sx={{ fontSize: '0.68rem', color: isOver ? RED : '#888', mt: 0.5, textAlign: 'right' }}>
                            {pct.toFixed(0)}%
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ minWidth: 120 }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>{t('Budget')}</Typography>
                            <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: TEAL }}>
                                {formatCurrencyRounded(budget ?? 0)} AMD
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mb: 0.2 }}>{t('Spent')}</Typography>
                            <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: isOver ? RED : '#111' }}>
                                {formatCurrencyRounded(spent ?? 0)} AMD
                            </Typography>
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );
}
