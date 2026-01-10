import React, { useRef, useState } from "react";
import { AccordionSummary, AccordionDetails, CircularProgress, Typography, IconButton, Toolbar, Stack, Button, Checkbox } from "@mui/material";

import { useTranslation } from "react-i18next";


import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import * as Api from '@/api';
import * as LaborsApi from '@/api/labor'
import * as OffersApi from '@/api/offer'
import * as MaterialsApi from '@/api/material'
import { LaborCategoryDisplayData, LaborItemDisplayData, LaborSubcategoryDisplayData } from "../../data/labor_display_data";
import { GridActionsColDef } from "@mui/x-data-grid";
import UserPageAddOfferDetailsDialog from "./UserPageAddOfferDetailsDIalog";
import { MaterialCategoryDisplayData, MaterialItemDisplayData, MaterialSubcategoryDisplayData } from "../../data/material_display_data";
import moment from "moment";
import { LaborOfferDisplayData, MaterialOfferDisplayData } from "../../data/offer_display_data";
import ProgressIndicator from "../../tsui/ProgressIndicator";
import { UserPageOfferEditDialog } from "./UserPageOfferEditDIalog";
import SearchComponent from "../../components/SearchComponent";
import { useApiFetchMany } from "../../components/ApiDataFetch";

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';


import SpacerComponent from "../../components/SpacerComponent";

import DataTableComponent from "@/components/DataTableComponent";
import { accordionBorderColor, mainBackgroundColor, mainIconColor } from "../../theme";
import { usePermissions } from "../../api/auth";
import { EstimateChildAccordion, EstimateRootAccordion, EstimateSubChildAccordion } from "../../components/AccordionComponent";
import { fixedToThree } from "../../tslib/parse";
import { PageSelect } from "../../tsui/PageSelect";


interface SelectedFiltersDataProps {
    categoryId: string | null;
    subcategoryId: string | null;
}

// ✅ Define Interface
interface AccardionItem {
    _id: string;
    label: string;
    isLoading?: boolean;
    children?: AccardionItem[]; // Holds nested children
    fullCode: string;
    code: string;
    categoryFullCode: string;


    measurementUnitRepresentationSymbol?: string;
    averagePrice?: string
    laborHours?: number; //🔴 TODO: this will need us in version 2 🔴

    itemFullCode?: string;
    accountName?: string;
    price?: string;
    createdAt?: Date
    updatedAt?: Date

    isArchived?: boolean;

    childrenQuantity?: number;

}

// ✅ Simulated API Call (Replace with real API)
const fetchData = async (parentId: string, level: number, accountViewId: string | undefined, catalogType: 'labor' | 'material', searchVal: string, selectedFiltersData: SelectedFiltersDataProps) => {
    return new Promise<any[]>((resolve) => {
        if (level === 2) {
            if (catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborSubcategory[]>({
                    command: accountViewId ? `labor/fetch_current_account_offers_subcategories` : `labor/fetch_subcategories`,
                    args: { accountViewId: accountViewId ?? '', categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,

                })
                    .then(laborSubcategoriesResData => {
                        // console.log('laborSubcategoriesResData', laborSubcategoriesResData)
                        // console.log('labor subcategories: ', laborSubcategoriesResData)
                        let laborSubcategoriesData: LaborSubcategoryDisplayData[] = [];

                        for (let laborSubcat of laborSubcategoriesResData) {
                            laborSubcategoriesData.push(new LaborSubcategoryDisplayData(laborSubcat));
                        }

                        resolve(laborSubcategoriesData);
                    })
            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialSubcategory[]>({
                    // command: `material/fetch_subcategories`,
                    command: accountViewId ? `material/fetch_current_account_offers_subcategories` : `material/fetch_subcategories`,
                    args: { accountViewId: accountViewId ?? '', categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,

                })
                    .then(materialSubcategoriesResData => {
                        // if (mounted.current) {

                        // console.log('labor subcategories: ', laborSubcategoriesResData)
                        let materialSubcategoriesData: MaterialSubcategoryDisplayData[] = [];

                        for (let materialSubcat of materialSubcategoriesResData) {
                            materialSubcategoriesData.push(new MaterialSubcategoryDisplayData(materialSubcat));
                        }

                        resolve(materialSubcategoriesData);
                        // console.log('laborSubcategoriesData', materialSubcategoriesData)
                        // setLaborSubcategories(laborSubcategoriesData)
                        // setProgIndic(false)

                    })
            }
        } else if (level === 3) {
            if (catalogType === 'labor') {
                // console.log('parentId', parentId)

                Api.requestSession<LaborsApi.ApiLaborItems[]>({
                    // command: 'labor/fetch_items', //TODO
                    command: accountViewId ? 'labor/fetch_current_account_offers_items_with_average_price' : 'labor/fetch_items_with_average_price',
                    args: { accountViewId: accountViewId ?? '', subcategoryMongoId: parentId, searchVal: searchVal, calledFromPage: 'offers' },
                })
                    .then(laborItemsResData => {
                        // if (mounted.current) {
                        // console.log('laborItemsResData', laborItemsResData)
                        // console.log('labor subcategories: ', laborSubcategoriesResData)
                        let laborItemsData: LaborItemDisplayData[] = [];

                        for (let laborItem of laborItemsResData) {
                            laborItemsData.push(new LaborItemDisplayData(laborItem));
                        }
                        console.log('laborItemsData', laborItemsData)
                        resolve(laborItemsData);
                        // console.log('laborSubcategoriesData', laborItemsData)
                        // setLaborSubcategories(laborSubcategoriesData)
                        // setProgIndic(false)

                    })

            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
                    command: accountViewId ? 'material/fetch_current_account_offers_items_with_average_price' : 'material/fetch_items_with_average_price',
                    args: { accountViewId: accountViewId ?? '', subcategoryMongoId: parentId, searchVal: searchVal, calledFromPage: 'offers' },
                })
                    .then(materialItemsResData => {
                        // if (mounted.current) {
                        // console.log('laborItemsResData', materialItemsResData)
                        // console.log('labor subcategories: ', laborSubcategoriesResData)
                        let materialItemsData: MaterialItemDisplayData[] = [];

                        for (let materialItem of materialItemsResData) {
                            materialItemsData.push(new MaterialItemDisplayData(materialItem));
                        }

                        resolve(materialItemsData);
                        // console.log('laborSubcategoriesData', materialItemsData)
                        // setLaborSubcategories(laborSubcategoriesData)
                        // setProgIndic(false)

                    })

            }
        } else if (level === 4) {

            if (catalogType === 'labor') {
                Api.requestSession<OffersApi.ApiLaborOffer[]>({
                    command: `labor/fetch_offers`,
                    args: { accountViewId: accountViewId ?? '', searchVal: 'empty', laborItemId: parentId, calledFromPage: 'offers' }
                })
                    .then(laborOffersResData => {

                        let laborOffersData: LaborOfferDisplayData[] = [];

                        for (let laborOffer of laborOffersResData) {
                            laborOffersData.push(new LaborOfferDisplayData(laborOffer));
                        }

                        resolve(laborOffersData);

                    })

            } else if (catalogType === 'material') {
                Api.requestSession<OffersApi.ApiMaterialOffer[]>({
                    command: `material/fetch_offers`,
                    args: { accountViewId: accountViewId ?? '', searchVal: 'empty', materialItemId: parentId, calledFromPage: 'offers' }
                })
                    .then(materialOffersResData => {

                        let materialOffersData: MaterialOfferDisplayData[] = [];

                        for (let materialOffer of materialOffersResData) {
                            materialOffersData.push(new MaterialOfferDisplayData(materialOffer));
                        }

                        resolve(materialOffersData);

                    })

            }
        }
    });
};


// ✅ Function to Find Parent and Add Children in Correct Position
// const updateNestedChildren = (items: AccardionItem[], parentId: string, newChildren: AccardionItem[], isLoading: boolean): AccardionItem[] => {
//     return items.map((item) => {
//         if (item.id === parentId) {
//             return { ...item, children: isLoading ? undefined : newChildren, isLoading }; // ✅ Direct match
//         } else if (item.children) {
//             return { ...item, children: updateNestedChildren(item.children, parentId, newChildren, isLoading) }; // ✅ Recursively search in children
//         }
//         return item;
//     });
// };

const updateNestedChildren = (items: AccardionItem[], parentId: string, newChildren: AccardionItem[] | undefined, isLoading: boolean): AccardionItem[] => {
    return items.map((item) => {
        if (item._id === parentId) {
            return {
                ...item,
                children: newChildren !== undefined ? newChildren : item.children, // Keep existing children if `newChildren` is undefined
                isLoading
            };
        } else if (item.children) {
            return {
                ...item,
                children: updateNestedChildren(item.children, parentId, newChildren, isLoading)
            };
        }
        return item;
    });
};



interface Props {
    catalogType: 'labor' | 'material'
    // offerStatus: boolean;
    // fetchMyOffers: boolean;

    accountViewId?: string;
    canEdit?: boolean;
}

// ✅ Nested Accordion Component
export default function OfferPageThreeLevelAccordion(props: Props) {
    const { session, permissionsSet } = usePermissions();
    const [t] = useTranslation()

    const [searchVal, setSearchVal] = React.useState('');


    const [items, setItems] = useState<AccardionItem[]>([]);
    const [offerItemId, setOfferItemId] = React.useState<string | null>(null);
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(true);
    const [progIndic, setProgIndic] = React.useState(false);

    const [offerItemDetailsd, setOfferItemDetailsId] = React.useState<string | null>(null);
    const [offerItemName, setOfferItemName] = React.useState<string | null>(null);
    const [offerItemEditId, setOfferItemEditId] = React.useState<string | null>(null);

    const [offerItemIdDialog, setOfferItemIdDialog] = React.useState<string | null>(null);

    const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string | null>('All')
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>('all');
    const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = React.useState<string | null>('All')
    const [selectedSubcategoryId, setSelectedSubcategoryId] = React.useState<string | null>('all');

    const selectedFiltersDataRef = React.useRef<SelectedFiltersDataProps>({
        categoryId: null,
        subcategoryId: null,
    });

    const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);


    React.useEffect(() => {
        setExpandedAccordions([])
        setDataRequested(false)
    }, [props.catalogType])


    React.useEffect(() => {
        setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {
            // console.log('I am here')
            if (props.catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborCategory[]>({
                    command: props.accountViewId ? `labor/fetch_current_account_offers_categories` : `labor/fetch_categories`,
                    args: {
                        accountViewId: props.accountViewId ?? '',
                        searchVal: searchVal
                    },
                    // args: { estimateName: estimateName }
                })
                    .then(laborCategoriesResData => {
                        if (mounted.current) {

                            // console.log('labor categories: ', d)
                            let laborCategoriesData: LaborCategoryDisplayData[] = [];

                            for (let laborCat of laborCategoriesResData) {
                                laborCategoriesData.push(new LaborCategoryDisplayData(laborCat));
                            }

                            const accordionData = [] as any;

                            laborCategoriesData.forEach(chosenCategory => {
                                accordionData.push({
                                    _id: chosenCategory._id,
                                    label: chosenCategory.name,
                                    code: chosenCategory.code,
                                    childrenQuantity: chosenCategory.childrenQuantity,
                                    children: []
                                    // content: (<AdminPageSubcategory />),
                                })
                            });

                            setItems(accordionData)
                        }
                        setProgIndic(false)

                    })
                setDataRequested(true);

                return;
            } else if (props.catalogType === 'material') {
                setProgIndic(true)

                Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
                    // command: `material/fetch_categories`,
                    command: props.accountViewId ? 'material/fetch_current_account_offers_categories' : 'material/fetch_categories',
                    args: {
                        accountViewId: props.accountViewId ?? '',
                        searchVal: searchVal
                    },
                    // args: { estimateName: estimateName }
                })
                    .then(materialCategoriesResData => {
                        if (mounted.current) {

                            // console.log('labor categories: ', d)
                            let materialCategoriesData: MaterialCategoryDisplayData[] = [];

                            for (let materialCat of materialCategoriesResData) {
                                materialCategoriesData.push(new MaterialCategoryDisplayData(materialCat));
                            }

                            const accordionData = [] as any;

                            materialCategoriesData.forEach(chosenCategory => {
                                accordionData.push({
                                    _id: chosenCategory._id,
                                    label: chosenCategory.name,
                                    code: chosenCategory.code,
                                    childrenQuantity: chosenCategory.childrenQuantity,
                                    children: []
                                    // content: (<AdminPageSubcategory />),
                                })
                            });

                            setItems(accordionData)
                        }
                        setProgIndic(false)

                    })
                setDataRequested(true);

                return;
            }
        }
        return () => { mounted.current = false }
    }, [dataRequested]);



    // const handleClick = (event) => {
    //     setAnchorEl(event.currentTarget);
    // };
    // const handleClose = () => {
    //     setAnchorEl(null);
    // };
    // const handleEdit = (currentOfferItemEditId: string) => {
    //     setOfferItemEditId(currentOfferItemEditId)
    //     setAnchorEl(null);
    // };
    // const handleArchive = (currentOfferItemEditId: string) => {
    //     setOfferItemArchiveId(currentOfferItemEditId)
    //     setAnchorEl(null);
    // };

    const handleAccordionChange = (id: string, fullCode: string, level: number) => async (_event: React.SyntheticEvent, isExpanded: boolean) => {
        if (isExpanded) {
            await fetchChildren(id, level); // Fetch data when opening the accordion
            console.log(fullCode)
            setExpandedAccordions((prev) => [...prev, fullCode]); // Add this accordion (fullCode) to expanded state
        } else {
            console.log(fullCode)
            if (level === 2) {
                // If closing Level 2 (Category), fully collapse everything inside (Levels 3 & 4)
                setExpandedAccordions((prev) => prev.filter((code) => !code.startsWith(fullCode))); // Collapse all sub-levels (e.g., Level 3 & Level 4)
                setItems((prevItems) => collapseChildren(prevItems, fullCode, true)); // Collapse all children inside Level 2 (Subcategories and Items)
            } else if (level === 3) {
                // If closing Level 3 (Subcategory), remove all Level 4 accordions but KEEP Level 3 open
                setExpandedAccordions((prev) => prev.filter((code) => code !== fullCode && !code.startsWith(fullCode))); // Collapse all Level 4 children of this Level 3
                setItems((prevItems) => collapseChildren(prevItems, fullCode, true)); // Collapse Level 4, but keep Level 3
            } else if (level === 4) {
                // If closing Level 4 (Item), just remove it from expandedAccordions (collapse table)
                setExpandedAccordions((prev) => prev.filter((code) => code !== fullCode));
            }
        }
    };

    // Utility function to collapse children based on fullCode
    const collapseChildren = (items: AccardionItem[], parentFullCode: string, collapseAll: boolean): AccardionItem[] => {
        return items.map((item) => {
            if (item.fullCode === parentFullCode) {
                return { ...item, children: collapseAll ? [] : item.children }; // Collapse children (reset) when closing
            } else if (item.children) {
                return {
                    ...item,
                    children: collapseChildren(item.children, parentFullCode, collapseAll), // Recursively collapse children if applicable
                };
            }
            return item;
        });
    };




    const refreshOffersData = async () => {
        if (!items) return; // If there are no items, do nothing
        console.log('items', items)

        // Find all expanded Level 3 items (that should have offers)
        const updatedItems = await Promise.all(
            items.map(async (category) => ({
                ...category,
                children: await Promise.all(
                    (category.children || []).map(async (subcategory) => ({
                        ...subcategory,
                        children: await Promise.all(
                            (subcategory.children || []).map(async (item) => {
                                if (expandedAccordions.includes(item.fullCode)) {
                                    const offers = await fetchData(item._id, 4, props.accountViewId, props.catalogType, searchVal, selectedFiltersDataRef.current);
                                    return { ...item, children: offers, isLoading: false };
                                }
                                return item;
                            })
                        ),
                    }))
                ),
            }))
        );

        setItems(updatedItems);
    };



    const fetchChildren = async (parentId: string, level: number): Promise<void> => {
        // console.log('fetchedData items', items)
        // console.log('fetchedData parentId', parentId)

        // setItems((prevItems) =>
        //     prevItems.map((item) =>
        //         item.id === parentId ? { ...item, isLoading: true } : item
        //     )
        // );
        setItems((prevItems) => updateNestedChildren(prevItems, parentId, undefined, true));



        const fetchedData = await fetchData(parentId, level, props.accountViewId, props.catalogType, searchVal, selectedFiltersDataRef.current);

        const newData: AccardionItem[] = [] as AccardionItem[];
        console.log('fetchedData', fetchedData)
        fetchedData.forEach((item) => {
            let itemArr: AccardionItem = {} as AccardionItem;
            itemArr._id = item._id;
            itemArr.label = item.name
            itemArr.children = [];
            itemArr.isLoading = false;
            itemArr.fullCode = item.fullCode
            itemArr.code = item.code,
                itemArr.categoryFullCode = item.categoryFullCode,
                // itemArr.cod
                itemArr.laborHours = item.laborHours //🔴 TODO: this will need us in version 2 🔴
            itemArr.measurementUnitRepresentationSymbol = item.measurementUnitRepresentationSymbol
            if (item.averagePrice) {
                // itemArr.averagePrice = item.averagePrice.toFixed(0);
                itemArr.averagePrice = fixedToThree(item.averagePrice);
            }
            itemArr.itemFullCode = item.itemFullCode
            itemArr.accountName = item.accountName
            itemArr.price = item.price;
            itemArr.createdAt = item.createdAt;
            itemArr.isArchived = item.isArchived;
            itemArr.updatedAt = item.updatedAt;

            itemArr.childrenQuantity = item.childrenQuantity;


            newData.push(itemArr);
        })

        console.log('newData', newData)
        setItems((prevItems) => updateNestedChildren(prevItems, parentId, newData, false));


    };


    const onArchiveStatusChange = React.useCallback(async (checked: boolean, offerId: string) => {

        // confirmDialog('Are you sure?').then((result) => {
        //     if (result.isConfirmed) {

        let cmd = checked ? 'archive_offer' : 'unarchive_offer';

        Api.requestSession<any>({ //TODO change any to interface
            command: `${props.catalogType}/${cmd}`,
            args: {
                itemOfferId: offerId,
            }
        })
            .then((removedMaterial) => {
                // console.log(removedMaterial);
                // props.onConfirm();

                // refreshOffersData()

            })
            .finally(() => {
                // setDataRequested(false);
                // setEstimatedMaterialId(null);
                // estimatedMaterialIdRef.current = null;
                // setEstimatedMaterialName(null);
            });
        // }
        // });

        // console.log('itemOfferId', itemOfferId)
        // let cmd = `${props.catalogType}/${checked ? 'archive_offer' : 'unarchive_offer'}`
        // await Api.requestSession<any>({
        //     command: cmd,
        //     args: {
        //         itemOfferId: itemOfferId,
        //     },
        // })
    }, [])





    const onSearch = React.useCallback((value: string) => {
        setSearchVal(value);

        // if (value === '') {

        //     return
        // }
        // let cmd = `${props.catalogType}/search'`
        // console.log('cmd', cmd)
        if (props.catalogType === 'labor') {
            Api.requestSession<any>({
                // command: 'labor/fetch_categories',
                command: props.accountViewId ? `labor/fetch_current_account_offers_categories` : `labor/fetch_categories`,
                args: {
                    accountViewId: props.accountViewId ?? '',
                    searchVal: value ?? ' ',
                },
                json: selectedFiltersDataRef.current,
            }).then(laborCategoriesResData => {

                let laborCategoriesData: LaborCategoryDisplayData[] = [];

                for (let laborCat of laborCategoriesResData) {
                    laborCategoriesData.push(new LaborCategoryDisplayData(laborCat));
                }

                const accordionData = [] as any;

                laborCategoriesData.forEach(chosenCategory => {
                    accordionData.push({
                        _id: chosenCategory._id,
                        label: chosenCategory.name,
                        code: chosenCategory.code,
                        childrenQuantity: chosenCategory.childrenQuantity,
                        children: []
                        // content: (<AdminPageSubcategory />),
                    })
                });

                setExpandedAccordions([])

                setItems(accordionData)
            })
        } else if (props.catalogType === 'material') {
            Api.requestSession<any>({
                // command: 'material/fetch_categories',
                command: props.accountViewId ? 'material/fetch_current_account_offers_categories' : 'material/fetch_categories',
                args: {
                    accountViewId: props.accountViewId ?? '',
                    searchVal: value ?? '',
                },
                json: selectedFiltersDataRef.current,
            }).then(materialCategoriesResData => {

                // console.log('labor categories: ', d)
                let materialCategoriesData: MaterialCategoryDisplayData[] = [];

                for (let materialCat of materialCategoriesResData) {
                    materialCategoriesData.push(new MaterialCategoryDisplayData(materialCat));
                }

                const accordionData = [] as any;

                materialCategoriesData.forEach(chosenCategory => {
                    accordionData.push({
                        _id: chosenCategory._id,
                        label: chosenCategory.name,
                        code: chosenCategory.code,
                        childrenQuantity: chosenCategory.childrenQuantity,
                        children: []
                        // content: (<AdminPageSubcategory />),
                    })
                });

                setExpandedAccordions([])

                setItems(accordionData)
            });
        }


    }, []);


    const categorySelectList = useApiFetchMany<Api.ApiLaborCategory | Api.ApiMaterialCategory>({
        api: {
            command: props.catalogType === 'labor'
                ? (props.accountViewId ? `labor/fetch_current_account_offers_categories` : `labor/fetch_categories`)
                : (props.accountViewId ? `material/fetch_current_account_offers_categories` : `material/fetch_categories`),
            args: {
                accountViewId: props.accountViewId ?? '',
            }

        },
    });

    const subcategorySelectList = useApiFetchMany<Api.ApiLaborSubcategory | Api.ApiMaterialSubcategory>({
        defer: true,
        api: {
            command: props.catalogType === 'labor'
                ? (props.accountViewId ? `labor/fetch_current_account_offers_subcategories` : `labor/fetch_subcategories`)
                : (props.accountViewId ? `material/fetch_current_account_offers_subcategories` : `material/fetch_subcategories`),
            args: {
                accountViewId: props.accountViewId ?? '',
            }
        },

    });



    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />
    }


    if (subcategorySelectList.loading && (selectedCategoryFilter && selectedCategoryFilter !== 'All')) {
        return <ProgressIndicator show={subcategorySelectList.loading} background='backdrop' />
    }

    if (categorySelectList.loading && categorySelectList.data === undefined) {
        return <ProgressIndicator show={categorySelectList.loading} background='backdrop' />
    }


    return (
        <>
            <Toolbar disableGutters sx={{ backgroundColor: 'inherit' }}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">

                    <PageSelect
                        withAll={true}
                        sx={{ minWidth: 300 }}
                        onSelected={(selected) => {
                            if (selected?.label) {
                                setSelectedCategoryFilter(selected.label);
                                setSelectedCategoryId(selected.id);

                                if (selected?.id === 'all') {
                                    setSelectedCategoryFilter(null);
                                    selectedFiltersDataRef.current.categoryId = null;
                                    selectedFiltersDataRef.current.subcategoryId = null;
                                } else {
                                    if (selected.id !== selectedFiltersDataRef.current.categoryId) {
                                        selectedFiltersDataRef.current.subcategoryId = null;
                                        subcategorySelectList.data = undefined;
                                        subcategorySelectList.setApi({
                                            // command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                                            command: props.catalogType === 'labor'
                                                ? (props.accountViewId ? `labor/fetch_current_account_offers_subcategories` : `labor/fetch_subcategories`)
                                                : (props.accountViewId ? `material/fetch_current_account_offers_subcategories` : `material/fetch_subcategories`),
                                            args: { accountViewId: props.accountViewId ?? '', categoryMongoId: selected.id }
                                        });
                                    }

                                    selectedFiltersDataRef.current.categoryId = selected.id;
                                }

                                onSearch(searchVal)
                            } else {
                                setSelectedCategoryFilter('All');
                                setSelectedCategoryId(null);
                                setSelectedSubcategoryFilter('All');
                                setSelectedSubcategoryId(null);

                                selectedFiltersDataRef.current.subcategoryId = null;
                                selectedFiltersDataRef.current.categoryId = null;

                                subcategorySelectList.data = undefined;

                                categorySelectList.data = undefined;
                                categorySelectList.setApi({
                                    // command: props.catalogType === 'labor' ? `labor/fetch_categories` : `material/fetch_categories`,
                                    command: props.catalogType === 'labor'
                                        ? (props.accountViewId ? `labor/fetch_current_account_offers_categories` : `labor/fetch_categories`)
                                        : (props.accountViewId ? `material/fetch_current_account_offers_categories` : `material/fetch_categories`),
                                    args: {
                                        accountViewId: props.accountViewId ?? '',
                                    }

                                });



                                console.log('selectedFiltersDataRef.current', selectedFiltersDataRef.current)
                                onSearch(searchVal)

                            }
                        }}
                        items={
                            categorySelectList.data
                                ? categorySelectList.data
                                    .filter((unit, index, self) =>
                                        index === self.findIndex(u => u.name === unit.name)
                                    )
                                    .map((unit) => ({
                                        key: unit._id,
                                        id: unit._id,
                                        name: unit.name,
                                        label: unit.name,
                                    }))

                                : []
                        }
                        value={selectedCategoryId ?? "All"}
                        label={'Category'}
                    />

                    {/* {selectedCategoryFilter && subcategorySelectList.data && */}
                    <PageSelect
                        withAll={true}
                        sx={{ minWidth: 300 }}
                        readonly={!(selectedCategoryFilter && subcategorySelectList.data)}
                        onSelected={(selected) => {
                            console.log('selected', selected)
                            if (selected) {
                                // setItems([])
                                // setExpandedAccordions([])
                                setSelectedSubcategoryFilter(selected.label);
                                setSelectedSubcategoryId(selected.id);

                                if (selected?.id === 'all') {
                                    selectedFiltersDataRef.current.subcategoryId = null;
                                } else {
                                    selectedFiltersDataRef.current.subcategoryId = selected.id;
                                }

                                onSearch(searchVal)

                            } else {
                                setSelectedSubcategoryFilter('All');
                                setSelectedSubcategoryId('all');
                                selectedFiltersDataRef.current.subcategoryId = null;

                                subcategorySelectList.data = undefined;
                                subcategorySelectList.setApi({
                                    // command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                                    command: props.catalogType === 'labor'
                                        ? (props.accountViewId ? `labor/fetch_current_account_offers_subcategories` : `labor/fetch_subcategories`)
                                        : (props.accountViewId ? `material/fetch_current_account_offers_subcategories` : `material/fetch_subcategories`),
                                    args: { accountViewId: props.accountViewId ?? '', categoryMongoId: selectedFiltersDataRef.current.categoryId }
                                });

                                onSearch(searchVal)

                            }
                        }}
                        items={
                            subcategorySelectList.data
                                ? subcategorySelectList.data
                                    .filter((unit, index, self) =>
                                        index === self.findIndex(u => u.name === unit.name)
                                    )
                                    .map((unit) => ({
                                        key: unit._id,
                                        id: unit._id,
                                        name: unit.name,
                                        label: unit.name,
                                    }))
                                : []

                        }
                        value={selectedSubcategoryId ?? "All"} // value should be the id of the selected item
                        label={'Subcategory'}
                    />

                </Stack>
            </Toolbar>
            <Stack >
                {/* <Stack spacing={2}> */}

                {items.map((item) => (
                    // <Accordion key={item.id} expanded={expandedAccordions.includes(item.id)} onChange={handleAccordionChange(item.id, 2)}>
                    <EstimateRootAccordion key={item._id}
                        expanded={expandedAccordions.includes(item.code)}
                        onChange={handleAccordionChange(item._id, item.code, 2)}
                    >

                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
                            display: 'flex',
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            gap: '8px',
                            paddingLeft: '10px',
                            // position: 'relative',
                        }}>

                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography>{item.code}</Typography>
                                <Typography sx={{ minWidth: 530, maxWidth: 700, wordBreak: 'break-word' }}>
                                    {item.label}&nbsp;
                                    <Typography
                                        component="span"
                                        sx={{ fontWeight: 'inherit' }}
                                    >
                                        {(typeof item.childrenQuantity === 'number' &&
                                            !isNaN(item.childrenQuantity) &&
                                            item.childrenQuantity > 0)
                                            ? `(${item.childrenQuantity})`
                                            : '(0)'}
                                    </Typography>
                                </Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{
                            position: 'relative',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 20,
                                top: 0,
                                width: '2px',
                                height: '100%',
                                // backgroundColor: '#000',
                                backgroundColor: accordionBorderColor,
                            },
                            backgroundColor: mainBackgroundColor,
                        }}>
                            {item.isLoading ? (
                                <CircularProgress size={24} sx={{ ml: 4 }} />
                            ) : item.children && item.children.length > 0 ? (
                                <Stack spacing={2} sx={{ ml: 4 }}>

                                    {item.children.map((child) => (
                                        child.children ? (
                                            // ✅ Level 2 & 3: Nested Accordion
                                            // <Accordion key={child.id} expanded={expandedAccordions.includes(`${item.fullCode + child.fullCode}`)} onChange={handleAccordionChange(`${item.fullCode + child.fullCode}`, 3)}>
                                            <EstimateChildAccordion key={child._id} expanded={expandedAccordions.includes(child.categoryFullCode)} onChange={handleAccordionChange(child._id, child.categoryFullCode, 3)}>

                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row-reverse',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    paddingLeft: '10px',
                                                    // position: 'relative',
                                                }}>
                                                    {/* Left Side: Label & Count */}
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography>{child.code}</Typography>
                                                        <Typography sx={{ minWidth: 530, maxWidth: 700, wordBreak: 'break-word' }}>
                                                            {child.label}&nbsp;
                                                            <Typography
                                                                component="span"
                                                                sx={{ fontWeight: 'inherit' }}
                                                            >
                                                                {(typeof child.childrenQuantity === 'number' &&
                                                                    !isNaN(child.childrenQuantity) &&
                                                                    child.childrenQuantity > 0)
                                                                    ? `(${child.childrenQuantity})`
                                                                    : '(0)'}
                                                            </Typography>
                                                        </Typography>
                                                    </Stack>

                                                    {/* {child.label} */}
                                                </AccordionSummary>
                                                <AccordionDetails sx={{
                                                    position: 'relative',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        left: 20,
                                                        top: 0,
                                                        width: '2px',
                                                        height: '100%',
                                                        // backgroundColor: '#000',
                                                        backgroundColor: accordionBorderColor,
                                                    },
                                                    backgroundColor: mainBackgroundColor,
                                                }}>
                                                    {child.isLoading ? (
                                                        <CircularProgress size={24} sx={{ ml: 4 }} />
                                                    ) : (
                                                        child.children && child.children.length > 0 ? (
                                                            <Stack spacing={2} sx={{ ml: 4 }}>

                                                                {child.children.map((subChild) => (
                                                                    // ✅ Level 3 & 4: Wrap DataGrid inside an Accordion
                                                                    // <Accordion key={subChild.id} expanded={expandedAccordions.includes(subChild.id)} onChange={handleAccordionChange(subChild.id, 4)}>
                                                                    <EstimateSubChildAccordion key={subChild._id} expanded={expandedAccordions.includes(subChild.fullCode)} onChange={handleAccordionChange(subChild._id, subChild.fullCode, 4)}>

                                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
                                                                            display: 'flex',
                                                                            flexDirection: 'row-reverse',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            paddingLeft: '10px',
                                                                            // position: 'relative',
                                                                        }}>
                                                                            {/* Left Side: Label & Count */}
                                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                                <Typography>{subChild.code}</Typography>
                                                                                <Typography sx={{ maxWidth: 650, wordBreak: 'break-word' }}>
                                                                                    {subChild.label}&nbsp;
                                                                                    <Typography
                                                                                        component="span"
                                                                                        sx={{ fontWeight: 'inherit' }}
                                                                                    >
                                                                                        {(typeof subChild.childrenQuantity === 'number' &&
                                                                                            !isNaN(subChild.childrenQuantity) &&
                                                                                            subChild.childrenQuantity > 0)
                                                                                            ? `(${subChild.childrenQuantity})`
                                                                                            : '(0)'}
                                                                                    </Typography>
                                                                                </Typography>
                                                                            </Stack>

                                                                        </AccordionSummary>
                                                                        <AccordionDetails
                                                                        //  sx={{
                                                                        //     position: 'relative',
                                                                        //     '&::before': {
                                                                        //         content: '""',
                                                                        //         position: 'absolute',
                                                                        //         left: 20,
                                                                        //         top: 0,
                                                                        //         width: '2px',
                                                                        //         height: '100%',
                                                                        //         backgroundColor: '#000',
                                                                        //     },
                                                                        // }}
                                                                        >
                                                                            {subChild.isLoading ? (
                                                                                <CircularProgress size={24} sx={{ ml: 4 }} />
                                                                            ) : (
                                                                                <DataTableComponent
                                                                                    sx={{ width: '100%', }}
                                                                                    columns={[
                                                                                        // { field: 'itemFullCode', headerName: t('ID'), headerAlign: 'left', flex:0.2},
                                                                                        { field: 'accountName', headerName: t('Company'), headerAlign: 'left', flex: 0.6, disableColumnMenu: true },
                                                                                        // { field: 'laborHours', headerName: t('Work per hour'), headerAlign: 'left', flex: 0.2 },
                                                                                        ...(props.catalogType === 'labor'
                                                                                            ? [
                                                                                                {
                                                                                                    field: "laborHours",
                                                                                                    headerName: t("Work per hour"),
                                                                                                    headerAlign: "center",
                                                                                                    align: "center",
                                                                                                    flex: 0.2,

                                                                                                } as GridActionsColDef,
                                                                                            ]
                                                                                            : []),

                                                                                        { field: 'measurementUnitRepresentationSymbol', headerName: t('Unit'), headerAlign: 'left', flex: 0.1, disableColumnMenu: true },
                                                                                        { field: 'price', headerName: t('Price'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true },
                                                                                        {
                                                                                            field: 'createdAt', type: 'dateTime', headerName: t('Uploaded'), headerAlign: 'left', align: 'left', flex: 0.3, valueFormatter: (params: any) =>
                                                                                                moment(params).format('DD.MM.YYYY HH:mm'),
                                                                                            disableColumnMenu: true
                                                                                        },
                                                                                        {
                                                                                            field: 'updatedAt', type: 'dateTime', headerName: t('Updated'), headerAlign: 'left', align: 'left', flex: 0.3, valueFormatter: (params: any) =>
                                                                                                moment(params).format('DD.MM.YYYY HH:mm'),
                                                                                            disableColumnMenu: true
                                                                                        },
                                                                                        // {
                                                                                        //     field: 'isArchived', type: 'actions', headerName: t('Archived Status'), flex: 0.2, renderCell: (cell) => {

                                                                                        //         return <>
                                                                                        //             <F.InputCheckbox id='isArchived' value={cell.row.isArchived} data={cell.row.isArchived} form={form} onChange={(checked) => { onArchiveStatusChange(checked, cell.row._id) }} xsMax />

                                                                                        //         </>;
                                                                                        //     }
                                                                                        // }, 
                                                                                        // {
                                                                                        //     field: 'info', type: 'actions', headerName: t('Edit'), flex: 0.2, renderCell: (cell) => {
                                                                                        //         return <>
                                                                                        //             <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                                        //                 // console.log('cell', cell)
                                                                                        //                 // setOfferItemName(cell.row.itemName)
                                                                                        //                 // setOfferItemDetailsId(cell.id as string)
                                                                                        //                 console.log('aaaa cell', cell)
                                                                                        //                 setOfferItemEditId(cell.row._id as string)
                                                                                        //                 // handleClick(event);

                                                                                        //             }
                                                                                        //             }
                                                                                        //             >
                                                                                        //                 <EditOutlinedIcon />
                                                                                        //             </IconButton>
                                                                                        //         </>;
                                                                                        //     }
                                                                                        // }, 
                                                                                        ...(
                                                                                            ((props.catalogType === 'labor' && permissionsSet?.has?.('OFF_CRT_LBR')) ||
                                                                                                (props.catalogType === 'material' && permissionsSet?.has?.('OFF_CRT_MTRL'))) && props.canEdit
                                                                                                ? [
                                                                                                    {
                                                                                                        field: 'isArchived',
                                                                                                        type: 'actions',
                                                                                                        headerName: t('Archived Status'),
                                                                                                        flex: 0.2,
                                                                                                        renderCell: (cell) => (
                                                                                                            <Checkbox
                                                                                                                // id="isArchived"
                                                                                                                value={cell.row.isArchived}
                                                                                                                // checked={cell.row.isArchived}
                                                                                                                defaultChecked={cell.row.isArchived}
                                                                                                                onChange={(event) => onArchiveStatusChange(event.target.checked, cell.row._id)}
                                                                                                            />
                                                                                                        )
                                                                                                    } as GridActionsColDef,
                                                                                                    {
                                                                                                        field: 'info',
                                                                                                        type: 'actions',
                                                                                                        headerName: t('Edit'),
                                                                                                        flex: 0.2,
                                                                                                        renderCell: (cell) => (
                                                                                                            <IconButton
                                                                                                                onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                                                                    console.log('Cell:', cell);
                                                                                                                    setOfferItemEditId(cell.row._id as string);
                                                                                                                }}
                                                                                                            >
                                                                                                                <EditOutlinedIcon />
                                                                                                            </IconButton>
                                                                                                        )
                                                                                                    } as GridActionsColDef,
                                                                                                ]
                                                                                                : []
                                                                                        )
                                                                                    ]}
                                                                                    rows={subChild.children ?? []}
                                                                                    disableRowSelectionOnClick
                                                                                    getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                                                                />

                                                                            )}
                                                                            {/* {session?.user && permissionsSet?.has?.('OFF_VW_LOC_LBR') && } */}
                                                                            {session?.user && (
                                                                                ((props.catalogType === 'labor' && permissionsSet?.has?.('OFF_CRT_LBR'))
                                                                                    ||
                                                                                    (props.catalogType === 'material' && permissionsSet?.has?.('OFF_CRT_MTRL'))) && props.canEdit
                                                                            ) && (
                                                                                    subChild.children && subChild.children.length > 0 ? (
                                                                                        <Button
                                                                                            fullWidth
                                                                                            sx={{
                                                                                                border: '1px dashed green',
                                                                                                color: mainIconColor,
                                                                                                background: 'rgba(0, 255, 0, 0.04)'
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                const firstOfferId = subChild.children?.[0]?._id;
                                                                                                if (firstOfferId) {
                                                                                                    setOfferItemEditId(firstOfferId);
                                                                                                }
                                                                                            }}
                                                                                        >

                                                                                            {t('edit Offer')}
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <Button
                                                                                            fullWidth
                                                                                            sx={{
                                                                                                border: '1px dashed rgba(151, 71, 255)',
                                                                                                color: 'rgba(151, 71, 255)',
                                                                                                background: 'rgba(151, 71, 255, 0.04)'
                                                                                            }}
                                                                                            onClick={() => setOfferItemIdDialog(subChild._id)}
                                                                                        >
                                                                                            {t('add Offer')}
                                                                                        </Button>
                                                                                    )
                                                                                )}
                                                                            {/* <Button fullWidth sx={{ border: '1px dashed rgba(151, 71, 255)', color: ' rgba(151, 71, 255)', background: 'rgba(151, 71, 255, 0.04)' }} onClick={() => setOfferItemIdDialog(subChild._id)}>{t('add Offer')}</Button> */}

                                                                        </AccordionDetails>
                                                                    </EstimateSubChildAccordion>
                                                                ))}
                                                            </Stack>

                                                        ) : (
                                                            <Typography sx={{ ml: 4 }}>{t("No more data")}</Typography>
                                                        )
                                                    )}
                                                </AccordionDetails>
                                            </EstimateChildAccordion>
                                        ) : null
                                    ))}
                                </Stack>

                            ) : (
                                <Typography sx={{ ml: 4 }}>{t("No more data")}</Typography>
                            )}
                        </AccordionDetails>
                    </EstimateRootAccordion>
                ))}
            </Stack >


            {offerItemEditId && <UserPageOfferEditDialog offerItemName={offerItemName} offerType={props.catalogType} offerMongoId={offerItemEditId} onClose={() => {
                setOfferItemEditId(null); setOfferItemDetailsId(null); setOfferItemName(null)
            }} onConfirm={refreshOffersData} />
            }

            {/* {
                offerItemDetailsd && <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem onClick={() => { handleEdit(offerItemDetailsd) }}>Edit</MenuItem>
                    <MenuItem onClick={() => { handleArchive(offerItemDetailsd) }}>Archive</MenuItem>
                </Menu>
            } */}

            {/* {openAddOfferDialogType && <UserPageAddOfferDialog offerType={openAddOfferDialogType} onClose={() => { setOpenAddOfferDialogType(null) }} />} */}
            {offerItemIdDialog && <UserPageAddOfferDetailsDialog catalogType={props.catalogType} offerItemMongoId={offerItemIdDialog} onClose={() => setOfferItemIdDialog(null)} onConfirm={refreshOffersData} />}
        </>
    )
}
