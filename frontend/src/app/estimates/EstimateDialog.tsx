'use client';

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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
    const [activeTab, setActiveTab] = useState(1); // 0: Tools, 1: General Info, 2: Export
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
                    // Check if click is on DialogContent or its direct children (not on grids or their content)
                    if (target.classList.contains('MuiDialogContent-root') ||
                        target.closest('.MuiBox-root') && !target.closest('.MuiDataGrid-root')) {
                        accordionRef.current?.clearSelection();
                    }
                }
            }}>
                {/* Tabs */}
                <Box sx={{ borderBottom: '1px solid rgba(25, 118, 210, 0.3)', mb: 0 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            minHeight: 48,
                            height: 48,
                            '& .MuiTabs-indicator': {
                                display: 'none', // Hide default indicator
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
                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                border: '1px solid rgba(25, 118, 210, 0.3)',
                                borderBottom: '1px solid rgba(25, 118, 210, 0.08)',
                            }
                        }}
                    >
                        <Tab
                            label={
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <ImgElement src={`${TOOLBAR_ICON}/tools.svg`} sx={{ height: 20, mr: 1 }} />
                                    {t('Tools')}
                                </Box>
                            }
                            sx={{ minHeight: 48, height: 48 }}
                        />
                        <Tab
                            label={
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <ImgElement src={`${TOOLBAR_ICON}/info.svg`} sx={{ height: 20, mr: 1 }} />
                                    {t('General Info')}
                                </Box>
                            }
                            sx={{ minHeight: 48, height: 48 }}
                        />
                        <Tab
                            label={
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <ImgElement src={`${TOOLBAR_ICON}/export.svg`} sx={{ height: 20, mr: 1 }} />
                                    {t('Export')}
                                </Box>
                            }
                            sx={{ minHeight: 48, height: 48 }}
                        />
                    </Tabs>
                </Box>

                {/* Tools Tab Content */}
                {activeTab === 0 && (
                    <Box sx={{
                        mb: 2,
                        p: 3,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 200,
                        overflow: 'visible',
                    }}>
                        <Box sx={{
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
                                        onClick={tool.disabled ? undefined : tool.onClick}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 1.25,
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
                                            width: { xs: 110, md: 130, lg: 150 },
                                            minHeight: { xs: 90, md: 100, lg: 110 },
                                        }}
                                    >
                                        <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImgElement src={tool.icon} sx={{ height: 28 }} />
                                        </Box>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
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
                                { labelKey: hideUnhideLabelKey, iconNode: anySelectedHidden ? <VisibilityOffIcon sx={{ fontSize: 28 }} /> : <VisibilityIcon sx={{ fontSize: 28 }} />, onClick: handleHideUnhide },
                            ].map((tool, index) => (
                                <Box
                                    key={index}
                                    onClick={lastThreeDisabled ? undefined : tool.onClick}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1.25,
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
                                        width: { xs: 110, md: 130, lg: 150 },
                                        minHeight: { xs: 90, md: 100, lg: 110 },
                                    }}
                                >
                                    <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {'iconPath' in tool && tool.iconPath ? <ImgElement src={tool.iconPath} sx={{ height: 28 }} /> : 'iconNode' in tool ? tool.iconNode : null}
                                    </Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                        {t(tool.labelKey)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* General Info Tab Content - Only the information section */}
                {activeTab === 1 && (
                    <Box sx={{
                        mb: 2,
                        p: 3,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 200,
                        overflow: 'visible',
                    }}>
                        <EstimateInfoAccordionContent estimateId={props.estimateId} onDataUpdated={handleDataUpdated} />
                    </Box>
                )}

                {/* Export Tab Content */}
                {activeTab === 2 && (
                    <Box sx={{
                        mb: 2,
                        p: 3,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        height: 200,
                        overflow: 'visible',
                    }}>
                        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {/* Download Estimation */}
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                                    {t('Download Estimation')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {[
                                        { label: 'HTML', icon: `${TOOLBAR_ICON}/html.svg`, format: 'html' as const },
                                        { label: 'Word', icon: `${TOOLBAR_ICON}/word.svg`, format: 'word' as const },
                                        { label: 'PDF', icon: `${TOOLBAR_ICON}/pdf.svg`, format: 'pdf' as const },
                                    ].map((format, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => handleDownloadEstimation(format.format)}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                p: 2.5,
                                                backgroundColor: 'transparent',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                minWidth: 120,
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                                    transform: 'translateY(-2px)',
                                                },
                                            }}
                                        >
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ImgElement src={format.icon} sx={{ height: 40 }} />
                                            </Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {t(format.label)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Download Bill of Quantities */}
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                                    {t('Download Bill of Quantities')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {[
                                        { label: 'HTML', icon: `${TOOLBAR_ICON}/html.svg`, format: 'html' as const },
                                        { label: 'Word', icon: `${TOOLBAR_ICON}/word.svg`, format: 'word' as const },
                                        { label: 'PDF', icon: `${TOOLBAR_ICON}/pdf.svg`, format: 'pdf' as const },
                                    ].map((format, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => handleDownloadBoQ(format.format)}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                p: 2.5,
                                                backgroundColor: 'transparent',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                minWidth: 120,
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                                    transform: 'translateY(-2px)',
                                                },
                                            }}
                                        >
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ImgElement src={format.icon} sx={{ height: 40 }} />
                                            </Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {t(format.label)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

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
