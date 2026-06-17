'use client';

import { useState } from 'react';
import { Box, Button, Stack, Typography, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ExtensionIcon from '@mui/icons-material/Extension';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '../structural/ChooseEstimationDialog';
import ComparativeLaborGrid from './ComparativeLaborGrid';
import BaseProposalsGrid from './BaseProposalsGrid';
import SelectCompanyDialog, { CompanyOption } from './SelectCompanyDialog';
import * as EstimatesApi from '@/api/estimate';

type AnalyticsTab = 'general' | 'labor' | 'materials';

const cards = [
    { key: 'By Market Value', gradientId: 'comparativeGradientGreen' },
    { key: 'By Submitted Estimations', gradientId: 'comparativeGradientBlue' },
    { key: 'By Base Proposals', gradientId: 'comparativeGradientTeal' },
];

export default function ComparativeAnalysisPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('general');
    const [analysisType, setAnalysisType] = useState<'market' | 'base_proposals'>('market');
    const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
    const [selectedCompanies, setSelectedCompanies] = useState<CompanyOption[]>([]);

    const hasData = !!selectedEstimate;

    const handleCardClick = (key: string) => {
        if (key === 'By Market Value') { setAnalysisType('market'); setDialogOpen(true); }
        if (key === 'By Base Proposals') { setAnalysisType('base_proposals'); setDialogOpen(true); }
    };

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
        setActiveTab(analysisType === 'base_proposals' ? 'labor' : 'general');
    };

    return (
        <PageContents title='Comparative Analytics'>
            <Box component='svg' width={0} height={0} sx={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id='comparativeGradientGreen' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#2ECC71' />
                        <stop offset='100%' stopColor='#1CA461' />
                    </linearGradient>
                    <linearGradient id='comparativeGradientBlue' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#29B6F6' />
                        <stop offset='100%' stopColor='#0288D1' />
                    </linearGradient>
                    <linearGradient id='comparativeGradientTeal' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#1CA461' />
                        <stop offset='100%' stopColor='#00ABBE' />
                    </linearGradient>
                </defs>
            </Box>

            {hasData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
                    <TabContext value={activeTab}>
                        {/* Fixed header — stays pinned, no sticky needed */}
                        <Box sx={{ flexShrink: 0, pt: 1 }}>
                            <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                                {selectedEstimate!.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'stretch', borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={(_, v) => setActiveTab(v as AnalyticsTab)} sx={{ flex: 1 }}>
                                    <Tab label={t('General')} value='general' disabled={analysisType === 'base_proposals'} />
                                    <Tab label={t('Labor')} value='labor' />
                                    <Tab label={t('Materials')} value='materials' />
                                </TabList>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, pb: '4px' }}>
                                    {analysisType === 'base_proposals' && (
                                        <Button variant='text' size='small' onClick={() => setCompanyDialogOpen(true)} sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                            {t('Add')} +
                                        </Button>
                                    )}
                                    <PageButton variant='contained' label='Create' size='small' sx={{ borderRadius: '25px' }} onClick={() => setDialogOpen(true)} />
                                </Box>
                            </Box>
                        </Box>

                        {/* Inner scroll container — table content scrolls here */}
                        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                            {analysisType === 'market' ? (
                                <>
                                    <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                                        <ComparativeLaborGrid estimate={selectedEstimate!} includeMaterials />
                                    </TabPanel>
                                    <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                                        <ComparativeLaborGrid estimate={selectedEstimate!} />
                                    </TabPanel>
                                    <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                                        <ComparativeLaborGrid estimate={selectedEstimate!} materialsOnly />
                                    </TabPanel>
                                </>
                            ) : (
                                <>
                                    <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                                        <BaseProposalsGrid estimate={selectedEstimate!} companies={selectedCompanies} mode='general' />
                                    </TabPanel>
                                    <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                                        <BaseProposalsGrid estimate={selectedEstimate!} companies={selectedCompanies} mode='labor' />
                                    </TabPanel>
                                    <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                                        <BaseProposalsGrid estimate={selectedEstimate!} companies={selectedCompanies} mode='materials' />
                                    </TabPanel>
                                </>
                            )}
                        </Box>
                    </TabContext>
                </Box>
            ) : (
                <Stack direction='row' spacing={3} flexWrap='wrap' useFlexGap justifyContent='center' sx={{ width: '100%' }}>
                    {cards.map((card) => (
                        <Box
                            key={card.key}
                            role='button'
                            tabIndex={0}
                            onClick={() => handleCardClick(card.key)}
                            sx={{
                                position: 'relative',
                                width: 180,
                                minHeight: 160,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 3,
                                cursor: 'pointer',
                                borderRadius: 3,
                                background: 'rgba(255, 255, 255, 0.55)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
                                },
                            }}
                        >
                            <AddIcon
                                sx={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    fontSize: 20,
                                    color: 'text.primary',
                                }}
                            />
                            <ExtensionIcon
                                sx={{
                                    fontSize: 56,
                                    fill: `url(#${card.gradientId})`,
                                }}
                            />
                            <Typography variant='body2' align='center' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {t(card.key)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            )}

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />

            <SelectCompanyDialog
                open={companyDialogOpen}
                onClose={() => setCompanyDialogOpen(false)}
                initialSelected={selectedCompanies}
                onConfirm={(companies) => { setSelectedCompanies(companies); setCompanyDialogOpen(false); }}
            />
        </PageContents>
    );
}
