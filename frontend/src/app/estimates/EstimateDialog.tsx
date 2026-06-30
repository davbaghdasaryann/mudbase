'use client';

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

import { Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography, Collapse, Stack } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import ExtensionIcon from '@mui/icons-material/Extension';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

import ImgElement from '@/tsui/DomElements/ImgElement';
import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';

const TOOLBAR_ICON = '/images/icons/toolbar';
import EstimateThreeLevelNestedAccordion, { EstimateThreeLevelNestedAccordionRef } from '@/components/estimate/EstimateThreeLevelAccordion';
import SelectCompanyDialog, { CompanyOption } from '@/app/analysis/comparative/SelectCompanyDialog';
import SelectSharedEstimationDialog, { SharedEstimationSelection } from '@/app/analysis/comparative/SelectSharedEstimationDialog';
import ChronologicalDateRangeDialog from '@/app/analysis/chronological/ChronologicalDateRangeDialog';
import EstimateWorksListDialog from '@/components/estimate/EstimateWorksListDialog';
import EstimateMaterialsListDialog from '@/components/estimate/EstimateMaterialsListDialog';
import EstimateMoveWorksDialog from '@/components/estimate/EstimateMoveWorksDialog';
import EstimateAddToFavoritesDialog from '@/components/estimate/EstimateAddToFavoritesDialog';
import EstimateImportFromFavoritesDialog from '@/components/estimate/EstimateImportFromFavoritesDialog';

import ProgressIndicator from '@/tsui/ProgressIndicator';
import EstimateOtherExpensesAccordion from '@/components/estimate/EstimateOtherExpensesAccordion';

import { runPrintEstimate } from '@/lib/print_estimate';
import { usePermissions } from '@/api/auth';
import * as Api from '@/api';
import { confirmDialog } from '@/components/ConfirmationDialog';

interface EstimatePageDialogProps {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm?: () => void;

    isOnlyEstInfo?: boolean;
}

export default function EstimatePageDialog(props: EstimatePageDialogProps) {
    const { t } = useTranslation();
    const { session, permissionsSet } = usePermissions();
    const router = useRouter();
    const dataUpdatedRef = useRef(false);
    const accordionRef = useRef<EstimateThreeLevelNestedAccordionRef>(null);
    const [activeTab, setActiveTab] = useState(0); // 0: Tools (hidden when isOnlyEstInfo→becomes GeneralInfo), 1: General Info, 2: Export
    const [toolbarOpen, setToolbarOpen] = useState(true);
    const [showWorksListDialog, setShowWorksListDialog] = useState(false);
    const [showMaterialsListDialog, setShowMaterialsListDialog] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedLaborIds, setSelectedLaborIds] = useState<string[]>([]);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
    const [showImportFromFavoritesDialog, setShowImportFromFavoritesDialog] = useState(false);
    const [comparativeModalOpen, setComparativeModalOpen] = useState(false);
    const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
    const [sharedEstimationDialogOpen, setSharedEstimationDialogOpen] = useState(false);
    const [chronologicalDialogOpen, setChronologicalDialogOpen] = useState(false);

    // const [progIndic, setProgIndic] = useState(false);

    const handleClose = () => {
        console.log(dataUpdatedRef.current);

        if (dataUpdatedRef.current) props.onConfirm?.();

        props.onClose();
    };

    // Callback for data updates coming from NestedAccordion
    const handleDataUpdated = (updated: boolean) => {
        dataUpdatedRef.current = true;
        // if (updated) {
        //     props.onConfirm?.();
        //     // setTimeout(() => {
        //     //     setRefreshKey(prevKey => prevKey + 1);
        //     //     setProgIndic(false);
        //     // }, 3000);
        // }
    };

    // Handler for Create Section button
    const handleCreateSection = () => {
        accordionRef.current?.openAddSectionDialog();
    };


    // Handler for Works List button
    const handleWorksListClick = () => {
        setShowWorksListDialog(true);
    };

    // Handler for Works List save
    const handleWorksListSave = () => {
        dataUpdatedRef.current = true;
    };

    const handleMaterialsListClick = () => {
        setShowMaterialsListDialog(true);
    };

    const handleMaterialsListSave = () => {
        dataUpdatedRef.current = true;
    };

    const handleSelectClick = () => {
        setIsSelectMode((prev) => {
            if (prev) setSelectedLaborIds([]); // clear selection when exiting select mode
            return !prev;
        });
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

    const handleImportFromLibrary = () => {
        if (isSelectMode) {
            const selectedIds = accordionRef.current?.getSelectedLaborIds() ?? [];
            if (selectedIds.length > 0) {
                accordionRef.current?.importMyPrices(selectedIds);
                return;
            }
        }
        accordionRef.current?.importMyPrices();
    };

    const lastThreeDisabled = selectedLaborIds.length === 0;

    const handleFavoritesClick = () => {
        if (selectedLaborIds.length > 0) {
            // Has selection - Add to Favorites
            setShowFavoritesDialog(true);
        } else {
            // No selection - Import from Favorites
            setShowImportFromFavoritesDialog(true);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedLaborIds.length === 0) return;
        confirmDialog(t('Delete N selected work(s)?', { count: selectedLaborIds.length })).then((result) => {
            if (!result.isConfirmed) return;
            Promise.all(
                selectedLaborIds.map((estimateLaborItemId) =>
                    Api.requestSession({ command: 'estimate/remove_labor_item', args: { estimateLaborItemId } })
                )
            ).then(() => {
                dataUpdatedRef.current = true;
                accordionRef.current?.refreshEverything(false);
            });
        });
    };

    const handleDuplicateSelected = () => {
        if (selectedLaborIds.length === 0) return;
        Promise.all(
            selectedLaborIds.map((estimatedLaborId) =>
                Api.requestSession({ command: 'estimate/duplicate_labor_item', args: { estimatedLaborId } })
            )
        ).then(() => {
            dataUpdatedRef.current = true;
            accordionRef.current?.refreshEverything(false);
        }).catch((err) => {
            console.error('duplicate_labor_item error:', err);
        });
    };

    const handleSetHidden = (hidden: boolean) => {
        if (selectedLaborIds.length === 0) return;
        Api.requestSession({
            command: 'estimate/set_labor_items_hidden',
            args: { estimateId: props.estimateId },
            json: { estimatedLaborIds: selectedLaborIds, hidden },
        }).then(async () => {
            dataUpdatedRef.current = true;
            await accordionRef.current?.refreshEverything(false);
            setSelectedLaborIds(prev => [...prev]);
        });
    };

    const selectedDetails = accordionRef.current?.getSelectedLaborDetails?.() ?? [];
    const anySelectedHidden = selectedDetails.some((d) => d.isHidden);
    const hideUnhideLabelKey = anySelectedHidden ? 'Unhide' : 'Hide';
    const handleHideUnhide = () => (anySelectedHidden ? handleSetHidden(false) : handleSetHidden(true));

    const handleUndo = () => accordionRef.current?.undo();
    const handleRedo = () => accordionRef.current?.redo();

    // Download handlers
    const handleDownloadEstimation = (format: 'html' | 'word' | 'pdf') => {
        const commandMap = {
            html: 'estimate/generate_html',
            word: 'estimate/generate_word',
            pdf: 'estimate/generate_pdf'
        };

        window.open(
            Api.makeApiUrl({
                command: commandMap[format],
                args: { estimateId: props.estimateId },
            }),
            '_blank'
        );
    };

    const handleDownloadBoQ = (format: 'html' | 'word' | 'pdf') => {
        const commandMap = {
            html: 'estimate/generate_boq_html',
            word: 'estimate/generate_boq_word',
            pdf: 'estimate/generate_boq_pdf'
        };

        window.open(
            Api.makeApiUrl({
                command: commandMap[format],
                args: { estimateId: props.estimateId },
            }),
            '_blank'
        );
    };

    return (
        <Dialog
            fullScreen
            open={true}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                    handleClose();
                }
            }}
            // TransitionComponent={Transition}
            slotProps={{
                paper: {
                    style: {
                        padding: 5,
                        borderRadius: '12px',
                    },
                },
            }}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 5,
                },
            }}
        >
            <DialogTitle sx={{ m: 0, pt: 1, pb: 0 }} id='customized-dialog-title'>
                {props.estimateTitle}
            </DialogTitle>

            <IconButton
                aria-label='print'
                onClick={() => runPrintEstimate(props.estimateId)}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 48,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <PrintIcon />
            </IconButton>

            <IconButton
                aria-label='close'
                onClick={handleClose}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent onClick={(e) => {
                // Clear selection when clicking outside data grids (on blank areas)
                if (isSelectMode && selectedLaborIds.length > 0) {
                    const target = e.target as HTMLElement;
                    // Don't clear if clicking on toolbar buttons
                    if (target.closest('[data-toolbar="true"]')) {
                        return;
                    }
                    // Check if click is on DialogContent or its direct children (not on grids or their content)
                    if (target.classList.contains('MuiDialogContent-root') ||
                        target.closest('.MuiBox-root') && !target.closest('.MuiDataGrid-root')) {
                        accordionRef.current?.clearSelection();
                    }
                }
            }}>
                {/* Tabs */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', position: 'relative', mb: 0, '&::after': { content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: '#00ABBE', zIndex: 0 } }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => {
                            setActiveTab(newValue);
                            if (!toolbarOpen) setToolbarOpen(true);
                        }}
                        sx={{
                            flex: 1,
                            minHeight: 43,
                            height: 43,
                            '& .MuiTabs-indicator': {
                                display: 'none',
                            },
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
                                backgroundColor: toolbarOpen ? '#F5F9F9' : '#FFFFFF',
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
                        }}
                    >
                        {!props.isOnlyEstInfo && (
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/tools.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('Tools')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                        )}
                        <Tab
                            label={
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <ImgElement src={`${TOOLBAR_ICON}/info.svg`} sx={{ height: 20, mr: 1 }} />
                                    {t('General Info')}
                                </Box>
                            }
                            sx={{ minHeight: 43, height: 43 }}
                        />
                        {!props.isOnlyEstInfo && (
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/export.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('Export')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                        )}
                        {!props.isOnlyEstInfo && (
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ShowChartIcon sx={{ height: 20, width: 20, mr: 1 }} />
                                        {t('Analytics')}
                                    </Box>
                                }
                                sx={{ minHeight: 43, height: 43 }}
                            />
                        )}
                    </Tabs>
                    <IconButton
                        onClick={() => setToolbarOpen((prev) => !prev)}
                        size="small"
                        sx={{
                            mb: 0.5,
                            ml: 0.5,
                            color: '#00ABBE',
                            transition: 'transform 0.3s',
                            '&:hover': { color: '#00ABBE' },
                        }}
                    >
                        {toolbarOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Box>

                <Collapse in={toolbarOpen} timeout={300} easing="cubic-bezier(0.4, 0, 0.2, 1)">
                {/* Tools Tab Content */}
                {!props.isOnlyEstInfo && activeTab === 0 && (
                    <Box sx={{
                        mb: 2,
                        p: 1.5,
                        backgroundColor: '#F5F9F9',
                        border: '1px solid #00ABBE',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 130,
                        overflow: 'visible',
                    }}>
                        <Box data-toolbar="true" sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'nowrap',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                        }}>
                            {/* Tool buttons */}
                            {[
                                { labelKey: 'Create Section', icon: `${TOOLBAR_ICON}/add.svg`, onClick: handleCreateSection },
                                {
                                    labelKey: selectedLaborIds.length > 0 ? 'Add to Favorites' : 'Import from Favorites',
                                    icon: `${TOOLBAR_ICON}/favourites.svg`,
                                    onClick: handleFavoritesClick
                                },
                                { labelKey: 'Works List', icon: `${TOOLBAR_ICON}/works.svg`, onClick: handleWorksListClick },
                                { labelKey: 'Materials List', icon: `${TOOLBAR_ICON}/materials.svg`, onClick: handleMaterialsListClick },
                                { labelKey: 'Update', icon: `${TOOLBAR_ICON}/refresh.svg`, onClick: handleUpdate },
                                { labelKey: 'Import from Library', icon: `${TOOLBAR_ICON}/import.svg`, onClick: handleImportFromLibrary, disabled: !permissionsSet?.has('OFF_CRT_LBR') },
                                { labelKey: 'Select', icon: `${TOOLBAR_ICON}/select.svg`, onClick: handleSelectClick },
                                { labelKey: 'Undo', iconNode: <UndoIcon sx={{ fontSize: 22 }} />, onClick: handleUndo },
                                { labelKey: 'Redo', iconNode: <RedoIcon sx={{ fontSize: 22 }} />, onClick: handleRedo },
                            ].map((tool, index) => {
                                const isSelectActive = tool.labelKey === 'Select' && isSelectMode;
                                return (
                                    <Box
                                        key={index}
                                        onClick={(e) => {
                                            if (tool.disabled) return;
                                            e.stopPropagation(); // Prevent event from bubbling to DialogContent
                                            tool.onClick();
                                        }}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 1,
                                            backgroundColor: isSelectActive ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                                            borderRadius: 2,
                                            cursor: tool.disabled ? 'not-allowed' : 'pointer',
                                            boxShadow: isSelectActive ? '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)' : '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                            transition: 'all 0.2s',
                                            opacity: tool.disabled ? 0.5 : 1,
                                            pointerEvents: tool.disabled ? 'none' : 'auto',
                                            transform: isSelectActive ? 'translateY(-2px)' : undefined,
                                            '&:hover': tool.disabled ? {} : {
                                                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                                transform: 'translateY(-2px)',
                                            },
                                            width: { xs: 85, md: 100, lg: 115 },
                                            minHeight: { xs: 65, md: 75, lg: 85 },
                                        }}
                                    >
                                        <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {'iconNode' in tool ? tool.iconNode : <ImgElement src={tool.icon} sx={{ height: 22 }} />}
                                        </Box>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '11px', minHeight: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                            {t(tool.labelKey)}
                                        </Typography>
                                    </Box>
                                );
                            })}

                            {/* Vertical divider */}
                            <Box sx={{
                                width: '2px',
                                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                alignSelf: 'stretch',
                                mx: 1
                            }} />

                            {/* Last buttons with separator — disabled until rows selected when in select mode */}
                            {[
                                { labelKey: 'Delete', iconPath: `${TOOLBAR_ICON}/delete.svg`, onClick: handleDeleteSelected },
                                { labelKey: 'Move', iconPath: `${TOOLBAR_ICON}/move.svg`, onClick: () => setShowMoveDialog(true) },
                                { labelKey: hideUnhideLabelKey, iconNode: anySelectedHidden ? <VisibilityOffIcon sx={{ fontSize: 22 }} /> : <VisibilityIcon sx={{ fontSize: 22 }} />, onClick: handleHideUnhide },
                                { labelKey: 'Copy', iconPath: `${TOOLBAR_ICON}/duplicate.svg`, onClick: handleDuplicateSelected },
                            ].map((tool, index) => (
                                <Box
                                    key={index}
                                    onClick={(e) => {
                                        if (lastThreeDisabled) return;
                                        e.stopPropagation(); // Prevent event from bubbling to DialogContent
                                        tool.onClick();
                                    }}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1,
                                        backgroundColor: 'transparent',
                                        borderRadius: 2,
                                        cursor: lastThreeDisabled ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.2s',
                                        opacity: lastThreeDisabled ? 0.5 : 1,
                                        pointerEvents: lastThreeDisabled ? 'none' : 'auto',
                                        '&:hover': lastThreeDisabled ? {} : {
                                            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)',
                                        },
                                        width: { xs: 85, md: 100, lg: 115 },
                                        minHeight: { xs: 65, md: 75, lg: 85 },
                                    }}
                                >
                                    <Box sx={{ height: 28, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {'iconPath' in tool && tool.iconPath ? <ImgElement src={tool.iconPath} sx={{ height: 22 }} /> : 'iconNode' in tool ? tool.iconNode : null}
                                    </Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem', minHeight: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                        {t(tool.labelKey)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* General Info Tab Content - Only the information section */}
                {(props.isOnlyEstInfo ? activeTab === 0 : activeTab === 1) && (
                    <Box sx={{
                        mb: 2,
                        pt: 0,
                        px: 2,
                        pb: 1,
                        backgroundColor: '#F5F9F9',
                        border: '1px solid #00ABBE',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 130,
                        overflow: 'visible',
                    }}>
                        <EstimateInfoAccordionContent estimateId={props.estimateId} onDataUpdated={handleDataUpdated} />
                    </Box>
                )}

                {/* Export Tab Content */}
                {!props.isOnlyEstInfo && activeTab === 2 && (
                    <Box sx={{
                        mb: 2,
                        p: 1.5,
                        backgroundColor: '#F5F9F9',
                        border: '1px solid #00ABBE',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 130,
                        overflow: 'visible',
                    }}>
                        <Box sx={{
                            display: 'flex',
                            gap: { xs: 1.5, md: 2, lg: 2.5 },
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            flexWrap: 'nowrap'
                        }}>
                            {[
                                { category: 'Estimation', format: 'HTML', icon: `${TOOLBAR_ICON}/html.svg`, onClick: () => handleDownloadEstimation('html') },
                                { category: 'Estimation', format: 'Word', icon: `${TOOLBAR_ICON}/word.svg`, onClick: () => handleDownloadEstimation('word') },
                                { category: 'Estimation', format: 'PDF', icon: `${TOOLBAR_ICON}/pdf.svg`, onClick: () => handleDownloadEstimation('pdf') },
                            ].map((item, index) => (
                                <Box
                                    key={index}
                                    onClick={item.onClick}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1,
                                        backgroundColor: 'transparent',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        width: { xs: 85, md: 100, lg: 115 },
                                        minHeight: { xs: 65, md: 75, lg: 85 },
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <Box sx={{ mb: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImgElement src={item.icon} sx={{ height: 22 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem', lineHeight: 1.2 }}>
                                            {t(item.category)}
                                        </Typography>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem', lineHeight: 1.2 }}>
                                            {t(item.format)}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}

                            {/* Vertical Divider */}
                            <Box sx={{
                                width: '2px',
                                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                alignSelf: 'stretch',
                                mx: 1
                            }} />

                            {[
                                { category: 'BoQ', format: 'HTML', icon: `${TOOLBAR_ICON}/html.svg`, onClick: () => handleDownloadBoQ('html') },
                                { category: 'BoQ', format: 'Word', icon: `${TOOLBAR_ICON}/word.svg`, onClick: () => handleDownloadBoQ('word') },
                                { category: 'BoQ', format: 'PDF', icon: `${TOOLBAR_ICON}/pdf.svg`, onClick: () => handleDownloadBoQ('pdf') },
                            ].map((item, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1,
                                        backgroundColor: 'transparent',
                                        borderRadius: 2,
                                        cursor: 'not-allowed',
                                        width: { xs: 85, md: 100, lg: 115 },
                                        minHeight: { xs: 65, md: 75, lg: 85 },
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                        opacity: 0.4,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <Box sx={{ mb: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImgElement src={item.icon} sx={{ height: 22 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem', lineHeight: 1.2 }}>
                                            {t(item.category)}
                                        </Typography>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem', lineHeight: 1.2 }}>
                                            {t(item.format)}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
                {/* Analysis Tab Content */}
                {!props.isOnlyEstInfo && activeTab === 3 && (
                    <Box sx={{
                        mb: 2,
                        p: 1.5,
                        backgroundColor: '#F5F9F9',
                        border: '1px solid #00ABBE',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 130,
                    }}>
                        <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2, lg: 2.5 }, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            {[
                                { label: 'Structural',    icon: <AccountTreeIcon   sx={{ fontSize: 30, color: '#00ABBE' }} />, onClick: () => window.open(`/analysis/structural?estimateId=${props.estimateId}`, '_blank') },
                                { label: 'Comparative',   icon: <CompareArrowsIcon sx={{ fontSize: 30, color: '#00ABBE' }} />, onClick: () => setComparativeModalOpen(true) },
                                { label: 'Chronological', icon: <TimelineIcon      sx={{ fontSize: 30, color: '#00ABBE' }} />, onClick: () => setChronologicalDialogOpen(true) },
                            ].map((item) => (
                                <Box key={item.label} onClick={item.onClick} sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    p: 1, backgroundColor: 'transparent', borderRadius: 2, cursor: 'pointer',
                                    width: { xs: 85, md: 100, lg: 115 }, minHeight: { xs: 65, md: 75, lg: 85 },
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.15), 2px 0 4px rgba(0,0,0,0.05), -2px 0 4px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s',
                                    '&:hover': { boxShadow: '0 6px 10px rgba(0,0,0,0.2)', transform: 'translateY(-2px)' },
                                }}>
                                    <Box sx={{ height: 34, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem', lineHeight: 1.2 }}>
                                        {t(item.label)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
                </Collapse>

                {/* Tables and accordions - Always visible regardless of active tab */}
                <EstimateThreeLevelNestedAccordion ref={accordionRef} isOnlyEstInfo={props.isOnlyEstInfo} estimateId={props.estimateId} onDataUpdated={handleDataUpdated} selectMode={isSelectMode} onSelectionChange={setSelectedLaborIds} />

                {session?.user && !permissionsSet?.has?.('EST_CRT_BY_BNK') && <EstimateOtherExpensesAccordion estimateId={props.estimateId} />}
            </DialogContent>

            {/* Works List Dialog */}
            {showWorksListDialog && (
                <EstimateWorksListDialog
                    estimateId={props.estimateId}
                    onClose={() => {
                        setShowWorksListDialog(false);
                        accordionRef.current?.refreshEverything(false);
                    }}
                    onSave={handleWorksListSave}
                />
            )}
            {showMaterialsListDialog && (
                <EstimateMaterialsListDialog
                    estimateId={props.estimateId}
                    onClose={() => {
                        setShowMaterialsListDialog(false);
                        accordionRef.current?.refreshEverything(false);
                    }}
                    onSave={handleMaterialsListSave}
                />
            )}
            <EstimateMoveWorksDialog
                open={showMoveDialog}
                estimateId={props.estimateId}
                selectedLaborIds={selectedLaborIds}
                onClose={() => setShowMoveDialog(false)}
                onConfirm={() => {
                    dataUpdatedRef.current = true;
                    accordionRef.current?.refreshEverything(false);
                }}
            />
            {showFavoritesDialog && (
                <EstimateAddToFavoritesDialog
                    selectedLaborIds={selectedLaborIds}
                    onClose={() => setShowFavoritesDialog(false)}
                    onConfirm={() => {
                        setShowFavoritesDialog(false);
                        // Optionally clear selection after adding to favorites
                        setSelectedLaborIds([]);
                    }}
                />
            )}
            {showImportFromFavoritesDialog && (
                <EstimateImportFromFavoritesDialog
                    estimateId={props.estimateId}
                    onClose={() => setShowImportFromFavoritesDialog(false)}
                    onConfirm={() => {
                        setShowImportFromFavoritesDialog(false);
                        dataUpdatedRef.current = true;
                        accordionRef.current?.refreshEverything(true);
                    }}
                />
            )}
            {/* Chronological date range dialog */}
            <ChronologicalDateRangeDialog
                open={chronologicalDialogOpen}
                itemName={props.estimateTitle}
                onClose={() => setChronologicalDialogOpen(false)}
                onPrevious={() => setChronologicalDialogOpen(false)}
                onDone={(fromDate, toDate) => {
                    setChronologicalDialogOpen(false);
                    const params = new URLSearchParams({
                        estimateId: props.estimateId,
                        estimateName: props.estimateTitle,
                        sourceType: 'list_of_estimates',
                        fromDate,
                        toDate,
                    });
                    window.open(`/analysis/chronological?${params.toString()}`, '_blank');
                }}
            />

            {/* By Submitted Estimations dialog */}
            <SelectSharedEstimationDialog
                open={sharedEstimationDialogOpen}
                onClose={() => setSharedEstimationDialogOpen(false)}
                onConfirm={(selection: SharedEstimationSelection) => {
                    setSharedEstimationDialogOpen(false);
                    const params = new URLSearchParams({
                        type: 'submitted',
                        originalEstimateId: selection.originalEstimateId,
                        estimate: JSON.stringify(selection.estimate),
                        companies: JSON.stringify(selection.companies),
                    });
                    window.open(`/analysis/comparative?${params.toString()}`, '_blank');
                }}
            />

            {/* By Base Proposals dialog */}
            <SelectCompanyDialog
                open={companyDialogOpen}
                onClose={() => setCompanyDialogOpen(false)}
                onConfirm={(companies: CompanyOption[]) => {
                    setCompanyDialogOpen(false);
                    const params = new URLSearchParams({
                        type: 'base_proposals',
                        estimateId: props.estimateId,
                        companies: JSON.stringify(companies),
                    });
                    window.open(`/analysis/comparative?${params.toString()}`, '_blank');
                }}
            />

            {/* Comparative Analysis Modal */}
            <Dialog open={comparativeModalOpen} onClose={() => setComparativeModalOpen(false)} maxWidth='sm' fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    {t('Comparative')}
                    <IconButton onClick={() => setComparativeModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component='svg' width={0} height={0} sx={{ position: 'absolute' }}>
                        <defs>
                            <linearGradient id='comparativeGradientGreen2' x1='0%' y1='0%' x2='100%' y2='100%'>
                                <stop offset='0%' stopColor='#2ECC71' />
                                <stop offset='100%' stopColor='#1CA461' />
                            </linearGradient>
                            <linearGradient id='comparativeGradientBlue2' x1='0%' y1='0%' x2='100%' y2='100%'>
                                <stop offset='0%' stopColor='#29B6F6' />
                                <stop offset='100%' stopColor='#0288D1' />
                            </linearGradient>
                            <linearGradient id='comparativeGradientTeal2' x1='0%' y1='0%' x2='100%' y2='100%'>
                                <stop offset='0%' stopColor='#1CA461' />
                                <stop offset='100%' stopColor='#00ABBE' />
                            </linearGradient>
                        </defs>
                    </Box>
                    <Stack direction='row' spacing={3} flexWrap='wrap' useFlexGap justifyContent='center' sx={{ py: 2 }}>
                        {[
                            {
                                key: 'By Market Value',
                                gradientId: 'comparativeGradientGreen2',
                                onClick: () => {
                                    setComparativeModalOpen(false);
                                    window.open(`/analysis/comparative?estimateId=${props.estimateId}&type=market`, '_blank');
                                },
                            },
                            {
                                key: 'By Submitted Estimations',
                                gradientId: 'comparativeGradientBlue2',
                                onClick: () => {
                                    setComparativeModalOpen(false);
                                    setSharedEstimationDialogOpen(true);
                                },
                            },
                            {
                                key: 'By Base Proposals',
                                gradientId: 'comparativeGradientTeal2',
                                onClick: () => {
                                    setComparativeModalOpen(false);
                                    setCompanyDialogOpen(true);
                                },
                            },
                        ].map((card) => (
                            <Box
                                key={card.key}
                                role='button'
                                tabIndex={0}
                                onClick={card.onClick}
                                sx={{
                                    position: 'relative',
                                    width: 160,
                                    minHeight: 150,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.5,
                                    px: 2,
                                    py: 3,
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.55)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 36px rgba(0,0,0,0.12)' },
                                }}
                            >
                                <AddIcon sx={{ position: 'absolute', top: 12, left: 12, fontSize: 20, color: 'text.primary' }} />
                                <ExtensionIcon sx={{ fontSize: 56, fill: `url(#${card.gradientId})` }} />
                                <Typography variant='body2' align='center' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {t(card.key)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
