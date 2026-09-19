'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, LinearProgress, Chip, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import * as Api from '@/api';
import { formatCurrencyRounded } from '@/lib/format_currency';
import { useTranslation } from 'react-i18next';

const TEAL = '#00ABBE';
const RED = '#c62828';
const TEXT_DARK = '#424242';
const BADGE_GREEN_BG = '#c8e6c9';
const BADGE_GREEN_TEXT = '#2e7d32';

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
    const remaining = (budget ?? 0) - (spent ?? 0);
    const remainPct = budget && budget > 0 ? (remaining / budget) * 100 : 0;

    return (
        <Card
            elevation={0}
            sx={{
                position: 'relative',
                overflow: 'visible',
                background: isOver
                    ? 'linear-gradient(135deg,rgba(198,40,40,0.05) 0%,rgba(255,255,255,0.80) 100%)'
                    : 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: 3,
                boxShadow: '0 4px 24px rgba(0,171,190,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                border: `1px solid ${isOver ? 'rgba(198,40,40,0.18)' : 'rgba(0,171,190,0.14)'}`,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                    borderColor: isOver ? 'rgba(198,40,40,0.45)' : 'rgba(0,171,190,0.45)',
                    boxShadow: '0 8px 32px rgba(0,171,190,0.14), 0 1px 6px rgba(0,0,0,0.06)',
                },
            }}
        >
            {onDelete && (
                <Tooltip title={t('Remove')}>
                    <IconButton
                        onClick={onDelete}
                        size="small"
                        sx={{
                            position: 'absolute', top: -8, right: -8, zIndex: 1,
                            p: 0.5,
                            bgcolor: 'rgba(0,0,0,0.06)',
                            color: TEXT_DARK,
                            '&:hover': { bgcolor: 'rgba(198,40,40,0.12)', color: RED },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            )}

            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Title */}
                <Typography
                    sx={{ fontSize: 14, fontWeight: 400, color: TEXT_DARK, mb: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                    {estimateName}
                </Typography>

                {loading ? (
                    <LinearProgress sx={{ borderRadius: 1, mt: 2 }} />
                ) : (
                    <>
                        {/* Budget value + trend chip */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: 22, fontWeight: 600, color: '#212121', letterSpacing: 0 }}>
                                {formatCurrencyRounded(budget ?? 0)}
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 400, color: TEXT_DARK }}>AMD</Typography>
                            <Chip
                                size="small"
                                icon={isOver
                                    ? <TrendingDownIcon sx={{ fontSize: 13 }} />
                                    : <TrendingUpIcon sx={{ fontSize: 13 }} />}
                                label={`${pct.toFixed(0)}% ${t('Spent')}`}
                                sx={{
                                    ml: 0.5, height: 20, fontSize: '0.72rem', fontWeight: 500,
                                    bgcolor: isOver ? 'rgba(244,67,54,0.13)' : BADGE_GREEN_BG,
                                    color: isOver ? RED : BADGE_GREEN_TEXT,
                                    borderRadius: 1.5,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        </Box>

                        {/* Progress bar */}
                        <Box sx={{ mb: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                    height: 8, borderRadius: 4,
                                    bgcolor: 'rgba(0,0,0,0.07)',
                                    '& .MuiLinearProgress-bar': { bgcolor: isOver ? RED : TEAL, borderRadius: 4 },
                                }}
                            />
                        </Box>

                        {/* Budget / Spent / Remaining */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#999', mb: 0.15, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {t('Budget')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: TEAL }}>
                                    {formatCurrencyRounded(budget ?? 0)}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.65rem', color: '#999', mb: 0.15, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {t('Spent')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isOver ? RED : TEXT_DARK }}>
                                    {formatCurrencyRounded(spent ?? 0)}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontSize: '0.65rem', color: '#999', mb: 0.15, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {t('Remaining')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isOver ? RED : BADGE_GREEN_TEXT }}>
                                    {isOver ? '-' : ''}{formatCurrencyRounded(Math.abs(remaining))}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
