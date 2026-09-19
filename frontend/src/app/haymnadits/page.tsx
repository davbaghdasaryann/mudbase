'use client';

import React, { useState } from 'react';
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
    const [widgets, setWidgets] = useState<FounderWidgetConfig[]>([]);
    const [builderOpen, setBuilderOpen] = useState(false);

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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 2 }}>
                    <CorporateFareOutlinedIcon sx={{ fontSize: 100, color: mainPrimaryColor, opacity: 0.2 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No Founders created yet')}</Typography>
                    <Button
                        variant='outlined'
                        startIcon={<AddIcon />}
                        onClick={() => setBuilderOpen(true)}
                        sx={{ borderRadius: '25px', height: '40px', mt: 1, borderColor: mainPrimaryColor, color: mainPrimaryColor, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
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
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 400px))' }}>
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
