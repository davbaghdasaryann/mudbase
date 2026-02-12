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
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import DataTableComponent from '@/components/DataTableComponent';
import {actionColumnWidth3, mainIconColor} from '@/theme';
import ImgElement from '@/tsui/DomElements/ImgElement';
import {usePermissions} from '@/api/auth';

import EstimateOnlyForViewDialog from './EstimateOnlyForViewDialog';
import {confirmDialog} from '../../components/ConfirmationDialog';
import {formatCurrency} from '@/lib/format_currency';
import {formatDate} from '@/lib/format_date';
import ProgressIndicator from '@/tsui/ProgressIndicator';

export default function ArchivedEstimatesTab() {
    const {session, permissionsSet} = usePermissions();

    const permEdit = permissionsSet?.has?.('EST_EDT');

    const [t] = useTranslation();

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);
    const [bigProgIndic, setBigProgIndic] = useState(false);

    const [searchVal, setSearchVal] = useState('');
    const [estimates, setEstimates] = useState<EstimatesDisplayData[] | null>(null);

    const [estimateId, setEstimateId] = useState<string | null>(null);

    const [estimateTitle, setEstimateTitle] = useState<string | null>(null);
    const [estimateTotalCost, setEstimateTotalCost] = useState<number | null>(null);

    useEffect(() => {
        mounted.current = true;

        if (!dataRequested) {
            setDataRequested(true);
            setProgIndic(true);

            Api.requestSession<EstimatesApi.ApiEstimate[]>({
                command: `estimates/fetch_archived`,
                args: {searchVal: searchVal === '' ? 'empty' : searchVal},
            }).then((estimatesResData) => {
                if (mounted.current) {
                    let estimatesData: EstimatesDisplayData[] = [];

                    for (let estimate of estimatesResData) {
                        estimatesData.push(new EstimatesDisplayData(estimate));
                    }

                    setEstimates(estimatesData);
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

    const onUnarchive = useCallback((estimateId: string) => {
        if (!estimateId) return;

        confirmDialog(t('Are you sure you want to unarchive this estimate?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                setBigProgIndic(true);

                Api.requestSession<any>({
                    command: 'estimate/unarchive',
                    args: {
                        estimateId: estimateId,
                    },
                })
                    .then((unarchivedEst) => {
                        // console.log(unarchivedEst);
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
                        // console.log(deletedEst);
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
            </Toolbar>

            <DataTableComponent
                sx={{
                    width: '100%',
                    flex: 1,
                }}
                getRowHeight={() => 'auto'}
                columns={[
                    {field: 'estimateNumber', headerName: 'ID', align: 'center'},
                    {
                        field: 'name',
                        headerName: t('Name'),
                        flex: 0.6,
                        renderCell: (params) => (
                            <div style={{
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                lineHeight: '1.5',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 0'
                            }}>
                                {params.value}
                            </div>
                        ),
                    },
                    {
                        field: 'totalCostWithOtherExpenses',
                        headerName: t('Cost'),
                        align: 'center',
                        flex: 0.4,
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
                        width: actionColumnWidth3,
                        getActions: (cell) => {
                            if (!session?.user) return [];

                            const actions: JSX.Element[] = [];

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
                                        key='unarchive'
                                        icon={<ImgElement src='/images/icons/toolbar/unarchive.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                        label={t('Unarchive')}
                                        onClick={() => onUnarchive(cell.row._id)}
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
                    />
                ) : (
                    <EstimateOnlyForViewDialog
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => setEstimateId(null)}
                        onConfirm={() => setDataRequested(false)}
                    />
                ))}

            <ProgressIndicator show={bigProgIndic} background='backdrop' />
        </>
    );
}
