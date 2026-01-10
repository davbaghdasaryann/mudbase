import React, {useCallback, useEffect} from 'react';

import {Box, InputBase, Divider, IconButton, Button} from '@mui/material';

import DirectionsIcon from '@mui/icons-material/Directions';
import DataTableComponent from '@/components/DataTableComponent';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';

import {t} from 'i18next';
import {formatCurrency} from '@/lib/format_currency';
import * as Api from 'api';
import * as LaborsApi from 'api/labor';
import * as MaterialsApi from 'api/material';
import {LaborItemDisplayData} from '../../data/labor_display_data';
import {MaterialItemDisplayData} from '../../data/material_display_data';
import UserPageAddOfferDetailsDialog from '@/app/offers/UserPageAddOfferDetailsDIalog';
import EstimateCatalogAccordion from '@/components/pages/EstimateCatalogAccordion';
import UserPageAddEstimationItemDetailsDialog from '@/app/offers/UserPageAddEstimationItemDetailsDIalog';

interface MaterialsLeftPaneContentProps {
    offerType: 'labor' | 'material';
    isEstimation: boolean;
    estimateSubsectionId?: string | null;
    estimateSectionId?: string | null;

    estimatedLaborId?: string | null;

    onConfirm: () => void;
}

export default function MaterialsLeftPaneContent(props: MaterialsLeftPaneContentProps) {
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(true);
    const [progIndic, setProgIndic] = React.useState(false);
    const [searchVal, setSearchVal] = React.useState('');
    const [offerList, setOfferList] = React.useState<LaborItemDisplayData[] | MaterialItemDisplayData[] | null>(null);
    const [offerItemId, setOfferItemId] = React.useState<string | null>(null);
    // const [averagePrice, setAveragePrice] = React.useState<number | null>(null);
    // const [laborHours, setLaborHours] = React.useState<number | null>(null); //🔴 TODO: this will need us in version 2 🔴
    let [offerItemName, setOfferItemName] = React.useState<string | null>(null);
    let [offerItemMeasurementUnitMongoId, setOfferItemMeasurementUnitMongoId] = React.useState<string | null>(null);

    // console.log('props', props)

    const searchTextSubmit = useCallback((e) => {
        setDataRequested(false);
    }, []);

    const searchTextChange = useCallback((e) => {
        setSearchVal(e.target.value);
        if (e.target.value === '') {
            setOfferList(null);
            // setDataRequested(false)
        }
    }, []);

    const onSubmit = useCallback((e) => {
        e.preventDefault();
        setDataRequested(false);
    }, []);

    useEffect(() => {
        setProgIndic(true);

        mounted.current = true;
        if (!dataRequested) {
            if (props.offerType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborItems[]>({
                    command: 'labor/fetch_items_with_average_price',
                    args: {searchVal: searchVal === '' ? 'empty' : searchVal, isSorting: true},
                    // args: { subcategoryMongoId: parentId }
                }).then((laborItemsResData) => {
                    if (mounted.current) {
                        console.log('laborItemsResData estimate average ', laborItemsResData);
                        let laborItemsData: LaborItemDisplayData[] = [];

                        for (let laborItem of laborItemsResData) {
                            laborItemsData.push(new LaborItemDisplayData(laborItem));
                        }

                        setOfferList(laborItemsData);
                    }
                    setProgIndic(false);
                });
            } else if (props.offerType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
                    command: 'material/fetch_items_with_average_price',
                    args: {searchVal: searchVal === '' ? 'empty' : searchVal, isSorting: true},
                    // args: { subcategoryMongoId: parentId }
                }).then((materialItemsResData) => {
                    if (mounted.current) {
                        // console.log('materialItemsResData', materialItemsResData)
                        let materialItemsData: MaterialItemDisplayData[] = [];

                        for (let materialItem of materialItemsResData) {
                            materialItemsData.push(new MaterialItemDisplayData(materialItem));
                        }

                        setOfferList(materialItemsData);
                    }
                    setProgIndic(false);
                });
            }
            setDataRequested(true);
            return;
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);

    if (offerList) {
        return (
            <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {/* Search bar */}
                <Box
                    component='form'
                    onSubmit={(e) => {
                        e.preventDefault();
                        // searchTextSubmit();
                    }}
                    sx={{
                        display: 'flex',
                        backgroundColor: '#242c37',
                        p: 1,
                        borderRadius: 1,
                    }}
                >
                    <InputBase
                        sx={{ml: 1, flex: 1, color: 'inherit'}}
                        placeholder={t('Search')}
                        inputProps={{'aria-label': 'search'}}
                        onChange={searchTextChange}
                        value={searchVal}
                    />
                    <Divider sx={{height: 28, m: 0.5, bgcolor: 'grey.600'}} orientation='vertical' />
                    <IconButton type='button' onClick={searchTextSubmit} sx={{color: 'white'}}>
                        <DirectionsIcon />
                    </IconButton>
                </Box>
                <Box component='form' onSubmit={onSubmit} sx={{display: 'flex', backgroundColor: '#242c37', width: 300, justifySelf: 'right', m: 1}}>
                    <InputBase sx={{ml: 1, flex: 1}} placeholder='Search' onChange={searchTextChange} value={searchVal} />
                    <Divider sx={{height: 28, m: 0.5}} orientation='vertical' />
                    <Button onClick={searchTextSubmit}>
                        <DirectionsIcon />
                    </Button>
                </Box>

                <Box sx={{flex: 1, overflow: 'auto', mt: 2}}>
                    <DataTableComponent
                        sx={{
                            width: '100%',
                            // color: "red"
                        }}
                        columns={[
                            {field: 'fullCode', headerName: t('ID'), headerAlign: 'left', flex: 0.2},
                            {field: 'name', headerName: t('Label'), headerAlign: 'left', flex: 0.5},
                            // { field: 'laborHours', headerName: 'Labor Hours', headerAlign: 'left', flex: 1 },
                            {
                                field: 'measurementUnitRepresentationSymbol',
                                headerName: t('Measurement Unit'),
                                headerAlign: 'left',
                                flex: 0.3,
                            },
                            {
                                field: 'averagePrice',
                                headerName: t('Average Price'),
                                align: 'center',
                                flex: 0.3,
                                valueFormatter: (value) => formatCurrency(value),
                            },
                            // { field: 'averagePrice', headerName: 'Average Price', headerAlign: 'left', flex: 1 },

                            {
                                field: 'info',
                                type: 'actions',
                                headerName: '',
                                width: 20,
                                renderCell: (cell) => {
                                    return (
                                        <>
                                            <IconButton
                                                onClick={(event: React.MouseEvent<HTMLElement>) => {
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
                                                    // setAveragePrice(cell.row.averagePrice ?? null);
                                                    setOfferItemMeasurementUnitMongoId(cell.row.measurementUnitMongoId as string);
                                                    setOfferItemName(cell.row.name);
                                                    setOfferItemId(cell.row._id as string);
                                                }}
                                            >
                                                <AddToPhotosIcon />
                                            </IconButton>
                                        </>
                                    );
                                },
                            }, // width: 600 },
                        ]}
                        rows={offerList}
                        // autoPageSize={true}
                        disableRowSelectionOnClick
                        getRowId={(row) => row._id}
                    />

                    {offerItemId && !props.isEstimation && (
                        <UserPageAddOfferDetailsDialog
                            catalogType={props.offerType}
                            offerItemMongoId={offerItemId}
                            onClose={() => setOfferItemId(null)}
                            onConfirm={props.onConfirm}
                        />
                    )}
                    {offerItemId && offerItemName && offerItemMeasurementUnitMongoId && props.isEstimation && props.offerType !== 'labor' && (
                        <UserPageAddEstimationItemDetailsDialog
                            onConfirm={props.onConfirm}
                            onClose={() => {
                                setOfferItemId(null);
                            }}
                            offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId}
                            estimatedLaborId={props.estimatedLaborId}
                            estimateSubsectionId={props.estimateSubsectionId}
                            offerItemNameForEstimation={offerItemName}
                            offerItemMongoIdForEstimation={offerItemId}
                            catalogType={props.offerType}
                        />
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{display: 'flex', overflow: 'auto', flexDirection: 'column', height: '100%'}}>
            <EstimateCatalogAccordion
                catalogType={props.offerType}
                estimateSectionId={props.estimateSectionId}
                estimateSubsectionId={props.estimateSubsectionId}
                estimatedLaborId={props.estimatedLaborId}
                onConfirm={props.onConfirm}
            />
        </Box>
    );
}
