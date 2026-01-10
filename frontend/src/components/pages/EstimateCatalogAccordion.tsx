import React, { useCallback, useRef, useState } from "react";
import { AccordionSummary, AccordionDetails, CircularProgress, Typography, IconButton, Menu, MenuItem, Toolbar, Stack } from "@mui/material";

import { useTranslation } from "react-i18next";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import * as Api from 'api';
import * as LaborsApi from 'api/labor'
import * as MaterialsApi from 'api/material'
import { LaborCategoryDisplayData, LaborItemDisplayData, LaborSubcategoryDisplayData } from "../../data/labor_display_data";
import { GridActionsColDef } from "@mui/x-data-grid";
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import { MaterialCategoryDisplayData, MaterialItemDisplayData, MaterialSubcategoryDisplayData } from "../../data/material_display_data";
import ProgressIndicator from "../../tsui/ProgressIndicator";
import SearchComponent from "../SearchComponent";
import { useApiFetchMany } from "../ApiDataFetch";
import UserPageAddOfferDetailsDialog from "../../app/offers/UserPageAddOfferDetailsDIalog";
import { UserPageOfferEditDialog } from "../../app/offers/UserPageOfferEditDIalog";
import SpacerComponent from "../SpacerComponent";
import UserPageAddEstimationItemDetailsDialog from "../../app/offers/UserPageAddEstimationItemDetailsDIalog";
import EstimateAddItemFromOffersDialog from "../estimate/EstimateAddItemFromOffersDialog";
import DataTableComponent from "../DataTableComponent";

import { accordionBorderColor, mainBackgroundColor } from "../../theme";
import { EstimateChildAccordion, EstimateRootAccordion } from "../AccordionComponent";


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
    measurementUnitMongoId?: string;
    averagePrice?: string
    laborHours?: number; //🔴 TODO: this will need us in version 2 🔴

    itemFullCode?: string;
    accountName?: string;
    price?: string;
    createdAt?: Date
    updatedAt?: Date

    childrenQuantity?: number;

}

// ✅ Simulated API Call (Replace with real API)
const fetchData = async (parentId: string, level: number, catalogType: 'labor' | 'material', searchVal: string, selectedFiltersData: SelectedFiltersDataProps) => {
    return new Promise<any[]>((resolve) => {
        if (level === 2) {
            if (catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborSubcategory[]>({
                    command: `labor/fetch_subcategories`,
                    args: { categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                })
                    .then(laborSubcategoriesResData => {
                        // console.log('laborSubcategoriesResData', laborSubcategoriesResData)
                        // if (mounted.current) {

                        // console.log('labor subcategories: ', laborSubcategoriesResData)
                        let laborSubcategoriesData: LaborSubcategoryDisplayData[] = [];

                        for (let laborSubcat of laborSubcategoriesResData) {
                            laborSubcategoriesData.push(new LaborSubcategoryDisplayData(laborSubcat));
                        }

                        resolve(laborSubcategoriesData);
                        // console.log('laborSubcategoriesData', laborSubcategoriesData)
                        // setLaborSubcategories(laborSubcategoriesData)
                        // setProgIndic(false)

                    })
            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialSubcategory[]>({
                    command: `material/fetch_subcategories`,
                    args: { categoryMongoId: parentId, searchVal: searchVal },
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
                    command: 'labor/fetch_items_with_average_price',
                    args: { subcategoryMongoId: parentId, searchVal: searchVal, isSorting: true, calledFromPage: 'estCatAccordion' }
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
                    command: 'material/fetch_items_with_average_price',
                    args: { subcategoryMongoId: parentId, searchVal: searchVal, isSorting: true, calledFromPage: 'estCatAccordion' }
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



interface EstimateCatalogAccordionProps {
    catalogType: 'labor' | 'material'
    onConfirm: () => void;
    estimateSectionId?: string | null;
    estimateSubsectionId?: string | null;

    estimatedLaborId?: string | null;
}

// ✅ Nested Accordion Component
export default function EstimateCatalogAccordion(props: EstimateCatalogAccordionProps) {
    // const form = F.useForm({ type: 'input' });
    const mounted = useRef(false);

    const [searchVal, setSearchVal] = useState('');

    const [items, setItems] = useState<AccardionItem[]>([]);
    const [offerItemId, setOfferItemId] = useState<string | null>(null);
    const [dataRequested, setDataRequested] = useState(true);
    const [progIndic, setProgIndic] = useState(false);

    const [offerItemDetailsd, setOfferItemDetailsId] = React.useState<string | null>(null);
    const [offerItemName, setOfferItemName] = React.useState<string | null>(null);
    const [averagePrice, setAveragePrice] = React.useState<number | null>(null);
    const [laborHours, setLaborHours] = React.useState<number | null>(null); //🔴 TODO: this will need us in version 2 🔴
    let [offerItemMeasurementUnitMongoId, setOfferItemMeasurementUnitMongoId] = React.useState<string | null>(null);

    const [offerItemEditId, setOfferItemEditId] = React.useState<string | null>(null);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [offerItemArchiveId, setOfferItemArchiveId] = React.useState<string | null>(null);

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
    const [t] = useTranslation();

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
                    command: `labor/fetch_categories`,
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
                    command: `material/fetch_categories`,
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



    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleEdit = (currentOfferItemEditId: string) => {
        setOfferItemEditId(currentOfferItemEditId)
        setAnchorEl(null);
    };
    const handleArchive = (currentOfferItemEditId: string) => {
        setOfferItemArchiveId(currentOfferItemEditId)
        setAnchorEl(null);
    };

    const handleAccordionChange = (id: string, fullCode: string, level: number) => async (_event: React.SyntheticEvent, isExpanded: boolean) => {
        if (isExpanded) {
            await fetchChildren(id, level); // Fetch data when opening the accordion
            // console.log(fullCode)
            setExpandedAccordions((prev) => [...prev, fullCode]); // Add this accordion (fullCode) to expanded state
        } else {
            // console.log(fullCode)
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
                                    const offers = await fetchData(item._id, 4, props.catalogType, searchVal, selectedFiltersDataRef.current);
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



        const fetchedData = await fetchData(parentId, level, props.catalogType, searchVal, selectedFiltersDataRef.current);

        const newData: AccardionItem[] = [] as AccardionItem[];
        // console.log('fetchedData', fetchedData)

        fetchedData.forEach((item) => {
            let itemArr: AccardionItem = {} as AccardionItem;
            itemArr._id = item._id;
            itemArr.label = item.name
            itemArr.children = [];
            itemArr.isLoading = false;
            itemArr.fullCode = item.fullCode;
            itemArr.code = item.code;
            itemArr.categoryFullCode = item.categoryFullCode;
            // itemArr.cod
            itemArr.laborHours = item.laborHours //🔴 TODO: this will need us in version 2 🔴
            itemArr.measurementUnitRepresentationSymbol = item.measurementUnitRepresentationSymbol;
            itemArr.measurementUnitMongoId = item.measurementUnitMongoId;
            if (item.averagePrice) {
                // itemArr.averagePrice = fixedToThree(item.averagePrice);
                itemArr.averagePrice = item.averagePrice.toFixed(0);
            }
            itemArr.itemFullCode = item.itemFullCode
            itemArr.accountName = item.accountName
            itemArr.price = item.price;
            itemArr.createdAt = item.createdAt;
            itemArr.updatedAt = item.updatedAt;

            itemArr.childrenQuantity = item.childrenQuantity;

            newData.push(itemArr);
        })

        // console.log('newData', newData)
        setItems((prevItems) => updateNestedChildren(prevItems, parentId, newData, false));
    };


    const onSearch = useCallback((value: string) => {
        setSearchVal(value);

        // if (value === '') {

        //     return
        // }
        // let cmd = `${props.catalogType}/search'`
        // console.log('cmd', cmd)
        if (props.catalogType === 'labor') {
            // console.log('selectedFiltersDataRef.', selectedFiltersDataRef.current)
            Api.requestSession<any>({
                command: 'labor/fetch_categories',
                args: {
                    searchVal: value ?? '',
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
                command: 'material/fetch_categories',
                args: {
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
            command: props.catalogType === 'labor' ? `labor/fetch_categories` : `material/fetch_categories`,
        },
    });

    const subcategorySelectList = useApiFetchMany<Api.ApiLaborSubcategory | Api.ApiMaterialSubcategory>({
        defer: true,
        api: {
            command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
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

                {/* <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                    <F.SelectField
                        form={form}
                        sx={{ minWidth: 300 }}
                        id="categorySearch"
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
                                            command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                                            args: { categoryMongoId: selected.id }
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
                                    command: props.catalogType === 'labor' ? `labor/fetch_categories` : `material/fetch_categories`,
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
                        label={t('Category')}
                        placeholder={selectedCategoryFilter ?? t('Category')}
                    />

                    <F.SelectField
                        form={form}
                        sx={{ minWidth: 300 }}
                        id="subcategorySearch"
                        readonly={!(selectedCategoryFilter && subcategorySelectList.data)}
                        onSelected={(selected) => {
                            console.log('selected', selected)
                            if (selected) {
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
                                    command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                                    args: { categoryMongoId: selectedFiltersDataRef.current.categoryId }
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
                        value={selectedSubcategoryId ?? "All"} 
                        label={t('Subcategory')}
                        placeholder={selectedSubcategoryFilter ?? t('Subcategory')}
                    />

                </Stack> */}
            </Toolbar>
            <Stack sx={{ mt: 2 }}>
                {items.map((item) => (
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
                                <Typography sx={{ wordBreak: 'break-word' }}>
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
                                                        {/* <Typography sx={{ minWidth: 530, maxWidth: 700, wordBreak: 'break-word' }}> */}
                                                        <Typography sx={{ wordBreak: 'break-word' }}>
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


                                                                <DataTableComponent
                                                                    sx={{ width: '100%', }}
                                                                    columns={[
                                                                        { field: 'fullCode', headerName: t('ID'), headerAlign: 'left', flex: 0.2, disableColumnMenu: true },
                                                                        { field: 'label', headerName: t('Name'), headerAlign: 'left', flex: 0.5, disableColumnMenu: true },
                                                                        ...(props.catalogType === 'labor'
                                                                            ? [
                                                                                {
                                                                                    field: "laborHours",
                                                                                    headerName: t("Labor Hours"),
                                                                                    align: "center",
                                                                                    flex: 0.2,
                                                                                } as GridActionsColDef,
                                                                            ]
                                                                            : []),

                                                                        // { field: 'laborHours', headerName: 'Labor Hours', headerAlign: 'left', flex: 0.2 }, //🔴 TODO: this will need us in version 2 🔴
                                                                        { field: 'measurementUnitRepresentationSymbol', headerName: t('Unit'), align: 'center', flex: 0.2 },
                                                                        { field: 'averagePrice', headerName: t('Average Price'), align: 'center', flex: 0.3 },
                                                                        // {
                                                                        //     field: 'createdAt', type: 'dateTime', headerName: 'Uploaded', headerAlign: 'left', align: 'left', width: 200, valueFormatter: (params: any) =>
                                                                        //         moment(params).format('DD.MM.YYYY HH:mm')
                                                                        // },
                                                                        // {
                                                                        //     field: 'updatedAt', type: 'dateTime', headerName: 'Updated', headerAlign: 'left', align: 'left', width: 200, valueFormatter: (params: any) =>
                                                                        //         moment(params).format('DD.MM.YYYY HH:mm')
                                                                        // },

                                                                        {
                                                                            field: 'info', type: 'actions', headerName: t('Add'), flex: 0.2, renderCell: (cell) => {
                                                                                return <>
                                                                                    <IconButton onClick={() => {
                                                                                        console.log('cell', cell)

                                                                                        //🔴 TODO: this will need us in version 2 🔴
                                                                                        if (props.catalogType === 'labor') {
                                                                                            let laborHours = (cell.row as LaborItemDisplayData).laborHours
                                                                                            if (laborHours !== undefined) {
                                                                                                setLaborHours(laborHours)
                                                                                            }

                                                                                        }
                                                                                        setAveragePrice(cell.row.averagePrice ? parseInt(cell.row.averagePrice) : null);
                                                                                        setOfferItemMeasurementUnitMongoId(cell.row.measurementUnitMongoId)
                                                                                        setOfferItemName(cell.row.label)
                                                                                        setOfferItemId(cell.row._id)

                                                                                    }
                                                                                    }

                                                                                    >
                                                                                        <AddToPhotosIcon />
                                                                                    </IconButton>
                                                                                </>;

                                                                            }
                                                                        }
                                                                    ]}
                                                                    rows={child.children ?? []}
                                                                    disableRowSelectionOnClick
                                                                    getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                                                />
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

            {
                offerItemDetailsd && <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem onClick={() => { handleEdit(offerItemDetailsd) }}>Edit</MenuItem>
                    <MenuItem onClick={() => { handleArchive(offerItemDetailsd) }}>Archive</MenuItem>
                    {/* <MenuItem onClick={() => { }}>Remove</MenuItem> */}
                </Menu>
            }

            {/* {openAddOfferDialogType && <UserPageAddOfferDialog offerType={openAddOfferDialogType} onClose={() => { setOpenAddOfferDialogType(null) }} />} */}
            {offerItemIdDialog && <UserPageAddOfferDetailsDialog catalogType={props.catalogType} offerItemMongoId={offerItemIdDialog} onClose={() => setOfferItemIdDialog(null)} onConfirm={refreshOffersData} />}



            {(offerItemId && offerItemName && offerItemMeasurementUnitMongoId && props.catalogType !== 'labor') && <UserPageAddEstimationItemDetailsDialog onConfirm={props.onConfirm} onClose={() => { setOfferItemId(null) }} offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId} estimatedLaborId={props.estimatedLaborId} estimateSubsectionId={props.estimateSubsectionId} offerItemNameForEstimation={offerItemName} offerItemMongoIdForEstimation={offerItemId} catalogType={props.catalogType} />}


            {/* //🔴 TODO: this will need us in version 2 🔴 */}
            {(offerItemId && offerItemName && offerItemMeasurementUnitMongoId && props.catalogType === 'labor') && <EstimateAddItemFromOffersDialog onConfirm={props.onConfirm} estimateSectionId={props.estimateSectionId} laborHours={laborHours ?? 0} averagePrice={averagePrice} onClose={() => { setOfferItemId(null) }} offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId} estimateItemId={offerItemId} estimateOfferId={null} estimatedLaborId={props.estimatedLaborId} estimateSubsectionId={props.estimateSubsectionId} offerItemNameForEstimation={offerItemName} estimateOfferItemType={props.catalogType} />}
            {/* {(offerItemId && offerItemName && offerItemMeasurementUnitMongoId && props.catalogType === 'labor') && <EstimateAddItemFromOffersDialog onConfirm={props.onConfirm} estimateSectionId={props.estimateSectionId} averagePrice={averagePrice} onClose={() => { setOfferItemId(null) }} offerItemMeasurementUnitMongoId={offerItemMeasurementUnitMongoId} estimateItemId={offerItemId} estimateOfferId={null} estimatedLaborId={props.estimatedLaborId} estimateSubsectionId={props.estimateSubsectionId} offerItemNameForEstimation={offerItemName} estimateOfferItemType={props.catalogType} />} */}

        </>
    )
}
