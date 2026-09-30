'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import PageContents from '@/components/PageContents';
import { mainPrimaryColor } from '@/theme';
import { useTranslation } from 'react-i18next';
import FounderWidgetBuilderDialog, { type FounderWidgetConfig } from './FounderWidgetBuilderDialog';
import CostingMonitorWidget from './CostingMonitorWidget';

export default function HaymnaditsPage() {
    const { t } = useTranslation();
    const [widgets, setWidgets] = useState<FounderWidgetConfig[]>(() => {
        try {
            const saved = localStorage.getItem('founder_widgets');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [builderOpen, setBuilderOpen] = useState(false);

    useEffect(() => {
        try { localStorage.setItem('founder_widgets', JSON.stringify(widgets)); } catch {}
    }, [widgets]);

    const handleConfirm = (cfgs: FounderWidgetConfig[]) => {
        setWidgets(prev => [...prev, ...cfgs]);
        setBuilderOpen(false);
    };

    const handleDelete = (idx: number) => {
        setWidgets(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <PageContents title={t('Haymnadits')}>
            {widgets.length === 0 ? (
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '65vh', gap: 2, position: 'relative', overflow: 'hidden',
                    background: 'radial-gradient(ellipse 55% 45% at 50% 48%, rgba(0,171,190,0.06) 0%, transparent 100%)',
                    animation: 'fadeSlideUp 0.5s ease both',
                    '@keyframes fadeSlideUp': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                }}>
                    {[
                        { top: '12%', left: '18%', size: 6, delay: '0s', opacity: 0.18 },
                        { top: '20%', right: '14%', size: 4, delay: '0.3s', opacity: 0.13 },
                        { bottom: '22%', left: '12%', size: 5, delay: '0.6s', opacity: 0.15 },
                        { bottom: '15%', right: '20%', size: 7, delay: '0.2s', opacity: 0.12 },
                        { top: '38%', left: '6%', size: 3, delay: '0.5s', opacity: 0.1 },
                        { top: '35%', right: '7%', size: 4, delay: '0.4s', opacity: 0.1 },
                    ].map((dot, i) => (
                        <Box key={i} sx={{
                            position: 'absolute', borderRadius: '50%', bgcolor: mainPrimaryColor,
                            width: dot.size, height: dot.size, opacity: dot.opacity,
                            top: dot.top, left: (dot as any).left, right: (dot as any).right, bottom: (dot as any).bottom,
                            animation: `floatDot 4s ease-in-out ${dot.delay} infinite alternate`,
                            '@keyframes floatDot': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-8px)' } },
                        }} />
                    ))}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        {[1, 2, 3].map(i => (
                            <Box key={i} sx={{
                                position: 'absolute', borderRadius: '50%',
                                border: `1.5px solid ${mainPrimaryColor}`,
                                width: 72 + i * 36, height: 72 + i * 36,
                                opacity: 0,
                                animation: `pulseRing 2.8s ease-out ${i * 0.7}s infinite`,
                                '@keyframes pulseRing': {
                                    '0%': { transform: 'scale(0.82)', opacity: 0.28 },
                                    '100%': { transform: 'scale(1.18)', opacity: 0 },
                                },
                            }} />
                        ))}
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(0,171,190,0.12) 0%, rgba(0,171,190,0.04) 70%)`,
                            border: `1.5px solid rgba(0,171,190,0.2)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'iconFloat 3.5s ease-in-out infinite',
                            '@keyframes iconFloat': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-7px)' },
                            },
                        }}>
                            <CorporateFareOutlinedIcon sx={{ fontSize: 40, color: mainPrimaryColor, opacity: 0.85 }} />
                        </Box>
                    </Box>
                    <Typography variant='h6' sx={{ fontWeight: 600, color: '#2d3748', mt: 1.5, animation: 'fadeSlideUp 0.5s 0.1s ease both' }}>
                        {t('No Founders created yet')}
                    </Typography>
                    <Button
                        variant='outlined'
                        startIcon={<AddIcon />}
                        onClick={() => setBuilderOpen(true)}
                        sx={{
                            borderRadius: '25px', height: '40px', mt: 1,
                            borderColor: mainPrimaryColor, color: mainPrimaryColor,
                            '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor },
                            animation: 'popIn 0.45s 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                            '@keyframes popIn': {
                                '0%': { opacity: 0, transform: 'scale(0.82)' },
                                '100%': { opacity: 1, transform: 'scale(1)' },
                            },
                        }}
                    >
                        {t('Create Widget')}
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant='contained'
                            startIcon={<AddIcon />}
                            onClick={() => setBuilderOpen(true)}
                            sx={{ borderRadius: '25px', height: '40px', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#007a6e' } }}
                        >
                            {t('Create Widget')}
                        </Button>
                    </Box>
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {widgets.map((cfg, idx) => (
                            <CostingMonitorWidget
                                key={idx}
                                estimateId={cfg.estimateId}
                                estimateName={cfg.estimateName}
                                onDelete={() => handleDelete(idx)}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {builderOpen && (
                <FounderWidgetBuilderDialog
                    onClose={() => setBuilderOpen(false)}
                    onConfirm={handleConfirm}
                    existingIds={widgets.map(w => w.estimateId)}
                />
            )}
        </PageContents>
    );
}
