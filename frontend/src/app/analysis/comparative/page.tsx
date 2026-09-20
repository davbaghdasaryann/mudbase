'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Button, Typography, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '../structural/ChooseEstimationDialog';
import ComparativeCreateDialog from './ComparativeCreateDialog';
import ComparativeLaborGrid from './ComparativeLaborGrid';
import BaseProposalsGrid from './BaseProposalsGrid';
import EnteredDataGrid from './EnteredDataGrid';
import SelectCompanyDialog, { CompanyOption } from './SelectCompanyDialog';
import SelectSharedEstimationDialog, { SharedEstimationSelection } from './SelectSharedEstimationDialog';
import SubmittedEstimationsGrid from './SubmittedEstimationsGrid';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';

type AnalyticsTab = 'general' | 'labor' | 'materials';

export default function ComparativeAnalysisPage() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('general');
    const [analysisType, setAnalysisType] = useState<'market' | 'base_proposals' | 'entered_data'>('market');
    const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
    const [selectedCompanies, setSelectedCompanies] = useState<CompanyOption[]>([]);
    const [sharedEstimationDialogOpen, setSharedEstimationDialogOpen] = useState(false);
    const [submittedSelection, setSubmittedSelection] = useState<SharedEstimationSelection | null>(null);

    const hasData = !!selectedEstimate || !!submittedSelection;

    useEffect(() => {
        const type = searchParams.get('type');
        if (!type) return;

        if (type === 'market') {
            const estimateId = searchParams.get('estimateId');
            if (!estimateId) return;
            Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId } })
                .then(full => { if (full) { setAnalysisType('market'); setSelectedEstimate(full); setActiveTab('general'); } })
                .catch(() => {});
        } else if (type === 'base_proposals') {
            const estimateId = searchParams.get('estimateId');
            const companiesRaw = searchParams.get('companies');
            if (!estimateId || !companiesRaw) return;
            try {
                const companies: CompanyOption[] = JSON.parse(companiesRaw);
                Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId } })
                    .then(full => { if (full) { setAnalysisType('base_proposals'); setSelectedEstimate(full); setSelectedCompanies(companies); setActiveTab('labor'); } })
                    .catch(() => {});
            } catch {}
        } else if (type === 'submitted') {
            const originalEstimateId = searchParams.get('originalEstimateId');
            const estimateRaw = searchParams.get('estimate');
            const companiesRaw = searchParams.get('companies');
            if (!originalEstimateId || !estimateRaw || !companiesRaw) return;
            try {
                setSubmittedSelection({
                    originalEstimateId,
                    estimate: JSON.parse(estimateRaw),
                    companies: JSON.parse(companiesRaw),
                });
                setActiveTab('general');
            } catch {}
        }
    }, [searchParams]);

    const handleCardClick = (key: string) => {
        if (key === 'By Market Value') { setSubmittedSelection(null); setAnalysisType('market'); setDialogOpen(true); }
        if (key === 'By Base Proposals') { setSubmittedSelection(null); setAnalysisType('base_proposals'); setDialogOpen(true); }
        if (key === 'By Submitted Estimations') { setSharedEstimationDialogOpen(true); }
        if (key === 'By Entered Data') { setSubmittedSelection(null); setAnalysisType('entered_data'); setDialogOpen(true); }
    };

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
        setActiveTab(analysisType === 'base_proposals' ? 'labor' : 'general');
    };

    return (
        <PageContents title='Comparative Analytics'>
            {hasData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
                    <TabContext value={activeTab}>
                        {/* Fixed header — stays pinned, no sticky needed */}
                        <Box sx={{ flexShrink: 0 }}>
                            <Button
                                startIcon={<ArrowBackIcon fontSize='small' />}
                                size='small'
                                onClick={() => { setSelectedEstimate(null); setSubmittedSelection(null); }}
                                sx={{ color: 'text.secondary', pl: 0, mb: 0.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                            >
                                {t('Back')}
                            </Button>
                            <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                                {submittedSelection ? submittedSelection.estimate.name : selectedEstimate!.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'stretch', borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={(_, v) => setActiveTab(v as AnalyticsTab)} sx={{ flex: 1 }}>
                                    <Tab label={t('General')} value='general' disabled={analysisType === 'base_proposals' && !submittedSelection} />
                                    <Tab label={t('Labor')} value='labor' />
                                    <Tab label={t('Materials')} value='materials' />
                                </TabList>
                                {analysisType === 'base_proposals' && !submittedSelection && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pb: '4px' }}>
                                        <Button variant='text' size='small' onClick={() => setCompanyDialogOpen(true)} sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                            {t('Add')} +
                                        </Button>
                                    </Box>
                                )}
                                {analysisType === 'entered_data' && !submittedSelection && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pb: '4px' }}>
                                        <Button variant='text' size='small' sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                            {t('Add')} +
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Inner scroll container — table content scrolls here */}
                        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                            {submittedSelection ? (
                                <>
                                    <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                                        <SubmittedEstimationsGrid originalEstimateId={submittedSelection.originalEstimateId} companies={submittedSelection.companies} mode='general' />
                                    </TabPanel>
                                    <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                                        <SubmittedEstimationsGrid originalEstimateId={submittedSelection.originalEstimateId} companies={submittedSelection.companies} mode='labor' />
                                    </TabPanel>
                                    <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                                        <SubmittedEstimationsGrid originalEstimateId={submittedSelection.originalEstimateId} companies={submittedSelection.companies} mode='materials' />
                                    </TabPanel>
                                </>
                            ) : analysisType === 'market' ? (
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
                            ) : analysisType === 'entered_data' ? (
                                <>
                                    <TabPanel value='general' sx={{ px: 0, pt: 2 }}>
                                        <EnteredDataGrid estimate={selectedEstimate!} mode='general' />
                                    </TabPanel>
                                    <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                                        <EnteredDataGrid estimate={selectedEstimate!} mode='labor' />
                                    </TabPanel>
                                    <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                                        <EnteredDataGrid estimate={selectedEstimate!} mode='materials' />
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 2 }}>
                    <CompareArrowsIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {t('No analytics created yet')}
                    </Typography>
                    <PageButton
                        variant='outlined'
                        label='Create'
                        size='large'
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{
                            borderRadius: '25px',
                            height: '40px',
                            mt: 1,
                            '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor },
                        }}
                    />
                </Box>
            )}

            <ComparativeCreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSelect={handleCardClick}
            />

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

            <SelectSharedEstimationDialog
                open={sharedEstimationDialogOpen}
                onClose={() => setSharedEstimationDialogOpen(false)}
                onConfirm={(selection: SharedEstimationSelection) => {
                    setSubmittedSelection(selection);
                    setSharedEstimationDialogOpen(false);
                    setActiveTab('general');
                    setSelectedEstimate(null);
                    setAnalysisType('market');
                }}
            />
        </PageContents>
    );
}
