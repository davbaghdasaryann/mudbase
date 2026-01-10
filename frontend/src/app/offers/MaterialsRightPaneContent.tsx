import React, { useCallback } from 'react';

import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import * as F from 'tsui/Form';
import * as Api from 'api';
import ProgressIndicator from '@/tsui/ProgressIndicator';
import { EstimateMaterialItemDisplayData } from '../../data/estimate_items_data';

import * as GD from '@/data/global_dispatch';

import { validateDoubleInteger, validatePositiveDoubleInteger, validatePositiveInteger } from '../../tslib/validate';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { normalizeArmenianDecimalPoint } from '../../tslib/parse';
import { formatCurrency } from '@/lib/format_currency';
import { confirmDialog } from '@/components/ConfirmationDialog';
import DataTableComponent from '@/components/DataTableComponent';
import { EstimateMaterialEditDialog } from '@/components/estimate/EstimateMaterialEditDialog';
import EstimatedItemPresentViewDialog from '@/components/estimate/EstimatedItemPresentViewDialog';


interface Props {
    estimatedLaborId: string;
    estimatedLaborName: string;
    onClose: () => void;
    onConfirm: () => void;

}

export function MaterialsRightPaneContent(props: Props) {
    const form = F.useUpdateForm();
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [t] = useTranslation();

    const [estimatedMaterialOfferViewId, setEstimatedMaterialOfferViewId] = React.useState<string | null>(null);
    const [estimatedMaterialOfferViewChangableItemName, setEstimatedMaterialOfferViewChangableItemName] = React.useState<string | null>(null);

    const [estimatedMaterialsData, setEstimatedMaterialsData] = React.useState<EstimateMaterialItemDisplayData[] | null>(null);
    let [estimatedMaterialId, setEstimatedMaterialId] = React.useState<string | null>(null);
    let estimatedMaterialIdRef = React.useRef<string | null>(null);
    let [estimatedMaterialDetailsId, setEstimatedMaterialDetailsId] = React.useState<string | null>(null);
    let [estimatedMaterialName, setEstimatedMaterialName] = React.useState<string | null>(null);

    const [progIndicator, setProgIndicator] = React.useState(false);

    React.useEffect(() => {
        const updateData = () => {
            setDataRequested(false);
        };

        GD.pubsub_.addListener(GD.estimateDataChangeId, updateData);

        return () => {
            GD.pubsub_.removeListener(GD.estimateDataChangeId, updateData);
        };
    }, []);


    const handleUpdateRow = useCallback(async (newRow, oldRow) => {

        // Prevent unnecessary updates when no changes were made
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
            // console.log("No changes detected, skipping update");
            return oldRow; // Return the old row without sending an update
        }

        if (!newRow || !newRow._id || !oldRow || !oldRow._id) {
            console.error("Invalid row data:", { newRow, oldRow });
            return oldRow; // Revert to oldRow if newRow is invalid
        }

        newRow.quantity = normalizeArmenianDecimalPoint(newRow.quantity)
        newRow.materialConsumptionNorm = normalizeArmenianDecimalPoint(newRow.materialConsumptionNorm)
        newRow.itemChangableAveragePrice = normalizeArmenianDecimalPoint(newRow.itemChangableAveragePrice)

        const isPositiveInteger: boolean = validateDoubleInteger(newRow.materialConsumptionNorm);
        // const isPositiveIntegerPrice: boolean = validatePositiveDoubleInteger(newRow.itemChangableAveragePrice);
        const isPositiveIntegerPrice: boolean = validateDoubleInteger(newRow.itemChangableAveragePrice);
        if ((newRow.materialConsumptionNorm && !isPositiveInteger) || (newRow.itemChangableAveragePrice && !isPositiveIntegerPrice)) {
            return oldRow;
        }

        // try {
        const response = await Api.requestSession<Api.ApiEstimateMaterialItem>({
            command: `estimate/update_material_item`,
            args: { estimatedMaterialId: oldRow._id, estimatedLaborId: props.estimatedLaborId },
            json: newRow
        });

        // console.log(" Successfully updated row:", response);
        props.onConfirm();
        setDataRequested(false)

        return { ...newRow }; //  Ensure a new object is returned
    }, []);


    const onRemove = React.useCallback(() => {
        // console.log('estimatedMaterialId', estimatedMaterialId)
        if (!estimatedMaterialIdRef.current)
            return


        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {

                Api.requestSession<any>({ //TODO change any to interface
                    command: 'estimate/remove_material_item',
                    args: {
                        estimateMaterialItemId: estimatedMaterialIdRef.current,
                    }
                })
                    .then((removedMaterial) => {
                        console.log(removedMaterial);
                        props.onConfirm();
                    })
                    .finally(() => {
                        setDataRequested(false);
                        setEstimatedMaterialId(null);
                        estimatedMaterialIdRef.current = null;
                        setEstimatedMaterialName(null);
                    });
            }
        });


    }, [])


    React.useEffect(() => {
        console.log('props.estimatedLaborName', props.estimatedLaborName)
        setProgIndicator(true)

        mounted.current = true;
        if (!dataRequested) {

            Api.requestSession<Api.ApiEstimateMaterialItem[]>({
                command: `estimate/fetch_material_items`,
                args: { estimatedLaborId: props.estimatedLaborId }
                // args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
            })
                .then(estimatedMaterialsResData => {
                    if (mounted.current) {
                        console.log('estimatedMaterialsResData', estimatedMaterialsResData)
                        let estimatedMaterialsData: EstimateMaterialItemDisplayData[] = [];

                        for (let estimatedMaterial of estimatedMaterialsResData) {
                            estimatedMaterialsData.push(new EstimateMaterialItemDisplayData(estimatedMaterial));
                        }

                        console.log('estimatedMaterialsData', estimatedMaterialsData)
                        setEstimatedMaterialsData(estimatedMaterialsData)
                    }
                    setProgIndicator(false)

                })


            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);


    if (progIndicator || !estimatedMaterialsData) {
        return <ProgressIndicator show={progIndicator} background='backdrop' />
    }

    return <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            p: 1,
        }}
    >
        {/* (Optional) A heading at the top of this pane:
          You can remove or replace with whatever you like. */}
        <Typography variant="h6" gutterBottom>
            {t("Edit Materials")}
        </Typography>

        {/* DataTable takes all remaining space */}
        <Box sx={{ flex: 1, overflow: "auto" }}>

            <DataTableComponent
                sx={{
                    width: '100%',
                    '& .editableCell': {
                        border: '1px solid #00BFFF	', // ✅ Blue border
                        borderRadius: '5px',
                        // backgroundColor: '#f8f9fa', // Light background
                        // transition: 'border 0.3s ease',
                    },
                    '& .editableCell:focus-within': {
                        // border: '2px solid darkOrange',
                    }
                }}
                columns={[
                    {
                        field: 'estimatedMaterialFullCode', headerName: 'ID', headerAlign: 'left', flex: 0.15, disableColumnMenu: true, renderCell: (params) => {
                            return (
                                <Button
                                    onClick={() => {
                                        console.log("🆔 Cell Value:", params.value);
                                        setEstimatedMaterialOfferViewId(params.row._id as string);
                                        setEstimatedMaterialOfferViewChangableItemName(params.row.materialOfferItemName as string);
                                    }}
                                >
                                    {params.value}
                                </Button>
                            );
                        }
                    },
                    { field: 'materialOfferItemName', headerName: t('Material'), headerAlign: 'left', editable: true, flex: 0.5, disableColumnMenu: true },
                    { field: 'estimatedMaterialMeasurementUnit', headerName: t('Unit'), headerAlign: 'left', flex: 0.1, disableColumnMenu: true },
                    { field: 'materialConsumptionNorm', headerName: t('Material consumption norm'), headerAlign: 'left', flex: 0.2, editable: true, cellClassName: 'editableCell', disableColumnMenu: true },
                    { field: 'quantity', headerName: t('Quantity'), headerAlign: 'left', flex: 0.15, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                    { field: 'changableAveragePrice', headerName: t('Price'), headerAlign: 'left', flex: 0.23, editable: true, cellClassName: 'editableCell', disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                    { field: 'materialTotalCost', headerName: t('Total Cost'), headerAlign: 'center', align: 'center', flex: 0.23, valueFormatter: (value) => formatCurrency(value) },


                    {
                        field: 'remove', type: 'actions', headerName: t('Remove'), flex: 0.15, renderCell: (cell) => {
                            return <>
                                <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {

                                    // setOfferItemDetailsId(cell.id as string)
                                    // handleClick(event);
                                    // console.log('material cell', cell)
                                    setEstimatedMaterialName(cell.row.materialOfferItemName as string)
                                    setEstimatedMaterialId(cell.row._id as string)
                                    estimatedMaterialIdRef.current = cell.row._id as string
                                    onRemove();
                                }
                                }
                                >
                                    <DeleteForeverIcon />
                                </IconButton>
                            </>;
                        }
                    }, // width: 600 },
                    {
                        field: 'info', type: 'actions', headerName: t('Edit'), flex: 0.1, renderCell: (cell) => {
                            return <>
                                {/* <IconButton onClick={() => setCompanyDetailsId(cell.id as string)}> */}
                                <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                    // setAccountDetailsId(cell.id as string)

                                    // console.log('esitmate cell', cell)
                                    // setEstimatedLaborItemName(cell.row.itemChangableName as string)
                                    // setEstimatedLaborItemDetailsId(cell.id as string)
                                    // handleClick(event);
                                    setEstimatedMaterialName(cell.row.materialOfferItemName as string)
                                    setEstimatedMaterialDetailsId(cell.row._id as string)

                                }
                                }
                                >
                                    <EditOutlinedIcon />
                                </IconButton>
                            </>;
                        }
                    }, // width: 600 },

                ]}
                rows={estimatedMaterialsData}
                // autoPageSize={true}
                processRowUpdate={handleUpdateRow} // Handle updates
                disableRowSelectionOnClick
                getRowId={row => row._id}
            // onRowDoubleClick={(row) => { setOfferItemEditId(row.id as string); setOfferItemName(row.row.itemName) }}
            />
        </Box>

        {(estimatedMaterialDetailsId && estimatedMaterialName) && 
            <EstimateMaterialEditDialog 
                estimatedLaborId={props.estimatedLaborId} 
                estimatedMaterialId={estimatedMaterialDetailsId} 
                estimatedMaterialName={estimatedMaterialName} 
                onConfirm={() => { 
                    props.onConfirm(); 
                    setDataRequested(false) 
                }} 
                onClose={() => { 
                    setEstimatedMaterialDetailsId(null); 
                    setEstimatedMaterialName(null);
                }}
            />
        }

        {(estimatedMaterialOfferViewId && estimatedMaterialOfferViewChangableItemName) &&
            <EstimatedItemPresentViewDialog
                itemType='material'
                changableItemCurrentName={estimatedMaterialOfferViewChangableItemName}
                itemId={estimatedMaterialOfferViewId}
                onClose={() => { 
                    setEstimatedMaterialOfferViewId(null); 
                    setEstimatedMaterialOfferViewChangableItemName(null);
                }}
            />
        }

    </Box>


}

