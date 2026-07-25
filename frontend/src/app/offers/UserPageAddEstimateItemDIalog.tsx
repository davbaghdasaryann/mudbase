import React from "react";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { Box, DialogContent, DialogTitle, InputBase, Typography } from "@mui/material";
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
import ImgElement from '@/tsui/DomElements/ImgElement';
import MaterialsTwoPartDialog from '@/app/offers/MaterialsTwoPartDialog';
import DataTableComponent from "@/components/DataTableComponent";
import { t } from "i18next";
import { formatCurrency } from "@/lib/format_currency";
import MaterialsLeftPaneContent from "@/app/offers/MaterialsLeftPaneContent";


interface GroupWorkRow {
    _id: string;
    itemFullCode: string;
    itemChangableName: string;
    itemMeasurementUnit: string;
    measurementUnitMongoId: string;
    itemChangableAveragePrice: number | null;
    itemLaborHours: number | null;
    quantity: number | null;
    itemWithoutMaterial: number | null;
    materialTotalCost: number;
    priceWithMaterial: number | null;
    unitPrice: number | null;
    savedEstimateId?: string;
}

interface Props {
    onClose: () => void;
    offerType: 'labor' | 'material';
    isEstimation: boolean;
    estimateSubsectionId?: string | null;
    estimateSectionId?: string | null;
    estimatedLaborId?: string | null;
    isGroupRow?: boolean;
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





    const [groupSelectedWorks, setGroupSelectedWorks] = React.useState<GroupWorkRow[]>([]);
    const [groupShowLibrary, setGroupShowLibrary] = React.useState(false);
    const [groupMainSearch, setGroupMainSearch] = React.useState('');
    const [groupMaterialRowId, setGroupMaterialRowId] = React.useState<string | null>(null);
    const [groupMaterialRowName, setGroupMaterialRowName] = React.useState<string>('');

    if (props.isGroupRow) {
        const filteredWorks = groupSelectedWorks.filter(w =>
            !groupMainSearch || (w.itemChangableName ?? '').toLowerCase().includes(groupMainSearch.toLowerCase())
        );

        const refreshGroupMaterialRow = async (savedEstimateId: string) => {
            if (!props.estimateSubsectionId) return;
            const items = await Api.requestSession<any[]>({
                command: 'estimate/fetch_labor_items',
                args: { estimateSubsectionId: props.estimateSubsectionId },
            });
            const updated = items?.find((item: any) => item._id?.toString() === savedEstimateId);
            if (!updated) return;
            let materialTotalCost = 0;
            if (updated.estimateMaterialItemData?.length > 0) {
                for (const mat of updated.estimateMaterialItemData) {
                    materialTotalCost += (mat.quantity ?? 0) * (mat.changableAveragePrice ?? 0);
                }
            }
            setGroupSelectedWorks(prev => prev.map(w => {
                if (w.savedEstimateId !== savedEstimateId) return w;
                const itemWithoutMaterial = w.quantity != null && w.itemChangableAveragePrice != null
                    ? Math.round(w.quantity * w.itemChangableAveragePrice * 1000) / 1000
                    : null;
                const priceWithMaterial = itemWithoutMaterial != null
                    ? Math.round((itemWithoutMaterial + materialTotalCost) * 1000) / 1000
                    : null;
                const unitPrice = w.quantity && priceWithMaterial
                    ? Math.round((priceWithMaterial / w.quantity) * 1000) / 1000
                    : null;
                return { ...w, materialTotalCost, priceWithMaterial, unitPrice };
            }));
        };

        const handleGroupMaterialClick = async (row: GroupWorkRow) => {
            let laborId = row.savedEstimateId;
            if (!laborId) {
                const result = await Api.requestSession<any>({
                    command: 'estimate/add_labor_item',
                    args: {
                        estimateSubsectionId: props.estimateSubsectionId,
                        laborItemQuantity: row.quantity ?? 0,
                        laborOffersAveragePrice: row.itemChangableAveragePrice ?? 0,
                        laborItemId: row._id,
                        laborOfferItemLaborHours: row.itemLaborHours ?? 0,
                        laborItemMeasurementUnitMongoId: row.measurementUnitMongoId,
                        laborOfferItemName: row.itemChangableName,
                    },
                });
                laborId = result?.newEstimateLaborItem?.insertedId;
                if (laborId) {
                    setGroupSelectedWorks(prev => prev.map(w => w._id === row._id ? { ...w, savedEstimateId: laborId } : w));
                }
            }
            if (laborId) {
                setGroupMaterialRowId(laborId);
                setGroupMaterialRowName(row.itemChangableName);
            }
        };

        const handleGroupRowUpdate = (newRow: GroupWorkRow): GroupWorkRow => {
            const qty = newRow.quantity != null ? parseFloat(String(newRow.quantity)) : null;
            const price = newRow.itemChangableAveragePrice;
            const itemWithoutMaterial = qty != null && price != null ? Math.round(qty * price * 1000) / 1000 : null;
            const updated: GroupWorkRow = {
                ...newRow,
                quantity: qty,
                itemWithoutMaterial,
                priceWithMaterial: itemWithoutMaterial,
                unitPrice: qty && itemWithoutMaterial ? Math.round((itemWithoutMaterial / qty) * 1000) / 1000 : null,
            };
            setGroupSelectedWorks(prev => prev.map(w => w._id === updated._id ? updated : w));
            return updated;
        };

        return <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            slotProps={{ paper: { style: { padding: 5, borderRadius: '12px' } } }}
            sx={{ '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', padding: 5 } }}
        >
            {/* ── Library view ── */}
            {groupShowLibrary ? <>
                <DialogTitle sx={{ m: 0, p: 2 }}>{t('Work Library')}</DialogTitle>
                <IconButton aria-label="back" onClick={() => setGroupShowLibrary(false)} sx={(theme) => ({ position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] })}>
                    <CloseIcon />
                </IconButton>
                <DialogContent sx={{ p: 0 }}>
                    <EstimateCatalogAccordion
                        catalogType='labor'
                        onConfirm={() => {}}
                        hideToolbar
                        onItemSelect={(item) => {
                            if (groupSelectedWorks.find(w => w._id === item._id)) {
                                setGroupShowLibrary(false);
                                return;
                            }
                            const price = item.averagePrice != null ? parseFloat(String(item.averagePrice)) : null;
                            const newRow: GroupWorkRow = {
                                _id: item._id,
                                itemFullCode: item.fullCode ?? '',
                                itemChangableName: item.label ?? item.name ?? '',
                                itemMeasurementUnit: item.measurementUnitRepresentationSymbol ?? '',
                                measurementUnitMongoId: item.measurementUnitMongoId ?? '',
                                itemChangableAveragePrice: price,
                                itemLaborHours: null,
                                quantity: null,
                                itemWithoutMaterial: null,
                                materialTotalCost: 0,
                                priceWithMaterial: null,
                                unitPrice: null,
                            };
                            setGroupSelectedWorks(prev => [...prev, newRow]);
                            setGroupShowLibrary(false);
                        }}
                    />
                </DialogContent>
            </> : <>
                {/* ── Group main view ── */}
                <DialogTitle sx={{ m: 0, p: 2 }}>{t('Add work')}</DialogTitle>
                <IconButton aria-label="close" onClick={handleClose} sx={(theme) => ({ position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] })}>
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Box sx={{ display: 'flex', border: '1px solid #ccc', borderRadius: 1, width: 300, backgroundColor: '#fff' }}>
                            <InputBase sx={{ ml: 1, flex: 1 }} placeholder={t('Search')} value={groupMainSearch} onChange={e => setGroupMainSearch(e.target.value)} />
                        </Box>
                    </Box>
                    <Button variant='contained' onClick={() => setGroupShowLibrary(true)}>{t('Add work')}</Button>
                    {filteredWorks.length > 0 && (
                        <Box sx={{
                            mt: 3, width: '100%', backgroundColor: '#FFFFFF',
                            '& .MuiDataGrid-row': { backgroundColor: '#FFFFFF' },
                            '& .MuiDataGrid-row:hover': { backgroundColor: '#E8EFEF !important' },
                            '& .editableCell': { boxShadow: 'inset 0 0 0 1px #00BFFF', borderRadius: '5px' },
                        }}>
                            <DataTableComponent
                                sx={{ width: '100%' }}
                                processRowUpdate={handleGroupRowUpdate}
                                columns={[
                                    { field: 'itemFullCode', headerName: t('ID'), align: 'center', width: 90, disableColumnMenu: true },
                                    { field: 'itemChangableName', headerName: t('Labor'), headerAlign: 'center', flex: 1, editable: true, cellClassName: 'editableCell', disableColumnMenu: true },
                                    { field: 'itemLaborHours', headerName: t('Work per hour'), align: 'center', width: 120, editable: true, cellClassName: 'editableCell', disableColumnMenu: true },
                                    { field: 'itemMeasurementUnit', headerName: t('Unit'), align: 'center', width: 80, disableColumnMenu: true },
                                    { field: 'quantity', headerName: t('Quantity'), align: 'center', width: 120, editable: true, cellClassName: 'editableCell', disableColumnMenu: true, valueFormatter: (value: any) => value != null ? formatCurrency(value) : '' },
                                    { field: 'itemChangableAveragePrice', headerName: t('Price'), align: 'center', width: 120, editable: true, cellClassName: 'editableCell', disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                                    { field: 'itemWithoutMaterial', headerName: t('Without material'), align: 'center', width: 160, disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                                    { field: 'materialTotalCost', headerName: t('Material Cost'), align: 'center', width: 160, disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                                    { field: 'priceWithMaterial', headerName: t('Price with material'), align: 'center', width: 160, disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                                    { field: 'unitPrice', headerName: t('Unit Price'), align: 'center', width: 160, disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                                    {
                                        field: 'addMaterial', type: 'actions', headerName: t('Materials'), width: 100, disableColumnMenu: true,
                                        renderCell: (cell: any) => (
                                            <IconButton onClick={() => handleGroupMaterialClick(cell.row)}>
                                                <ImgElement src='/images/icons/material.svg' sx={{ height: 20 }} />
                                            </IconButton>
                                        ),
                                    },
                                ]}
                                rows={filteredWorks}
                                disableRowSelectionOnClick
                                getRowId={(row: any) => row._id}
                            />
                        </Box>
                    )}
                    {groupMaterialRowId && (
                        <MaterialsTwoPartDialog
                            offerType='material'
                            isEstimation
                            estimatedLaborId={groupMaterialRowId}
                            estimatedLaborName={groupMaterialRowName}
                            onClose={() => setGroupMaterialRowId(null)}
                            onConfirm={() => { refreshGroupMaterialRow(groupMaterialRowId); }}
                        />
                    )}
                </DialogContent>
            </>}
        </Dialog>;
    }

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
                        borderRadius: '12px',
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
                    borderRadius: '12px',
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
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <MaterialsLeftPaneContent
                offerType={props.offerType}
                isEstimation={props.isEstimation}
                estimateSectionId={props.estimateSectionId}
                estimateSubsectionId={props.estimateSubsectionId}
                estimatedLaborId={props.estimatedLaborId}
                onBack={handleClose}
                onConfirm={props.onConfirm}
            />
        </DialogContent>
    </Dialog>


    // return <F.PageFormDialog title='Add Offer' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
    //     <AdminPageCatalog catalogType='labor' offerStatus={true} onSelected={onSelectedOffer}/>
    // </F.PageFormDialog>
}
