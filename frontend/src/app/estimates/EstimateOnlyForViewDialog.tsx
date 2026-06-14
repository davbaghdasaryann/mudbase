'use client';
import React, { useState } from 'react';

import { Box, Dialog, DialogContent, DialogTitle, IconButton, Tab, Tabs, Typography } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

import * as F from 'tsui/Form';
import * as Api from '@/api';
import ImgElement from '@/tsui/DomElements/ImgElement';
import EstimateInfoOnlyForViewAccardionContent from '../../components/estimate/EstimateInfoOnlyForViewAccardionContent';
import EstimateOnlyForViewThreeLevelAccordion from '../../components/estimate/EstimateOnlyForViewThreeLevelAccordion';
import {usePermissions} from '../../api/auth';
import EstimateOtherExpensesAccordion from '../../components/estimate/EstimateOtherExpensesAccordion';
import { runPrintEstimate } from '@/lib/print_estimate';
import { useTranslation } from 'react-i18next';

const TOOLBAR_ICON = '/images/icons/toolbar';

interface Props {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm?: () => void;

    viewOnly?: boolean;
}

export default function EstimateOnlyForViewDialog(props: Props) {
    const {session, permissionsSet} = usePermissions();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);

    const handleDataUpdated = (updated: boolean) => {
        if (updated) {
            props.onConfirm?.();
        }
    };

    const handleDownloadEstimation = (format: 'html' | 'word' | 'pdf') => {
        const commandMap = {
            html: 'estimate/generate_html',
            word: 'estimate/generate_word',
            pdf: 'estimate/generate_pdf',
        };
        window.open(
            Api.makeApiUrl({ command: commandMap[format], args: { estimateId: props.estimateId } }),
            '_blank'
        );
    };

    const handleDownloadBoQ = (format: 'html' | 'word' | 'pdf') => {
        const commandMap = {
            html: 'estimate/generate_boq_html',
            word: 'estimate/generate_boq_word',
            pdf: 'estimate/generate_boq_pdf',
        };
        window.open(
            Api.makeApiUrl({ command: commandMap[format], args: { estimateId: props.estimateId } }),
            '_blank'
        );
    };

    return (
        <Dialog
            fullScreen
            open={true}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                    props.onClose();
                }
            }}
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
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
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
                            },
                        }}
                    >
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
                                    <ImgElement src={`${TOOLBAR_ICON}/export.svg`} sx={{ height: 20, mr: 1 }} />
                                    {t('Export')}
                                </Box>
                            }
                            sx={{ minHeight: 43, height: 43 }}
                        />
                    </Tabs>
                </Box>

                {/* General Info Tab Content */}
                {activeTab === 0 && (
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
                        <EstimateInfoOnlyForViewAccardionContent estimateId={props.estimateId} />
                    </Box>
                )}

                {/* Export Tab Content */}
                {activeTab === 1 && (
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
                            flexWrap: 'nowrap',
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

                            <Box sx={{ width: '2px', backgroundColor: 'rgba(0, 0, 0, 0.12)', alignSelf: 'stretch', mx: 1 }} />

                            {[
                                { category: 'BoQ', format: 'HTML', icon: `${TOOLBAR_ICON}/html.svg` },
                                { category: 'BoQ', format: 'Word', icon: `${TOOLBAR_ICON}/word.svg` },
                                { category: 'BoQ', format: 'PDF', icon: `${TOOLBAR_ICON}/pdf.svg` },
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

                <EstimateOnlyForViewThreeLevelAccordion estimateId={props.estimateId} onDataUpdated={handleDataUpdated} viewOnly={props.viewOnly} />

                {session?.user && permissionsSet?.has?.('EST_VW_OTHR_XPNS') && (
                    <EstimateOtherExpensesAccordion estimateId={props.estimateId} viewOnly={true} />
                )}
            </DialogContent>
        </Dialog>
    );
}
