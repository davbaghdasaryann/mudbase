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
import OfferPageThreeLevelAccordion from "./OfferPageThreeLevelAccordion";
import SearchComponent from "../../components/SearchComponent";
import DataTableComponent from "@/components/DataTableComponent";
// import OfferPageThreeLevelAccordion from "./OfferPageThreeLevelAccordion";


export default function UserPageOffer() {
    <></>
}

// //⚠️ This is old code. Not used
// export default function UserPageOffer() {
//     const mounted = React.useRef(false);
//     const [dataRequested, setDataRequested] = React.useState(true);
//     const [searchVal, setSearchVal] = React.useState('');
//     const [progIndic, setProgIndic] = React.useState(false)
//     // const [laborList, setLaborList] = React.useState<LaborItemDipslayData[] | null>(null);
//     const [catalogItems, setCatalogItems] = React.useState<LaborItemDisplayData[] | MaterialItemDisplayData[] | null>(null);

//     const [catalogType, setCatalogType] = React.useState<'labor' | 'material'>('labor')
//     const [value, setValue] = React.useState('labor');


//     const handleChange = (event: React.SyntheticEvent, newValue: string) => {
//         setValue(newValue);
//         if (newValue === 'labor' || newValue === 'material')
//             setCatalogType(newValue);
//         // setDataRequested(false)
//         setCatalogItems(null)
//         // setOffers(null)
//     };



//     const searchTextSubmit = React.useCallback((e) => {
//         setDataRequested(false)
//     }, [])

//     const searchTextChange = React.useCallback((e) => {
//         setSearchVal(e.target.value)
//         if (e.target.value === '') {
//             setCatalogItems(null)
//             // setDataRequested(false)
//         }
//     }, [])

//     const onSubmit = React.useCallback((e) => {

//         e.preventDefault();
//         setDataRequested(false)

//     }, [])


//     React.useEffect(() => {
//         setProgIndic(true)

//         mounted.current = true;
//         if (!dataRequested) {
//             if (catalogType === 'labor') {
//                 Api.requestSession<LaborsApi.ApiLaborItems[]>({
//                     command: 'labor/fetch_items_with_average_price',
//                     args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
//                     // args: { subcategoryMongoId: parentId }
//                 })
//                     .then(laborItemsResData => {
//                         if (mounted.current) {
//                             console.log('laborItemsResData', laborItemsResData)
//                             let laborItemsData: LaborItemDisplayData[] = [];

//                             for (let laborItem of laborItemsResData) {
//                                 laborItemsData.push(new LaborItemDisplayData(laborItem));
//                             }

//                             setCatalogItems(laborItemsData);
//                         }
//                         setProgIndic(false)

//                     })
//             } else if (catalogType === 'material') {
//                 Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
//                     command: 'material/fetch_items',
//                     args: { searchVal: searchVal === '' ? 'empty' : searchVal, }
//                     // args: { subcategoryMongoId: parentId }
//                 })
//                     .then(materialItemsResData => {
//                         if (mounted.current) {
//                             console.log('materialItemsResData', materialItemsResData)
//                             let materialItemsData: MaterialItemDisplayData[] = [];

//                             for (let materialItem of materialItemsResData) {
//                                 materialItemsData.push(new MaterialItemDisplayData(materialItem));
//                             }

//                             setCatalogItems(materialItemsData);
//                         }
//                         setProgIndic(false)

//                     })
//             }
//             setDataRequested(true);
//             return;
//         }
//         return () => { mounted.current = false }
//     }, [dataRequested]);


//     // if (!catalogItems) {
//     //     <PageContents>
//     //         <Box
//     //             component="form" onSubmit={onSubmit} sx={{ display: 'flex', backgroundColor: '#242c37', width: 300, justifySelf: 'right', m: 1 }}>

//     //             <InputBase
//     //                 sx={{ ml: 1, flex: 1, }}
//     //                 placeholder='Search'
//     //                 inputProps={{ 'aria-label': 'search google maps' }}
//     //                 // onChange={(e) => {setSearchVal(e.target.value)}}
//     //                 onChange={searchTextChange}
//     //                 value={searchVal}
//     //             />
//     //             {/* <IconButton type='button' sx={{ p: '10px' }} aria-label='search'>
//     //                 <SearchIcon />
//     //             </IconButton> */}
//     //             <Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
//     //             <Button onClick={searchTextSubmit}>
//     //                 <DirectionsIcon />
//     //             </Button>
//     //         </Box>
//     //     </PageContents>
//     // }



//     return <PageContents requiredPermission="old_code">

//         <Box
//             component="form" onSubmit={onSubmit} sx={{ display: 'flex', backgroundColor: '#242c37', width: 300, justifySelf: 'right', m: 1 }}>

//             {/* <InputBase
//                 sx={{ ml: 1, flex: 1, }}
//                 placeholder='Search'
//                 inputProps={{ 'aria-label': 'search google maps' }}
//                 // onChange={(e) => {setSearchVal(e.target.value)}}
//                 onChange={searchTextChange}
//                 value={searchVal}
//             />
//             <Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
//             <Button onClick={searchTextSubmit}>
//                 <DirectionsIcon />
//             </Button> */}
//         </Box>
//         <TabContext value={value}>
//             <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//                 <TabList onChange={handleChange}>
//                     <Tab label="Labor" value="labor" />
//                     <Tab label="Material" value="material" />
//                 </TabList>
//             </Box>
//             {/* <TabPanel value="1">Labor</TabPanel>
//                 <TabPanel value="2">Materials</TabPanel>
//                 <TabPanel value="3">Item Three</TabPanel> */}
//         </TabContext>
//         {catalogItems &&
//             <DataTableComponent
//                 sx={{
//                     width: '100%',
//                     // color: "red"
//                 }}
//                 columns={[
//                     { field: 'fullCode', headerName: 'ID', headerAlign: 'left', flex:0.3, disableColumnMenu:true },
//                     { field: 'name', headerName: 'Name', headerAlign: 'left', flex: 0.5, disableColumnMenu:true },
//                     { field: 'measurementUnitRepresentationSymbol', headerName: 'Name', headerAlign: 'left', flex: 0.2, disableColumnMenu:true },
//                 ]}
//                 rows={catalogItems}
//                 // autoPageSize={true}
//                 disableRowSelectionOnClick
//                 getRowId={row => row._id}
//             />
//         }

//         {/* key={catalogType} this for refreshing component */}
//         {!catalogItems && <OfferPageThreeLevelAccordion fetchMyOffers={false} catalogType={catalogType} />}
//         {/* {!catalogItems && <CatalogAccardion key={catalogType} catalogType={catalogType} offerStatus={false} onSelected={() => { }} />} */}
//     </PageContents>
// }

