'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogTitle, IconButton, Tabs, Tab, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import ImgElement from '@/tsui/DomElements/ImgElement';
import EstimateInfoAccordionContent from '@/components/estimate/EstimateInfoAccordionContent';
import EstimatePageDialog from '@/app/estimates/EstimateDialog';
import EstimateWorksListDialog from '@/components/estimate/EstimateWorksListDialog';
import EstimateMaterialsListDialog from '@/components/estimate/EstimateMaterialsListDialog';
import EstimateThreeLevelNestedAccordion from '@/components/estimate/EstimateThreeLevelAccordion';
import { usePermissions } from '@/api/auth';
import * as Api from '@/api';
import { confirmDialog } from '@/components/ConfirmationDialog';

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

    const isAdmin = permissionsSet?.has('CAT_EDT');
    const hasLinkedEstimate = !!linkedEstimateId;

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
                await confirmDialog(t('Estimate copied to your estimates successfully'), t('Success'));
            } catch (error) {
                console.error('Error copying estimate:', error);
            }
        }
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
        minHeight: 48,
        height: 48,
        '& .MuiTabs-indicator': { display: 'none' },
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
    };

    const panelSx = {
        mb: 2,
        p: 3,
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        border: '1px solid rgba(25, 118, 210, 0.3)',
        borderTop: 0,
        borderRadius: '0 4px 4px 4px',
        minHeight: 200,
        overflow: 'visible',
    };

    const toolButtonSx = (disabled?: boolean) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1.25,
        backgroundColor: 'transparent',
        borderRadius: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15), 2px 0 4px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s',
        ...(disabled ? {} : {
            '&:hover': {
                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2), 3px 0 6px rgba(0, 0, 0, 0.08), -3px 0 6px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(-2px)',
            },
        }),
        width: { xs: 110, md: 130, lg: 150 },
        minHeight: { xs: 90, md: 100, lg: 110 },
    });

    const noDataMessage = (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 150 }}>
            <Typography color="text.secondary">
                {t('No linked estimate available')}
            </Typography>
        </Box>
    );

    // Build tool buttons based on admin vs user
    const toolButtons = isAdmin
        ? [
            {
                labelKey: hasLinkedEstimate ? 'Edit Estimation' : 'Create Estimation',
                icon: `${TOOLBAR_ICON}/add.svg`,
                onClick: handleCreateEstimation,
            },
            { labelKey: 'Update', icon: `${TOOLBAR_ICON}/refresh.svg`, onClick: () => {}, disabled: !hasLinkedEstimate },
            { labelKey: 'Works List', icon: `${TOOLBAR_ICON}/works.svg`, onClick: handleWorksListClick, disabled: !hasLinkedEstimate },
            { labelKey: 'Materials List', icon: `${TOOLBAR_ICON}/materials.svg`, onClick: handleMaterialsListClick, disabled: !hasLinkedEstimate },
        ]
        : [
            { labelKey: 'Copy to My Estimates', icon: `${TOOLBAR_ICON}/add.svg`, onClick: handleCreateEstimation, disabled: !hasLinkedEstimate },
            { labelKey: 'Works List', icon: `${TOOLBAR_ICON}/works.svg`, onClick: handleWorksListClick, disabled: !hasLinkedEstimate },
            { labelKey: 'Materials List', icon: `${TOOLBAR_ICON}/materials.svg`, onClick: handleMaterialsListClick, disabled: !hasLinkedEstimate },
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
                    <Box sx={{ borderBottom: '1px solid rgba(25, 118, 210, 0.3)', mb: 0 }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={tabSx}>
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
                                        <ImgElement src={`${TOOLBAR_ICON}/tools.svg`} sx={{ height: 20, mr: 1 }} />
                                        {t('General Parameters')}
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
                                {toolButtons.map((tool, index) => (
                                    <Box
                                        key={index}
                                        onClick={() => { if (!tool.disabled) tool.onClick(); }}
                                        sx={toolButtonSx(tool.disabled)}
                                    >
                                        <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImgElement src={tool.icon} sx={{ height: 28 }} />
                                        </Box>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                            {t(tool.labelKey)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* General Info Tab */}
                    {activeTab === 1 && (
                        <Box sx={{ ...panelSx, pt: 0, px: 3, pb: 2 }}>
                            {hasLinkedEstimate ? (
                                <EstimateInfoAccordionContent estimateId={linkedEstimateId!} />
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
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                            }}>
                                {[
                                    { labelKey: 'Upload Project', icon: `${TOOLBAR_ICON}/import.svg`, onClick: () => {} },
                                    { labelKey: 'View Specification', icon: `${TOOLBAR_ICON}/works.svg`, onClick: () => {} },
                                ].map((tool, index) => (
                                    <Box key={index} onClick={tool.onClick} sx={toolButtonSx()}>
                                        <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImgElement src={tool.icon} sx={{ height: 28 }} />
                                        </Box>
                                        <Typography variant="caption" align="center" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                            {t(tool.labelKey)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Export Tab */}
                    {activeTab === 3 && (
                        <Box sx={panelSx}>
                            {hasLinkedEstimate ? (
                                <Box sx={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',
                                    flexWrap: 'wrap'
                                }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                                            {t('Download Estimation')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            {[
                                                { label: 'HTML', icon: `${TOOLBAR_ICON}/html.svg`, format: 'html' as const },
                                                { label: 'Word', icon: `${TOOLBAR_ICON}/word.svg`, format: 'word' as const },
                                                { label: 'PDF', icon: `${TOOLBAR_ICON}/pdf.svg`, format: 'pdf' as const },
                                            ].map((format, index) => (
                                                <Box
                                                    key={index}
                                                    onClick={() => handleDownload(format.format)}
                                                    sx={toolButtonSx()}
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
                            ) : noDataMessage}
                        </Box>
                    )}

                    {/* Estimate content - always visible below tabs when linked */}
                    {hasLinkedEstimate && (
                        <EstimateThreeLevelNestedAccordion
                            estimateId={linkedEstimateId!}
                            isOnlyEstInfo={!isAdmin}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Full Estimate Editor (for superadmin) */}
            {showEstimateDialog && linkedEstimateId && (
                <EstimatePageDialog
                    estimateId={linkedEstimateId}
                    estimateTitle={props.estimateTitle}
                    onClose={() => setShowEstimateDialog(false)}
                />
            )}

            {/* Works List Dialog */}
            {showWorksListDialog && linkedEstimateId && (
                <EstimateWorksListDialog
                    estimateId={linkedEstimateId}
                    onClose={() => setShowWorksListDialog(false)}
                    onSave={() => {}}
                />
            )}

            {/* Materials List Dialog */}
            {showMaterialsListDialog && linkedEstimateId && (
                <EstimateMaterialsListDialog
                    estimateId={linkedEstimateId}
                    onClose={() => setShowMaterialsListDialog(false)}
                    onSave={() => {}}
                />
            )}
        </>
    );
}
