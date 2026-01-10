import React from "react";
import { Button, IconButton } from "@mui/material";

import { useTranslation } from "react-i18next";


import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';


import * as F from 'tsui/Form';
import * as Api from 'api';
import * as OffersApi from 'api/estimateOffer'
import moment from "moment";
import { EstimateLaborOfferDisplayData, EstimateMaterialOfferDisplayData } from "../../data/estimate_offer_display_data";
import EstimateAddItemFromOffersDialog from "../../components/estimate/EstimateAddItemFromOffersDialog";
import DataTableComponent from "@/components/DataTableComponent";
import { fixedToThree } from "../../tslib/parse";
import { formatCurrency } from "@/lib/format_currency";


interface Props {
    onClose: () => void;
    offerItemMongoIdForEstimation: string;
    offerItemNameForEstimation: string;
    catalogType: 'labor' | 'material'
    estimateSubsectionId?: string | null;

    estimatedLaborId?: string | null;
    offerItemMeasurementUnitMongoId: string;

    onConfirm: () => void;

}


export default function UserPageAddEstimationItemDetailsDialog(props: Props) {
    // const form = F.useUpdateForm();
    const form = F.useForm({ type: 'input' });
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [progIndic, setProgIndic] = React.useState(false)
    const [openWithoutOffersDialog, setOpenWithoutOffersDialog] = React.useState(false)
    const [offers, setOffers] = React.useState<EstimateLaborOfferDisplayData[] | EstimateMaterialOfferDisplayData[] | null>(null);

    const [offerDetailsId, setOfferDetailsId] = React.useState<string | null>(null);
    const [openAddMaterialWithoutCurrentPrice, setOpenAddMaterialWithoutCurrentPrice] = React.useState(false);
    const [currentMaterialOfferPrice, setCurrentMaterialOfferPrice] = React.useState<number | null>(null);
    // const [itemId, setItemId] = React.useState<string | null>(null);
    const [t] = useTranslation()

    const averagePriceRef = React.useRef<string>('')


    React.useEffect(() => {
        setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {

            if (props.catalogType === 'labor') {
                Api.requestSession<OffersApi.ApiMainEstimateLaborOffer[]>({
                    command: `estimate/fetch_labor_offers`,
                    args: { laborItemId: props.offerItemMongoIdForEstimation }
                })
                    .then(laborOffersResData => {
                        if (mounted.current) {
                            if (laborOffersResData.length === 0) {
                                setOpenWithoutOffersDialog(true)
                                return
                            }
                            console.log(laborOffersResData)
                            let laborOffersData: EstimateLaborOfferDisplayData[] = [];

                            if (laborOffersResData[0].offers) {

                                for (let laborOffer of laborOffersResData[0].offers) {

                                    laborOffersData.push(new EstimateLaborOfferDisplayData(laborOffer));

                                }
                            }

                            setOffers(laborOffersData)
                            if (laborOffersResData[0].averagePrice) {
                                {
                                    // averagePriceRef.current = (laborOffersResData[0].averagePrice).toFixed(0)
                                    averagePriceRef.current = fixedToThree(laborOffersResData[0].averagePrice)
                                }
                            }
                        }
                        setProgIndic(false)

                    })
            } else if (props.catalogType === 'material') {
                Api.requestSession<OffersApi.ApiMainEstimateMaterialOffer[]>({
                    command: `estimate/fetch_material_offers`,
                    args: {
                        materialItemId: props.offerItemMongoIdForEstimation,
                    }
                })
                    .then(materialOffersResData => {
                        if (mounted.current) {
                            if (materialOffersResData.length === 0) {
                                setOpenWithoutOffersDialog(true)
                                return
                            }
                            // console.log('response', response)
                            console.log('materialOffersResData', materialOffersResData)
                            let materialOffersData: EstimateMaterialOfferDisplayData[] = [];

                            if (materialOffersResData[0].offers) {

                                for (let materialOffer of materialOffersResData[0].offers) {

                                    materialOffersData.push(new EstimateMaterialOfferDisplayData(materialOffer));

                                }
                            }

                            setOffers(materialOffersData)
                            if (materialOffersResData[0].averagePrice) {
                                {
                                    // averagePriceRef.current = (materialOffersResData[0].averagePrice).toFixed(0)
                                    averagePriceRef.current = fixedToThree(materialOffersResData[0].averagePrice)
                                }
                            }
                        }
                        setProgIndic(false)

                    })
            }
            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);




    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (props.catalogType === 'material') {
            setOpenAddMaterialWithoutCurrentPrice(true);
        } else {
            props.onClose();
        }
    }, []);


    if (!offers) {
        return <>
            {openWithoutOffersDialog && <EstimateAddItemFromOffersDialog currentMaterialOfferPrice={null}
                onConfirm={props.onConfirm}
                offerItemNameForEstimation={props.offerItemNameForEstimation}
                averagePrice={parseInt(averagePriceRef.current)}
                offerItemMeasurementUnitMongoId={props.offerItemMeasurementUnitMongoId}
                estimatedLaborId={props.estimatedLaborId}
                estimateItemId={props.offerItemMongoIdForEstimation}
                estimateOfferItemType={props.catalogType}
                estimateOfferId={offerDetailsId}
                estimateSubsectionId={props.estimateSubsectionId}
                onClose={() => { setOpenWithoutOffersDialog(false); props.onClose() }} />}
        </>
    }


    return <>
        <F.PageFormDialog ignoreDataChecking title={props.offerItemNameForEstimation} form={form} size='xl' onSubmit={onSubmit} onClose={props.onClose}>
            {(offers && props.catalogType === 'labor') &&

                <DataTableComponent
                    sx={{
                        width: '100%',
                        // color: "red"
                    }}
                    columns={[
                        // { field: 'itemFullCode', headerName: 'ID', headerAlign: 'left', width: 80 },
                        // { field: 'itemName', headerName: 'Name', headerAlign: 'left', flex: 1 },
                        { field: 'accountName', headerName: t('Company'), headerAlign: 'left', flex: 0.6, disableColumnMenu: true },
                        { field: 'laborHours', headerName: t('Work per hour'), headerAlign: 'left', width: 150 }, //🔴 TODO: this will need us in version 2 🔴
                        { field: 'measurementUnitRepresentationSymbol', headerName: t('Measurement Unit'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true },
                        { field: 'price', headerName: `${t('Price (Average Price')}: ${averagePriceRef.current})`, headerAlign: 'left', flex: 0.3, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                        {
                            field: 'updatedAt', type: 'dateTime', headerName: t('Date'), headerAlign: 'center', align: 'center', flex: 0.3, valueFormatter: (params: any) =>
                                moment(params).format('DD.MM.YYYY HH:mm'),
                            disableColumnMenu: true
                        },
                        {
                            field: 'info', type: 'actions', headerName: '', flex: 0.2, renderCell: (cell) => {
                                return <>
                                    <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {

                                        // setOfferItemName(cell.row.itemName)
                                        console.log('cellcell', cell)
                                        // setItemId(cell.row.itemId as string)
                                        setOfferDetailsId(cell.row._id as string)
                                        // handleClick(event);

                                    }
                                    }
                                    >
                                        <AddToPhotosIcon />
                                    </IconButton>
                                </>;
                            }
                        }, // width: 600 },
                    ]}
                    rows={offers as EstimateLaborOfferDisplayData[]}
                    // autoPageSize={true}
                    disableRowSelectionOnClick
                    getRowId={row => row._id}
                // onRowDoubleClick={(row) => { setOfferItemEditId(row.id as string); setOfferItemName(row.row.itemName) }}
                />


            }

            {(offers && props.catalogType === 'material') &&

                <DataTableComponent
                    sx={{
                        width: '100%',
                        // color: "red"
                    }}
                    columns={[
                        { field: 'accountName', headerName: t('Company'), headerAlign: 'left', flex: 0.6, disableColumnMenu: true },
                        { field: 'measurementUnitRepresentationSymbol', headerName: t('Measurement Unit'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true },
                        { field: 'price', headerName: `${t('Price (Average Price')}: ${averagePriceRef.current})`, headerAlign: 'left', flex: 0.3, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                        {
                            field: 'updatedAt', type: 'dateTime', headerName: t('Date'), headerAlign: 'center', align: 'center', flex: 0.3, valueFormatter: (params: any) =>
                                moment(params).format('DD.MM.YYYY HH:mm'),
                            disableColumnMenu: true
                        },
                        {
                            field: 'info', type: 'actions', headerName: '', flex: 0.3, renderCell: (cell) => {
                                return <>
                                    <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {

                                        // setOfferItemName(cell.row.itemName)
                                        console.log('cellcell', cell)
                                        // setItemId(cell.row.itemId as string)
                                        setCurrentMaterialOfferPrice(cell.row.price);
                                        setOfferDetailsId(cell.row._id as string)
                                        // handleClick(event);

                                    }
                                    }
                                    >
                                        <AddToPhotosIcon />
                                    </IconButton>
                                </>;
                            }
                        }, // width: 600 },
                    ]}
                    rows={offers as EstimateMaterialOfferDisplayData[]}
                    // autoPageSize={true}
                    disableRowSelectionOnClick
                    getRowId={row => row._id}
                // onRowDoubleClick={(row) => { setOfferItemEditId(row.id as string); setOfferItemName(row.row.itemName) }}
                />
            }
            {/* <F.InputText maxLength={50} label='Price' id='price' required form={form} xsMax /> */}

        </F.PageFormDialog>
        {((offerDetailsId || openAddMaterialWithoutCurrentPrice) && props.offerItemMongoIdForEstimation) &&
            <EstimateAddItemFromOffersDialog
                currentMaterialOfferPrice={currentMaterialOfferPrice}
                onConfirm={() => {
                    props.onConfirm()

                    if (props.catalogType === 'material') {
                        props.onClose()
                    }

                    setOfferDetailsId(null)
                    setOpenAddMaterialWithoutCurrentPrice(false)
                }}
                offerItemNameForEstimation={props.offerItemNameForEstimation}
                averagePrice={parseInt(averagePriceRef.current)}
                offerItemMeasurementUnitMongoId={props.offerItemMeasurementUnitMongoId}
                estimatedLaborId={props.estimatedLaborId}
                estimateItemId={props.offerItemMongoIdForEstimation}
                estimateOfferItemType={props.catalogType}
                estimateOfferId={offerDetailsId}
                estimateSubsectionId={props.estimateSubsectionId}
                onClose={() => { setOfferDetailsId(null); setOpenAddMaterialWithoutCurrentPrice(false) }} />
        }
    </>
}
