'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Box, Stack} from '@mui/system';
import {IconButton, Toolbar, Tooltip, Typography} from '@mui/material';

import {GridActionsCellItem, GridActionsColDef} from '@mui/x-data-grid';

import * as Api from 'api';
import * as EstimatesSharesApi from '@/api/estimates_shares';

import EstimateShareToAccountSelectionDialog from '../../components/estimates_shares/EstimateShareToAccount';
import {SharedEstimatesDisplayData} from '../../data/shared_estimates_display_data';
import EstimateOnlyForViewDialog from './EstimateOnlyForViewDialog';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {useTranslation} from 'react-i18next';
import {usePermissions} from '../../api/auth';
import SearchComponent from '../../components/SearchComponent';
import DataTableComponent from '@/components/DataTableComponent';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import {useApiFetchMany} from '../../components/ApiDataFetch';
import {confirmDialog} from '../../components/ConfirmationDialog';
import {PageSelect} from '../../tsui/PageSelect';
import {formatCurrency, formatCurrencyRoundedSymbol} from '@/lib/format_currency';
import {EstimateRootAccordion, EstimateRootAccordionDetails, EstimateRootAccordionSummary} from '@/components/AccordionComponent';
import ProgressIndicator from '@/tsui/ProgressIndicator';


interface SelectedFiltersDataProps {
    // categoryId: string | null;
    // subcategoryId: string | null;
    accountId: string | null;
}

// ✅ Define Interface
interface AccordionShareItem {
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
    children?: AccordionShareItem[]; // Holds nested children
}


export default function AccountSharedEstimatesByMeTab() {
    const {session, status, permissionsSet} = usePermissions();
    const [t] = useTranslation();

    // const showShareColumn = permissionsSet?.has?.('EST_CRT_BY_BNK') || permissionsSet?.has?.('EST_CRT_BY_DEV');

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);
    const [bigProgIndic, setBigProgIndic] = useState(false);

    const [searchVal, setSearchVal] = useState('');
    const [sharedEstimates, setSharedEstimates] = useState<SharedEstimatesDisplayData[] | null>(null);

    const [estimateId, setEstimateId] = useState<string | null>(null);
    const [estimateIdForShare, setEstimateIdForShare] = useState<string | null>(null);

    const [estimateTitle, setEstimateTitle] = useState<string | null>(null);
    const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

    const [selectedAccountFilter, setSelectedAccountFilter] = React.useState<string | null>('All');
    const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>('all');

    const selectedFiltersDataRef = React.useRef<SelectedFiltersDataProps>({
        // categoryId: null,
        // subcategoryId: null,
        accountId: null,
    });

    const accountsSelectList = useApiFetchMany<Api.ApiAccount>({
        api: {
            command: 'accounts/with_estimates_shared_by_me',
        },
    });

    useEffect(() => {
        setProgIndic(true);

        mounted.current = true;
        if (!dataRequested) {
            Api.requestSession<EstimatesSharesApi.ApiEstimatesShares[]>({
                command: `estimates_shared_by_me/fetch`,
                args: {searchVal: searchVal === '' ? 'empty' : searchVal},
                json: selectedFiltersDataRef.current,
            }).then((estimatesResData) => {
                if (mounted.current) {
                    console.log('estimatesResData', estimatesResData);

                    // console.log('labor categories: ', d)
                    let estimatesData: SharedEstimatesDisplayData[] = [];

                    for (let estimate of estimatesResData) {
                        let ed = new SharedEstimatesDisplayData(estimate);

                        // Find estimate with the estimate number
                        let root = estimatesData.find((value) => value.estimateNumber === ed.estimateNumber);
                        if (!root) {
                            estimatesData.push(ed);
                            root = estimatesData.find((value) => value.estimateNumber === ed.estimateNumber)!;
                            root.children = [];
                        }

                        root.children?.push(ed);

                        // estimatesData.push(new SharedEstimatesDisplayData(estimate));
                    }

                    // Do post processing
                    for (let estimate of estimatesData) {
                        estimate.theSameEstNumAveragePrice = estimate.childrenAverageTotalCostWithOtherExpenses();
                    }

                    setSharedEstimates(estimatesData);
                    // setSharedEstimatesItems(estimatesData);
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

    // const refreshDuplicatedEstimatesData = async () => {
    //     if (!sharedEstimates || sharedEstimates.length === 0) return;

    //     const updatedItems = await Promise.all(
    //         sharedEstimates.map(async (item) => {
    //             if (expandedAccordions.includes(item._id)) {
    //                 // Optionally mark as loading
    //                 setSharedEstimates((prev) => updateNestedChildren(prev, item._id, undefined, true));

    //                 const fetchedData = await fetchData(item._id, 2, searchVal);

    //                 // Map the fetched data to an array of AccardionItem objects,
    //                 // including all required properties
    //                 const newChildren = fetchedData.map(
    //                     (dataItem: any): AccordionShareItem => ({
    //                         _id: dataItem._id,
    //                         name: dataItem.name,
    //                         children: [],
    //                         isLoading: false,
    //                         totalCost: roundNumber(dataItem.totalCost ?? 0),
    //                         totalCostWithOtherExpenses: roundNumber(dataItem.totalCostWithOtherExpenses ?? 0),
    //                         estimateNumber: dataItem.estimateNumber,
    //                         companyName: dataItem.companyName,
    //                         isOnlyEstimateInfo: dataItem.isOnlyEstimateInfo,
    //                         theSameEstNumAveragePrice: dataItem.theSameEstNumAveragePrice,
    //                         sharedAt: dataItem.sharedAt,
    //                         sharedEstimateId: dataItem.sharedEstimateId,
    //                         // Ensure these required fields are present:
    //                         createdAt: dataItem.createdAt ?? new Date(), // fallback to current date if missing
    //                         sharedByAccountName: dataItem.sharedByAccountName ?? '', // fallback to empty string if missing
    //                     })
    //                 );

    //                 return {...item, children: newChildren, isLoading: false};
    //             }
    //             return item;
    //         })
    //     );

    //     setSharedEstimates(updatedItems);
    // };

    // const fetchChildren = async (parentId: string, level: number) => {
    //     setSharedEstimates((prevItems) => updateNestedChildren(prevItems, parentId, undefined, true));

    //     const fetchedData = await fetchData(parentId, level, searchVal);

    //     const newData: AccordionShareItem[] = [] as AccordionShareItem[];
    //     // console.log('fetchedData', fetchedData);
    //     fetchedData.forEach((item) => {
    //         let itemArr: AccordionShareItem = {} as AccordionShareItem;
    //         itemArr._id = item._id;
    //         itemArr.name = item.name;
    //         itemArr.children = [];
    //         itemArr.isLoading = false;
    //         itemArr.totalCost = roundNumber(item.totalCost ?? 0);
    //         itemArr.totalCostWithOtherExpenses = roundNumber(item.totalCostWithOtherExpenses ?? 0);
    //         itemArr.estimateNumber = item.estimateNumber;
    //         itemArr.companyName = item.companyName;
    //         itemArr.isOnlyEstimateInfo = item.isOnlyEstimateInfo;
    //         itemArr.theSameEstNumAveragePrice = item.theSameEstNumAveragePrice;

    //         newData.push(itemArr);
    //     });

    //     // console.log('newData', newData);
    //     setSharedEstimates((prevItems) => updateNestedChildren(prevItems, parentId, newData, false));
    // };

    const onSearch = useCallback((value: string) => {
        setSearchVal(value);
        setDataRequested(false);
    }, []);

    const onRemoveEstimateShare = useCallback((shareId: string, estimateId: string) => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                setBigProgIndic(true);

                Api.requestSession<any>({
                    command: 'estimates_shares/delete_share_by_me',
                    args: {
                        shareId: shareId,
                        estimateId: estimateId,
                    },
                })
                    .then((deletedEst) => {
                        // setSharedEstimates((prev) => removeChildFromParent(prev, parentId, sharedDuplicatedEstimateId));
                    })
                    .finally(() => {
                        setProgIndic(false);
                        setBigProgIndic(false);
                        setDataRequested(false);
                    });
            }
        });
    }, []);

    const onRemoveEstimateShareByNumber = useCallback((estimateNumber: string) => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                setBigProgIndic(true);

                Api.requestSession<any>({
                    command: 'estimates_shares/delete_share_by_me_group',
                    args: {
                        estimateNumber: estimateNumber,
                    },
                })
                    .then((deletedEst) => {
                        // setSharedEstimates((prev) => removeChildFromParent(prev, parentId, sharedDuplicatedEstimateId));
                    })
                    .finally(() => {
                        setProgIndic(false);
                        setBigProgIndic(false);
                        setDataRequested(false);
                    });
            }
        });
    }, []);

    // const onRemoveSharedDuplicateEstimate = useCallback((parentId: string, sharedDuplicatedEstimateId: string) => {
    //     if (!sharedDuplicatedEstimateId) return;

    //     console.log('sharedDuplicatedEstimateId', sharedDuplicatedEstimateId);
    //     // return
    //     confirmDialog(t('Are you sure?')).then((result) => {
    //         if (result.isConfirmed) {
    //             setProgIndic(true);
    //             Api.requestSession<any>({
    //                 command: 'estimates_shares/delete_duplicate',
    //                 args: {
    //                     sharedDuplicatedEstimateId: sharedDuplicatedEstimateId,
    //                 },
    //             })
    //                 .then((deletedEst) => {
    //                     setSharedEstimates((prev) => removeChildFromParent(prev, parentId, sharedDuplicatedEstimateId));
    //                 })
    //                 .finally(() => {
    //                     setProgIndic(false);
    //                 });
    //         }
    //     });
    // }, []);

    // const onRemoveSharedEstimateFromCommonTable = useCallback((sharedEstimateMongoId: string) => {
    //     if (!sharedEstimateMongoId) return;

    //     // console.log('sharedDuplicatedEstimateId', sharedEstimateMongoId);
    //     // return
    //     confirmDialog(t('Are you sure?')).then((result) => {
    //         if (result.isConfirmed) {
    //             setProgIndic(true);
    //             Api.requestSession<any>({
    //                 command: 'estimates_shares/delete_from_common_table',
    //                 args: {
    //                     sharedEstimateMongoId: sharedEstimateMongoId,
    //                 },
    //             })
    //                 .then((deletedEst) => {
    //                     // console.log(removedMaterial);
    //                     // props.onConfirm();
    //                     setDataRequested(false);
    //                 })
    //                 .finally(() => {
    //                     setProgIndic(false);
    //                 });
    //         }
    //     });
    // }, []);

    // const onRemoveSharedMainAccordionEstimate = useCallback((sharedEstimateId: string) => {
    //     if (!sharedEstimateId) return;

    //     confirmDialog(t('Are you sure?')).then((result) => {
    //         if (result.isConfirmed) {
    //             setProgIndic(true);
    //             Api.requestSession<any>({
    //                 command: 'estimates_shares/delete_parent',
    //                 args: {
    //                     sharedEstimateId: sharedEstimateId,
    //                 },
    //             })
    //                 .then((deletedEst) => {
    //                     // console.log(removedMaterial);
    //                     // props.onConfirm();
    //                     setDataRequested(false);
    //                 })
    //                 .finally(() => {
    //                     setProgIndic(false);
    //                 });
    //         }
    //     });
    // }, []);

    if (!sharedEstimates) return null;

    return (
        <>
            <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                <SearchComponent onSearch={onSearch} />
                {/* <SpacerComponent /> */}

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

            <Stack spacing={0}>
                {sharedEstimates.map((estimateShare) => (
                    <EstimateRootAccordion
                        key={estimateShare._id}
                        expanded={expandedAccordions.includes(estimateShare._id)}
                        onChange={(event, isExpanded) => {
                            // setExpandedAccordions((prev) => [...prev, item._id])
                            // fetchChildren(item._id, 2)
                            if (isExpanded) {
                                setExpandedAccordions((prev) => [...prev, estimateShare._id]);
                                // fetchChildren(item._id, 2);
                            } else {
                                setExpandedAccordions((prev) => prev.filter((id) => id !== estimateShare._id));
                            }
                        }}
                    >
                        <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction='row' justifyContent='space-between' alignItems='center' width='100%'>
                                <Typography>{estimateShare.name}</Typography>
                                <Box flex={2}>&nbsp;</Box>

                                <Tooltip title={t('Average price')} arrow placement='top'>
                                    <Typography component='span' sx={{fontWeight: 'bold', whiteSpace: 'nowrap'}}>
                                        {formatCurrencyRoundedSymbol(estimateShare.theSameEstNumAveragePrice)}
                                    </Typography>
                                </Tooltip>


                                {session?.user && permissionsSet?.has?.('EST_MULT_SHRD_DEL') && (
                                    <IconButton
                                        component='div'
                                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                                            event.stopPropagation();
                                            //onRemoveSharedMainAccordionEstimate(estimateShare.sharedEstimateId);
                                            onRemoveEstimateShareByNumber(estimateShare.estimateNumber);
                                        }}
                                    >
                                        <DeleteForeverIcon />
                                    </IconButton>
                                )}

                                {/* <IconButton
                                    component='div'
                                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                                        event.stopPropagation();
                                        console.log('item', item);
                                        setEstimateTitle(item.name as string);
                                        setEstimateId(item.sharedEstimateId as string);
                                        setEstimateTotalCost(item.totalCost);
                                    }}
                                >
                                    <VisibilityIcon />
                                </IconButton> */}

                                {/* </Stack> */}
                            </Stack>
                        </EstimateRootAccordionSummary>

                        <EstimateRootAccordionDetails>
                            <DataTableComponent
                                sx={{
                                    width: '100%',
                                    // color: "red"
                                }}
                                columns={[
                                    {field: 'estimateNumber', headerName: 'ID', flex: 0.2},
                                    {field: 'sharedWithAccountName', headerName: t('Company'), flex: 0.6},
                                    {
                                        field: 'totalCostWithOtherExpenses',
                                        headerName: t('Cost'),
                                        align: 'center',
                                        flex: 0.5,
                                        valueFormatter: (value) => formatCurrency(value),
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
                                                                  onClick={(event) => {
                                                                      onRemoveEstimateShare(cell.row._id, cell.row.sharedEstimateId);
                                                                      // console.log('cell.row', cell.row)
                                                                      //   onRemoveSharedDuplicateEstimate(item._id, cell.row._id);
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
                                        headerName: t('View'),
                                        align: 'center',
                                        flex: 0.2,
                                        renderCell: (cell) => {
                                            return (
                                                <>
                                                    <IconButton
                                                        onClick={(event) => {
                                                            // console.log('cell', cell);

                                                            setEstimateTitle(cell.row.name as string);
                                                            setEstimateId(cell.row.sharedEstimateId as string);
                                                            // setEstimateTotalCost(cell.row.totalCost);
                                                        }}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </>
                                            );
                                        },
                                    }, // width: 600 },
                                ]}
                                rows={estimateShare.children ?? []}
                                disableRowSelectionOnClick
                                loading={progIndic}
                                getRowId={(row) => row._id}
                                onRowDoubleClick={(row) => {
                                    setEstimateId(row.row.sharedEstimateId as string);
                                    setEstimateTitle(row.row.name as string);
                                }}
                            />
                        </EstimateRootAccordionDetails>
                    </EstimateRootAccordion>
                ))}

                {estimateIdForShare && estimateTitle && (
                    <EstimateShareToAccountSelectionDialog
                        calledFromPage='sharedEstimates'
                        estimateId={estimateIdForShare}
                        title={estimateTitle}
                        onClose={() => {
                            setEstimateIdForShare(null);
                            setEstimateTitle(null);
                        }}
                        onConfirm={() => {
                            // refreshDuplicatedEstimatesData();
                            setDataRequested(false);
                        }}
                    />
                )}

                {estimateId && estimateTitle && (
                    <EstimateOnlyForViewDialog
                        estimateId={estimateId}
                        estimateTitle={estimateTitle}
                        onClose={() => setEstimateId(null)}
                        onConfirm={() => setDataRequested(false)}
                    />
                )}
            </Stack>

            <ProgressIndicator show={bigProgIndic} background='backdrop' />
        </>
    );
}
