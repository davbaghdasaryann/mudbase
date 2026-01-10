'use client'

import { Box, Button, Divider, InputBase, Tab, TextField, Toolbar, Typography } from "@mui/material";
import PageContents from "../../components/PageContents";
import CatalogAccordion from "../../components/pages/CatalogAccordion";
import React from "react";
import DirectionsIcon from '@mui/icons-material/Directions';
import * as Api from 'api';
import * as LaborsApi from 'api/labor'
import * as MaterialsApi from 'api/material'
import { MaterialItemDisplayData } from "../../data/material_display_data";
import { LaborItemDisplayData } from "../../data/labor_display_data";
import { TabContext, TabList } from "@mui/lab";
import SearchComponent from "../../components/SearchComponent";
import OfferPageThreeLevelAccordion from "../offers/OfferPageThreeLevelAccordion";
import DataTableComponent from "@/components/DataTableComponent";
import { usePermissions } from "@/api/auth";
// import OfferPageThreeLevelAccordion from "./OfferPageThreeLevelAccordion";

type OfferType = 'labor' | 'material';

interface Props {
    offerType: OfferType

    accountViewId?: string;

    canEdit?: boolean;
}

export default function AccountOffersPage(props: Props) {
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(true);
    const [searchVal, setSearchVal] = React.useState('');
    const [progIndic, setProgIndic] = React.useState(false)
    // const [laborList, setLaborList] = React.useState<LaborItemDipslayData[] | null>(null);
    const [catalogItems, setCatalogItems] = React.useState<LaborItemDisplayData[] | MaterialItemDisplayData[] | null>(null);

    const [catalogType, setCatalogType] = React.useState<OfferType>(props.offerType)
    // const [value, setValue] = React.useState(props.offerType);
    const { session, permissionsSet } = usePermissions();




    // const searchTextSubmit = React.useCallback((e) => {
    //     setDataRequested(false)
    // }, [])

    // const searchTextChange = React.useCallback((e) => {
    //     setSearchVal(e.target.value)
    //     if (e.target.value === '') {
    //         setCatalogItems(null)
    //         // setDataRequested(false)
    //     }
    // }, [])

    // const onSubmit = React.useCallback((e) => {

    //     e.preventDefault();
    //     setDataRequested(false)

    // }, [])


    // React.useEffect(() => {
    //     setProgIndic(true)

    //     mounted.current = true;
    //     if (!dataRequested) {
    //         if (catalogType === 'labor') {
    //             Api.requestSession<LaborsApi.ApiLaborItems[]>({
    //                 command: 'labor/fetch_items_with_average_price',
    //                 args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
    //                 // args: { subcategoryMongoId: parentId }
    //             })
    //                 .then(laborItemsResData => {
    //                     if (mounted.current) {
    //                         console.log('laborItemsResData', laborItemsResData)
    //                         let laborItemsData: LaborItemDisplayData[] = [];

    //                         for (let laborItem of laborItemsResData) {
    //                             laborItemsData.push(new LaborItemDisplayData(laborItem));
    //                         }

    //                         setCatalogItems(laborItemsData);
    //                     }
    //                     setProgIndic(false)

    //                 })
    //         } else if (catalogType === 'material') {
    //             Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
    //                 command: 'material/fetch_items',
    //                 args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
    //                 // args: { subcategoryMongoId: parentId }
    //             })
    //                 .then(materialItemsResData => {
    //                     if (mounted.current) {
    //                         console.log('materialItemsResData', materialItemsResData)
    //                         let materialItemsData: MaterialItemDisplayData[] = [];

    //                         for (let materialItem of materialItemsResData) {
    //                             materialItemsData.push(new MaterialItemDisplayData(materialItem));
    //                         }

    //                         setCatalogItems(materialItemsData);
    //                     }
    //                     setProgIndic(false)

    //                 })
    //         }
    //         setDataRequested(true);
    //         return;
    //     }
    //     return () => { mounted.current = false }
    // }, [dataRequested]);



    return <>

        {/* {catalogItems &&
            <DataTableComponent
                sx={{
                    width: '100%',
                }}
                columns={[
                    { field: 'fullCode', headerName: 'ID', headerAlign: 'left', width: 160, disableColumnMenu:true },
                    { field: 'name', headerName: 'Name', headerAlign: 'left', flex: 1, disableColumnMenu:true },
                    { field: 'measurementUnitRepresentationSymbol', headerName: 'Name', headerAlign: 'left', flex: 1, disableColumnMenu:true },
                ]}
                rows={catalogItems}
                disableRowSelectionOnClick
                getRowId={row => row._id}
            />
        }
 */}


        {/* key={catalogType} this for refreshing component */}
        {/* {!catalogItems && <OfferPageThreeLevelAccordion fetchMyOffers={true} catalogType={catalogType} accountViewId={props.accountViewId}/>} */}
        {!catalogItems && <OfferPageThreeLevelAccordion catalogType={catalogType} accountViewId={props.accountViewId} canEdit={props.canEdit}/>}
        {/* {!catalogItems && <CatalogAccardion key={catalogType} catalogType={catalogType} offerStatus={false} onSelected={() => { }} />} */}
    </>
}

