import React from "react";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { Box, DialogContent, DialogTitle, InputBase, ListItem, Typography } from "@mui/material";
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
import MaterialsLeftPaneContent from "@/app/offers/MaterialsLeftPaneContent";


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





    const [groupSelectedWorks, setGroupSelectedWorks] = React.useState<LaborItemDisplayData[]>([]);
    const [groupShowLibrary, setGroupShowLibrary] = React.useState(false);
    const [groupMainSearch, setGroupMainSearch] = React.useState('');
    const [groupLibraryResults, setGroupLibraryResults] = React.useState<LaborItemDisplayData[] | null>(null);
    const [groupLibrarySearch, setGroupLibrarySearch] = React.useState('');
    const [groupLibraryLoading, setGroupLibraryLoading] = React.useState(false);

    const fetchGroupLibrary = React.useCallback((val: string) => {
        setGroupLibraryLoading(true);
        Api.requestSession<LaborsApi.ApiLaborItems[]>({
            command: 'labor/fetch_items_with_average_price',
            args: { searchVal: val.trim() || 'empty', isSorting: true },
        }).then(data => {
            setGroupLibraryResults((data ?? []).map((d: LaborsApi.ApiLaborItems) => new LaborItemDisplayData(d)));
        }).finally(() => setGroupLibraryLoading(false));
    }, []);

    React.useEffect(() => {
        if (groupShowLibrary && groupLibraryResults === null) {
            fetchGroupLibrary('');
        }
    }, [groupShowLibrary]);

    if (props.isGroupRow) {
        const filteredWorks = groupSelectedWorks.filter(w =>
            !groupMainSearch || (w.name ?? '').toLowerCase().includes(groupMainSearch.toLowerCase())
        );

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
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Box
                            component="form"
                            onSubmit={e => { e.preventDefault(); fetchGroupLibrary(groupLibrarySearch); }}
                            sx={{ display: 'flex', border: '1px solid #ccc', borderRadius: 1, width: 300, backgroundColor: '#fff' }}
                        >
                            <InputBase sx={{ ml: 1, flex: 1 }} placeholder={t('Search')} value={groupLibrarySearch} onChange={e => setGroupLibrarySearch(e.target.value)} />
                            <Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
                            <Button onClick={() => fetchGroupLibrary(groupLibrarySearch)}><DirectionsIcon /></Button>
                        </Box>
                    </Box>
                    {groupLibraryLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><DirectionsIcon /></Box>}
                    {!groupLibraryLoading && groupLibraryResults && (
                        <DataTableComponent
                            sx={{ width: '100%' }}
                            columns={[
                                { field: 'fullCode', headerName: t('ID'), headerAlign: 'left', flex: 0.2, disableColumnMenu: true },
                                { field: 'name', headerName: t('Label'), headerAlign: 'left', flex: 0.5, disableColumnMenu: true },
                                { field: 'measurementUnitRepresentationSymbol', headerName: t('Measurement Unit'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true },
                                { field: 'averagePrice', headerName: t('Average Price'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                                {
                                    field: 'select', type: 'actions', headerName: '', flex: 0.1,
                                    renderCell: (cell: any) => (
                                        <IconButton onClick={() => {
                                            setGroupSelectedWorks(prev => prev.find(w => w._id === cell.row._id) ? prev : [...prev, cell.row as LaborItemDisplayData]);
                                            setGroupShowLibrary(false);
                                        }}>
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    ),
                                },
                            ]}
                            rows={groupLibraryResults}
                            disableRowSelectionOnClick
                            getRowId={(row: any) => row._id}
                        />
                    )}
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
                        <Box sx={{ mt: 3 }}>
                            <List dense>
                                {filteredWorks.map(w => (
                                    <ListItem key={w._id as string}>
                                        <ListItemText primary={w.name} secondary={w.measurementUnitRepresentationSymbol} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
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
