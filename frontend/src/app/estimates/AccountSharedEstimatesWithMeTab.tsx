'use client';

import React, {JSX, useCallback, useEffect, useRef, useState} from 'react';

import {Box, IconButton, Toolbar, Tooltip, Typography} from '@mui/material';
import {GridActionsCellItem, GridActionsColDef} from '@mui/x-data-grid';

import {useTranslation} from 'react-i18next';


import SendIcon from '@mui/icons-material/Send';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';




import EstimatePageDialog from './EstimateDialog';

import * as Api from 'api';
import * as EstimatesSharesApi from '@/api/estimates_shares';

import {SharedEstimatesDisplayData} from '@/data/shared_estimates_display_data';
import EstimateOnlyForViewDialog from './EstimateOnlyForViewDialog';

import {usePermissions} from '@/api/auth';
import SearchComponent from '@/components/SearchComponent';
import DataTableComponent from '@/components/DataTableComponent';

import {useApiFetchMany} from '@/components/ApiDataFetch';
import {mainIconColor} from '@/theme';
import {confirmDialog} from '@/components/ConfirmationDialog';
import {PageSelect} from '@/tsui/PageSelect';
import {formatCurrency} from '@/lib/format_currency';
import {formatDate} from '@/lib/format_date';


interface SelectedFiltersDataProps {
    // categoryId: string | null;
    // subcategoryId: string | null;
    accountId: string | null;
}

// ✅ Define Interface
interface AccardionItem {
    _id: string;
    sharedAt: Date;

    isOnlyEstimateInfo?: boolean;

    estimateNumber: string;
    theSameEstNumAveragePrice?: number;
    name: string;
    totalCost: number;
    totalCostWithOtherExpenses: number;
    createdAt: Date;
    sharedEstimateId: string;

    companyName?: string;

    sharedByAccountName: string;
    isLoading?: boolean;
    children?: AccardionItem[]; // Holds nested children
}


// interface AccountSharedEstimatesTabProps {
//     showOffers: boolean;
//     viewOnly?: boolean;
// }

// show offers: true
// viewOnly: false

export default function AccountSharedEstimatesWithMeTab() {
    const {session, status, permissionsSet} = usePermissions();
    const [t] = useTranslation();

    const showShareColumn = false;
    // false || (!props.showOffers && session?.user && (permissionsSet?.has?.('EST_CRT_BY_BNK') || permissionsSet?.has?.('EST_CRT_BY_DEV')));

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);

    const [searchVal, setSearchVal] = useState('');
    const [items, setItems] = useState<AccardionItem[]>([]);
    const [estimates, setEstimates] = useState<SharedEstimatesDisplayData[] | null>(null);

    const [estimateId, setEstimateId] = useState<string | null>(null);
    const [isOnlyEstInfo, setIsOnlyEstInfo] = useState(false);
    const [estimateIdForShare, setEstimateIdForShare] = useState<string | null>(null);

    const [estimateTitle, setEstimateTitle] = useState<string | null>(null);

    const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>('All');
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>('all');

    const selectedFiltersDataRef = useRef<SelectedFiltersDataProps>({
        // categoryId: null,
        // subcategoryId: null,
        accountId: null,
    });

    const accountsSelectList = useApiFetchMany<Api.ApiAccount>({
        api: {
            command: 'accounts/done_estimate_share',
        },
    });

    useEffect(() => {
        setProgIndic(true);

        mounted.current = true;
        if (!dataRequested) {
            Api.requestSession<EstimatesSharesApi.ApiEstimatesShares[]>({
                command: `estimates_shares/fetch`,
                args: {searchVal: searchVal === '' ? 'empty' : searchVal},
                json: selectedFiltersDataRef.current,
            }).then((estimatesResData) => {
                if (mounted.current) {
                    console.log('estimatesResData', estimatesResData);
                    let estimatesData: SharedEstimatesDisplayData[] = [];

                    for (let estimate of estimatesResData) {
                        estimatesData.push(new SharedEstimatesDisplayData(estimate));
                    }

                    setItems(estimatesData);
                    setEstimates(estimatesData);
                }
                setProgIndic(false);
            });

            setDataRequested(true);
            return;
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);

    const onSearch = useCallback((value: string) => {
        setSearchVal(value);
        setDataRequested(false);
    }, []);


    const onRemoveSharedEstimateFromCommonTable = useCallback((sharedEstimateMongoId: string) => {
        if (!sharedEstimateMongoId) return;

        // console.log('sharedDuplicatedEstimateId', sharedEstimateMongoId);
        // return
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                Api.requestSession<any>({
                    command: 'estimates_shares/delete_from_common_table',
                    args: {
                        sharedEstimateMongoId: sharedEstimateMongoId,
                    },
                })
                    .then((deletedEst) => {
                        // console.log(removedMaterial);
                        // props.onConfirm();
                        setDataRequested(false);
                    })
                    .finally(() => {
                        setProgIndic(false);
                    });
            }
        });
    }, []);

    if (
        session?.user &&
        permissionsSet?.has?.('EST_SHR_VW_RCV') &&
        !permissionsSet?.has?.('EST_MULT_SHRD_EDT') &&
        !permissionsSet?.has?.('EST_MULT_SHRD_ONLY_VW_ONE')
    ) {
        console.log('111');

        return (
            <>
                <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                    <SearchComponent onSearch={onSearch} />
                    <Box sx={{ flexGrow: 1 }} />
                    <PageSelect
                        withAll={true}
                        sx={{minWidth: 300, ml: 1}}
                        onSelected={(selected) => {
                            if (selected?.label) {
                                setSelectedAccountFilter(selected.label);
                                setSelectedAccountId(selected.id);

                                if (selected.id === 'all') {
                                    selectedFiltersDataRef.current.accountId = null;
                                } else {
                                    selectedFiltersDataRef.current.accountId = selected.id;
                                }

                                onSearch(searchVal);
                            } else {
                                setSelectedAccountFilter(null);
                                setSelectedAccountId(null);
                                selectedFiltersDataRef.current.accountId = null;
                            }
                        }}
                        items={
                            accountsSelectList.data
                                ? accountsSelectList.data
                                      .filter((unit, index, self) => index === self.findIndex((u) => u.companyName === unit.companyName))
                                      .map((unit) => ({
                                          key: unit._id,
                                          id: unit._id,
                                          name: unit.companyName,
                                          label: unit.companyName,
                                      }))
                                : []
                        }
                        value={selectedAccountId ?? 'All'} // value should be the id of the selected item
                        label={t('Company')}
                    />
                </Toolbar>

                <DataTableComponent
                    sx={{
                        width: '100%',
                    }}
                    columns={[
                        {field: 'estimateNumber', headerName: 'ID', flex: 0.2},
                        {field: 'sharedByAccountName', headerName: t('Shared by'), flex: 0.4},
                        {field: 'name', headerName: t('Name'), flex: 0.6},
                        {
                            field: 'totalCostWithOtherExpenses',
                            type: 'number',
                            headerName: t('Total Cost'),
                            flex: 0.5,
                            align: 'center',
                            valueFormatter: (value) => formatCurrency(value),
                        },
                        {
                            field: 'sharedAt',
                            type: 'dateTime',
                            headerName: t('Shared Date'),
                            align: 'center',
                            flex: 0.3,
                            valueFormatter: (value) => formatDate(value),
                        },
                        ...(session?.user && permissionsSet?.has?.('EST_MULT_SHRD_DEL')
                            ? [
                                  {
                                      field: 'remove',
                                      type: 'actions',
                                      headerName: t('Remove'),
                                      flex: 0.15,
                                      renderCell: (cell) => {
                                          return (
                                              <>
                                                  <IconButton
                                                      onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                          onRemoveSharedEstimateFromCommonTable(cell.row._id);
                                                      }}
                                                  >
                                                      <DeleteForeverIcon />
                                                  </IconButton>
                                              </>
                                          );
                                      },
                                  } as GridActionsColDef,
                              ]
                            : []),
                        {
                            field: 'info',
                            type: 'actions',
                            headerName: 'View',
                            align: 'center',
                            width: 80,
                            renderCell: (cell) => {
                                return (
                                    <>
                                        <IconButton
                                            onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                console.log('cell isOnlyEstimateInfo', cell);
                                                setEstimateTitle(cell.row.name as string);
                                                setEstimateId(cell.row.sharedEstimateId as string);
                                                setIsOnlyEstInfo(cell.row.isOnlyEstimateInfo);
                                            }}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </>
                                );
                            },
                        },
                    ]}
                    rows={estimates ?? []}
                    disableRowSelectionOnClick
                    loading={progIndic}
                    getRowId={(row) => row._id}
                    onRowDoubleClick={(row) => {
                        setEstimateId(row.row.sharedEstimateId as string);
                        setEstimateTitle(row.row.name as string);
                    }}
                />

                {estimateId && estimateTitle && (
                    <EstimateOnlyForViewDialog
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => {
                            setEstimateId(null);
                        }}
                        onConfirm={() => {
                            setDataRequested(false);
                        }}
                    />
                )}
            </>
        );
    }

    if (session?.user && permissionsSet?.has?.('EST_MULT_SHRD_EDT')) {
        console.log('222');

        return (
            <>
                <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                    <SearchComponent onSearch={onSearch} />
                    <Box sx={{ flexGrow: 1 }} />
                    <PageSelect
                        withAll={true}
                        sx={{minWidth: 300, ml: 1}}
                        onSelected={(selected) => {
                            if (selected?.label) {
                                setSelectedAccountFilter(selected.label);
                                setSelectedAccountId(selected.id);

                                if (selected.id === 'all') {
                                    selectedFiltersDataRef.current.accountId = null;
                                } else {
                                    selectedFiltersDataRef.current.accountId = selected.id;
                                }

                                onSearch(searchVal);
                            } else {
                                setSelectedAccountFilter(null);
                                setSelectedAccountId(null);
                                selectedFiltersDataRef.current.accountId = null;
                            }
                        }}
                        items={
                            accountsSelectList.data
                                ? accountsSelectList.data
                                      .filter((unit, index, self) => index === self.findIndex((u) => u.companyName === unit.companyName))
                                      .map((unit) => ({
                                          key: unit._id,
                                          id: unit._id,
                                          name: unit.companyName,
                                          label: unit.companyName,
                                      }))
                                : []
                        }
                        value={selectedAccountId ?? 'All'} // value should be the id of the selected item
                        label={t('Company')}
                    />
                </Toolbar>
                <DataTableComponent
                    sx={{
                        width: '100%',
                        // color: "red"
                    }}
                    columns={[
                        {field: 'estimateNumber', headerName: 'ID', flex: 0.2},
                        {field: 'sharedByAccountName', headerName: t('Shared by'), flex: 0.4},
                        {field: 'name', headerName: t('Name'), flex: 0.6},
                        {
                            field: 'totalCostWithOtherExpenses',
                            headerName: t('Total Cost'),
                            flex: 0.5,
                            align: 'center',
                            valueFormatter: (value) => formatCurrency(value),
                        },
                        // {
                        //     field: 'createdDate', type: 'dateTime', headerName: 'Created Date', align: 'center', width: 200, valueFormatter: (params: any) =>
                        //         moment(params).format('DD.MM.YYYY HH:mm')
                        // },
                        {
                            field: 'sharedAt',
                            type: 'dateTime',
                            headerName: t('Shared Date'),
                            align: 'center',
                            flex: 0.3,
                            valueFormatter: (value) => formatDate(value),
                        },

                        {
                            field: 'actions',
                            type: 'actions',
                            width: 100,
                            getActions: (cell) => {
                                if (!session?.user) return [];

                                const actions: JSX.Element[] = [];

                                if (showShareColumn) {
                                    actions.push(
                                        <GridActionsCellItem
                                            key='share'
                                            icon={<SendIcon sx={{color: mainIconColor}} />}
                                            label={t('Share')}
                                            onClick={() => {
                                                setEstimateTitle(cell.row.name as string);
                                                setEstimateIdForShare(cell.row._id as string);
                                            }}
                                        />
                                    );
                                }

                                actions.push(
                                    <GridActionsCellItem
                                        key='edit'
                                        icon={<EditOutlinedIcon />}
                                        // icon={<VisibilityIcon />}
                                        label={t('Edit')}
                                        onClick={() => {
                                            setEstimateTitle(cell.row.name as string);
                                            setEstimateId(cell.row.sharedEstimateId as string);
                                            setIsOnlyEstInfo(cell.row.isOnlyEstimateInfo);
                                        }}
                                    />
                                );

                                if (permissionsSet.has('EST_MULT_SHRD_DEL')) {
                                    actions.push(
                                        <GridActionsCellItem
                                            key='remove'
                                            icon={<DeleteForeverIcon />}
                                            label={t('Remove')}
                                            onClick={() => onRemoveSharedEstimateFromCommonTable(cell.row._id)}
                                            // showInMenu={false}
                                        />
                                    );
                                }

                                return actions;
                            },
                        },
                    ]}
                    rows={estimates ?? []}
                    disableRowSelectionOnClick
                    loading={progIndic}
                    getRowId={(row) => row._id}
                    onRowDoubleClick={(row) => {
                        setEstimateId(row.row.sharedEstimateId as string);
                        setEstimateTitle(row.row.name as string);
                    }}
                />

                {estimateId && estimateTitle && (
                    <EstimatePageDialog
                        isOnlyEstInfo={isOnlyEstInfo}
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => setEstimateId(null)}
                        onConfirm={() => setDataRequested(false)}
                    />
                )}
            </>
        );
    }

    if (
        session?.user &&
        permissionsSet?.has?.('EST_CRT_BY_BNK') &&
        (permissionsSet?.has?.('EST_MULT_SHRD_ONLY_VW_ONE') || permissionsSet?.has?.('EST_MULT_SHRD_ONLY_VW_ALL'))
    ) {
        //THIS I ADD FOR BANK 'EST_MULT_SHRD_ONLY_VW_ALL'
        return (
            <>
                <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                    <SearchComponent onSearch={onSearch} />
                    <Box sx={{ flexGrow: 1 }} />
                    <PageSelect
                        withAll={true}
                        sx={{minWidth: 300, ml: 1}}
                        onSelected={(selected) => {
                            if (selected?.label) {
                                setSelectedAccountFilter(selected.label);
                                setSelectedAccountId(selected.id);

                                if (selected.id === 'all') {
                                    selectedFiltersDataRef.current.accountId = null;
                                } else {
                                    selectedFiltersDataRef.current.accountId = selected.id;
                                }

                                onSearch(searchVal);
                            } else {
                                setSelectedAccountFilter(null);
                                setSelectedAccountId(null);
                                selectedFiltersDataRef.current.accountId = null;
                            }
                        }}
                        items={
                            accountsSelectList.data
                                ? accountsSelectList.data
                                      .filter((unit, index, self) => index === self.findIndex((u) => u.companyName === unit.companyName))
                                      .map((unit) => ({
                                          key: unit._id,
                                          id: unit._id,
                                          name: unit.companyName,
                                          label: unit.companyName,
                                      }))
                                : []
                        }
                        value={selectedAccountId ?? 'All'} // value should be the id of the selected item
                        label={t('Company')}
                    />
                </Toolbar>
                <DataTableComponent
                    sx={{
                        width: '100%',
                        // color: "red"
                    }}
                    columns={[
                        {field: 'estimateNumber', headerName: 'ID', flex: 0.2},
                        {field: 'sharedByAccountName', headerName: t('Shared by'), flex: 0.4},
                        {field: 'name', headerName: t('Name'), flex: 0.6},
                        {
                            field: 'totalCostWithOtherExpenses',
                            type: 'number',
                            headerName: t('Cost'),
                            align: 'center',
                            flex: 0.5,
                            valueFormatter: (value) => formatCurrency(value),
                        },
                        {
                            field: 'sharedAt',
                            type: 'dateTime',
                            headerName: t('Shared Date'),
                            align: 'center',
                            flex: 0.3,
                            valueFormatter: (value) => formatDate(value),
                        },

                        {
                            field: 'actions',
                            type: 'actions',
                            width: 200,
                            getActions: (cell) => {
                                if (!session?.user) return [];

                                const actions: JSX.Element[] = [];

                                if (permissionsSet?.has?.('EST_MULT_SHRD_ONLY_VW_ONE')) {
                                    actions.push(
                                        <GridActionsCellItem
                                            key='edit'
                                            icon={<EditOutlinedIcon />}
                                            // icon={<VisibilityIcon />}
                                            label={t('Edit')}
                                            onClick={() => {
                                                setEstimateTitle(cell.row.name as string);
                                                setEstimateId(cell.row.sharedEstimateId as string);
                                                setIsOnlyEstInfo(cell.row.isOnlyEstimateInfo);
                                            }}
                                        />
                                    );
                                }

                                // actions.push(
                                //     <GridActionsCellItem
                                //         key='print'
                                //         icon={<PrintIcon />}
                                //         label={t('Print')}
                                //         onClick={() => runPrintEstimate(cell.row.sharedEstimateId)}
                                //     />
                                // );

                                if (permissionsSet.has('EST_MULT_SHRD_DEL')) {
                                    actions.push(
                                        <GridActionsCellItem
                                            key='remove'
                                            icon={<DeleteForeverIcon />}
                                            label={t('Remove')}
                                            onClick={() => onRemoveSharedEstimateFromCommonTable(cell.row._id)}
                                        />
                                    );
                                }

                                return actions;
                            },
                        },

                        // ...(session?.user && permissionsSet?.has?.('EST_MULT_SHRD_DEL')
                        //     ? [
                        //         {
                        //             field: 'remove', type: 'actions', headerName: t('Remove'), flex: 0.15, renderCell: (cell) => {
                        //                 return <>
                        //                     <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                        //                         onRemoveSharedEstimateFromCommonTable(cell.row._id);
                        //                     }
                        //                     }
                        //                     >
                        //                         <DeleteForeverIcon />
                        //                     </IconButton>
                        //                 </>;
                        //             }
                        //         } as GridActionsColDef,
                        //     ]
                        //     : []),
                        // {
                        //     field: 'info', type: 'actions', headerName: t('Edit'), headerAlign: 'center', align: 'center', width: 80, renderCell: (cell) => {
                        //         return <>
                        //             <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {

                        //                 // setOfferItemName(cell.row.itemName)
                        //                 // setOfferItemDetailsId(cell.id as string)
                        //                 // handleClick(event);
                        //                 console.log('cell isOnlyEstimateInfo', cell)
                        //                 setEstimateTitle(cell.row.name as string)
                        //                 setEstimateId(cell.row.sharedEstimateId as string)
                        //                 setIsOnlyEstInfo(cell.row.isOnlyEstimateInfo)
                        //             }
                        //             }
                        //             >
                        //                 <EditOutlinedIcon />
                        //             </IconButton>
                        //         </>;
                        //     }
                        // }, // width: 600 },
                    ]}
                    rows={estimates ?? []}
                    disableRowSelectionOnClick
                    loading={progIndic}
                    getRowId={(row) => row._id}
                    onRowDoubleClick={(row) => {
                        setEstimateId(row.row.sharedEstimateId as string);
                        setEstimateTitle(row.row.name as string);
                    }}
                />

                {estimateId && estimateTitle && (
                    <EstimateOnlyForViewDialog
                        viewOnly={false}
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => {
                            setEstimateId(null);
                        }}
                        onConfirm={() => {
                            setDataRequested(false);
                        }}
                    />
                )}
            </>
        );
    }

    return null;
}
