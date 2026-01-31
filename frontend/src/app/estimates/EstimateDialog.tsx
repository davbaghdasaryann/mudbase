'use client';

import React, {useRef, useState} from 'react';

import {Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';
import EstimateThreeLevelNestedAccordion from '@/components/estimate/EstimateThreeLevelAccordion';

import ProgressIndicator from '@/tsui/ProgressIndicator';
import EstimateOtherExpensesAccordion from '@/components/estimate/EstimateOtherExpensesAccordion';

import {runPrintEstimate} from '@/lib/print_estimate';
import {usePermissions} from '@/api/auth';

interface EstimatePageDialogProps {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm?: () => void;

    isOnlyEstInfo?: boolean;
}

export default function EstimatePageDialog(props: EstimatePageDialogProps) {
    const {session, permissionsSet} = usePermissions();
    const dataUpdatedRef = useRef(false);
    const [activeTab, setActiveTab] = useState(1); // 0: Tools, 1: General Info, 2: Export

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
            <DialogTitle sx={{m: 0, pt: 1, pb: 0}} id='customized-dialog-title'>
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
                        p: 3,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        borderTop: 0,
                        borderRadius: '0 4px 4px 4px',
                        minHeight: 200
                    }}>
                        <Box sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            justifyContent: 'center'
                        }}>
                            {/* Tool buttons */}
                            {[
                                { label: 'Create Section', icon: '➕' },
                                { label: 'Favorites', icon: '⭐' },
                                { label: 'Works List', icon: '📋' },
                                { label: 'Materials List', icon: '🟢' },
                                { label: 'Update', icon: '🔄' },
                                { label: 'Import from Library', icon: '⬇️' },
                                { label: 'Select', icon: '✓' },
                            ].map((tool, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1.5,
                                        backgroundColor: 'white',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            boxShadow: 2,
                                            transform: 'translateY(-2px)',
                                            transition: 'all 0.2s'
                                        },
                                        minWidth: 100,
                                        maxWidth: 110,
                                        minHeight: 90,
                                        flexShrink: 0
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
                                        p: 1.5,
                                        backgroundColor: 'white',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            boxShadow: 2,
                                            transform: 'translateY(-2px)',
                                            transition: 'all 0.2s'
                                        },
                                        minWidth: 100,
                                        maxWidth: 110,
                                        minHeight: 90,
                                        flexShrink: 0
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
                                        { label: 'HTML', icon: '📄', color: '#E34F26' },
                                        { label: 'Word', icon: '📘', color: '#2B579A' },
                                        { label: 'PDF', icon: '📕', color: '#FF0000' },
                                    ].map((format, index) => (
                                        <Box
                                            key={index}
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
                                        { label: 'HTML', icon: '📄', color: '#E34F26' },
                                        { label: 'Word', icon: '📘', color: '#2B579A' },
                                        { label: 'PDF', icon: '📕', color: '#FF0000' },
                                    ].map((format, index) => (
                                        <Box
                                            key={index}
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
                <EstimateThreeLevelNestedAccordion isOnlyEstInfo={props.isOnlyEstInfo} estimateId={props.estimateId} onDataUpdated={handleDataUpdated} />

                {session?.user && !permissionsSet?.has?.('EST_CRT_BY_BNK') && <EstimateOtherExpensesAccordion estimateId={props.estimateId} />}
            </DialogContent>
        </Dialog>
    );
}
