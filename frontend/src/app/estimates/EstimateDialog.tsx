'use client';

import React, { useRef, useState } from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';
import EstimateThreeLevelNestedAccordion, { EstimateThreeLevelNestedAccordionRef } from '@/components/estimate/EstimateThreeLevelAccordion';
import EstimateWorksListDialog from '@/components/estimate/EstimateWorksListDialog';
import EstimateMaterialsListDialog from '@/components/estimate/EstimateMaterialsListDialog';

import ProgressIndicator from '@/tsui/ProgressIndicator';
import EstimateOtherExpensesAccordion from '@/components/estimate/EstimateOtherExpensesAccordion';

import { runPrintEstimate } from '@/lib/print_estimate';
import { usePermissions } from '@/api/auth';
import * as Api from '@/api';

interface EstimatePageDialogProps {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm?: () => void;

    isOnlyEstInfo?: boolean;
}

export default function EstimatePageDialog(props: EstimatePageDialogProps) {
    const { session, permissionsSet } = usePermissions();
    const dataUpdatedRef = useRef(false);
    const accordionRef = useRef<EstimateThreeLevelNestedAccordionRef>(null);
    const [activeTab, setActiveTab] = useState(1); // 0: Tools, 1: General Info, 2: Export
    const [showWorksListDialog, setShowWorksListDialog] = useState(false);
    const [showMaterialsListDialog, setShowMaterialsListDialog] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);

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
        setIsSelectMode((prev) => !prev);
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

            <DialogContent>
                {/* Tabs */}
                <Box sx={{ borderBottom: 0, mb: 0 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            minHeight: 48,
                            height: 48,
                            '& .MuiTab-root': {
                                borderTopLeftRadius: 1,
                                borderTopRightRadius: 1,
                                border: '1px solid transparent',
                                marginRight: 0.5,
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
                        <Tab label="Tools" sx={{ minHeight: 48, height: 48 }} />
                        <Tab label="General Info" sx={{ minHeight: 48, height: 48 }} />
                        <Tab label="Export" sx={{ minHeight: 48, height: 48 }} />
                    </Tabs>
                </Box>

                {/* Tools Tab Content */}
                {activeTab === 0 && (
                    <Box sx={{
                        mb: 2,
                        p: 2,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        minHeight: 140,
                        overflow: 'visible',
                    }}>
                        <Box sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'nowrap',
                            justifyContent: 'center',
                            py: 1.5,
                            px: 0.5,
                        }}>
                            {/* Tool buttons */}
                            {[
                                { label: 'Create Section', icon: '➕', onClick: handleCreateSection },
                                { label: 'Favorites', icon: '⭐', onClick: () => { } },
                                { label: 'Works List', icon: '📋', onClick: handleWorksListClick },
                                { label: 'Materials List', icon: '🟢', onClick: handleMaterialsListClick },
                                { label: 'Update', icon: '🔄', onClick: handleUpdate },
                                { label: 'Import from Library', icon: '⬇️', onClick: () => { } },
                                { label: 'Select', icon: '✓', onClick: handleSelectClick },
                            ].map((tool, index) => (
                                <Box
                                    key={index}
                                    onClick={tool.onClick}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1.25,
                                        backgroundColor: 'transparent',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)',
                                        },
                                        minWidth: 85,
                                        minHeight: 80,
                                        flex: '1 1 auto',
                                    }}
                                >
                                    <Box sx={{ fontSize: '1.75rem', mb: 0.5 }}>{tool.icon}</Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                        {tool.label}
                                    </Typography>
                                </Box>
                            ))}

                            {/* Vertical divider */}
                            <Box sx={{
                                width: '2px',
                                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                alignSelf: 'stretch',
                                mx: 1
                            }} />

                            {/* Last 3 buttons with separator */}
                            {[
                                { label: 'Delete', icon: '🗑️' },
                                { label: 'Move', icon: '➡️' },
                                { label: 'Hide', icon: '👁️' },
                            ].map((tool, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1.25,
                                        backgroundColor: 'transparent',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)',
                                        },
                                        minWidth: 85,
                                        minHeight: 80,
                                        flex: '1 1 auto',
                                    }}
                                >
                                    <Box sx={{ fontSize: '1.75rem', mb: 0.5 }}>{tool.icon}</Box>
                                    <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                        {tool.label}
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
                        minHeight: 200
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
                        minHeight: 200
                    }}>
                        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {/* Download Estimation */}
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                                    Download Estimation
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {[
                                        { label: 'HTML', icon: '📄', color: '#E34F26', format: 'html' as const },
                                        { label: 'Word', icon: '📘', color: '#2B579A', format: 'word' as const },
                                        { label: 'PDF', icon: '📕', color: '#FF0000', format: 'pdf' as const },
                                    ].map((format, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => handleDownloadEstimation(format.format)}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                p: 3,
                                                backgroundColor: 'white',
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                minWidth: 120,
                                                '&:hover': {
                                                    boxShadow: 2,
                                                    transform: 'translateY(-2px)',
                                                    transition: 'all 0.2s'
                                                }
                                            }}
                                        >
                                            <Box sx={{ fontSize: '3rem', mb: 1, color: format.color }}>{format.icon}</Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {format.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Download Bill of Quantities */}
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                                    Download Bill of Quantities
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {[
                                        { label: 'HTML', icon: '📄', color: '#E34F26', format: 'html' as const },
                                        { label: 'Word', icon: '📘', color: '#2B579A', format: 'word' as const },
                                        { label: 'PDF', icon: '📕', color: '#FF0000', format: 'pdf' as const },
                                    ].map((format, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => handleDownloadBoQ(format.format)}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                p: 3,
                                                backgroundColor: 'white',
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                minWidth: 120,
                                                '&:hover': {
                                                    boxShadow: 2,
                                                    transform: 'translateY(-2px)',
                                                    transition: 'all 0.2s'
                                                }
                                            }}
                                        >
                                            <Box sx={{ fontSize: '3rem', mb: 1, color: format.color }}>{format.icon}</Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {format.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Tables and accordions - Always visible regardless of active tab */}
                <EstimateThreeLevelNestedAccordion ref={accordionRef} isOnlyEstInfo={props.isOnlyEstInfo} estimateId={props.estimateId} onDataUpdated={handleDataUpdated} selectMode={isSelectMode} />

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
        </Dialog>
    );
}
