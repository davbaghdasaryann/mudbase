'use client';

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography, Collapse } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import ImgElement from '@/tsui/DomElements/ImgElement';
import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';

const TOOLBAR_ICON = '/images/icons/toolbar';
import EstimateThreeLevelNestedAccordion, { EstimateThreeLevelNestedAccordionRef } from '@/components/estimate/EstimateThreeLevelAccordion';
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
    const dataUpdatedRef = useRef(false);
    const accordionRef = useRef<EstimateThreeLevelNestedAccordionRef>(null);
    const [activeTab, setActiveTab] = useState(props.isOnlyEstInfo ? 0 : 1); // When isOnlyEstInfo: 0 is General Info, otherwise: 0: Tools, 1: General Info, 2: Export
    const [toolbarOpen, setToolbarOpen] = useState(true);
    const [showWorksListDialog, setShowWorksListDialog] = useState(false);
    const [showMaterialsListDialog, setShowMaterialsListDialog] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedLaborIds, setSelectedLaborIds] = useState<string[]>([]);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
    const [showImportFromFavoritesDialog, setShowImportFromFavoritesDialog] = useState(false);

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
        confirmDialog(`Delete ${selectedLaborIds.length} selected work(s)?`).then((result) => {
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

    const handleSetHidden = (hidden: boolean) => {
        if (selectedLaborIds.length === 0) return;
        Api.requestSession({
            command: 'estimate/set_labor_items_hidden',
            args: { estimateId: props.estimateId },
            json: { estimatedLaborIds: selectedLaborIds, hidden },
        }).then(() => {
            dataUpdatedRef.current = true;
            accordionRef.current?.refreshEverything(false);
        });
    };

    const selectedDetails = accordionRef.current?.getSelectedLaborDetails?.() ?? [];
    const anySelectedHidden = selectedDetails.some((d) => d.isHidden);
    const hideUnhideLabelKey = anySelectedHidden ? 'Unhide' : 'Hide';
    const handleHideUnhide = () => (anySelectedHidden ? handleSetHidden(false) : handleSetHidden(true));

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
                <Box sx={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid rgba(25, 118, 210, 0.3)', mb: 0 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => {
                            setActiveTab(newValue);
                            if (!toolbarOpen) setToolbarOpen(true);
                        }}
                        sx={{
                            flex: 1,
                            minHeight: 48,
                            height: 48,
                            '& .MuiTabs-indicator': {
                                display: 'none',
                            },
                            '& .MuiTab-root': {
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px',
                                border: '1px solid rgba(25, 118, 210, 0.2)',
                                borderBottom: '1px solid transparent',
                                marginRight: '4px',
                                minHeight: 48,
                                height: 48,
                                padding: '12px 16px',
                            },
                            '& .Mui-selected': {
                                backgroundColor: toolbarOpen ? '#F5F9F9' : 'transparent',
                                border: '1px solid rgba(25, 118, 210, 0.3)',
                                borderBottom: toolbarOpen ? '1px solid #F5F9F9' : '1px solid transparent',
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
                                sx={{ minHeight: 48, height: 48 }}
                            />
                        )}
                        <Tab
                            label={
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <ImgElement src={`${TOOLBAR_ICON}/info.svg`} sx={{ height: 20, mr: 1 }} />
                                    {t('General Info')}
                                </Box>
                            }
                            sx={{ minHeight: 48, height: 48 }}
                        />
                        {!props.isOnlyEstInfo && (
                            <Tab
                                label={
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <ImgElement src={`${TOOLBAR_ICON}/export.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('Export')}
                                    </Box>
                                }
                                sx={{ minHeight: 48, height: 48 }}
                            />
                        )}
                    </Tabs>
                    <IconButton
                        onClick={() => setToolbarOpen((prev) => !prev)}
                        size="small"
                        sx={{
                            mb: 0.5,
                            ml: 0.5,
                            color: 'rgba(25, 118, 210, 0.6)',
                            transition: 'transform 0.3s',
                            '&:hover': { color: 'rgba(25, 118, 210, 0.9)' },
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
                        border: '1px solid rgba(25, 118, 210, 0.3)',
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
                                        <Box sx={{ mb: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImgElement src={tool.icon} sx={{ height: 22 }} />
                                        </Box>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
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

                            {/* Last 3 buttons with separator — disabled until rows selected when in select mode */}
                            {[
                                { labelKey: 'Delete', iconPath: `${TOOLBAR_ICON}/delete.svg`, onClick: handleDeleteSelected },
                                { labelKey: 'Move', iconPath: `${TOOLBAR_ICON}/move.svg`, onClick: () => setShowMoveDialog(true) },
                                { labelKey: hideUnhideLabelKey, iconNode: anySelectedHidden ? <VisibilityOffIcon sx={{ fontSize: 22 }} /> : <VisibilityIcon sx={{ fontSize: 22 }} />, onClick: handleHideUnhide },
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
                                    <Box sx={{ mb: 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {'iconPath' in tool && tool.iconPath ? <ImgElement src={tool.iconPath} sx={{ height: 22 }} /> : 'iconNode' in tool ? tool.iconNode : null}
                                    </Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
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
                        border: '1px solid rgba(25, 118, 210, 0.3)',
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
                        border: '1px solid rgba(25, 118, 210, 0.3)',
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
        </Dialog>
    );
}
