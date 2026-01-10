import React from "react";
import PageDialog from "../../tsui/PageDialog";
import * as F from 'tsui/Form';
import CatalogAccordion from "../../components/pages/CatalogAccordion";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Box, DialogContent, DialogTitle, InputBase } from "@mui/material";
import { LaborItemDisplayData } from "../../data/labor_display_data";
import { MaterialItemDisplayData } from "../../data/material_display_data";

import * as Api from 'api';
import * as LaborsApi from 'api/labor'
import DirectionsIcon from '@mui/icons-material/Directions';
import * as MaterialsApi from 'api/material'
import UserPageAddOfferDetailsDialog from "./UserPageAddOfferDetailsDIalog";
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import DataTableComponent from "@/components/DataTableComponent";
import { useTranslation } from "react-i18next";


interface Props {
    onClose: () => void;
    offerType: 'labor' | 'material';
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<unknown>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function UserPageAddOfferDialog(props: Props) {

    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(true);
    const [searchVal, setSearchVal] = React.useState('');
    const [progIndic, setProgIndic] = React.useState(false)
    const [offerList, setOfferList] = React.useState<LaborItemDisplayData[] | MaterialItemDisplayData[] | null>(null);
    const [offerItemId, setOfferItemId] = React.useState<string | null>(null);
    const [t] = useTranslation();
    const [open, setOpen] = React.useState(true);


    const onSelectedOffer = React.useCallback((key: string) => {
        console.log('key', key)
    }, [])



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
                    command: 'labor/fetch_items',
                    args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
                    // args: { subcategoryMongoId: parentId }
                })
                    .then(laborItemsResData => {
                        if (mounted.current) {
                            console.log('laborItemsResData', laborItemsResData)
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
                    command: 'material/fetch_items',
                    args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
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
                {t('Add Labor')}
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



                <DataTableComponent
                    sx={{
                        width: '100%',
                        // color: "red"
                    }}
                    columns={[
                        { field: 'fullCode', headerName: 'ID', headerAlign: 'left', flex: 0.2, disableColumnMenu: true },
                        { field: 'name', headerName: 'Label', headerAlign: 'left', flex: 0.5, disableColumnMenu: true },
                        { field: 'measurementUnitRepresentationSymbol', headerName: 'Unit', headerAlign: 'left', flex: 0.2, disableColumnMenu: true },

                        {
                            field: 'info', type: 'actions', headerName: '', flex: 0.2, renderCell: (cell) => {
                                return <>
                                    <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                        // setUserDetailsId(cell.id as string)
                                        // handleClick(event);

                                        // props.onSelected(cell.id as string);
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


            </DialogContent>
            {offerItemId && <UserPageAddOfferDetailsDialog catalogType={props.offerType} offerItemMongoId={offerItemId} onClose={() => setOfferItemId(null)} onConfirm={() => { }} />}

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
        {t('Add Labor')}
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
            <CatalogAccordion catalogType={props.offerType} />
        </DialogContent>
    </Dialog>


    // return <F.PageFormDialog title='Add Offer' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
    //     <AdminPageCatalog catalogType='labor' offerStatus={true} onSelected={onSelectedOffer}/>
    // </F.PageFormDialog>
}
