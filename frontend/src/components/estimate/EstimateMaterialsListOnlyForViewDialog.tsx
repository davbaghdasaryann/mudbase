import React from 'react';

import { useTranslation } from 'react-i18next';

import * as F from 'tsui/Form';
import * as Api from 'api';
import { Button } from '@mui/material';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import { EstimateMaterialItemDisplayData } from '../../data/estimate_items_data';

import DataTableComponent from '../DataTableComponent';
import { validateDoubleInteger } from '../../tslib/validate';
import EstimatedItemPresentViewDialog from './EstimatedItemPresentViewDialog';
import { usePermissions } from '../../api/auth';
import { normalizeArmenianDecimalPoint } from '../../tslib/parse';
import { formatCurrency } from '@/lib/format_currency';


interface Props {
    estimatedLaborId: string;
    estimatedLaborName: string;
    onClose: () => void;
    onConfirm: () => void;

}

export function EstimateMaterialsListOnlyForViewDialog(props: Props) {
    const { session, permissionsSet } = usePermissions();

    const form = F.useUpdateForm();
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);

    const [estimatedMaterialOfferViewId, setEstimatedMaterialOfferViewId] = React.useState<string | null>(null);
    const [estimatedMaterialOfferViewChangableItemName, setEstimatedMaterialOfferViewChangableItemName] = React.useState<string | null>(null);

    const [estimatedMaterialsData, setEstimatedMaterialsData] = React.useState<EstimateMaterialItemDisplayData[] | null>(null);

    const [progIndicator, setProgIndicator] = React.useState(false);
    const [t] = useTranslation();

    const handleUpdateRow = async (newRow, oldRow) => {

        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
            console.log("No changes detected, skipping update");
            return oldRow; // Return the old row without sending an update
        }

        if (!newRow || !newRow._id || !oldRow || !oldRow._id) {
            console.error("Invalid row data:", { newRow, oldRow });
            return oldRow; // Revert to oldRow if newRow is invalid
        }

        newRow.quantity = normalizeArmenianDecimalPoint(newRow.quantity)
        newRow.materialConsumptionNorm = normalizeArmenianDecimalPoint(newRow.materialConsumptionNorm)
        newRow.itemChangableAveragePrice = normalizeArmenianDecimalPoint(newRow.itemChangableAveragePrice)

        // const isPositiveInteger: boolean = validatePositiveDoubleInteger(newRow.quantity);
        const isPositiveInteger: boolean = validateDoubleInteger(newRow.quantity);
        // const isPositiveIntegerPrice: boolean = validatePositiveDoubleInteger(newRow.itemChangableAveragePrice);
        const isPositiveIntegerPrice: boolean = validateDoubleInteger(newRow.itemChangableAveragePrice);
        if ((newRow.quantity && !isPositiveInteger) || (newRow.itemChangableAveragePrice && !isPositiveIntegerPrice)) {
            return oldRow;
        }

        const response = await Api.requestSession<Api.ApiEstimateMaterialItem>({
            command: `estimate/update_material_item`,
            args: { estimatedMaterialId: oldRow._id, estimatedLaborId: props.estimatedLaborId },
            json: newRow
        });

        console.log(" Successfully updated row:", response);
        props.onConfirm();
        setDataRequested(false)


        return { ...newRow }; //  Ensure a new object is returned
    };





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


    return <F.PageFormDialog title={`${t('Materials:')} ${props.estimatedLaborName}`} type='panel' form={form} size='lg' onClose={props.onClose}>

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
                // { field: 'estimatedMaterialFullCode', headerName: 'ID', headerAlign: 'left', flex: 0.15, disableColumnMenu: true },
                { field: 'materialOfferItemName', headerName: t('Material'), headerAlign: 'left', flex: 0.5, disableColumnMenu: true },
                { field: 'estimatedMaterialMeasurementUnit', headerName: t('Unit'), headerAlign: 'left', flex: 0.1, disableColumnMenu: true },
                { field: 'materialConsumptionNorm', headerName: t('Material consumption norm'), headerAlign: 'left', flex: 0.2, editable: session?.user && permissionsSet?.has?.('EST_EDT_MTRL_QTY'), cellClassName: session?.user && permissionsSet?.has?.('EST_EDT_MTRL_QTY') ? 'editableCell' : '', disableColumnMenu: true },
                { field: 'quantity', headerName: t('Quantity'), headerAlign: 'left', flex: 0.15, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                { field: 'changableAveragePrice', headerName: t('Average Price'), headerAlign: 'left', flex: 0.23, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                { field: 'materialTotalCost', headerName: t('Total Cost'), headerAlign: 'center', align: 'center', flex: 0.23, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                // {
                //     field: 'updateDate', type: 'dateTime', headerName: 'Date', headerAlign: 'center', align: 'center', width: 200, valueFormatter: (params: any) =>
                //         moment(params).format('DD.MM.YYYY HH:mm')
                // },
                // {
                //     field: 'remove', type: 'actions', headerName: 'Remove', width: 80, renderCell: (cell) => {
                //         return <>
                //             <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {

                //                 // setOfferItemDetailsId(cell.id as string)
                //                 // handleClick(event);
                //                 // console.log('material cell', cell)
                //                 setEstimatedMaterialName(cell.row.materialOfferItemName as string)
                //                 setEstimatedMaterialId(cell.id as string)
                //                 estimatedMaterialIdRef.current = cell.id as string
                //             }
                //             }
                //             >
                //                 <DeleteForeverIcon />
                //             </IconButton>
                //         </>;
                //     }
                // }, // width: 600 },
                // {
                //     field: 'info', type: 'actions', headerName: 'Details', width: 80, renderCell: (cell) => {
                //         return <>
                //             {/* <IconButton onClick={() => setCompanyDetailsId(cell.id as string)}> */}
                //             <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                //                 // setAccountDetailsId(cell.id as string)

                //                 // console.log('esitmate cell', cell)
                //                 // setEstimatedLaborItemName(cell.row.itemChangableName as string)
                //                 // setEstimatedLaborItemDetailsId(cell.id as string)
                //                 // handleClick(event);
                //                 setEstimatedMaterialName(cell.row.materialOfferItemName as string)
                //                 setEstimatedMaterialDetailsId(cell.id as string)

                //             }
                //             }
                //             >
                //                 <MoreVertIcon />
                //             </IconButton>
                //         </>;
                //     }
                // }, // width: 600 },

            ]}
            rows={estimatedMaterialsData}
            // autoPageSize={true}
            processRowUpdate={handleUpdateRow} // Handle updates
            disableRowSelectionOnClick
            getRowId={row => row._id}
        // onRowDoubleClick={(row) => { setOfferItemEditId(row.id as string); setOfferItemName(row.row.itemName) }}
        />

        {(estimatedMaterialOfferViewId && estimatedMaterialOfferViewChangableItemName)
            &&
            <EstimatedItemPresentViewDialog
                itemType='material'
                changableItemCurrentName={estimatedMaterialOfferViewChangableItemName}
                itemId={estimatedMaterialOfferViewId}
                onClose={() => { setEstimatedMaterialOfferViewId(null); setEstimatedMaterialOfferViewChangableItemName(null) }}
            />
        }

        {/* {(estimatedMaterialId && estimatedMaterialName) && <EstimateMaterialDeleteDialog title={props.estimatedLaborName} message='Are you sure you want to remove this?' onConfirm={onRemoveConfirm} onClose={() => { setEstimatedMaterialId(null); setEstimatedMaterialName(null); estimatedMaterialIdRef.current = null }} />}
        {(estimatedMaterialDetailsId && estimatedMaterialName) && <EstimateMaterialEditDialog estimatedMaterialId={estimatedMaterialDetailsId} estimatedMaterialName={estimatedMaterialName} onConfirm={()=> {props.onConfirm(); setDataRequested(false)}} onClose={()=> {setEstimatedMaterialDetailsId(null); setEstimatedMaterialName(null)}}/>} */}
    </F.PageFormDialog>


}

