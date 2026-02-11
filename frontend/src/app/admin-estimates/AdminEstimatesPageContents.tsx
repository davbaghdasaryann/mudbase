'use client';

import React, {JSX, useCallback, useEffect, useRef, useState} from 'react';

import {useTranslation} from 'react-i18next';

import {Stack, Toolbar} from '@mui/material';
import {GridActionsCellItem} from '@mui/x-data-grid';

import VisibilityIcon from '@mui/icons-material/Visibility';

import * as Api from 'api';
import * as EstimatesApi from '@/api/estimate';

import {EstimatesDisplayData} from '../../data/estimates_display_data';
import EstimatePageDialog from '../estimates/EstimateDialog';
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import DataTableComponent from '@/components/DataTableComponent';
import {actionColumnWidth5, mainIconColor} from '@/theme';
import {usePermissions} from '@/api/auth';

import {confirmDialog} from '../../components/ConfirmationDialog';
import {formatCurrency} from '@/lib/format_currency';
import {formatDate} from '@/lib/format_date';
import ProgressIndicator from '@/tsui/ProgressIndicator';
import {PageSelect} from '@/tsui/PageSelect';
import ImgElement from '@/tsui/DomElements/ImgElement';
import ECICopyLocationDialog from './ECICopyLocationDialog';

export default function AdminEstimatesPageContents() {
    const {session, permissionsSet} = usePermissions();
    const [t] = useTranslation();

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);
    const [bigProgIndic, setBigProgIndic] = useState(false);

    const [searchVal, setSearchVal] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [estimates, setEstimates] = useState<EstimatesDisplayData[] | null>(null);
    const [allEstimates, setAllEstimates] = useState<EstimatesDisplayData[] | null>(null);

    const [estimateId, setEstimateId] = useState<string | null>(null);
    const [estimateTitle, setEstimateTitle] = useState<string | null>(null);
    const [estimateTotalCost, setEstimateTotalCost] = useState<number | null>(null);

    const [copyEstimateId, setCopyEstimateId] = useState<string | null>(null);
    const [copyEstimateTitle, setCopyEstimateTitle] = useState<string | null>(null);

    // Fetch all estimations
    useEffect(() => {
        mounted.current = true;

        if (!dataRequested) {
            setDataRequested(true);
            setProgIndic(true);

            Api.requestSession<EstimatesApi.ApiEstimate[]>({
                command: `admin/fetch_all_estimates`,
                args: {searchVal: searchVal === '' ? 'empty' : searchVal},
            }).then((estimatesResData) => {
                if (mounted.current) {
                    let estimatesData: EstimatesDisplayData[] = [];

                    for (let estimate of estimatesResData) {
                        estimatesData.push(new EstimatesDisplayData(estimate));
                    }

                    setAllEstimates(estimatesData);
                    setEstimates(estimatesData);
                }

                setProgIndic(false);
            });
        }

        return () => {
            mounted.current = false;
        };
    }, [dataRequested, searchVal]);

    // Filter by company
    useEffect(() => {
        if (!allEstimates) return;

        if (!selectedAccountId || selectedAccountId === '') {
            setEstimates(allEstimates);
        } else {
            const filtered = allEstimates.filter((est) => est.accountId === selectedAccountId);
            setEstimates(filtered);
        }
    }, [selectedAccountId, allEstimates]);

    const onSearch = useCallback((value: string) => {
        setSearchVal(value);
        setDataRequested(false);
    }, []);

    const onRemove = useCallback(
        (estimateId: string) => {
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
        },
        [t]
    );

    const onCopy = useCallback((estimateId: string, estimateTitle: string) => {
        setCopyEstimateId(estimateId);
        setCopyEstimateTitle(estimateTitle);
    }, []);

    // Get unique companies from estimates
    const companies = React.useMemo(() => {
        if (!allEstimates) return [];
        const companyMap = new Map();
        allEstimates.forEach((est) => {
            if (est.accountId && est.companyName) {
                companyMap.set(est.accountId, est.companyName);
            }
        });
        return Array.from(companyMap, ([id, name]) => ({key: id, id, name, label: name}));
    }, [allEstimates]);

    const handleAccountSelect = useCallback(
        (sel: {id: string} | null) => {
            setSelectedAccountId(sel?.id === 'all' ? '' : sel?.id || '');
        },
        []
    );

    return (
        <>
            <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />

                <Stack direction='row' spacing={2} alignItems='center'>
                    <PageSelect
                        withAll={true}
                        sx={{minWidth: 180}}
                        label={t('Company')}
                        value={selectedAccountId || 'all'}
                        items={companies}
                        onSelected={handleAccountSelect}
                    />
                </Stack>
            </Toolbar>

            <DataTableComponent
                sx={{
                    width: '100%',
                    flex: 1,
                }}
                columns={[
                    {field: 'estimateNumber', headerName: 'ID', align: 'center', width: 80},
                    {field: 'companyName', headerName: t('Company'), flex: 0.5},
                    {field: 'name', headerName: t('Name'), flex: 0.6},
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
                        width: actionColumnWidth5,
                        getActions: (cell) => {
                            if (!session?.user) return [];

                            const actions: JSX.Element[] = [];

                            actions.push(
                                <GridActionsCellItem
                                    key='copy'
                                    icon={<ImgElement src='/images/icons/toolbar/duplicate.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                    label={t('Copy to Aggregated')}
                                    onClick={() => onCopy(cell.row._id, cell.row.name)}
                                    showInMenu={false}
                                />
                            );

                            actions.push(
                                <GridActionsCellItem
                                    key='view'
                                    icon={<VisibilityIcon sx={{color: mainIconColor}} />}
                                    label={t('View')}
                                    onClick={() => {
                                        setEstimateTitle(cell.row.name);
                                        setEstimateId(cell.row._id);
                                        setEstimateTotalCost(cell.row.totalCost);
                                    }}
                                />
                            );

                            actions.push(
                                <GridActionsCellItem
                                    key='remove'
                                    icon={<ImgElement src='/images/icons/delete.svg' sx={{height: {xs: 20, sm: 24}}} />}
                                    label={t('Delete')}
                                    onClick={() => onRemove(cell.row._id)}
                                />
                            );

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

            {estimateId && estimateTitle && (
                <EstimatePageDialog
                    estimateId={estimateId}
                    estimateTitle={estimateTitle}
                    onClose={() => setEstimateId(null)}
                    onConfirm={() => setDataRequested(false)}
                    isOnlyEstInfo={true}
                />
            )}

            {copyEstimateId && copyEstimateTitle && (
                <ECICopyLocationDialog
                    estimateId={copyEstimateId}
                    estimateTitle={copyEstimateTitle}
                    onClose={() => {
                        setCopyEstimateId(null);
                        setCopyEstimateTitle(null);
                    }}
                    onConfirm={() => {
                        setCopyEstimateId(null);
                        setCopyEstimateTitle(null);
                        setDataRequested(false);
                    }}
                />
            )}

            <ProgressIndicator show={bigProgIndic} background='backdrop' />
        </>
    );
}
