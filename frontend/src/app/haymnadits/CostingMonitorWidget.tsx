'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, CircularProgress, Chip, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { PieChart, Pie, Cell, Tooltip as ReTooltip } from 'recharts';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
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
    const remaining = Math.max((budget ?? 0) - (spent ?? 0), 0);

    const pieData = [
        { name: t('Spent'),     value: Math.min(spent ?? 0, budget ?? 0) },
        { name: t('Remaining'), value: remaining },
    ];
    const pieColors = [isOver ? RED : TEAL, 'rgba(0,0,0,0.07)'];

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

            <CardContent sx={{ p: 3, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:last-child': { pb: 3 } }}>
                {/* Title + chip */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                        sx={{ fontSize: 14, fontWeight: 400, color: TEXT_DARK, flex: 1, pr: 1,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                        {estimateName}
                    </Typography>
                    {!loading && (budget ?? 0) > 0 && (
                        <Chip
                            size="small"
                            icon={isOver
                                ? <TrendingDownIcon sx={{ fontSize: 13 }} />
                                : <TrendingUpIcon sx={{ fontSize: 13 }} />}
                            label={`${pct === 0 ? '0' : pct < 0.1 ? pct.toFixed(2) : pct < 1 ? pct.toFixed(1) : pct.toFixed(0)}%`}
                            sx={{
                                flexShrink: 0, height: 20, fontSize: '0.72rem', fontWeight: 500,
                                bgcolor: isOver ? 'rgba(244,67,54,0.13)' : BADGE_GREEN_BG,
                                color: isOver ? RED : BADGE_GREEN_TEXT,
                                borderRadius: 1.5,
                                '& .MuiChip-icon': { color: 'inherit' },
                            }}
                        />
                    )}
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 4 }}>
                        <CircularProgress size={36} sx={{ color: TEAL }} />
                    </Box>
                ) : (budget ?? 0) === 0 ? (
                    /* Empty state — no budget configured */
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 3, gap: 1 }}>
                        <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 42, color: 'rgba(0,171,190,0.25)' }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#bbb', textAlign: 'center' }}>
                            {t('No budget data available')}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {/* Donut chart */}
                        <Box sx={{ flexShrink: 0 }}>
                            <PieChart width={120} height={120}>
                                <Pie
                                    data={pieData}
                                    cx={55}
                                    cy={55}
                                    innerRadius={36}
                                    outerRadius={54}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    strokeWidth={0}
                                    minAngle={(spent ?? 0) > 0 ? 8 : 0}
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={pieColors[i]} />
                                    ))}
                                </Pie>
                                <ReTooltip
                                    formatter={(val: any) => [formatCurrencyRounded(val) + ' AMD', '']}
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                                />
                            </PieChart>
                        </Box>

                        {/* Legend / values */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.15 }}>
                                    {t('Budget')}
                                </Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: TEAL }}>
                                    {formatCurrencyRounded(budget ?? 0)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: TEXT_DARK }}>AMD</span>
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.15 }}>
                                    {t('Spent')}
                                </Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: isOver ? RED : TEXT_DARK }}>
                                    {formatCurrencyRounded(spent ?? 0)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: TEXT_DARK }}>AMD</span>
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.15 }}>
                                    {t('Remaining')}
                                </Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: isOver ? RED : BADGE_GREEN_TEXT }}>
                                    {isOver ? '—' : formatCurrencyRounded(remaining) + ' AMD'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
