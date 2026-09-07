'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {Box, IconButton, Toolbar, Typography} from '@mui/material';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';

import * as Api from 'api';
import * as EstimatesApi from '@/api/estimate';

import {EstimatesDisplayData} from '../../data/estimates_display_data';
import EstimatePageDialog from './EstimateDialog';
import CreateEstimateDialog from './CreateEstimateDialog';
import EstimateShareToAccountSelectionDialog from '../../components/estimates_shares/EstimateShareToAccount';
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import {mainPrimaryColor} from '@/theme';
import ImgElement from '@/tsui/DomElements/ImgElement';
import {PageButton} from '../../tsui/Buttons/PageButton';
import {usePermissions} from '@/api/auth';

import EstimateOnlyForViewDialog from './EstimateOnlyForViewDialog';
import {confirmDialog} from '../../components/ConfirmationDialog';
import {formatCurrency} from '@/lib/format_currency';
import {formatDate} from '@/lib/format_date';
import ProgressIndicator from '@/tsui/ProgressIndicator';

export default function AccountEstimatesTab() {
    const {session, permissionsSet} = usePermissions();

    const permCreate = permissionsSet?.has?.('EST_CRT');
    const permEdit = permissionsSet?.has?.('EST_EDT');

    const [t] = useTranslation();

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);
    const [bigProgIndic, setBigProgIndic] = useState(false);

    const [openCreateEstimateDialog, setOpenCreateEstimateDialog] = useState(false);

    const [searchVal, setSearchVal] = useState('');
    const [estimates, setEstimates] = useState<EstimatesDisplayData[] | null>(null);

    const [estimateId, setEstimateId] = useState<string | null>(null);
    const [estimateIdForShare, setEstimateIdForShare] = useState<string | null>(null);

    const [estimateTitle, setEstimateTitle] = useState<string | null>(null);
    const [estimateTotalCost, setEstimateTotalCost] = useState<number | null>(null);

    useEffect(() => {
        mounted.current = true;

        if (!dataRequested) {
            setDataRequested(true);
            setProgIndic(true);

            Api.requestSession<EstimatesApi.ApiEstimate[]>({
                command: `estimates/fetch`,
                args: {searchVal: searchVal === '' ? 'empty' : searchVal},
            }).then((estimatesResData) => {
                if (mounted.current) {
                    // console.log('estimatesResData', estimatesResData);
                    // console.log('labor categories: ', d)
                    let estimatesData: EstimatesDisplayData[] = [];

                    for (let estimate of estimatesResData) {
                        estimatesData.push(new EstimatesDisplayData(estimate));
                    }
                    // console.log('laborOffersData', estimatesData);

                    setEstimates(estimatesData);

                    // GD.pubsub_.dispatch('estimateDataChange');
                }

                setProgIndic(false);
            });
        }

        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);

    const onSearch = useCallback((value: string) => {
        setSearchVal(value);
        setDataRequested(false);
    }, []);

    const onDuplicate = useCallback((estimateId: string) => {
        if (!estimateId) return;

        confirmDialog(t('Are you sure you want to duplicate this estimate?'), undefined, { noTitle: true, confirmColor: '#DC3741' }).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                setBigProgIndic(true);

                Api.requestSession<any>({
                    command: 'estimate/duplicate',
                    args: {
                        estimateId: estimateId,
                    },
                })
                    .then((duplicatedEst) => {
                        // console.log(duplicatedEst);
                    })
                    .finally(() => {
                        setDataRequested(false);
                        setProgIndic(false);
                        setBigProgIndic(false);
                    });
            }
        });
    }, []);

    const onArchive = useCallback((estimateId: string) => {
        if (!estimateId) return;

        confirmDialog(t('Are you sure you want to archive this estimate?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                setBigProgIndic(true);

                Api.requestSession<any>({
                    command: 'estimate/archive',
                    args: {
                        estimateId: estimateId,
                    },
                })
                    .then((archivedEst) => {
                        // console.log(archivedEst);
                    })
                    .finally(() => {
                        setDataRequested(false);
                        setProgIndic(false);
                        setBigProgIndic(false);
                    });
            }
        });
    }, []);

    const onRemove = useCallback((estimateId: string) => {
        if (!estimateId) return;

        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                setBigProgIndic(true);

                Api.requestSession<any>({
                    command: 'estimate/delete',
                    args: {
                        estimateId: estimateId,
                    },
                })
                    .then((deletedEst) => {
                        // console.log(removedMaterial);
                        // props.onConfirm();
                    })
                    .finally(() => {
                        setDataRequested(false);
                        setProgIndic(false);
                        setBigProgIndic(false);
                    });
            }
        });
    }, []);

    return (
        <>
            <Toolbar disableGutters sx={{ backgroundColor: 'inherit', minHeight: 'auto !important', py: 1, mt: 2, mb: 1 }}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />

                {permCreate && <PageButton variant='outlined' label='Create Estimate' size='large' onClick={() => setOpenCreateEstimateDialog(true)} sx={{ borderRadius: '25px', height: '40px', borderColor: mainPrimaryColor, color: mainPrimaryColor, '&:hover': { backgroundColor: mainPrimaryColor, color: '#fff', borderColor: mainPrimaryColor } }} />}
            </Toolbar>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {estimates && estimates.length === 0 && !progIndic && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
                        <DescriptionOutlinedIcon sx={{ fontSize: 72, color: mainPrimaryColor, opacity: 0.2 }} />
                        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>{t('No Estimates created yet')}</Typography>
                    </Box>
                )}
                {estimates && estimates.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {estimates.map(est => (
                            <Box
                                key={est._id}
                                onClick={() => { setEstimateId(est._id); setEstimateTitle(est.name); setEstimateTotalCost(est.totalCost); }}
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.8, borderRadius: 2, border: '1px solid #e0f5f7', backgroundColor: '#fafeff', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s', '&:hover': { boxShadow: '0 2px 12px rgba(0,171,190,0.12)', borderColor: mainPrimaryColor } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                    <DescriptionOutlinedIcon sx={{ color: mainPrimaryColor, opacity: 0.7, fontSize: 22, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{est.name}</Typography>
                                        <Typography variant='caption' color='text.secondary'>#{est.estimateNumber} · {est.createdAt ? formatDate(est.createdAt) : '—'}</Typography>
                                    </Box>
                                </Box>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: mainPrimaryColor, mx: 3, flexShrink: 0 }}>
                                    {formatCurrency(est.totalCostWithOtherExpenses)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    {permEdit && (
                                        <IconButton size='small' onClick={() => onDuplicate(est._id)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                            <ImgElement src='/images/icons/toolbar/duplicate.svg' sx={{ height: 20 }} />
                                        </IconButton>
                                    )}
                                    {permissionsSet?.has('EST_SHR') && (
                                        <IconButton size='small' onClick={() => { setEstimateTitle(est.name); setEstimateIdForShare(est._id); setEstimateTotalCost(est.totalCost); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                            <ImgElement src='/images/icons/toolbar/share.svg' sx={{ height: 20 }} />
                                        </IconButton>
                                    )}
                                    {permEdit ? (
                                        <IconButton size='small' onClick={() => { setEstimateTitle(est.name); setEstimateId(est._id); setEstimateTotalCost(est.totalCost); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                            <ImgElement src='/images/icons/edit.svg' sx={{ height: 20 }} />
                                        </IconButton>
                                    ) : (
                                        <IconButton size='small' onClick={() => { setEstimateTitle(est.name); setEstimateId(est._id); setEstimateTotalCost(est.totalCost); }} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                            <VisibilityIcon fontSize='small' />
                                        </IconButton>
                                    )}
                                    {permEdit && (
                                        <IconButton size='small' onClick={() => onArchive(est._id)} sx={{ color: '#bbb', '&:hover': { color: mainPrimaryColor } }}>
                                            <ImgElement src='/images/icons/toolbar/archive.svg' sx={{ height: 20 }} />
                                        </IconButton>
                                    )}
                                    {permEdit && (
                                        <IconButton size='small' onClick={() => onRemove(est._id)} sx={{ color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                            <ImgElement src='/images/icons/delete.svg' sx={{ height: 20 }} />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {estimateId &&
                estimateTitle &&
                (permEdit ? (
                    <EstimatePageDialog
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => setEstimateId(null)}
                        onConfirm={() => setDataRequested(false)}
                        // isOnlyEstInfo={session?.user && permissionsSet?.has?.('EST_CRT_BY_BNK') ? true : false}
                    />
                ) : (
                    <EstimateOnlyForViewDialog
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => setEstimateId(null)}
                        onConfirm={() => setDataRequested(false)}
                    />
                ))}

            {estimateIdForShare && estimateTitle && (
                <EstimateShareToAccountSelectionDialog
                    calledFromPage='estimates'
                    estimateId={estimateIdForShare}
                    title={estimateTitle}
                    onClose={() => {
                        setEstimateIdForShare(null);
                        setEstimateTitle(null);
                    }}
                    onConfirm={() => setDataRequested(false)}
                />
            )}

            {openCreateEstimateDialog && <CreateEstimateDialog onClose={() => setOpenCreateEstimateDialog(false)} onConfirm={() => setDataRequested(false)} />}

            <ProgressIndicator show={bigProgIndic} background='backdrop' />
        </>
    );
}
