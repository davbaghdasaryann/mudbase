import React, { useRef, useState } from 'react';
import { CircularProgress, Typography, Menu, MenuItem, Toolbar, Stack, Button, Box, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as Api from 'api';
import * as LaborsApi from 'api/labor';
import * as OffersApi from 'api/offer';
import * as MaterialsApi from 'api/material';
import { LaborCategoryDisplayData, LaborItemDisplayData, LaborSubcategoryDisplayData } from '../../data/labor_display_data';
import { GridActionsColDef } from '@mui/x-data-grid';
import { MaterialCategoryDisplayData, MaterialItemDisplayData, MaterialSubcategoryDisplayData } from '../../data/material_display_data';
import { LaborOfferDisplayData, MaterialOfferDisplayData } from '../../data/offer_display_data';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import SearchComponent from '../SearchComponent';
import { useApiFetchMany, useApiFetchOne } from '../ApiDataFetch';
import UserPageAddOfferDetailsDialog from '../../app/offers/UserPageAddOfferDetailsDIalog';
import { UserPageOfferEditDialog } from '../../app/offers/UserPageOfferEditDIalog';
import SpacerComponent from '../SpacerComponent';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../api/auth';
import DataTableComponent from '../DataTableComponent';

import Link from 'next/link';
import AddOrEditEntityDialog from '../EditAddCategoryDialog';
import { filtersSelecteWidth } from '../../theme';
import {
    EstimateChildAccordion,
    EstimateRootAccordion,
    EstimateRootAccordionDetails,
    EstimateRootAccordionSummary,
    EstimateSubChildAccordion,
    EstimateSubChildAccordionDetails,
} from '../AccordionComponent';
import { PageSelect } from '../../tsui/PageSelect';
import { formatCurrencyRoundedSymbol } from '@/lib/format_currency';
import { formatDate } from '@/lib/format_date';

interface SelectedFiltersDataProps {
    categoryId: string | null;
    subcategoryId: string | null;
    accountId: string | null;
}

interface AccardionItem {
    _id: string;
    label: string;
    isLoading?: boolean;
    children?: AccardionItem[];
    fullCode: string;
    code: string;
    categoryFullCode: string;

    measurementUnitRepresentationSymbol?: string;
    averagePrice?: string;
    laborHours?: number; //🔴 TODO this will need us in version 2 🔴

    itemFullCode?: string;
    accountName?: string;
    accountId?: string;
    price?: string;
    createdAt?: Date;
    updatedAt?: Date;

    childrenQuantity?: number;
}

const fetchData = async (
    parentId: string,
    level: number,
    catalogType: 'labor' | 'material',
    searchVal: string,
    selectedFiltersData: SelectedFiltersDataProps
) => {
    return new Promise<any[]>((resolve) => {
        if (level === 2) {
            if (catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborSubcategory[]>({
                    command: `labor/fetch_subcategories`,
                    args: { categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((laborSubcategoriesResData) => {
                    let laborSubcategoriesData: LaborSubcategoryDisplayData[] = [];

                    for (let laborSubcat of laborSubcategoriesResData) {
                        laborSubcategoriesData.push(new LaborSubcategoryDisplayData(laborSubcat));
                    }

                    resolve(laborSubcategoriesData);
                });
            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialSubcategory[]>({
                    command: `material/fetch_subcategories`,
                    args: { categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((materialSubcategoriesResData) => {
                    let materialSubcategoriesData: MaterialSubcategoryDisplayData[] = [];

                    for (let materialSubcat of materialSubcategoriesResData) {
                        materialSubcategoriesData.push(new MaterialSubcategoryDisplayData(materialSubcat));
                    }
                    resolve(materialSubcategoriesData);
                });
            }
        } else if (level === 3) {
            if (catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborItems[]>({
                    command: 'labor/fetch_items_with_average_price',
                    args: { subcategoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((laborItemsResData) => {
                    let laborItemsData: LaborItemDisplayData[] = [];

                    for (let laborItem of laborItemsResData) {
                        laborItemsData.push(new LaborItemDisplayData(laborItem));
                    }
                    console.log('laborItemsData', laborItemsData);
                    resolve(laborItemsData);
                });
            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
                    command: 'material/fetch_items_with_average_price',
                    args: { subcategoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((materialItemsResData) => {
                    let materialItemsData: MaterialItemDisplayData[] = [];

                    for (let materialItem of materialItemsResData) {
                        materialItemsData.push(new MaterialItemDisplayData(materialItem));
                    }

                    resolve(materialItemsData);
                });
            }
        } else if (level === 4) {
            if (catalogType === 'labor') {
                Api.requestSession<OffersApi.ApiLaborOffer[]>({
                    command: `labor/fetch_offers`,
                    args: { searchVal: 'empty', laborItemId: parentId },
                }).then((laborOffersResData) => {
                    let laborOffersData: LaborOfferDisplayData[] = [];

                    for (let laborOffer of laborOffersResData) {
                        laborOffersData.push(new LaborOfferDisplayData(laborOffer));
                    }

                    resolve(laborOffersData);
                });
            } else if (catalogType === 'material') {
                Api.requestSession<OffersApi.ApiMaterialOffer[]>({
                    command: `material/fetch_offers`,
                    args: { searchVal: 'empty', materialItemId: parentId },
                }).then((materialOffersResData) => {
                    let materialOffersData: MaterialOfferDisplayData[] = [];

                    for (let materialOffer of materialOffersResData) {
                        materialOffersData.push(new MaterialOfferDisplayData(materialOffer));
                    }

                    resolve(materialOffersData);
                });
            }
        }
    });
};


const updateNestedChildren = (items: AccardionItem[], parentId: string, newChildren: AccardionItem[] | undefined, isLoading: boolean): AccardionItem[] => {
    return items.map((item) => {
        if (item._id === parentId) {
            return {
                ...item,
                children: newChildren !== undefined ? newChildren : item.children, // Keep existing children if `newChildren` is undefined
                isLoading,
            };
        } else if (item.children) {
            return {
                ...item,
                children: updateNestedChildren(item.children, parentId, newChildren, isLoading),
            };
        }
        return item;
    });
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

interface Props {
    catalogType: 'labor' | 'material';
}

export default function CatalogAccordion(props: Props) {
    const { session, status, permissionsSet } = usePermissions();

    const [searchVal, setSearchVal] = React.useState('');

    const [actionType, setActionType] = React.useState<'add' | 'update' | 'archive' | null>(null);
    const [entityType, setEntityType] = React.useState<'category' | 'subcategory' | 'item' | null>(null);
    const [entityName, setEntityName] = React.useState<string | null>(null);
    const [entityCode, setEntityCode] = React.useState<string | null>(null);
    const [entityMongoId, setEntityMongoId] = React.useState<string | null>(null);
    const entityParentMongoId = React.useRef<string | null>(null);

    const [items, setItems] = useState<AccardionItem[]>([]);
    const [offerItemId, setOfferItemId] = React.useState<string | null>(null);
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(true);
    const [progIndic, setProgIndic] = React.useState(false);
    const [progIndicAfterRefreshing, setProgIndicAfterRefreshing] = React.useState(false);

    const [offerItemDetailsd, setOfferItemDetailsId] = React.useState<string | null>(null);
    const [offerItemName, setOfferItemName] = React.useState<string | null>(null);
    const [offerItemEditId, setOfferItemEditId] = React.useState<string | null>(null);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [offerItemArchiveId, setOfferItemArchiveId] = React.useState<string | null>(null);

    const [offerItemIdDialog, setOfferItemIdDialog] = React.useState<string | null>(null);

    const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string | null>('All');
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>('all');
    const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = React.useState<string | null>('All');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = React.useState<string | null>('all');
    const [selectedAccountFilter, setSelectedAccountFilter] = React.useState<string | null>('All');
    const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>('all');

    const selectedFiltersDataRef = React.useRef<SelectedFiltersDataProps>({
        categoryId: null,
        subcategoryId: null,
        accountId: null,
    });

    const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
    const [t] = useTranslation();

    React.useEffect(() => {
        setExpandedAccordions([]);
        setDataRequested(false);
    }, [props.catalogType]);

    React.useEffect(() => {
        setProgIndic(true);

        mounted.current = true;
        if (!dataRequested) {
            if (props.catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborCategory[]>({
                    command: `labor/fetch_categories`,
                }).then((laborCategoriesResData) => {
                    if (mounted.current) {
                        let laborCategoriesData: LaborCategoryDisplayData[] = [];

                        for (let laborCat of laborCategoriesResData) {
                            laborCategoriesData.push(new LaborCategoryDisplayData(laborCat));
                        }

                        const accordionData = [] as any;

                        laborCategoriesData.forEach((chosenCategory) => {
                            accordionData.push({
                                _id: chosenCategory._id,
                                label: chosenCategory.name,
                                code: chosenCategory.code,
                                childrenQuantity: chosenCategory.childrenQuantity,
                                children: [],
                            });
                        });

                        setItems(accordionData);
                    }
                    setProgIndic(false);
                });
                setDataRequested(true);

                return;
            } else if (props.catalogType === 'material') {
                setProgIndic(true);

                Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
                    command: `material/fetch_categories`,
                }).then((materialCategoriesResData) => {
                    if (mounted.current) {
                        let materialCategoriesData: MaterialCategoryDisplayData[] = [];

                        for (let materialCat of materialCategoriesResData) {
                            materialCategoriesData.push(new MaterialCategoryDisplayData(materialCat));
                        }

                        const accordionData = [] as any;

                        materialCategoriesData.forEach((chosenCategory) => {
                            accordionData.push({
                                _id: chosenCategory._id,
                                label: chosenCategory.name,
                                code: chosenCategory.code,
                                childrenQuantity: chosenCategory.childrenQuantity,
                                children: [],
                            });
                        });

                        setItems(accordionData);
                    }
                    setProgIndic(false);
                });
                setDataRequested(true);

                return;
            }
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);

    const handleClick = React.useCallback((event) => {
        setAnchorEl(event.currentTarget);
    }, []);
    const handleClose = React.useCallback(() => {
        setAnchorEl(null);
    }, []);
    const handleEdit = React.useCallback((currentOfferItemEditId: string) => {
        setOfferItemEditId(currentOfferItemEditId);
        setAnchorEl(null);
    }, []);
    const handleArchive = React.useCallback((currentOfferItemEditId: string) => {
        setOfferItemArchiveId(currentOfferItemEditId);
        setAnchorEl(null);
    }, []);

    const refreshOffersData = React.useCallback(async () => {
        if (!items) return;

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
    }, [items, expandedAccordions, props.catalogType, searchVal, fetchData]);


    const fetchChildren = React.useCallback(
        async (parentId: string, level: number): Promise<void> => {
            console.log('parentId, level', parentId, level);

            setItems((prevItems) => updateNestedChildren(prevItems, parentId, undefined, true));

            const fetchedData = await fetchData(parentId, level, props.catalogType, searchVal, selectedFiltersDataRef.current);

            const newData: AccardionItem[] = [] as AccardionItem[];
            console.log('fetchedData', fetchedData);
            fetchedData.forEach((item) => {
                let itemArr: AccardionItem = {} as AccardionItem;
                itemArr._id = item._id;
                itemArr.accountId = item.accountId;
                itemArr.label = item.name;
                itemArr.children = [];
                itemArr.isLoading = false;
                itemArr.fullCode = item.fullCode;
                (itemArr.code = item.code), (itemArr.categoryFullCode = item.categoryFullCode), (itemArr.laborHours = item.laborHours); //🔴 TODO this will need us in version 2 🔴
                itemArr.measurementUnitRepresentationSymbol = item.measurementUnitRepresentationSymbol;
                if (item.averagePrice) {
                    itemArr.averagePrice = item.averagePrice.toFixed(0);
                }
                itemArr.itemFullCode = item.itemFullCode;
                itemArr.accountName = item.accountName;
                itemArr.price = item.price;
                itemArr.createdAt = item.createdAt;
                itemArr.updatedAt = item.updatedAt;

                itemArr.childrenQuantity = item.childrenQuantity;

                newData.push(itemArr);
            });

            console.log('newData', newData);

            setItems((prevItems) => updateNestedChildren(prevItems, parentId, newData, false));
        },
        [props.catalogType, searchVal, fetchData, updateNestedChildren]
    );

    const handleAccordionChange = React.useCallback(
        (id: string, fullCode: string, level: number) => async (_event: React.SyntheticEvent, isExpanded: boolean) => {
            if (isExpanded) {
                await fetchChildren(id, level);
                setExpandedAccordions((prev) => [...prev, fullCode]);
            } else {
                if (level === 2) {
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
        },
        [fetchChildren, setExpandedAccordions, collapseChildren]
    );

    const onSearch = React.useCallback(
        (value: string) => {
            setSearchVal(value);
            console.log('selectedFiltersDataRef.current', selectedFiltersDataRef.current);

            if (props.catalogType === 'labor') {
                Api.requestSession<any>({
                    command: 'labor/fetch_categories',
                    args: {
                        searchVal: value ?? '',
                    },
                    json: selectedFiltersDataRef.current,
                }).then((laborCategoriesResData) => {

                    let laborCategoriesData: LaborCategoryDisplayData[] = [];

                    for (let laborCat of laborCategoriesResData) {
                        laborCategoriesData.push(new LaborCategoryDisplayData(laborCat));
                    }

                    const accordionData = [] as any;

                    laborCategoriesData.forEach((chosenCategory) => {
                        accordionData.push({
                            _id: chosenCategory._id,
                            label: chosenCategory.name,
                            code: chosenCategory.code,
                            childrenQuantity: chosenCategory.childrenQuantity,
                            children: [],
                        });
                    });

                    setExpandedAccordions([]);

                    setItems(accordionData);
                });
            } else if (props.catalogType === 'material') {
                Api.requestSession<any>({
                    command: 'material/fetch_categories',
                    args: {
                        searchVal: value ?? '',
                    },
                    json: selectedFiltersDataRef.current,
                }).then((materialCategoriesResData) => {
                    let materialCategoriesData: MaterialCategoryDisplayData[] = [];

                    for (let materialCat of materialCategoriesResData) {
                        materialCategoriesData.push(new MaterialCategoryDisplayData(materialCat));
                    }

                    const accordionData = [] as any;

                    materialCategoriesData.forEach((chosenCategory) => {
                        accordionData.push({
                            _id: chosenCategory._id,
                            label: chosenCategory.name,
                            code: chosenCategory.code,
                            childrenQuantity: chosenCategory.childrenQuantity,
                            children: [],
                        });
                    });

                    setExpandedAccordions([]);

                    setItems(accordionData);
                });
            }

        },
        [props.catalogType]
    );

    const refreshChangedEntity = React.useCallback(
        async (parentId: string | null, entityType: string, entityMongoId: string | null) => {
            if (!parentId) return;
            setProgIndicAfterRefreshing(true);

            let level4Keys: string[] = [];
            items.forEach((category) => {
                category.children?.forEach((subcategory) => {
                    subcategory.children?.forEach((item) => {
                        level4Keys.push(item.fullCode);
                    });
                });
            });

            setExpandedAccordions((prev) => prev.filter((key) => !level4Keys.includes(key)));

            if (entityType === 'category') {
                if (!entityMongoId) {
                    // For an add operation, re‑fetch all categories
                    let fetchedCategories;
                    if (props.catalogType === 'labor') {
                        fetchedCategories = await Api.requestSession<LaborsApi.ApiLaborCategory[]>({
                            command: 'labor/fetch_categories',
                            args: { searchVal },
                        });
                    } else {
                        fetchedCategories = await Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
                            command: 'material/fetch_categories',
                            args: { searchVal },
                        });
                    }
                    console.log('fetchedCategories', fetchedCategories);
                    setItems(prevItems => {
                        // Keep a look-up of old children arrays by category _id
                        const oldById = Object.fromEntries(
                            prevItems.map(cat => [cat._id, cat.children ?? []])
                        );

                        // Map into AccardionItem[], preserving each cat’s own children
                        const mapped = fetchedCategories.map(cat => ({
                            _id: cat._id,
                            label: cat.name,
                            code: cat.code,
                            fullCode: cat.code,
                            categoryFullCode: cat.code,
                            childrenQuantity: cat.childrenQuantity,
                            children: oldById[cat._id] ?? [],
                            isLoading: false,
                        }));

                        return mapped;
                    });
                } else {
                    const categoryId = entityMongoId;
                    console.log('categoryId', categoryId, entityMongoId);
                    let fetchedCategories;
                    if (props.catalogType === 'labor') {
                        fetchedCategories = await Api.requestSession<LaborsApi.ApiLaborCategory[]>({
                            command: 'labor/fetch_categories',
                            args: { searchVal },
                        });
                    } else {
                        fetchedCategories = await Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
                            command: 'material/fetch_categories',
                            args: { searchVal },
                        });
                    }
                    console.log('fetchedCategories', fetchedCategories);
                    const changedCategory = fetchedCategories.find((cat) => cat._id === entityMongoId);
                    if (changedCategory) {
                        const updatedCategory: AccardionItem = {
                            _id: changedCategory._id,
                            label: changedCategory.name,
                            code: changedCategory.code,
                            fullCode: changedCategory.code,
                            categoryFullCode: changedCategory.code,
                            childrenQuantity: changedCategory.childrenQuantity,
                            children: items.find((cat) => cat._id === changedCategory._id)?.children ?? [],
                            isLoading: false,
                        };
                        setItems((prevItems) => prevItems.map((cat) => (cat._id === updatedCategory._id ? updatedCategory : cat)));
                    }
                }
            } else if (entityType === 'subcategory') {
                if (parentId) {
                    const updatedSubcategories = await fetchData(parentId, 2, props.catalogType, searchVal, selectedFiltersDataRef.current);


                    setItems(prevItems =>
                        updateNestedChildren(prevItems, parentId!,
                            updatedSubcategories.map(sub => {
                                const oldChildren = prevItems
                                    .find(cat => cat._id === parentId)
                                    ?.children
                                    ?.find(old => old._id === sub._id)
                                    ?.children
                                    ?? [];

                                return {
                                    _id: sub._id,
                                    label: sub.name,
                                    code: sub.code,
                                    fullCode: sub.fullCode,
                                    categoryFullCode: sub.categoryFullCode,
                                    childrenQuantity: sub.childrenQuantity,
                                    children: oldChildren,
                                    isLoading: false,
                                };
                            }),
                            false
                        )
                    );

                }
            } else if (entityType === 'item') {
                if (parentId) {
                    const updatedItemsArray = await fetchData(parentId, 3, props.catalogType, searchVal, selectedFiltersDataRef.current);
                    const mappedItems: AccardionItem[] = updatedItemsArray.map((itm) => ({
                        _id: itm._id,
                        label: itm.name,
                        code: itm.code,
                        fullCode: itm.fullCode || itm.code,
                        categoryFullCode: itm.categoryFullCode || itm.code,
                        childrenQuantity: itm.childrenQuantity,
                        averagePrice: itm.averagePrice !== undefined && itm.averagePrice !== null ? itm.averagePrice.toFixed(0) : '0',
                        measurementUnitRepresentationSymbol: itm.measurementUnitRepresentationSymbol,

                        // If items do not have nested children beyond this level, you can leave it as an empty array.
                        children: [],
                        isLoading: false,
                    }));

                    setItems((prevItems) => updateNestedChildren(prevItems, parentId!, mappedItems, false));
                }
            }

            console.log('refreshed catalog');
            setProgIndicAfterRefreshing(false);
        },
        [searchVal, items, props.catalogType, fetchData, updateNestedChildren]
    );

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

    const accountsSelectList = useApiFetchMany<Api.ApiAccount>({
        api: {
            command: props.catalogType === 'labor' ? 'accounts/has_labor_offer' : 'accounts/has_material_offer',
        },
    });

    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />;
    }


    if (categorySelectList.loading && categorySelectList.data === undefined) {
        return <ProgressIndicator show={categorySelectList.loading} background='backdrop' />;
    }

    if (accountsSelectList.loading && selectedAccountFilter) {
        return <ProgressIndicator show={categorySelectList.loading} background='backdrop' />;
    }

    return (
        <>
            <Toolbar disableGutters sx={{ backgroundColor: 'inherit' }}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
                    <PageSelect
                        withAll={true}
                        sx={{ minWidth: filtersSelecteWidth }}
                        onSelected={(selected) => {
                            if (selected?.label) {
                                setSelectedCategoryFilter(selected.label);
                                setSelectedCategoryId(selected.id);

                                if (selected?.id === 'all') {
                                    setSelectedCategoryFilter(null);
                                    selectedFiltersDataRef.current.categoryId = null;
                                    selectedFiltersDataRef.current.subcategoryId = null;
                                    setSelectedSubcategoryFilter('All');
                                    setSelectedSubcategoryId('all');
                                    subcategorySelectList.data = undefined;
                                } else {
                                    if (selected.id !== selectedFiltersDataRef.current.categoryId) {
                                        selectedFiltersDataRef.current.subcategoryId = null;
                                        subcategorySelectList.data = undefined;

                                        subcategorySelectList.setApi({
                                            command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                                            args: { categoryMongoId: selected.id },
                                        });
                                    }

                                    selectedFiltersDataRef.current.categoryId = selected.id;
                                }

                                onSearch(searchVal);
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

                                console.log('selectedFiltersDataRef.current', selectedFiltersDataRef.current);
                                onSearch(searchVal);
                            }
                        }}
                        items={
                            categorySelectList.data
                                ? categorySelectList.data
                                    .filter((unit, index, self) => index === self.findIndex((u) => u.name === unit.name))
                                    .map((unit) => ({
                                        key: unit._id,
                                        id: unit._id,
                                        name: unit.name,
                                        label: unit.name,
                                    }))
                                : []
                        }
                        value={selectedCategoryId ?? 'All'}
                        label='Category'
                    />

                    <PageSelect
                        withAll={true}
                        sx={{
                            minWidth: filtersSelecteWidth,
                        }}
                        readonly={!(selectedCategoryFilter && subcategorySelectList.data)}
                        onSelected={(selected) => {
                            console.log('selected', selected);
                            if (selected) {
                                setSelectedSubcategoryFilter(selected.label);
                                setSelectedSubcategoryId(selected.id);

                                if (selected?.id === 'all') {
                                    selectedFiltersDataRef.current.subcategoryId = null;
                                } else {
                                    selectedFiltersDataRef.current.subcategoryId = selected.id;
                                }
                                onSearch(searchVal);
                            } else {
                                setSelectedSubcategoryFilter('All');
                                setSelectedSubcategoryId('all');
                                selectedFiltersDataRef.current.subcategoryId = null;

                                subcategorySelectList.data = undefined;
                                subcategorySelectList.setApi({
                                    command: props.catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                                    args: { categoryMongoId: selectedFiltersDataRef.current.categoryId },
                                });
                                onSearch(searchVal);
                            }
                        }}
                        items={
                            subcategorySelectList.data
                                ? subcategorySelectList.data
                                    .filter((unit, index, self) => index === self.findIndex((u) => u.name === unit.name))
                                    .map((unit) => ({
                                        key: unit._id,
                                        id: unit._id,
                                        name: unit.name,
                                        label: unit.name,
                                    }))
                                : []
                        }
                        value={selectedSubcategoryId ?? 'All'}
                        label='Subcategory'
                    />

                    <PageSelect
                        withAll={true}
                        sx={{ minWidth: filtersSelecteWidth }}
                        onSelected={(selected) => {
                            if (selected?.label) {
                                setSelectedAccountFilter(selected.label);
                                setSelectedAccountId(selected.id);

                                if (selected.id === 'all') {
                                    selectedFiltersDataRef.current.accountId = null;
                                } else {
                                    selectedFiltersDataRef.current.accountId = selected.id;
                                }

                                onSearch(searchVal);
                            } else {
                                setSelectedAccountFilter(null);
                                setSelectedAccountId(null);
                                selectedFiltersDataRef.current.accountId = null;
                            }
                        }}
                        items={
                            accountsSelectList.data
                                ? accountsSelectList.data
                                    .filter((unit, index, self) => index === self.findIndex((u) => u.companyName === unit.companyName))
                                    .map((unit) => ({
                                        key: unit._id,
                                        id: unit._id,
                                        name: unit.companyName,
                                        label: unit.companyName,
                                    }))
                                : []
                        }
                        value={selectedAccountId ?? 'All'}
                        label='Company'
                    />
                </Stack>
            </Toolbar>

            <Stack spacing={0} direction='column' sx={{ overflowY: 'auto' }}>
                <ProgressIndicator show={progIndicAfterRefreshing} background='backdrop' />

                {items.map((item) => (
                    <EstimateRootAccordion
                        key={item._id}
                        expanded={expandedAccordions.includes(item.code)}
                        onChange={handleAccordionChange(item._id, item.code, 2)}
                    >
                        <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction='row' spacing={1} justifyContent='space-between' alignItems='center' width='100%'>
                                <Typography>{item.code}</Typography>
                                <Typography>{item.label}</Typography>
                                <Typography>{formatQuantityParens(item.childrenQuantity)}</Typography>

                                <Box flex={2}>&nbsp;</Box>

                                {session?.user && permissionsSet?.has?.('CAT_EDT') && (
                                    <>
                                        <Button
                                            component='div'
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setActionType('update');
                                                setEntityType('category');
                                                setEntityName(item.label);
                                                setEntityCode(item.code);
                                                setEntityMongoId(item._id);
                                                entityParentMongoId.current = item._id;
                                            }}
                                        >
                                            {t('Edit Category')}
                                        </Button>

                                        <Button
                                            component='div'
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setActionType('add');
                                                setEntityType('category');
                                                entityParentMongoId.current = item._id;
                                            }}
                                        >
                                            {t('Add Category')}
                                        </Button>

                                    </>
                                )}
                            </Stack>
                        </EstimateRootAccordionSummary>

                        <EstimateRootAccordionDetails>
                            {item.isLoading ? (
                                <CircularProgress size={24} sx={{ ml: 4 }} />
                            ) : item.children && item.children.length > 0 ? (
                                <Stack spacing={0} sx={{ ml: 4 }}>
                                    {item.children.map((child) =>
                                        child.children ? (
                                            <EstimateChildAccordion
                                                key={child._id}
                                                expanded={expandedAccordions.includes(child.categoryFullCode)}
                                                onChange={handleAccordionChange(child._id, child.categoryFullCode, 3)}
                                            >
                                                <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Stack direction='row' spacing={1} justifyContent='space-between' alignItems='center' width='100%'>
                                                        <Typography>{child.code}</Typography>
                                                        <Typography>{child.label}</Typography>
                                                        <Typography>{formatQuantityParens(child.childrenQuantity)}</Typography>

                                                        <Box flex={2}>&nbsp;</Box>

                                                        {session?.user && permissionsSet?.has?.('CAT_EDT') && (
                                                            <>
                                                                <Button
                                                                    component='div'
                                                                    disableRipple
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setActionType('update');
                                                                        setEntityType('subcategory');
                                                                        setEntityName(child.label);
                                                                        setEntityCode(child.code);
                                                                        setEntityMongoId(child._id);
                                                                        entityParentMongoId.current = item._id;
                                                                    }}
                                                                >
                                                                    {t('Edit Subcategory')}
                                                                </Button>

                                                                <Button
                                                                    component='div'
                                                                    disableRipple
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setActionType('add');
                                                                        setEntityType('subcategory');
                                                                        setEntityMongoId(item._id);
                                                                        entityParentMongoId.current = item._id;
                                                                    }}
                                                                >
                                                                    {t('Add Subcategory')}
                                                                </Button>

                                                            </>
                                                        )}
                                                    </Stack>
                                                </EstimateRootAccordionSummary>
                                                <EstimateRootAccordionDetails>
                                                    {child.isLoading ? (
                                                        <CircularProgress size={24} sx={{ ml: 4 }} />
                                                    ) : child.children && child.children.length > 0 ? (
                                                        <Stack spacing={2} sx={{ ml: 4 }}>
                                                            {child.children.map((subChild) => (
                                                                <EstimateSubChildAccordion
                                                                    key={subChild._id}
                                                                    expanded={expandedAccordions.includes(subChild.fullCode)}
                                                                    onChange={handleAccordionChange(subChild._id, subChild.fullCode, 4)}
                                                                >
                                                                    <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                                        <Stack
                                                                            direction='row'
                                                                            alignItems='flex-start'
                                                                            width='100%'
                                                                            spacing={1}
                                                                        >
                                                                            <Typography>{subChild.code}</Typography>
                                                                            <Typography
                                                                                sx={{
                                                                                    flexGrow: 1,
                                                                                    flexShrink: 1,
                                                                                    flexBasis: 'auto',
                                                                                    minWidth: 0, // <— the magic: lets it go narrower than its “min-content” width
                                                                                    overflowWrap: 'break-word',
                                                                                }}
                                                                            >
                                                                                {subChild.label}
                                                                            </Typography>

                                                                            <Box flex={20}>&nbsp;</Box>
                                                                            <Typography>{formatQuantityParens(subChild.childrenQuantity)}</Typography>

                                                                            <Tooltip title={t('Average market price')} arrow placement='top'>
                                                                                <Typography sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                                    {formatCurrencyRoundedSymbol(subChild.averagePrice)}
                                                                                </Typography>
                                                                            </Tooltip>

                                                                            <Typography>({subChild.measurementUnitRepresentationSymbol})</Typography>

                                                                            {session?.user && permissionsSet?.has?.('CAT_EDT') && (
                                                                                <>
                                                                                    <Box>&nbsp;</Box>
                                                                                    <Button
                                                                                        component='div'
                                                                                        disableRipple
                                                                                        onClick={(event) => {
                                                                                            event.stopPropagation();
                                                                                            setActionType('update');
                                                                                            setEntityType('item');
                                                                                            setEntityName(subChild.label);
                                                                                            setEntityCode(subChild.code);
                                                                                            setEntityMongoId(subChild._id);
                                                                                            entityParentMongoId.current = child._id;
                                                                                        }}
                                                                                    >
                                                                                        {t('Edit Item')}
                                                                                    </Button>
                                                                                    <Box>&nbsp;</Box>
                                                                                    <Button
                                                                                        component='div'
                                                                                        disableRipple
                                                                                        onClick={(event) => {
                                                                                            event.stopPropagation();
                                                                                            setActionType('add');
                                                                                            setEntityType('item');
                                                                                            setEntityMongoId(child._id);
                                                                                            entityParentMongoId.current = child._id;
                                                                                        }}
                                                                                    >
                                                                                        {t('Add Item')}
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </Stack>
                                                                    </EstimateRootAccordionSummary>

                                                                    <EstimateSubChildAccordionDetails>
                                                                        {subChild.isLoading ? (
                                                                            <CircularProgress size={24} sx={{ ml: 4 }} />
                                                                        ) : (
                                                                            <DataTableComponent
                                                                                sx={{ width: '100%' }}
                                                                                columns={[
                                                                                    {
                                                                                        field: 'accountName',
                                                                                        headerName: t('Company'),
                                                                                        flex: 0.5,
                                                                                        disableColumnMenu: true,
                                                                                        renderCell: (params) => (
                                                                                            <Link
                                                                                                href={`/account_view?accountId=${params.row.accountId}`}
                                                                                                style={{ textDecoration: 'none' }}
                                                                                            >
                                                                                                {params.value}
                                                                                            </Link>
                                                                                        ),
                                                                                    },
                                                                                    ...(props.catalogType === 'labor'
                                                                                        ? [
                                                                                            {
                                                                                                field: 'laborHours',
                                                                                                headerName: t('Labor Hours'),
                                                                                                align: 'center',
                                                                                                flex: 0.2,
                                                                                            } as GridActionsColDef,
                                                                                        ]
                                                                                        : []),

                                                                                    {
                                                                                        field: 'measurementUnitRepresentationSymbol',
                                                                                        headerName: t('Unit'),
                                                                                        align: 'center',
                                                                                        flex: 0.15,
                                                                                    },
                                                                                    {
                                                                                        field: 'price',
                                                                                        headerName: t('Price'),
                                                                                        align: 'center',
                                                                                        flex: 0.3,
                                                                                    },
                                                                                    {
                                                                                        field: 'createdAt',
                                                                                        type: 'dateTime',
                                                                                        headerName: t('Uploaded'),
                                                                                        align: 'center',
                                                                                        flex: 0.25,
                                                                                        valueFormatter: (value) => formatDate(value),
                                                                                    },
                                                                                    {
                                                                                        field: 'updatedAt',
                                                                                        type: 'dateTime',
                                                                                        headerName: t('Updated'),
                                                                                        align: 'center',
                                                                                        flex: 0.25,
                                                                                        valueFormatter: (value) => formatDate(value),
                                                                                    },
                                                                                ]}
                                                                                rows={subChild.children ?? []}
                                                                                disableRowSelectionOnClick
                                                                                getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                                                            />
                                                                        )}
                                                                        {session?.user &&
                                                                            ((props.catalogType === 'labor' && permissionsSet?.has?.('OFF_CRT_LBR')) ||
                                                                                (props.catalogType === 'material' && permissionsSet?.has?.('OFF_CRT_MTRL'))) &&
                                                                            !subChild.children?.some((child) => child.accountId === session.user.accountId) && (
                                                                                <Button
                                                                                    fullWidth
                                                                                    sx={{
                                                                                        border: '1px dashed rgba(151, 71, 255)',
                                                                                        color: 'rgba(151, 71, 255)',
                                                                                        background: 'rgba(151, 71, 255, 0.04)',
                                                                                    }}
                                                                                    onClick={() => setOfferItemIdDialog(subChild._id)}
                                                                                >
                                                                                    {t('Add Offer')}
                                                                                </Button>
                                                                            )}
                                                                    </EstimateSubChildAccordionDetails>
                                                                </EstimateSubChildAccordion>
                                                            ))}
                                                        </Stack>
                                                    ) : (
                                                        <>
                                                            <Typography sx={{ ml: 4 }}>{t('No more data')}</Typography>

                                                            {session?.user && permissionsSet?.has?.('CAT_EDT') && (
                                                                <Button
                                                                    component='div'
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setActionType('add');
                                                                        setEntityType('item');
                                                                        setEntityMongoId(child._id);
                                                                        entityParentMongoId.current = child._id;
                                                                    }}
                                                                    sx={{ ml: 5 }}
                                                                >
                                                                    {t('Add Item')}
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </EstimateRootAccordionDetails>
                                            </EstimateChildAccordion>
                                        ) : null
                                    )}
                                </Stack>
                            ) : (
                                <>
                                    <Typography sx={{ ml: 4 }}>{t('No more data')}</Typography>
                                    {session?.user && permissionsSet?.has?.('CAT_EDT') && selectedFiltersDataRef.current.accountId === null && (
                                        <Button
                                            component='div'
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setActionType('add');
                                                setEntityType('subcategory');
                                                setEntityMongoId(item._id);
                                                entityParentMongoId.current = item._id;
                                            }}
                                            sx={{ ml: 5 }}
                                        >
                                            {t('Add Subcategory')}
                                        </Button>
                                    )}
                                </>
                            )}
                        </EstimateRootAccordionDetails>
                    </EstimateRootAccordion>
                ))}
            </Stack>

            {offerItemEditId && (
                <UserPageOfferEditDialog
                    offerItemName={offerItemName}
                    offerType={props.catalogType}
                    offerMongoId={offerItemEditId}
                    onClose={() => {
                        setOfferItemEditId(null);
                        setOfferItemDetailsId(null);
                        setOfferItemName(null);
                    }}
                    onConfirm={refreshOffersData}
                />
            )}

            {offerItemDetailsd && (
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                    <MenuItem onClick={() => handleEdit(offerItemDetailsd)}>{t('Edit')}</MenuItem>
                    <MenuItem onClick={() => handleArchive(offerItemDetailsd)}>{t('Archive')}</MenuItem>
                </Menu>
            )}

            {offerItemIdDialog && (
                <UserPageAddOfferDetailsDialog
                    catalogType={props.catalogType}
                    offerItemMongoId={offerItemIdDialog}
                    onClose={() => setOfferItemIdDialog(null)}
                    onConfirm={refreshOffersData}
                />
            )}

            {actionType && entityType && (
                <AddOrEditEntityDialog
                    entityMongoId={entityMongoId}
                    entityName={entityName}
                    entityCode={entityCode}
                    catalogType={props.catalogType}
                    actionType={actionType}
                    entityType={entityType}
                    onClose={() => {
                        setActionType(null);
                        setEntityType(null);
                        setEntityName(null);
                        setEntityCode(null);
                        setEntityMongoId(null);
                    }}
                    onConfirm={async () => {
                        await refreshChangedEntity(entityParentMongoId.current, entityType, entityMongoId);

                        setActionType(null);
                        setEntityType(null);
                        setEntityName(null);
                        setEntityCode(null);
                        setEntityMongoId(null);
                        entityParentMongoId.current = null;
                    }}
                />
            )}

        </>
    );
}

export function formatQuantityParens(value: number | undefined) {
    if (typeof value === 'number' && !isNaN(value) && value > 0) return `(${value})`;

    return '(0)';
}
