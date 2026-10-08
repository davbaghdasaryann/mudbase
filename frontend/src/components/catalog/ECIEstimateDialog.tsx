'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Autocomplete, Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography, Divider, Button, TextField, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

import ImgElement from '@/tsui/DomElements/ImgElement';
import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';
import EstimatePageDialog from '@/app/estimates/EstimateDialog';
import EstimateWorksListDialog from '@/components/estimate/EstimateWorksListDialog';
import EstimateMaterialsListDialog from '@/components/estimate/EstimateMaterialsListDialog';
import EstimateThreeLevelNestedAccordion, { EstimateThreeLevelNestedAccordionRef } from '@/components/estimate/EstimateThreeLevelAccordion';
import EstimateOtherExpensesAccordion from '@/components/estimate/EstimateOtherExpensesAccordion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import CheckIcon from '@mui/icons-material/Check';
import HomeIcon from '@mui/icons-material/Home';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FoundationIcon from '@mui/icons-material/Foundation';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import BoltIcon from '@mui/icons-material/Bolt';
import AirIcon from '@mui/icons-material/Air';
import { usePermissions } from '@/api/auth';
import * as Api from '@/api';
import { ApiAccount, makeCompanyLogoUrl } from '@/api/accounts';
import { confirmDialog, successDialog } from '@/components/ConfirmationDialog';

const TOOLBAR_ICON = '/images/icons/toolbar';

interface ECIEstimateDialogProps {
    eciEstimateId: string;
    estimateId?: string;
    estimateTitle: string;
    onClose: () => void;
}

export default function ECIEstimateDialog(props: ECIEstimateDialogProps) {
    const { t } = useTranslation();
    const { permissionsSet } = usePermissions();
    const [activeTab, setActiveTab] = useState(0);

    const [linkedEstimateId, setLinkedEstimateId] = useState<string | undefined>(props.estimateId);
    const [showEstimateDialog, setShowEstimateDialog] = useState(false);
    const [showWorksListDialog, setShowWorksListDialog] = useState(false);
    const [showMaterialsListDialog, setShowMaterialsListDialog] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedLaborIds, setSelectedLaborIds] = useState<string[]>([]);
    const accordionRef = useRef<EstimateThreeLevelNestedAccordionRef>(null);
    const autoUpdatedRef = useRef(false);
    const [accordionKey, setAccordionKey] = useState(0);

    // Auto-update market prices when an estimate is linked/opened (no confirmation needed)
    useEffect(() => {
        if (!linkedEstimateId || autoUpdatedRef.current) return;
        autoUpdatedRef.current = true;
        Api.requestSession<any>({
            command: 'estimate/calc_market_prices',
            args: { estimateId: linkedEstimateId },
        }).then(() => {
            setAccordionKey(k => k + 1); // remount accordion so it fetches fresh prices
        }).catch(() => {});
    }, [linkedEstimateId]);
    const [creatorAccount, setCreatorAccount] = useState<ApiAccount | null>(null);

    const [constructionTypes, setConstructionTypes] = useState<string[]>([]);

    useEffect(() => {
        if (!linkedEstimateId) { setConstructionTypes([]); return; }
        Api.requestSession<any>({ command: 'estimate/get', args: { estimateId: linkedEstimateId } })
            .then(est => {
                setConstructionTypes(est?.constructionTypes ?? []);
                if (!est?.accountId) return;
                return Api.requestSession<ApiAccount>({ command: 'account/get', args: { accountId: String(est.accountId) } });
            })
            .then(account => { if (account) setCreatorAccount(account); })
            .catch(() => {});
    }, [linkedEstimateId]);

    const toggleConstructionType = async (key: string) => {
        if (!linkedEstimateId) return;
        const next = constructionTypes.includes(key)
            ? constructionTypes.filter(k => k !== key)
            : [...constructionTypes, key];
        setConstructionTypes(next);
        await Api.requestSession({ command: 'estimate/update_construction_types', json: { estimateId: linkedEstimateId, constructionTypes: next } });
    };

    const isAdmin = permissionsSet == null ? true : permissionsSet.has('CAT_EDT');
    const isSuperAdmin = permissionsSet == null ? true : permissionsSet.has('USR_FCH_ALL');
    const hasLinkedEstimate = !!linkedEstimateId;

    const [editingCompany, setEditingCompany] = useState(false);
    const [allAccounts, setAllAccounts] = useState<ApiAccount[]>([]);

    useEffect(() => {
        if (!isSuperAdmin) return;
        Api.requestSession<ApiAccount[]>({ command: 'accounts/fetch_active', args: { search: '', select: 'all' } })
            .then(data => { if (data) setAllAccounts(data); })
            .catch(() => {});
    }, [isSuperAdmin]);

    const handleChangeCompany = async (account: ApiAccount | null) => {
        setEditingCompany(false);
        if (!account || !linkedEstimateId) return;
        await Api.requestSession({ command: 'estimate/change_account', args: { estimateId: linkedEstimateId, accountId: account._id } });
        setCreatorAccount(account);
    };

    // Superadmin: create or open linked estimate
    const handleCreateEstimation = async () => {
        if (isAdmin) {
            if (hasLinkedEstimate) {
                // Already linked - open the estimate editor
                setShowEstimateDialog(true);
            } else {
                // Create a new estimate and link it
                try {
                    const result = await Api.requestSession<{ estimateId: string; alreadyLinked: boolean }>({
                        command: 'eci/create_linked_estimate',
                        args: { eciEstimateId: props.eciEstimateId }
                    });
                    setLinkedEstimateId(result.estimateId);
                    setShowEstimateDialog(true);
                } catch (error) {
                    console.error('Error creating linked estimate:', error);
                }
            }
        } else {
            // Regular user: copy to their estimates
            try {
                await Api.requestSession({
                    command: 'eci/copy_estimate',
                    args: { eciEstimateId: props.eciEstimateId }
                });
                await successDialog(t('Estimate copied to your estimates successfully'), t('Success'));
            } catch (error) {
                console.error('Error copying estimate:', error);
            }
        }
    };

    const handleUpdate = () => {
        if (isSelectMode) {
            const selectedIds = accordionRef.current?.getSelectedLaborIds() ?? [];
            if (selectedIds.length > 0) {
                accordionRef.current?.calcMarketPrices(selectedIds);
                return;
            }
        }
        accordionRef.current?.calcMarketPrices();
    };

    const handleWorksListClick = () => {
        if (hasLinkedEstimate) {
            setShowWorksListDialog(true);
        }
    };

    const handleMaterialsListClick = () => {
        if (hasLinkedEstimate) {
            setShowMaterialsListDialog(true);
        }
    };

    const handleDownload = (format: 'html' | 'word' | 'pdf') => {
        if (!linkedEstimateId) return;

        const commandMap = {
            html: 'estimate/generate_html',
            word: 'estimate/generate_word',
            pdf: 'estimate/generate_pdf'
        };

        window.open(
            Api.makeApiUrl({
                command: commandMap[format],
                args: { estimateId: linkedEstimateId },
            }),
            '_blank'
        );
    };

    const tabSx = {
        flex: 1,
        minHeight: 43,
        height: 43,
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTab-root': {
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            border: '1px solid rgba(0, 171, 190, 0.35)',
            borderBottom: '1px solid transparent',
            marginRight: '4px',
            minHeight: 43,
            height: 43,
            padding: '12px 16px',
        },
        '& .Mui-selected': {
            backgroundColor: '#F5F9F9',
            borderTop: '1px solid #00ABBE',
            borderLeft: '1px solid #00ABBE',
            borderRight: '1px solid #00ABBE',
            borderBottom: 'none',
            marginBottom: 0,
            position: 'relative',
            zIndex: 1,
            color: '#000000 !important',
            fontWeight: 700,
        }
    };

    const panelSx = {
        mb: 2,
        p: 1.5,
        backgroundColor: '#F5F9F9',
        border: '1px solid #00ABBE',
        borderTop: 0,
        borderRadius: '0 4px 4px 4px',
        height: 130,
        overflow: 'visible',
    };

    const toolButtonSx = (disabled?: boolean) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1,
        backgroundColor: 'transparent',
        borderRadius: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s',
        ...(disabled ? {} : {
            '&:hover': {
                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(-2px)',
            },
        }),
        width: { xs: 85, md: 100, lg: 115 },
        minHeight: { xs: 65, md: 75, lg: 85 },
    });

    const noDataMessage = (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 150 }}>
            <Typography color="text.secondary">
                {t('No linked estimate available')}
            </Typography>
        </Box>
    );

    const handleSelectClick = () => {
        setIsSelectMode((prev) => {
            if (prev) setSelectedLaborIds([]);
            return !prev;
        });
    };

    const handleSetHidden = (hidden: boolean) => {
        if (selectedLaborIds.length === 0 || !linkedEstimateId) return;
        Api.requestSession({
            command: 'estimate/set_labor_items_hidden',
            args: { estimateId: linkedEstimateId },
            json: { estimatedLaborIds: selectedLaborIds, hidden },
        }).then(async () => {
            await accordionRef.current?.refreshEverything(false);
            // Re-trigger render so anySelectedHidden re-reads updated accordion state
            setSelectedLaborIds(prev => [...prev]);
        });
    };

    const selectedDetails = accordionRef.current?.getSelectedLaborDetails?.() ?? [];
    const anySelectedHidden = selectedDetails.some((d) => d.isHidden);
    const hideUnhideLabelKey = anySelectedHidden ? 'Unhide' : 'Hide';
    const handleHideUnhide = () => (anySelectedHidden ? handleSetHidden(false) : handleSetHidden(true));

    // Build tool buttons based on admin vs user
    const toolButtons = isAdmin
        ? [
            {
                labelKey: hasLinkedEstimate ? 'Edit Estimation' : 'Create Estimation',
                icon: `${TOOLBAR_ICON}/add.svg`,
                onClick: handleCreateEstimation,
            },
            { labelKey: 'Works List', icon: `${TOOLBAR_ICON}/works.svg`, onClick: handleWorksListClick, disabled: !hasLinkedEstimate },
            { labelKey: 'Materials List', icon: `${TOOLBAR_ICON}/materials.svg`, onClick: handleMaterialsListClick, disabled: !hasLinkedEstimate },
            { labelKey: 'Select', icon: `${TOOLBAR_ICON}/select.svg`, onClick: handleSelectClick, isSelect: true },
        ]
        : [
            { labelKey: 'Copy', icon: `${TOOLBAR_ICON}/add.svg`, onClick: handleCreateEstimation, disabled: !hasLinkedEstimate },
            { labelKey: 'Works List', icon: `${TOOLBAR_ICON}/works.svg`, onClick: handleWorksListClick, disabled: !hasLinkedEstimate },
            { labelKey: 'Materials List', icon: `${TOOLBAR_ICON}/materials.svg`, onClick: handleMaterialsListClick, disabled: !hasLinkedEstimate },
            { labelKey: 'Select', icon: `${TOOLBAR_ICON}/select.svg`, onClick: () => {}, disabled: true },
        ];

    return (
        <>
            <Dialog
                fullScreen
                open={true}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                        props.onClose();
                    }
                }}
                slotProps={{
                    paper: { style: { padding: 5 } },
                }}
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 5,
                    },
                }}
            >
                <DialogTitle sx={{ m: 0, pt: 1, pb: 0 }}>
                    {props.estimateTitle}
                </DialogTitle>

                <IconButton
                    aria-label='close'
                    onClick={props.onClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>

                <DialogContent>
                    {/* Tabs */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', position: 'relative', mb: 0, '&::after': { content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: '#00ABBE', zIndex: 0 } }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={tabSx}>
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/tools.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('Tools')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/info.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('General Info')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/tools.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('General Parameters')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/export.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('Export')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                        </Tabs>
                    </Box>

                    {/* Tools Tab */}
                    {activeTab === 0 && (
                        <Box sx={panelSx}>
                            <Box sx={{
                                display: 'flex',
                                gap: 1.5,
                                flexWrap: 'nowrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                            }}>
                                {toolButtons.map((tool, index) => {
                                    const isSelectActive = tool.isSelect && isSelectMode;
                                    return (
                                        <Box
                                            key={index}
                                            onClick={() => { if (!tool.disabled) tool.onClick(); }}
                                            sx={{
                                                ...toolButtonSx(tool.disabled),
                                                ...(isSelectActive ? {
                                                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                                    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                                    transform: 'translateY(-2px)',
                                                } : {}),
                                            }}
                                        >
                                            <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <ImgElement src={tool.icon} sx={{ height: 22 }} />
                                            </Box>
                                            <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '11px', minHeight: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                                {t(tool.labelKey)}
                                            </Typography>
                                        </Box>
                                    );
                                })}

                                {/* Divider */}
                                <Box sx={{ width: '2px', backgroundColor: 'rgba(0, 0, 0, 0.12)', alignSelf: 'stretch', mx: 1 }} />

                                {/* Hide/Unhide button */}
                                <Box
                                    onClick={() => { if (isAdmin && selectedLaborIds.length > 0) handleHideUnhide(); }}
                                    sx={{ ...toolButtonSx(!isAdmin || selectedLaborIds.length === 0) }}
                                >
                                    <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {anySelectedHidden
                                            ? <VisibilityOffIcon sx={{ fontSize: 22 }} />
                                            : <VisibilityIcon sx={{ fontSize: 22 }} />}
                                    </Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '11px', minHeight: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                        {t(hideUnhideLabelKey)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* General Info Tab */}
                    {activeTab === 1 && (
                        <Box sx={{ ...panelSx, pt: 0, px: 3, pb: 2 }}>
                            {hasLinkedEstimate ? (
                                <EstimateInfoAccordionContent estimateId={linkedEstimateId!} readOnly={!isAdmin} />
                            ) : noDataMessage}
                        </Box>
                    )}

                    {/* General Parameters Tab */}
                    {activeTab === 2 && (
                        <Box sx={panelSx}>
                            <Box sx={{
                                display: 'flex',
                                gap: 1.5,
                                flexWrap: 'nowrap',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                height: '100%',
                                pl: '35px',
                            }}>
                                {creatorAccount && (
                                    <>
                                        {isSuperAdmin && editingCompany ? (
                                            <Box sx={{ width: 140, px: 1 }}>
                                                <Autocomplete
                                                    options={allAccounts}
                                                    getOptionLabel={(a) => a.companyName ?? ''}
                                                    onChange={(_, val) => handleChangeCompany(val)}
                                                    onBlur={() => setEditingCompany(false)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} autoFocus size="small" placeholder={t('Search company')} />
                                                    )}
                                                    ListboxProps={{ style: { maxHeight: 240 } }}
                                                    componentsProps={{ popper: { placement: 'bottom-start', style: { width: 320 } } }}
                                                    openOnFocus
                                                    size="small"
                                                />
                                            </Box>
                                        ) : (
                                            <Tooltip title={isSuperAdmin ? `${creatorAccount.companyName} — ${t('Change Company')}` : creatorAccount.companyName} placement="bottom">
                                                <Box
                                                    onClick={() => isSuperAdmin && setEditingCompany(true)}
                                                    sx={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                        justifyContent: 'center', gap: 0.5, px: 1, position: 'relative',
                                                        ...(isSuperAdmin && {
                                                            cursor: 'pointer', borderRadius: 1,
                                                            '&:hover': { bgcolor: 'rgba(0,171,190,0.08)',
                                                                '& .edit-icon': { opacity: 1 } },
                                                        }),
                                                    }}
                                                >
                                                    {makeCompanyLogoUrl(creatorAccount) ? (
                                                        <Box component="img" src={makeCompanyLogoUrl(creatorAccount)}
                                                            alt={creatorAccount.companyName}
                                                            sx={{ height: 36, maxWidth: 100, objectFit: 'contain', borderRadius: 1 }} />
                                                    ) : (
                                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,171,190,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#00ABBE' }}>
                                                                {creatorAccount.companyName?.charAt(0)?.toUpperCase() ?? '?'}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                        <Typography sx={{ fontSize: '11px', fontWeight: 500, color: 'text.secondary', textAlign: 'center', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {creatorAccount.companyName}
                                                        </Typography>
                                                        {isSuperAdmin && <EditIcon className="edit-icon" sx={{ fontSize: 11, color: 'text.disabled', opacity: 0, transition: 'opacity 0.15s' }} />}
                                                    </Box>
                                                </Box>
                                            </Tooltip>
                                        )}
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                                    </>
                                )}

                                {[
                                    { label: t('Project'), icon: `${TOOLBAR_ICON}/import.svg`, onClick: () => {} },
                                    { label: t('Specification'), icon: `${TOOLBAR_ICON}/works.svg`, onClick: () => {} },
                                ].map((tool, index) => (
                                    <Box key={index} onClick={tool.onClick} sx={toolButtonSx()}>
                                        <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ImgElement src={tool.icon} sx={{ height: 22 }} />
                                        </Box>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '11px', minHeight: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                            {tool.label}
                                        </Typography>
                                    </Box>
                                ))}

                                {true && (
                                    <>
                                    <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                        {[
                                            { key: 'interior', label: 'Ներքին Հարդարում', icon: <FormatPaintIcon />, color: '#E07B39' },
                                            { key: 'exterior', label: 'Արտաքին Հարդարում', icon: <HomeIcon />, color: '#4CAF50' },
                                            { key: 'heating', label: 'Ջեռուցում', icon: <WhatshotIcon />, color: '#F44336' },
                                            { key: 'foundation', label: 'Հիմնակմախքի իրականացում', icon: <FoundationIcon />, color: '#8D6E63' },
                                            { key: 'water_supply', label: 'Ջրամատակարարում', icon: <WaterDropIcon />, color: '#2196F3' },
                                            { key: 'sewage', label: 'Ջրահեռացում և կենցաղային կոյուղի', icon: <PlumbingIcon />, color: '#00ACC1' },
                                            { key: 'electrical', label: 'Էլեկտրասնուցում', icon: <BoltIcon />, color: '#FFC107' },
                                            { key: 'ventilation', label: 'Օդափոխություն', icon: <AirIcon />, color: '#7E57C2' },
                                        ].map((item) => {
                                            const selected = constructionTypes.includes(item.key);
                                            return (
                                                <Tooltip key={item.key} title={isSuperAdmin ? 'ընտրել' : ''} placement="top" arrow>
                                                <Box
                                                    onClick={isSuperAdmin ? () => toggleConstructionType(item.key) : undefined}
                                                    sx={{
                                                        ...toolButtonSx(!isSuperAdmin),
                                                        pointerEvents: isSuperAdmin ? 'auto' : 'none',
                                                        backgroundColor: selected ? 'rgba(0,171,190,0.12)' : 'rgba(0,171,190,0.04)',
                                                        opacity: (!isSuperAdmin && !selected) ? 0.6 : 1,
                                                        outline: selected ? '1.5px solid' : 'none',
                                                        outlineColor: 'primary.main',
                                                        minWidth: 80,
                                                        height: 84,
                                                    }}
                                                >
                                                    <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.color, '& svg': { fontSize: '22px' } }}>
                                                        {item.icon}
                                                    </Box>
                                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '11px', height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textAlign: 'center', color: selected ? 'primary.main' : 'text.secondary' }}>
                                                        {item.label}
                                                    </Typography>
                                                </Box>
                                                </Tooltip>
                                            );
                                        })}
                                    </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Export Tab */}
                    {activeTab === 3 && (
                        <Box sx={panelSx}>
                            {hasLinkedEstimate ? (
                                <Box sx={{
                                    display: 'flex',
                                    gap: 1.5,
                                    flexWrap: 'nowrap',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    height: '100%',
                                    pl: '35px',
                                }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            {[
                                                { label: 'Estimation HTML', icon: `${TOOLBAR_ICON}/html.svg`, format: 'html' as const },
                                                { label: 'Estimation Word', icon: `${TOOLBAR_ICON}/word.svg`, format: 'word' as const },
                                                { label: 'Estimation PDF', icon: `${TOOLBAR_ICON}/pdf.svg`, format: 'pdf' as const },
                                            ].map((format, index) => (
                                                <Box
                                                    key={index}
                                                    onClick={() => handleDownload(format.format)}
                                                    sx={toolButtonSx()}
                                                >
                                                    <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <ImgElement src={format.icon} sx={{ height: 22 }} />
                                                    </Box>
                                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '11px', minHeight: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                                        {t(format.label)}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                </Box>
                            ) : noDataMessage}
                        </Box>
                    )}

                    {/* Estimate content - always visible below tabs when linked */}
                    {hasLinkedEstimate && (
                        <EstimateThreeLevelNestedAccordion
                            key={accordionKey}
                            ref={accordionRef}
                            estimateId={linkedEstimateId!}
                            isOnlyEstInfo={!isAdmin}
                            selectMode={isSelectMode}
                            onSelectionChange={setSelectedLaborIds}
                        />
                    )}
                    {hasLinkedEstimate && (
                        <EstimateOtherExpensesAccordion estimateId={linkedEstimateId!} viewOnly={!isSuperAdmin} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Full Estimate Editor (for superadmin) */}
            {showEstimateDialog && linkedEstimateId && (
                <EstimatePageDialog
                    estimateId={linkedEstimateId}
                    estimateTitle={props.estimateTitle}
                    onClose={() => setShowEstimateDialog(false)}
                    showBackButton={true}
                    disableUpdateData={true}
                />
            )}

            {/* Works List Dialog */}
            {showWorksListDialog && linkedEstimateId && (
                <EstimateWorksListDialog
                    estimateId={linkedEstimateId}
                    onClose={() => setShowWorksListDialog(false)}
                    onSave={() => {}}
                    readOnly={!isAdmin}
                />
            )}

            {/* Materials List Dialog */}
            {showMaterialsListDialog && linkedEstimateId && (
                <EstimateMaterialsListDialog
                    estimateId={linkedEstimateId}
                    onClose={() => setShowMaterialsListDialog(false)}
                    onSave={() => {}}
                    readOnly={!isAdmin}
                />
            )}
        </>
    );
}
