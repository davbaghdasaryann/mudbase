'use client';

import React, {JSX, useCallback, useEffect, useRef, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {Toolbar} from '@mui/material';
import {GridActionsCellItem} from '@mui/x-data-grid';

import VisibilityIcon from '@mui/icons-material/Visibility';

import * as Api from 'api';
import * as EstimatesApi from '@/api/estimate';

import {EstimatesDisplayData} from '../../data/estimates_display_data';
import EstimatePageDialog from './EstimateDialog';
import CreateEstimateDialog from './CreateEstimateDialog';
import EstimateShareToAccountSelectionDialog from '../../components/estimates_shares/EstimateShareToAccount';
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import DataTableComponent from '@/components/DataTableComponent';
import {actionColumnWidth5, mainIconColor} from '@/theme';
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

        confirmDialog(t('Are you sure you want to duplicate this estimate?')).then((result) => {
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
            <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />

                {permCreate && <PageButton variant='contained' label='Create Estimate' size='large' onClick={() => setOpenCreateEstimateDialog(true)} />}
            </Toolbar>

            <DataTableComponent
                sx={{
                    width: '100%',
                    flex: 1,
                }}
                columns={[
                    {field: 'estimateNumber', headerName: 'ID', align: 'center'},
                    {field: 'name', headerName: t('Name'), flex: 0.6},
                    {
                        field: 'totalCostWithOtherExpenses',
                        headerName: t('Cost'),
                        align: 'center',
                        flex: 0.6,
                        valueFormatter: (value) => formatCurrency(value),
                    },
                    {
                        field: 'createdAt',
                        type: 'dateTime',
                        headerName: t('Date'),
                        align: 'center',
                        flex: 0.3,
                        valueFormatter: (value) => formatDate(value),
                    },

                    {
                        field: 'actions',
                        type: 'actions',
                        width: actionColumnWidth5,
                        getActions: (cell) => {
                            if (!session?.user) return [];

                            const actions: JSX.Element[] = [];

                            if (permEdit) {
                                actions.push(
                                    <GridActionsCellItem
                                        key='duplicate'
                                        icon={<ImgElement src='/images/icons/toolbar/duplicate.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                        label={t('Duplicate')}
                                        onClick={() => onDuplicate(cell.row._id)}
                                        showInMenu={false}
                                    />
                                );
                            }

                            if (permissionsSet.has('EST_SHR')) {
                                actions.push(
                                    <GridActionsCellItem
                                        key='share'
                                        icon={<ImgElement src='/images/icons/toolbar/share.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                        label={t('Share')}
                                        onClick={() => {
                                            setEstimateTitle(cell.row.name);
                                            setEstimateIdForShare(cell.row._id);
                                            setEstimateTotalCost(cell.row.totalCost);
                                        }}
                                        showInMenu={false}
                                    />
                                );
                            }

                            if (permEdit) {
                                actions.push(
                                    <GridActionsCellItem
                                        key='edit'
                                        icon={<ImgElement src='/images/icons/edit.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                        label={t('Edit')}
                                        onClick={() => {
                                            setEstimateTitle(cell.row.name);
                                            setEstimateId(cell.row._id);
                                            setEstimateTotalCost(cell.row.totalCost);
                                        }}
                                    />
                                );
                            } else {
                                actions.push(
                                    <GridActionsCellItem
                                        key='view'
                                        icon={<VisibilityIcon />}
                                        label={t('View')}
                                        onClick={() => {
                                            setEstimateTitle(cell.row.name);
                                            setEstimateId(cell.row._id);
                                            setEstimateTotalCost(cell.row.totalCost);
                                        }}
                                    />
                                );
                            }

                            if (permEdit) {
                                actions.push(
                                    <GridActionsCellItem
                                        key='archive'
                                        icon={<ImgElement src='/images/icons/toolbar/archive.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                        label={t('Archive')}
                                        onClick={() => onArchive(cell.row._id)}
                                        showInMenu={false}
                                    />
                                );
                            }

                            if (permEdit) {
                                actions.push(
                                    <GridActionsCellItem
                                        key='remove'
                                        icon={<ImgElement src='/images/icons/delete.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                        label={t('Remove')}
                                        onClick={() => onRemove(cell.row._id)}
                                    />
                                );
                            }

                            return actions;
                        },
                    },
                ]}
                rows={estimates ?? []}
                autoPageSize={true}
                disableRowSelectionOnClick
                loading={progIndic}
                getRowId={(row) => row._id}
                onRowDoubleClick={(row) => {
                    setEstimateId(row.row._id);
                    setEstimateTitle(row.row.name);
                    setEstimateTotalCost(row.row.totalCost);
                }}
            />

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
