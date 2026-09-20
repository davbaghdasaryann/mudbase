'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Typography, Tab, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InputIcon from '@mui/icons-material/Input';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '../structural/ChooseEstimationDialog';
import ComparativeCreateDialog from './ComparativeCreateDialog';
import ComparativeLaborGrid from './ComparativeLaborGrid';
import BaseProposalsGrid from './BaseProposalsGrid';
import EnteredDataGrid, { EnteredCompany, CellState } from './EnteredDataGrid';
import AddEnteredCompanyDialog from './AddEnteredCompanyDialog';
import SelectCompanyDialog, { CompanyOption } from './SelectCompanyDialog';
import SelectSharedEstimationDialog, { SharedEstimationSelection } from './SelectSharedEstimationDialog';
import SubmittedEstimationsGrid from './SubmittedEstimationsGrid';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';
import PackageLock from '@/components/PackageLock';

type AnalyticsTab = 'general' | 'labor' | 'materials';

interface ComparativeRecord {
    _id: string;
    name: string;
    analysisType: 'market' | 'base_proposals' | 'entered_data';
    estimateId: string | null;
    activeTab: string;
    selectedCompanies: CompanyOption[];
    submittedSelection: SharedEstimationSelection | null;
    enteredDataCompanies: EnteredCompany[];
    enteredDataCellValues?: Record<string, Record<string, CellState>>;
    createdAt: string;
    updatedAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
    market: ShowChartIcon,
    base_proposals: AccountBalanceIcon,
    entered_data: InputIcon,
    submitted: FactCheckIcon,
};
const TYPE_COLOR: Record<string, string> = {
    market: '#00ABBE',
    base_proposals: '#0288D1',
    entered_data: '#E67E22',
    submitted: '#1CA461',
};


function ComparativeAnalysisPageInner() {
    const { t } = useTranslation();
    const router = useRouter();
    const TYPE_LABEL: Record<string, string> = {
        market: t('By Market Value'),
        base_proposals: t('By Base Proposals'),
        entered_data: 'Ըստ մուտքագրված տվյալների',
        submitted: t('By Submitted Estimations'),
    };
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('id');

    // List state
    const [records, setRecords] = useState<ComparativeRecord[]>([]);
    const [listLoading, setListLoading] = useState(true);

    // Detail state
    const [detail, setDetail] = useState<ComparativeRecord | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('general');
    const [selectedCompanies, setSelectedCompanies] = useState<CompanyOption[]>([]);
    const [enteredDataCompanies, setEnteredDataCompanies] = useState<EnteredCompany[]>([]);
    const [enteredDataCellValues, setEnteredDataCellValues] = useState<Record<string, Record<string, CellState>>>({});

    // Dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingCardKey, setPendingCardKey] = useState<string>('');
    const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
    const [sharedEstimationDialogOpen, setSharedEstimationDialogOpen] = useState(false);
    const [addEnteredCompanyOpen, setAddEnteredCompanyOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load list on mount
    useEffect(() => {
        Api.requestSession<ComparativeRecord[]>({ command: 'comparative/fetch_all', args: {} })
            .then(data => { setRecords(data ?? []); setListLoading(false); })
            .catch(() => setListLoading(false));
    }, []);

    // Load detail when id changes
    useEffect(() => {
        if (!selectedId) { setDetail(null); setSelectedEstimate(null); setEstimateLoading(false); return; }
        setDetailLoading(true);
        Api.requestSession<ComparativeRecord>({ command: 'comparative/fetch', args: { id: selectedId } })
            .then(data => {
                if (!data) return;
                setDetail(data);
                setActiveTab((data.activeTab as AnalyticsTab) ?? 'general');
                setSelectedCompanies(data.selectedCompanies ?? []);
                setEnteredDataCompanies(data.enteredDataCompanies ?? []);
                setEnteredDataCellValues(data.enteredDataCellValues ?? {});
                // Re-fetch full estimate object if needed
                if (data.estimateId) {
                    setEstimateLoading(true);
                    Api.requestSession<EstimatesApi.ApiEstimate>({ command: 'estimate/get', args: { estimateId: data.estimateId } })
                        .then(full => { if (full) setSelectedEstimate(full); })
                        .catch(() => {})
                        .finally(() => setEstimateLoading(false));
                } else {
                    setSelectedEstimate(null);
                    setEstimateLoading(false);
                }
            })
            .catch(() => {})
            .finally(() => setDetailLoading(false));
    }, [selectedId]);

    // Debounced autosave on changes
    const triggerSave = useCallback((patch: Partial<ComparativeRecord>) => {
        if (!selectedId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            Api.requestSession({ command: 'comparative/update', args: { id: selectedId }, json: patch }).catch(() => {});
        }, 800);
    }, [selectedId]);

    const handleCardClick = (key: string) => {
        if (key === 'By Submitted Estimations') { setSharedEstimationDialogOpen(true); return; }
        setPendingCardKey(key);
        setDialogOpen(true);
    };

    const handleEstimateSelect = async (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        const analysisType: 'market' | 'base_proposals' | 'entered_data' =
            pendingCardKey === 'By Market Value' ? 'market' :
            pendingCardKey === 'By Base Proposals' ? 'base_proposals' : 'entered_data';
        const tab = analysisType === 'market' ? 'general' : 'labor';
        setCreating(true);
        try {
            const result = await Api.requestSession<{ _id: string }>({ command: 'comparative/create', json: {
                name: estimate.name,
                analysisType,
                estimateId: String(estimate._id),
                activeTab: tab,
                selectedCompanies: [],
                submittedSelection: null,
                enteredDataCompanies: [],
                enteredDataCellValues: {},
            }});
            const newRec: ComparativeRecord = {
                _id: String(result._id),
                name: estimate.name,
                analysisType,
                estimateId: String(estimate._id),
                activeTab: tab,
                selectedCompanies: [],
                submittedSelection: null,
                enteredDataCompanies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setRecords(prev => [newRec, ...prev]);
            router.push(`?id=${result._id}`);
        } finally { setCreating(false); }
    };

    const handleSubmittedConfirm = async (selection: SharedEstimationSelection) => {
        setSharedEstimationDialogOpen(false);
        setCreating(true);
        try {
            const result = await Api.requestSession<{ _id: string }>({ command: 'comparative/create', json: {
                name: selection.estimate.name,
                analysisType: 'market', // stored but not used for submitted
                estimateId: null,
                activeTab: 'general',
                selectedCompanies: [],
                submittedSelection: selection,
                enteredDataCompanies: [],
                enteredDataCellValues: {},
            }});
            const newRec: ComparativeRecord = {
                _id: String(result._id),
                name: selection.estimate.name,
                analysisType: 'market',
                estimateId: null,
                activeTab: 'general',
                selectedCompanies: [],
                submittedSelection: selection,
                enteredDataCompanies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setRecords(prev => [newRec, ...prev]);
            router.push(`?id=${result._id}`);
        } finally { setCreating(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await Api.requestSession({ command: 'comparative/delete', args: { id } }).catch(() => {});
        setRecords(prev => prev.filter(r => r._id !== id));
    };

    const handleTabChange = (tab: AnalyticsTab) => {
        setActiveTab(tab);
        triggerSave({ activeTab: tab });
    };

    const handleCompaniesConfirm = (companies: CompanyOption[]) => {
        setSelectedCompanies(companies);
        setCompanyDialogOpen(false);
        triggerSave({ selectedCompanies: companies });
    };

    const handleAddEnteredCompany = (name: string) => {
        const newCompany = { id: `${Date.now()}`, name };
        const next = [...enteredDataCompanies, newCompany];
        setEnteredDataCompanies(next);
        triggerSave({ enteredDataCompanies: next });
    };

    const handleDeleteEnteredCompany = (cid: string) => {
        const next = enteredDataCompanies.filter(c => c.id !== cid);
        setEnteredDataCompanies(next);
        triggerSave({ enteredDataCompanies: next });
    };

    const handleCellChange = (itemId: string, cid: string, field: keyof CellState, val: string) => {
        setEnteredDataCellValues(prev => {
            const next = { ...prev, [itemId]: { ...prev[itemId], [cid]: { ...(prev[itemId]?.[cid] ?? { unitCost: '', qty: '' }), [field]: val } } };
            triggerSave({ enteredDataCellValues: next });
            return next;
        });
    };

    const analysisType = detail?.submittedSelection ? 'submitted' : (detail?.analysisType ?? 'market');
    const submittedSelection = detail?.submittedSelection ?? null;

    // ── List view ──────────────────────────────────────────────────────────
    if (!selectedId) {
        if (listLoading) return (
            <PageContents title='Comparative Analytics'>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
            </PageContents>
        );

        if (records.length === 0) return (
            <PageContents title='Comparative Analytics'>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 180px)', gap: 2 }}>
                    <CompareArrowsIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No analytics created yet')}</Typography>
                    <PageButton
                        variant='outlined' label={creating ? t('Loading...') : t('Create')} size='large'
                        onClick={() => setCreateDialogOpen(true)} disabled={creating}
                        sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                    />
                </Box>
                <ComparativeCreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSelect={handleCardClick} />
                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleEstimateSelect} />
                <SelectSharedEstimationDialog open={sharedEstimationDialogOpen} onClose={() => setSharedEstimationDialogOpen(false)} onConfirm={handleSubmittedConfirm} />
            </PageContents>
        );

        return (
            <PageContents title='Comparative Analytics'>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <PageButton
                            variant='outlined' label={creating ? t('Loading...') : t('Create')}
                            onClick={() => setCreateDialogOpen(true)} disabled={creating}
                            sx={{ borderRadius: '25px', height: '36px', '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }}
                        />
                    </Box>
                    {records.map(rec => {
                        const type = rec.submittedSelection ? 'submitted' : rec.analysisType;
                        const Icon = TYPE_ICON[type] ?? CompareArrowsIcon;
                        const color = TYPE_COLOR[type] ?? mainPrimaryColor;
                        return (
                            <Box key={rec._id} onClick={() => router.push(`?id=${rec._id}`)}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    px: 2.5, py: 1.8, borderRadius: 2, border: '1px solid #e0f5f7',
                                    backgroundColor: '#fafeff', cursor: 'pointer',
                                    transition: 'box-shadow 0.15s, border-color 0.15s',
                                    '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: color },
                                }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Tooltip title={TYPE_LABEL[type] ?? type} placement='top'>
                                        <Icon sx={{ fontSize: 20, color, opacity: 0.7 }} />
                                    </Tooltip>
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.name}</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                                            {new Date(rec.updatedAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Tooltip title={t('Delete')}>
                                    <IconButton size='small' onClick={e => handleDelete(rec._id, e)} sx={{ color: '#ccc', '&:hover': { color: '#e53935' } }}>
                                        <DeleteOutlineIcon fontSize='small' />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        );
                    })}
                </Box>
                <ComparativeCreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSelect={handleCardClick} />
                <ChooseEstimationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleEstimateSelect} />
                <SelectSharedEstimationDialog open={sharedEstimationDialogOpen} onClose={() => setSharedEstimationDialogOpen(false)} onConfirm={handleSubmittedConfirm} />
            </PageContents>
        );
    }

    // ── Detail view ────────────────────────────────────────────────────────
    if (detailLoading || estimateLoading || (selectedId && !detail && !detailLoading)) return (
        <PageContents title='Comparative Analytics'>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
        </PageContents>
    );

    if (!detail) return null;

    return (
        <PageContents title='Comparative Analytics'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
                <TabContext value={activeTab}>
                    <Box sx={{ flexShrink: 0 }}>
                        <Button
                            startIcon={<ArrowBackIcon fontSize='small' />}
                            size='small'
                            onClick={() => router.push('/analysis/comparative')}
                            sx={{ color: 'text.secondary', pl: 0, mb: 0.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                        >
                            {t('Back')}
                        </Button>
                        <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>{detail.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'stretch', borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={(_, v) => handleTabChange(v as AnalyticsTab)} sx={{ flex: 1 }}>
                                <Tab label={t('General')} value='general' disabled={(analysisType === 'base_proposals' || analysisType === 'entered_data') && !submittedSelection} />
                                <Tab label={t('Labor')} value='labor' />
                                <Tab label={t('Materials')} value='materials' />
                            </TabList>
                            {analysisType === 'base_proposals' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pb: '4px' }}>
                                    <Button variant='text' size='small' onClick={() => setCompanyDialogOpen(true)} sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                        {t('Add')} +
                                    </Button>
                                </Box>
                            )}
                            {analysisType === 'entered_data' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pb: '4px' }}>
                                    <Button variant='text' size='small' onClick={() => setAddEnteredCompanyOpen(true)} sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                        {t('Add')} +
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
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
                                    <EnteredDataGrid estimate={selectedEstimate!} mode='general' companies={enteredDataCompanies} onDeleteCompany={handleDeleteEnteredCompany} cellValues={enteredDataCellValues} onCellChange={handleCellChange} />
                                </TabPanel>
                                <TabPanel value='labor' sx={{ px: 0, pt: 2 }}>
                                    <EnteredDataGrid estimate={selectedEstimate!} mode='labor' companies={enteredDataCompanies} onDeleteCompany={handleDeleteEnteredCompany} cellValues={enteredDataCellValues} onCellChange={handleCellChange} />
                                </TabPanel>
                                <TabPanel value='materials' sx={{ px: 0, pt: 2 }}>
                                    <EnteredDataGrid estimate={selectedEstimate!} mode='materials' companies={enteredDataCompanies} onDeleteCompany={handleDeleteEnteredCompany} cellValues={enteredDataCellValues} onCellChange={handleCellChange} />
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

            <SelectCompanyDialog
                open={companyDialogOpen}
                onClose={() => setCompanyDialogOpen(false)}
                initialSelected={selectedCompanies}
                onConfirm={handleCompaniesConfirm}
            />
            <AddEnteredCompanyDialog
                open={addEnteredCompanyOpen}
                onClose={() => setAddEnteredCompanyOpen(false)}
                onAdd={handleAddEnteredCompany}
            />
        </PageContents>
    );
}

export default function ComparativeAnalysisPage() {
    return <PackageLock feature="analysis" pageTitle="Comparative Analysis"><ComparativeAnalysisPageInner /></PackageLock>;
}
