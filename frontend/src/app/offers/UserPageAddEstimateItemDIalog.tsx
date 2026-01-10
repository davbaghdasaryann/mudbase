import React from "react";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { Box, DialogContent, DialogTitle, InputBase } from "@mui/material";
import { LaborItemDisplayData } from "../../data/labor_display_data";
import { MaterialItemDisplayData } from "../../data/material_display_data";

import * as Api from 'api';
import * as LaborsApi from 'api/labor'
import DirectionsIcon from '@mui/icons-material/Directions';
import * as MaterialsApi from 'api/material'
import UserPageAddOfferDetailsDialog from "./UserPageAddOfferDetailsDIalog";
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import UserPageAddEstimationItemDetailsDialog from "./UserPageAddEstimationItemDetailsDIalog";
import EstimateAddItemFromOffersDialog from "../../components/estimate/EstimateAddItemFromOffersDialog";
import ProgressIndicator from "../../tsui/ProgressIndicator";
import EstimateCatalogAccordion from "../../components/pages/EstimateCatalogAccordion";
import DataTableComponent from "@/components/DataTableComponent";
import { t } from "i18next";
import { formatCurrency } from "@/lib/format_currency";


interface Props {
    onClose: () => void;
    offerType: 'labor' | 'material';
    isEstimation: boolean;
    estimateSubsectionId?: string | null;
    estimateSectionId?: string | null;

    estimatedLaborId?: string | null;

    onConfirm: () => void;

}



export default function UserPageAddEstimateItemDialog(props: Props) {

    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(true);
    const [progIndic, setProgIndic] = React.useState(false)
    const [searchVal, setSearchVal] = React.useState('');
    const [offerList, setOfferList] = React.useState<LaborItemDisplayData[] | MaterialItemDisplayData[] | null>(null);
    const [offerItemId, setOfferItemId] = React.useState<string | null>(null);
    const [averagePrice, setAveragePrice] = React.useState<number | null>(null);
    const [laborHours, setLaborHours] = React.useState<number | null>(null); //🔴 TODO: this will need us in version 2 🔴
    let [offerItemName, setOfferItemName] = React.useState<string | null>(null);
    let [offerItemMeasurementUnitMongoId, setOfferItemMeasurementUnitMongoId] = React.useState<string | null>(null);

    const [open, setOpen] = React.useState(true);

    console.log('props', props)




    const handleClose = () => {
        setOpen(false);
        props.onClose();
    };


    const searchTextSubmit = React.useCallback((e) => {
        setDataRequested(false)
    }, [])

    const searchTextChange = React.useCallback((e) => {
        setSearchVal(e.target.value)
        if (e.target.value === '') {
            setOfferList(null)
            // setDataRequested(false)
        }
    }, [])

    const onSubmit = React.useCallback((e) => {

        e.preventDefault();
        setDataRequested(false)

    }, [])


    React.useEffect(() => {
        setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {

            if (props.offerType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborItems[]>({
                    command: 'labor/fetch_items_with_average_price',
                    args: { searchVal: searchVal === '' ? 'empty' : searchVal, isSorting: true}
                    // args: { subcategoryMongoId: parentId }
                })
                    .then(laborItemsResData => {
                        if (mounted.current) {
                            console.log('laborItemsResData estimate average ', laborItemsResData)
                            let laborItemsData: LaborItemDisplayData[] = [];

                            for (let laborItem of laborItemsResData) {
                                laborItemsData.push(new LaborItemDisplayData(laborItem));
                            }

                            setOfferList(laborItemsData);
                        }
                        setProgIndic(false)

                    })
            } else if (props.offerType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
                    command: 'material/fetch_items_with_average_price',
                    args: { searchVal: searchVal === '' ? 'empty' : searchVal, isSorting: true}
                    // args: { subcategoryMongoId: parentId }
                })
                    .then(materialItemsResData => {
                        if (mounted.current) {
                            console.log('materialItemsResData', materialItemsResData)
                            let materialItemsData: MaterialItemDisplayData[] = [];

                            for (let materialItem of materialItemsResData) {
                                materialItemsData.push(new MaterialItemDisplayData(materialItem));
                            }

                            setOfferList(materialItemsData);
                        }
                        setProgIndic(false)

                    })
            }
            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);





    if (offerList) {
        return <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            // TransitionComponent={Transition}
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
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                {props.offerType === 'labor' ? t('Add Labor') : t('Add Material')}
            </DialogTitle>
            <IconButton
                aria-label="close"
                onClick={handleClose}
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
                <Box
                    component="form" onSubmit={onSubmit} sx={{ display: 'flex', backgroundColor: '#242c37', width: 300, justifySelf: 'right', m: 1 }}>

                    <InputBase
                        sx={{ ml: 1, flex: 1, }}
                        placeholder='Search'
                        inputProps={{ 'aria-label': 'search google maps' }}
                        // onChange={(e) => {setSearchVal(e.target.value)}}
                        onChange={searchTextChange}
                        value={searchVal}
                    />
                    {/* <IconButton type='button' sx={{ p: '10px' }} aria-label='search'>
                    <SearchIcon />
                </IconButton> */}
                    <Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
                    <Button onClick={searchTextSubmit}>
                        <DirectionsIcon />
                    </Button>
                </Box>





                {props.offerType === 'labor' &&
                    <DataTableComponent
                        sx={{
                            width: '100%',
                            // color: "red"
                        }}
                        columns={[
                            { field: 'fullCode', headerName: t('ID'), headerAlign: 'left', flex:0.2, disableColumnMenu:true },
                            { field: 'name', headerName: t('Label'), headerAlign: 'left', flex: 0.5, disableColumnMenu:true },
                            { field: 'laborHours', headerName: t('Work per hour'), headerAlign: 'left', flex: 1 }, //🔴 TODO: this will need us in version 2 🔴
                            { field: 'measurementUnitRepresentationSymbol', headerName: t('Measurement Unit'), headerAlign: 'left', flex: 0.3, disableColumnMenu:true },
                            { field: 'averagePrice', headerName: t('Average Price'), headerAlign: 'left', flex: 0.3, disableColumnMenu:true, valueFormatter: (value) => formatCurrency(value) },
                            // { field: 'averagePrice', headerName: 'Average Price', headerAlign: 'left', flex: 1 },

                            {
                                field: 'info', type: 'actions', headerName: '', flex:0.2, renderCell: (cell) => {
                                    return <>
                                        <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                            // setUserDetailsId(cell.id as string)
                                            // handleClick(event);

                                            // props.onSelected(cell.id as string);
                                            console.log('cell', cell)

                                            //🔴 TODO: this will need us in version 2 🔴
                                            // if (props.offerType === 'labor') {
                                            //     let laborHours = (cell.row as LaborItemDisplayData).laborHours
                                            //     if (laborHours !== undefined) {
                                            //         setLaborHours(laborHours)
                                            //     }

                                            // }
                                            setAveragePrice(cell.row.averagePrice ?? null);
                                            setOfferItemMeasurementUnitMongoId(cell.row.measurementUnitMongoId as string)
                                            setOfferItemName(cell.row.name)
                                            setOfferItemId(cell.row._id as string)

                                        }
                                        }
                                        >
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    </>;
                                }
                            }, // width: 600 },
                        ]}
                        rows={offerList}
                        // autoPageSize={true}
                        disableRowSelectionOnClick
                        getRowId={row => row._id}
                    />

                }

                {props.offerType === 'material' &&
                    <DataTableComponent
                        sx={{
                            width: '100%',
                            // color: "red"
                        }}
                        columns={[
                            { field: 'fullCode', headerName: t('ID'), flex: 0.2},
                            { field: 'name', headerName: t('Label'), flex: 0.5},
                            // { field: 'laborHours', headerName: 'Labor Hours', flex: 1 },
                            { field: 'measurementUnitRepresentationSymbol', headerName: t('Measurement Unit'), flex: 0.3},
                            { field: 'averagePrice', headerName: t('Average Price'), flex: 0.3, valueFormatter: (value) => formatCurrency(value) },
                            // { field: 'averagePrice', headerName: 'Average Price', flex: 1 },

                            {

                                field: 'info', type: 'actions', headerName: '', width: 20, renderCell: (cell) => {
                                    return <>
                                        <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                            // setUserDetailsId(cell.id as string)
                                            // handleClick(event);

                                            // props.onSelected(cell.id as string);
                                            // console.log('cell', cell)

                                            //🔴 TODO: this will need us in version 2 🔴
                                            // if (props.offerType === 'labor') {
                                            //     let laborHours = (cell.row as LaborItemDisplayData).laborHours
                                            //     if (laborHours !== undefined) {
                                            //         setLaborHours(laborHours)
                                            //     }

                                            // }
                                            setAveragePrice(cell.row.averagePrice ?? null);
                                            setOfferItemMeasurementUnitMongoId(cell.row.measurementUnitMongoId as string)
                                            setOfferItemName(cell.row.name)
                                            setOfferItemId(cell.row._id as string)

                                        }
                                        }
                                        >
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    </>;
                                }
                            }, // width: 600 },
                        ]}
                        rows={offerList}
                        // autoPageSize={true}
                        disableRowSelectionOnClick
                        getRowId={row => row._id}
                    />

                }
            </DialogContent>
            {offerItemId && !props.isEstimation && <UserPageAddOfferDetailsDialog catalogType={props.offerType} offerItemMongoId={offerItemId} onClose={() => setOfferItemId(null)} onConfirm={props.onConfirm} />}
            {(offerItemId && offerItemName && offerItemMeasurementUnitMongoId && props.isEstimation && props.offerType !== 'labor') && <UserPageAddEstimationItemDetailsDialog onConfirm={props.onConfirm} onClose={() => { setOfferItemId(null) }} offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId} estimatedLaborId={props.estimatedLaborId} estimateSubsectionId={props.estimateSubsectionId} offerItemNameForEstimation={offerItemName} offerItemMongoIdForEstimation={offerItemId} catalogType={props.offerType} />}
            {/* {(offerItemId && offerItemName && offerItemMeasurementUnitMongoId && laborHours && props.isEstimation && props.offerType === 'labor') && <EstimateAddLaborFromOffersDialog onConfirm={props.onConfirm} estimateSectionId={props.estimateSectionId} laborHours={laborHours} averagePrice={averagePrice} onClose={() => { setOfferItemId(null) }} offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId} estimateItemId={offerItemId} estimateOfferId={null} estimatedLaborId={props.estimatedLaborId} estimateSubsectionId={props.estimateSubsectionId} offerItemNameForEstimation={offerItemName} estimateOfferItemType={props.offerType} />} */}
            {(offerItemId && offerItemName && offerItemMeasurementUnitMongoId && props.isEstimation && props.offerType === 'labor') && <EstimateAddItemFromOffersDialog onConfirm={props.onConfirm} estimateSectionId={props.estimateSectionId} averagePrice={averagePrice} onClose={() => { setOfferItemId(null) }} offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId} estimateItemId={offerItemId} estimateOfferId={null} estimatedLaborId={props.estimatedLaborId} estimateSubsectionId={props.estimateSubsectionId} offerItemNameForEstimation={offerItemName} estimateOfferItemType={props.offerType} />}
        </Dialog>


    }


    return <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        // TransitionComponent={Transition}
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
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
            {props.offerType === 'labor' ? t('Add Labor') : t('Add Material')}
        </DialogTitle>
        <IconButton
            aria-label="close"
            onClick={handleClose}
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
            {/* <Box
                component="form" onSubmit={onSubmit} sx={{ display: 'flex', backgroundColor: '#242c37', width: 300, justifySelf: 'right', m: 1 }}>

                <InputBase
                    sx={{ ml: 1, flex: 1, }}
                    placeholder='Search'
                    inputProps={{ 'aria-label': 'search google maps' }}
                    onChange={searchTextChange}
                    value={searchVal}
                />
                <Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
                <Button onClick={searchTextSubmit}>
                    <DirectionsIcon />
                </Button>
            </Box> */}
            <EstimateCatalogAccordion
                catalogType={props.offerType}
                estimateSectionId={props.estimateSectionId}
                estimateSubsectionId={props.estimateSubsectionId}
                estimatedLaborId={props.estimatedLaborId}
                onConfirm={props.onConfirm}
            />
        </DialogContent>
    </Dialog>


    // return <F.PageFormDialog title='Add Offer' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
    //     <AdminPageCatalog catalogType='labor' offerStatus={true} onSelected={onSelectedOffer}/>
    // </F.PageFormDialog>
}
