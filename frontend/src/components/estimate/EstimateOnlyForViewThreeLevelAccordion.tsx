import React, { useRef, useState } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Typography,
    IconButton,
    Button,
    MenuItem,
    Menu,
    Box,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as Api from 'api';
import * as EstimateApi from '@/api/estimate';
import * as EstimateItemsApi from 'api/estimate_items';
import { EstimateSubsectionsDisplayData } from '../../data/estimate_subsections_display_data';
import { EstimateLaborItemDisplayData } from '../../data/estimate_items_data';
import EstimateSubsectionButtonDialog from './EstimateAddSubsectionDialog';
import { EstimateLaborEditDialog } from './EstimateLaborEditDialog';

import * as EstimateSectionsApi from '@/api/estimate';
import { EstimateSectionsDisplayData } from '../../data/estimate_sections_display_data';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import EstimateSectionButtonDialog from './EstimateAddSectionDialog';
import { EstimateRenameDialog } from './EstimateRenameDIalog';
import { EstimateLaborDeleteDialog } from './EstimateLaborDeleteDIalog';
import EstimatedItemPresentViewDialog from './EstimatedItemPresentViewDialog';
import { EstimateMaterialsListOnlyForViewDialog } from './EstimateMaterialsListOnlyForViewDialog';
import { useTranslation } from 'react-i18next';
import { validatePositiveInteger } from '../../tslib/validate';
import { confirmDialog } from '../ConfirmationDialog';
import DataTableComponent from '../DataTableComponent';
import { mainIconColor, materialIconHeight } from '../../theme';
import { usePermissions } from '../../api/auth';
import ImgElement from '../../tsui/DomElements/ImgElement';
import { normalizeArmenianDecimalPoint, parseThousandsSeparator, roundNumber, roundToThree } from '../../tslib/parse';
import { formatCurrency } from '@/lib/format_currency';
import { makeMultilineTableCell } from '@/lib/format_date';

// ✅ Define Interface
interface AccardionItem {
    _id: string;
    label: string;
    totalCost: number;
    isLoading?: boolean;
    children?: AccardionItem[]; // Holds nested children
    fullCode?: string;
    itemName?: string;
    itemChangableName?: string;
    itemMeasurementUnit?: string;
    itemFullCode?: string;
    companyNameMadeOffer?: string;

    presentItemOfferAveragePrice?: number;

    itemLaborHours?: number; //🔴 TODO: this will need us in version 2 🔴
    quantity?: number;
    itemChangableAveragePrice?: number;
    itemAveragePrice?: number;
    itemUnitPrice?: number;
    itemTotalCost?: number;

    itemWithoutMaterial?: number;

    materialUnitPrice?: number;
    materialTotalCost?: number;
    materialQuantity?: number;

    priceWithMaterial?: number;

    unitPrice?: number;

}

// ✅ Simulated API Call (Replace with real API)
const fetchData = async (parentId: string, level: number) => {
    return new Promise<any[]>((resolve) => {
        if (level === 2) {
            // if (catalogType === 'labor') {
            Api.requestSession<EstimateApi.ApiEstimateSubsection[]>({
                command: `estimate/fetch_subsections`,
                args: { estimateSectionId: parentId },
            })
                .then((estimateSubsectionsList) => {
                    // if (mounted.current) {

                    // console.log('labor subcategories: ', laborSubcategoriesResData)
                    let estimateSubsectionsData: EstimateSubsectionsDisplayData[] = [];

                    for (let estimateSubsection of estimateSubsectionsList) {
                        estimateSubsectionsData.push(new EstimateSubsectionsDisplayData(estimateSubsection));
                    }

                    resolve(estimateSubsectionsData);
                    console.log('laborSubcategoriesData', estimateSubsectionsData);
                    // setLaborSubcategories(laborSubcategoriesData)
                    // setProgIndic(false)
                })

            // }
            // else if (catalogType === 'material') {
            //     Api.requestSession<MaterialsApi.ApiMaterialSubcategory[]>({
            //         command: `material/fetch_subcategories`,
            //         args: { categoryMongoId: parentId }
            //     })
            //         .then(materialSubcategoriesResData => {
            //             // if (mounted.current) {

            //             // console.log('labor subcategories: ', laborSubcategoriesResData)
            //             let materialSubcategoriesData: MaterialSubcategoryDisplayData[] = [];

            //             for (let materialSubcat of materialSubcategoriesResData) {
            //                 materialSubcategoriesData.push(new MaterialSubcategoryDisplayData(materialSubcat));
            //             }

            //             resolve(materialSubcategoriesData);
            //             console.log('laborSubcategoriesData', materialSubcategoriesData)
            //             // setLaborSubcategories(laborSubcategoriesData)
            //             // setProgIndic(false)

            //         }).catch();
            // }
        } else if (level === 3) {
            Api.requestSession<EstimateItemsApi.ApiEstimateLaborItem[]>({
                command: 'estimate/fetch_labor_items',
                args: { estimateSubsectionId: parentId },
            })
                .then((estimateLaborItemsResData) => {
                    // if (mounted.current) {
                    // console.log('laborItemsResData', laborItemsResData)

                    console.log('Only for view estimateLaborItemsResData: ', estimateLaborItemsResData);

                    let estimateLaborItemsData: EstimateLaborItemDisplayData[] = [];

                    for (let estimateLaborItem of estimateLaborItemsResData) {
                        estimateLaborItemsData.push(new EstimateLaborItemDisplayData(estimateLaborItem));
                    }

                    console.log('estimateLaborItemsData', estimateLaborItemsData);
                    resolve(estimateLaborItemsData);
                })
                .catch();

            //       Api.requestSession<EstimateItemsApi.ApiEstimateLaborItem[]>({
            //     command: 'estimate/fetch_labor_items',
            //     args: { estimateSubsectionId: parentId }
            // })
            //     .then(estimateLaborItemsResData => {
            //         // if (mounted.current) {
            //         // console.log('laborItemsResData', laborItemsResData)
            //         console.log('estimateLaborItemsResData: ', estimateLaborItemsResData)
            //         let estimateLaborItemsData: EstimateLaborItemDisplayData[] = [];

            //         for (let estimateLaborItem of estimateLaborItemsResData) {
            //             estimateLaborItemsData.push(new EstimateLaborItemDisplayData(estimateLaborItem));
            //         }

            //         console.log('estimateLaborItemsData', estimateLaborItemsData)
            //         resolve(estimateLaborItemsData);

            //     }).catch();
        }
    });
};

// ✅ Function to Find Parent and Add Children in Correct Position
const updateNestedChildren = (items: AccardionItem[], parentId: string, newChildren: AccardionItem[], isLoading: boolean): AccardionItem[] => {
    return items.map((item) => {
        if (item._id === parentId) {
            return { ...item, children: isLoading ? undefined : newChildren, isLoading }; // ✅ Direct match
        } else if (item.children) {
            return { ...item, children: updateNestedChildren(item.children, parentId, newChildren, isLoading) }; // ✅ Recursively search in children
        }
        return item;
    });
};

// ✅ Nested Accordion Component

interface Props {
    estimateId: string;
    onDataUpdated?: (updated: boolean) => void;
    viewOnly?: boolean;
}

export default function EstimateOnlyForViewThreeLevelAccordion(props: Props) {
    const { session, permissionsSet } = usePermissions();

    const [openAddSubsectionDialog, setOpenAddSubsectionDialog] = React.useState(false);
    const [openAddSubsectionDialogCurrentSectionId, setOpenAddSubsectionDialogCurrentSectionId] = React.useState<string | null>(null);
    const [openAddSectionDialog, setOpenAddSectionDialog] = React.useState(false);
    let [estimateRenameId, setEstimateRenameId] = React.useState<string | null>(null);
    let [estimateRenameDialogLabel, setEstimateRenameDialogLabel] = React.useState<string | null>(null);
    const [estimateRenameDialogType, setEstimateRenameDialogType] = React.useState<'section' | 'subsection' | null>(null);

    let [estimatedLaborItemDetailsId, setEstimatedLaborItemDetailsId] = React.useState<string | null>(null);
    let [estimatedLaborItemName, setEstimatedLaborItemName] = React.useState<string | null>(null);

    let [editLaborEstimateLaborItemIdEditId, setEditLaborEstimateLaborItemId] = React.useState<string | null>(null);
    let [editMaterialsEstimateLaborItemId, setEditMaterialsEstimateLaborItemId] = React.useState<string | null>(null);
    let [removeLaborEstimateLaborItemId, setRemoveLaborEstimateLaborItemId] = React.useState<string | null>(null);

    const [openAddOfferDialogType, setOpenAddOfferDialogType] = React.useState<'labor' | 'material' | null>(null);
    // const [openAddOfferDialogTypeWithouSubsection, setOpenAddOfferDialogTypeWithouSubsection] = React.useState<'labor' | 'material' | null>(null);
    const [selectedChildId, setSelectedChildId] = React.useState<string | null>(null);

    const [estimatedLaborOfferViewId, setEstimatedLaborOfferViewId] = React.useState<string | null>(null);
    const [estimatedLaborOfferViewChangableItemName, setEstimatedLaborOfferViewChangableItemName] = React.useState<string | null>(null);

    const [items, setItems] = useState<AccardionItem[]>([]);
    const [estimatedLaborItemId, setEstimatedLaborItemId] = React.useState<string | null>(null);

    const [anchorEl, setAnchorEl] = React.useState(null);

    const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [progIndic, setProgIndic] = React.useState(false);
    const [chosenCatalogCategories, setChosenCataloCategories] = React.useState<EstimateSectionsDisplayData[] | null>(null);
    const [t] = useTranslation();

    const onCancelDialog = React.useCallback((event, reason) => {
        if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
    }, []);

    React.useEffect(() => {
        setProgIndic(true);

        mounted.current = true;
        if (!dataRequested) {
            Api.requestSession<EstimateSectionsApi.ApiEstimateSecttion[]>({
                command: 'estimate/fetch_sections',
                args: {
                    estimateId: props.estimateId, //TODO remove this hard code
                },
            })
                .then((estimateSectionsList) => {
                    if (mounted.current) {
                        console.log('estimate sections: ', estimateSectionsList);
                        let estimateSectionsData: EstimateSectionsDisplayData[] = [];

                        for (let estimateSection of estimateSectionsList) {
                            estimateSectionsData.push(new EstimateSectionsDisplayData(estimateSection));
                        }


                        const accordionData = [] as any;

                        estimateSectionsData.forEach((chosenCategory) => {
                            accordionData.push({
                                _id: chosenCategory._id,
                                label: chosenCategory.name,
                                totalCost: chosenCategory.totalCost ? roundNumber(chosenCategory.totalCost) : 0,
                                children: [],
                                // content: (<AdminPageSubcategory />),
                            });
                        });
                        setItems(accordionData);
                    }
                    setProgIndic(false);
                })

            setDataRequested(true);

            return;
        }
        return () => {
            mounted.current = false;
        };
    }, [dataRequested]);

    // React.useEffect(() => {
    //     setItems(props.data);
    //     console.log('props.data', props.data)
    // }, [])

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleEditLabor = (currentOfferItemEditId: string) => {
        // setOfferItemEditId(currentOfferItemEditId)
        setEditLaborEstimateLaborItemId(currentOfferItemEditId);
        setAnchorEl(null);
    };
    const handleEditMaterials = (currentOfferItemEditId: string) => {
        // setOfferItemEditId(currentOfferItemEditId)
        setEditMaterialsEstimateLaborItemId(currentOfferItemEditId);
        setAnchorEl(null);
    };
    const handleRemoveLabor = (currentOfferItemEditId: string) => {
        // setOfferItemEditId(currentOfferItemEditId)
        // setRemoveLaborEstimateLaborItemId(currentOfferItemEditId);
        setAnchorEl(null);



        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                Api.requestSession<any>({
                    command: 'estimate/remove_labor_item',
                    args: {
                        estimateLaborItemId: currentOfferItemEditId,
                    },
                })
                    .then(() => {
                        refreshEverything();
                    })
                    .finally(() => {
                        setRemoveLaborEstimateLaborItemId(null);
                        setEstimatedLaborItemName(null);

                    });
            }
        });
    };


    const handleUpdateRow = async (newRow, oldRow) => {
        // console.log(" processRowUpdate Triggered!", { newRow, oldRow });

        // Prevent unnecessary updates when no changes were made
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
            console.log("No changes detected, skipping update");
            return oldRow; // Return the old row without sending an update
        }

        if (!newRow || !newRow._id || !oldRow || !oldRow._id) {
            console.error("Invalid row data:", { newRow, oldRow });
            return oldRow; // Revert to oldRow if newRow is invalid
        }

        newRow.quantity = normalizeArmenianDecimalPoint(newRow.quantity)
        newRow.itemChangableAveragePrice = normalizeArmenianDecimalPoint(newRow.itemChangableAveragePrice)

        const isPositiveInteger: boolean = validatePositiveInteger(newRow.quantity);
        const isPositiveIntegerPrice: boolean = validatePositiveInteger(newRow.itemChangableAveragePrice);
        if ((newRow.quantity && !isPositiveInteger) || (newRow.itemChangableAveragePrice && !isPositiveIntegerPrice)) {
            return oldRow;
        }

        try {
            const response = await Api.requestSession<Api.ApiEstimateLaborItem>({
                command: `estimate/update_labor_item`,
                args: { estimatedLaborId: oldRow._id },
                json: newRow
            });

            console.log(" Successfully updated row:", response);
            refreshEverything(true)
            // //  Ensure state updates correctly
            // setRows((prevRows) =>
            //     prevRows.map((row) => (row.id === newRow.id ? newRow : row))
            // );

            return { ...newRow }; //  Ensure a new object is returned
        } catch (error) {
            console.error("Error updating row:", error);
            return oldRow; // Prevent DataGrid from breaking
        }
    };



    // const onRemoveLaborConfirm = React.useCallback(() => {
    //     console.log('removeLaborEstimateLaborItemId', removeLaborEstimateLaborItemId)
    //     Api.requestSession<any>({
    //         //TODO change any to interface
    //         command: 'estimate/remove_labor_item',
    //         args: {
    //             estimateLaborItemId: removeLaborEstimateLaborItemIdRef.current,
    //         },
    //     })
    //         .then((removedLabor) => {
    //             console.log(removedLabor);
    //             setRemoveLaborEstimateLaborItemId(null);
    //             removeLaborEstimateLaborItemIdRef.current = null;
    //             setEstimatedLaborItemName(null);
    //             refreshEverything(false);
    //         })
    //         .catch();

    // }, []);

    const handleAccordionChange = (id: string, level: number) => async (_event: React.SyntheticEvent, isExpanded: boolean) => {
        if (isExpanded) {
            await fetchChildren(id, level);
        }

        if (level === 2 && !isExpanded) {
            setExpandedAccordions([]);
        } else {
            setExpandedAccordions((prev) => (isExpanded ? [...prev, id] : prev.filter((accId) => accId !== id)));
        }
    };



    // Helper to map fetched data to your AccardionItem structure (exactly your old code)
    const mapLevelItem = (item: any): AccardionItem => {
        let itemArr: AccardionItem = {} as AccardionItem;
        itemArr._id = item._id;
        itemArr.label = item.name;
        itemArr.totalCost = item.totalCost; // from backend
        itemArr.children = [];
        itemArr.isLoading = false;
        itemArr.fullCode = item.fullCode;
        itemArr.itemName = item.itemName;
        itemArr.itemChangableName = item.itemChangableName;
        itemArr.itemFullCode = item.itemFullCode;
        itemArr.companyNameMadeOffer = item.accountName;
        itemArr.quantity = roundToThree(item.quantity);
        itemArr.itemChangableAveragePrice = roundToThree(item.itemChangableAveragePrice);
        itemArr.itemAveragePrice = roundToThree(item.itemAveragePrice);
        itemArr.itemMeasurementUnit = item.itemMeasurementUnit;
        itemArr.itemLaborHours = item.itemLaborHours; //🔴 TODO: this will need us in version 2 🔴
        itemArr.presentItemOfferAveragePrice = roundToThree(item.presentItemOfferAveragePrice);
        if (item.itemUnitPrice) {
            console.log('item.itemUnitPrice: ', item.itemUnitPrice, 'item.quantity: ', item.quantity);
            itemArr.itemUnitPrice = item.itemUnitPrice;
            itemArr.itemTotalCost = roundNumber(item.quantity * item.itemUnitPrice);
        }
        if (item.quantity && item.itemChangableAveragePrice) {
            itemArr.itemWithoutMaterial = roundNumber(item.quantity * item.itemChangableAveragePrice);
        }
        // if (item.materialTotalCost) {
        itemArr.materialTotalCost = roundNumber(item.materialTotalCost ?? 0);

        if (itemArr.itemWithoutMaterial) {
            itemArr.priceWithMaterial = roundNumber(itemArr.itemWithoutMaterial + (item.materialTotalCost ?? 0));
            if (itemArr.itemLaborHours) {
                if (itemArr.itemLaborHours === 0) {
                    itemArr.unitPrice = 0;
                } else {
                    itemArr.unitPrice = roundNumber(itemArr.priceWithMaterial / item.itemLaborHours)
                }
            }
        }
        // }
        return itemArr;
    };

    const fetchChildren = async (parentId: string, level: number): Promise<void> => {
        console.log('Fetching children for parentId:', parentId, 'at level:', level);

        // Set loading state for the current parent item
        setItems((prevItems) => prevItems.map((item) => (item._id === parentId ? { ...item, isLoading: true } : item)));

        const fetchedData = await fetchData(parentId, level);
        console.log('Fetched Data:', fetchedData);

        if (level === 2 && fetchedData.length > 0) {
            const hasNamedSubsection = fetchedData.some((sub) => sub.name.trim() !== '');

            if (!hasNamedSubsection) {
                console.log('No named subsections found, fetching items directly...');

                const emptySubsectionId = fetchedData[0]._id; // Get the empty subsection ID
                const fetchedItems = await fetchData(emptySubsectionId, 3);

                console.log('Fetched Items:', fetchedItems);

                // Create an "empty subsection" to store the items inside
                const emptySubsection: AccardionItem = {
                    _id: emptySubsectionId,
                    label: '',
                    totalCost: 0,
                    children: fetchedItems.map((item) => {
                        // Build the base object
                        const newItem: any = {
                            _id: item._id,
                            label: item.itemChangableName ?? 'Unnamed Item',
                            totalCost: item.totalCost ? roundNumber(item.totalCost) : 0,
                            isLoading: false,
                            fullCode: item.fullCode,
                            itemName: item.itemName,
                            itemChangableName: item.itemChangableName,
                            itemMeasurementUnit: item.itemMeasurementUnit,
                            itemFullCode: item.itemFullCode,
                            companyNameMadeOffer: item.accountName,
                            presentItemOfferAveragePrice: roundToThree(item.presentItemOfferAveragePrice),
                            itemLaborHours: item.itemLaborHours, //🔴 TODO: this will need us in version 2 🔴
                            quantity: roundToThree(item.quantity),
                            itemChangableAveragePrice: roundToThree(item.itemChangableAveragePrice),
                            itemAveragePrice: roundToThree(item.itemAveragePrice),
                            materialUnitPrice: roundToThree(item.materialUnitPrice),
                            materialQuantity: item.materialQuantity,
                        };

                        // Conditionally add fields if applicable
                        if (item.itemUnitPrice) {
                            console.log('item.itemUnitPrice:', item.itemUnitPrice, 'item.quantity:', item.quantity);
                            newItem.itemUnitPrice = roundToThree(item.itemUnitPrice);
                            newItem.itemTotalCost = roundNumber(item.quantity * item.itemUnitCost);
                        }

                        if (item.quantity && item.itemChangableAveragePrice) {
                            newItem.itemWithoutMaterial = roundNumber(item.quantity * item.itemChangableAveragePrice);
                        }

                        // if (item.materialTotalCost) {
                        newItem.materialTotalCost = roundNumber(item.materialTotalCost ?? 0);
                        // Make sure itemWithoutMaterial is defined before adding
                        if (newItem.itemWithoutMaterial) {
                            newItem.priceWithMaterial = roundNumber(newItem.itemWithoutMaterial + (item.materialTotalCost ?? 0));
                            if (newItem.itemLaborHours) {
                                if (newItem.itemLaborHours === 0) {
                                    newItem.unitPrice = 0;
                                } else {
                                    newItem.unitPrice = roundNumber(newItem.priceWithMaterial / item.itemLaborHours)
                                }
                            }
                        }
                        // }

                        return newItem;
                    }),
                    isLoading: false,
                };

                console.log('Empty Subsection with Items:', emptySubsection);

                // Update state by replacing section's children with this new subsection
                setItems((prevItems) => updateNestedChildren(prevItems, parentId, [emptySubsection], false));

                return;
            }
        }

        const newData: AccardionItem[] = [] as AccardionItem[];

        fetchedData.forEach((item) => {
            console.log('item', item);
            let itemArr: AccardionItem = {} as AccardionItem;
            itemArr._id = item._id;
            itemArr.label = item.name;
            (itemArr.totalCost = item.totalCost), (itemArr.children = []);
            itemArr.isLoading = false;
            itemArr.fullCode = item.fullCode;
            itemArr.itemName = item.itemName;
            itemArr.itemChangableName = item.itemChangableName;
            itemArr.itemFullCode = item.itemFullCode;
            itemArr.companyNameMadeOffer = item.accountName;
            itemArr.quantity = roundToThree(item.quantity);
            itemArr.itemChangableAveragePrice = roundToThree(item.itemChangableAveragePrice);
            itemArr.itemAveragePrice = roundToThree(item.itemAveragePrice);
            itemArr.itemMeasurementUnit = item.itemMeasurementUnit;
            itemArr.itemLaborHours = item.itemLaborHours; //🔴 TODO: this will need us in version 2 🔴

            itemArr.presentItemOfferAveragePrice = roundToThree(item.presentItemOfferAveragePrice);

            if (item.itemUnitPrice) {
                console.log('item.itemUnitPrice: ', item.itemUnitPrice, 'item.quantity: ', item.quantity);
                itemArr.itemUnitPrice = roundToThree(item.itemUnitPrice);
                itemArr.itemTotalCost = roundNumber(item.quantity * item.itemUnitPrice);
            }
            // if (item.materialUnits) {
            //     itemArr.materialUnitPrice = item.materialUnitPrice;
            //     itemArr.materialTotalCost = item.materialQuantity * item.materialUnitPrice;
            // }
            if (item.quantity && item.itemChangableAveragePrice) {
                itemArr.itemWithoutMaterial = roundNumber(item.quantity * item.itemChangableAveragePrice);
            }
            // if (item.materialTotalCost) {
            itemArr.materialTotalCost = roundNumber(item.materialTotalCost ?? 0);

            if (itemArr.itemWithoutMaterial) {
                itemArr.priceWithMaterial = roundNumber(itemArr.itemWithoutMaterial + (item.materialTotalCost ?? 0));
                if (itemArr.itemLaborHours) {
                    if (itemArr.itemLaborHours === 0) {
                        itemArr.unitPrice = 0;
                    } else {
                        itemArr.unitPrice = roundNumber(itemArr.priceWithMaterial / item.itemLaborHours)
                    }
                }
            }
            // }

            newData.push(itemArr);
        });

        setItems((prevItems) => updateNestedChildren(prevItems, parentId, newData, false));
    };

    const refreshAllAccordions = async () => {
        // Step 1: Refresh level‑3 (items) for expanded subsections
        const itemsWithUpdatedLevel3 = await Promise.all(
            items.map(async (item) => {
                if (expandedAccordions.includes(item._id) && item.children) {
                    const updatedLevel2Children = await Promise.all(
                        item.children.map(async (subItem) => {
                            if (expandedAccordions.includes(subItem._id)) {
                                const fetchedLevel3Data = await fetchData(subItem._id, 3);
                                const level3Items: AccardionItem[] = [];
                                fetchedLevel3Data.forEach((level3Item) => {
                                    level3Items.push(mapLevelItem(level3Item));
                                });
                                return { ...subItem, children: level3Items, isLoading: false };
                            }
                            return subItem;
                        })
                    );
                    return { ...item, children: updatedLevel2Children, isLoading: false };
                }
                return item;
            })
        );

        // Step 2: For each expanded section, re‑fetch its level‑2 data and merge in updated level‑3 children.
        const itemsWithUpdatedLevel2 = await Promise.all(
            itemsWithUpdatedLevel3.map(async (item) => {
                if (expandedAccordions.includes(item._id)) {
                    const fetchedLevel2Data = await fetchData(item._id, 2);
                    const newLevel2Items: AccardionItem[] = [];
                    fetchedLevel2Data.forEach((level2Item) => {
                        newLevel2Items.push(mapLevelItem(level2Item));
                    });
                    // For the "empty subsection" case:
                    if (newLevel2Items.length > 0 && newLevel2Items[0].label.trim() === '') {
                        const emptySubsectionId = newLevel2Items[0]._id;
                        const fetchedLevel3Data = await fetchData(emptySubsectionId, 3);
                        const level3Items: AccardionItem[] = [];
                        fetchedLevel3Data.forEach((level3Item) => {
                            level3Items.push(mapLevelItem(level3Item));
                        });
                        newLevel2Items[0].children = level3Items;
                    } else {
                        // For each level‑2 item, if it was previously updated with level‑3 data, merge that back.
                        const mergedLevel2Items = newLevel2Items.map((backendSub) => {
                            const existingSub = item.children?.find((sub) => sub._id === backendSub._id);
                            if (existingSub && existingSub.children && existingSub.children.length > 0) {
                                return { ...backendSub, children: existingSub.children };
                            }
                            return backendSub;
                        });
                        newLevel2Items.splice(0, newLevel2Items.length, ...mergedLevel2Items);
                    }
                    return { ...item, children: newLevel2Items, isLoading: false };
                }
                return item;
            })
        );
        setItems(itemsWithUpdatedLevel2);
    };

    // Step 3: Refresh top-level sections (simulate your useEffect)
    const refreshSections = async () => {
        // Fetch new sections data from the backend.
        const fetchedSections = await Api.requestSession<EstimateSectionsApi.ApiEstimateSecttion[]>({
            command: 'estimate/fetch_sections',
            args: { estimateId: props.estimateId },
        });

        // Merge new sections with existing ones to preserve children.
        setItems((prevItems) =>
            fetchedSections.map((section) => {
                // Look for the section in the previous state.
                const existingSection = prevItems.find((s) => s._id === section._id);
                return {
                    _id: section._id,
                    label: section.name,
                    totalCost: section.totalCost ?? 0,
                    // If an existing section is found, keep its children; otherwise default to empty.
                    children: existingSection ? existingSection.children : [],
                };
            })
        );
    };

    // Combined refresh: first refresh children, then sections.
    const refreshEverything = async (showProgIndic: boolean = true) => {
        if (showProgIndic) {
            setProgIndic(true);
        }

        await refreshAllAccordions();
        await refreshSections();

        if (props.onDataUpdated) {
            props.onDataUpdated(true);
        }

        if (showProgIndic) {
            setProgIndic(false);
        }
    };

    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />
    }

    if (!items) {
        <></>;
    }

    return (
        <>
            {/* <Button
                fullWidth
                onClick={() => {
                    setOpenAddSectionDialog(true);
                }}
                sx={{ width: 200, border: '1px dashed rgba(151, 71, 255)', color: ' rgba(151, 71, 255)', background: 'rgba(151, 71, 255, 0.04)' }}
            >
                Add Section
            </Button> */}
            {items.map((item) => (
                <Accordion
                    key={item._id}
                    // onChange={() => fetchChildren(item.id, 2)}
                    expanded={expandedAccordions.includes(item._id)}
                    onChange={handleAccordionChange(item._id, 2)}
                >
                    <AccordionSummary
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                                transform: 'none',
                            },
                        }}
                        expandIcon={
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    // Disable rotation on the icon itself
                                    '& .MuiSvgIcon-root': { transform: 'none' },
                                }}
                            >
                                <Typography sx={{ whiteSpace: 'nowrap' }}>
                                    {t('Total Cost: ') + `${parseThousandsSeparator(item.totalCost) ?? 0}`}
                                </Typography>
                                <ExpandMoreIcon />
                            </Box>
                        }
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{item.label}</Typography>
                            {/* <IconButton component="div" onClick={(e) => { e.stopPropagation(); setEstimateRenameId(item.id); setEstimateRenameDialogLabel(item.label); setEstimateRenameDialogType('section') }}>
                                <EditOutlinedIcon />
                            </IconButton> */}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {item.isLoading ? (
                            <CircularProgress size={24} />
                        ) : item.children && item.children.length > 0 ? (
                            item.children[0]?.label === '' ? ( // ✅ If the first child is an empty subsection, show table inside it
                                <>
                                    <DataTableComponent
                                        sx={{
                                            width: '100%',
                                            mt: 2,
                                            '& .editableCell': {
                                                border: '1px solid #00BFFF	', // ✅ Blue border
                                                borderRadius: '5px',
                                                // backgroundColor: '#f8f9fa', // Light background
                                                // transition: 'border 0.3s ease',
                                            },
                                            '& .editableCell:focus-within': {
                                                // border: '2px solid darkOrange',
                                            },

                                            '& .multilineCell': {
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word',
                                                lineHeight: '1.4',
                                                display: 'flex',
                                                alignItems: 'center',
                                                // justifyContent: 'start',
                                                paddingTop: '8px',
                                                paddingBottom: '8px',
                                            },
                                        }}
                                        columns={[
                                            // { field: 'itemFullCode', headerName: 'ID', headerAlign: 'left', width: 80, },
                                            {
                                                field: 'itemFullCode',
                                                type: 'actions',
                                                headerName: 'ID',
                                                headerAlign: 'left',
                                                flex: 0.2,
                                                renderCell: (params) => {
                                                    return (
                                                        <Button
                                                            onClick={() => {
                                                                console.log("🆔 Cell Value:", params.value);
                                                                setEstimatedLaborOfferViewId(params.row._id as string);
                                                                setEstimatedLaborOfferViewChangableItemName(params.row.itemName as string);
                                                            }}
                                                        >
                                                            {params.value}
                                                        </Button>
                                                    );
                                                },
                                                disableColumnMenu: true
                                            },
                                            { field: 'itemChangableName', headerName: t('Labor'), headerAlign: 'left', flex: 0.5, disableColumnMenu: true, cellClassName: 'multilineCell', },
                                            { field: 'itemMeasurementUnit', headerName: t('Unit'), headerAlign: 'left', flex: 0.2, disableColumnMenu: true },
                                            // { field: 'quantity', headerName: 'Quantity', headerAlign: 'left', width: 120, editable: true, cellClassName: 'editableCell' },
                                            { field: 'quantity', headerName: t('Quantity'), headerAlign: 'left', flex: 0.2, editable: (session?.user && permissionsSet?.has?.('EST_EDT_LBR_QTY') && !props.viewOnly), cellClassName: (session?.user && permissionsSet?.has?.('EST_EDT_LBR_QTY') && !props.viewOnly) ? 'editableCell' : '', disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                            // { field: 'itemChangableAveragePrice', headerName: 'Price', headerAlign: 'left', width: 120, editable: true, cellClassName: 'editableCell'},
                                            { field: 'itemChangableAveragePrice', headerName: t('Price'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                            { field: 'itemWithoutMaterial', headerName: t('Without material'), headerAlign: 'left', flex: 0.4, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                            { field: 'materialTotalCost', headerName: t('Material Cost'), headerAlign: 'left', flex: 0.4, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                            { field: 'priceWithMaterial', headerName: t('Price with material'), headerAlign: 'left', flex: 0.5, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                            { field: 'unitPrice', headerName: t('Unit Price'), headerAlign: 'center', align: 'center', width: 160, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },

                                            //🔴 TODO: this will need us in version 2 🔴

                                            // {
                                            //     field: 'presentItemOfferAveragePrice',
                                            //     headerName: 'Average Price',
                                            //     width: 120,
                                            //     renderCell: (cell) => {
                                            //         if (cell.value) {
                                            //             if (cell.row.itemAveragePrice) {
                                            //                 if (cell.row.itemAveragePrice - cell.value < 0) {
                                            //                     return (
                                            //                         <Box sx={{ display: 'flex' }}>
                                            //                             <IconButton>
                                            //                                 <NorthEastIcon sx={{ color: 'red' }} />
                                            //                             </IconButton>
                                            //                             {cell.value}
                                            //                         </Box>
                                            //                     );
                                            //                 } else if (cell.row.itemAveragePrice - cell.value > 0) {
                                            //                     return (
                                            //                         <Box sx={{ display: 'flex' }}>
                                            //                             <IconButton>
                                            //                                 <SouthWestIcon sx={{ color: 'green' }} />
                                            //                             </IconButton>
                                            //                             {cell.value}
                                            //                         </Box>
                                            //                     );
                                            //                 } else {
                                            //                     return (
                                            //                         <Box sx={{ display: 'flex' }}>
                                            //                             <IconButton>
                                            //                                 <VerticalAlignCenterIcon sx={{ color: 'yellow' }} />
                                            //                             </IconButton>
                                            //                             {cell.value}
                                            //                         </Box>
                                            //                     );
                                            //                 }
                                            //             }
                                            //             return <>{cell.value}</>;
                                            //         } else {
                                            //             return <></>;
                                            //         }
                                            //     },
                                            // }, 

                                            {
                                                field: 'info',
                                                type: 'actions',
                                                headerName: t('Materials'),
                                                flex: 0.2,
                                                renderCell: (cell) => {
                                                    return (
                                                        <>
                                                            {/* <IconButton onClick={() => setCompanyDetailsId(cell.id as string)}> */}
                                                            <IconButton
                                                                sx={{ color: mainIconColor }}
                                                                onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                    // setAccountDetailsId(cell.id as string)

                                                                    // console.log('esitmate cell', cell);
                                                                    setEstimatedLaborItemName(cell.row.itemChangableName as string);
                                                                    // setEstimatedLaborItemDetailsId(cell.id as string);
                                                                    // handleClick(event);
                                                                    setEditMaterialsEstimateLaborItemId(cell.row._id as string);

                                                                }}
                                                            >
                                                                {/* <ScienceIcon /> */}
                                                                <ImgElement src="/images/icons/material.svg" sx={{ height: materialIconHeight }} />
                                                            </IconButton>
                                                        </>
                                                    );
                                                },
                                            }, // width: 600 },
                                        ]}
                                        rows={item.children[0].children} // ✅ Show items from the empty subsection
                                        getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                        processRowUpdate={handleUpdateRow} // Handle updates
                                        onProcessRowUpdateError={(error) => console.error('Error updating row:', error)} // ✅ Handle errors
                                        getRowHeight={({ model }) =>
                                            makeMultilineTableCell(model.itemChangableName as string)
                                        }
                                    />
                                    {/* <Button variant='contained' sx={{ m: 1 }} onClick={() => setOpenAddOfferDialogTypeWithouSubsection('labor')}>
                                        add labor
                                    </Button> */}

                                    {estimatedLaborItemDetailsId && (
                                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                                            <MenuItem
                                                onClick={() => {
                                                    handleEditLabor(estimatedLaborItemDetailsId);
                                                }}
                                            >
                                                {t('Edit Labor')}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => {
                                                    handleEditMaterials(estimatedLaborItemDetailsId);
                                                }}
                                            >
                                                {t('Edit Materials')}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => {
                                                    handleRemoveLabor(estimatedLaborItemDetailsId);
                                                }}
                                            >
                                                Remove
                                            </MenuItem>
                                        </Menu>
                                    )}

                                    {/* {(editLaborEstimateLaborItemIdEditId && estimatedLaborItemName) && <EstimateLaborEditDialog estimatedLaborName={estimatedLaborItemName} estimatedLaborId={editLaborEstimateLaborItemIdEditId} onClose={() => { setEditLaborEstimateLaborItemId(null) }} />}
                                    {(editMaterialsEstimateLaborItemId && estimatedLaborItemName) && <EstimateMaterialsListDialog estimatedLaborName={estimatedLaborItemName} estimatedLaborId={editMaterialsEstimateLaborItemId} onClose={() => { setEditMaterialsEstimateLaborItemId(null) }} />}
                                    {(removeLaborEstimateLaborItemId && estimatedLaborItemName) && <EstimateMaterialDeleteDialog title={estimatedLaborItemName} message='Are you sure you want to remove this?' onConfirm={onRemoveLaborConfirm} onClose={() => { setRemoveLaborEstimateLaborItemId(null), setEstimatedLaborItemName(null) }} />} */}

                                    {/* {openAddOfferDialogTypeWithouSubsection && (
                                        <UserPageAddEstimateItemDialog
                                            offerType={openAddOfferDialogTypeWithouSubsection}
                                            isEstimation={true}
                                            // estimateSubsectionId={}
                                            estimateSectionId={item._id}
                                            estimatedLaborId={estimatedLaborItemId}
                                            onConfirm={() => {
                                                refreshEverything(false);
                                            }}
                                            onClose={() => {
                                                setOpenAddOfferDialogTypeWithouSubsection(null);
                                            }}
                                        />
                                    )} */}
                                </>
                            ) : (
                                item.children.map((child) =>
                                    child.children ? (
                                        <Accordion
                                            key={child._id}
                                            // onChange={() => fetchChildren(child.id, 3)}
                                            expanded={expandedAccordions.includes(child._id)}
                                            onChange={handleAccordionChange(child._id, 3)}
                                        >
                                            {/* <AccordionSummary
                                                expandIcon={<ExpandMoreIcon />}
                                                sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                                            >
                                                <Typography>{child.label}</Typography>
                                                <Box sx={{ flexGrow: 1 }} />
                                                <Typography sx={{ whiteSpace: 'nowrap', mr: 2 }}>{`Total Cost: ${child.totalCost ?? 0}`}</Typography>
                                            </AccordionSummary> */}
                                            <AccordionSummary
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    width: '100%',
                                                    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                                                        transform: 'none',
                                                    },
                                                }}
                                                expandIcon={
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            // Disable rotation on the icon itself
                                                            '& .MuiSvgIcon-root': { transform: 'none' },
                                                        }}
                                                    >
                                                        <Typography sx={{ whiteSpace: 'nowrap' }}>
                                                            {t('Total Cost: ') + `${parseThousandsSeparator(child.totalCost) ?? 0}`}
                                                        </Typography>
                                                        <ExpandMoreIcon />
                                                    </Box>
                                                }
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography>{child.label}</Typography>
                                                    {/* <IconButton component="div" onClick={(e) => { e.stopPropagation(); setEstimateRenameId(child.id); setEstimateRenameDialogLabel(child.label); setEstimateRenameDialogType('subsection') }}>
                                                        <EditOutlinedIcon />
                                                    </IconButton> */}
                                                </Box>
                                            </AccordionSummary>

                                            <AccordionDetails>
                                                {child.isLoading ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    <>
                                                        <DataTableComponent
                                                            sx={{
                                                                width: '100%',
                                                                '& .editableCell': {
                                                                    border: '1px solid #00BFFF	', // ✅ Blue border
                                                                    borderRadius: '5px',
                                                                    // backgroundColor: '#f8f9fa', // Light background
                                                                    // transition: 'border 0.3s ease',
                                                                },
                                                                '& .editableCell:focus-within': {
                                                                    // border: '2px solid darkOrange',
                                                                },

                                                                '& .multilineCell': {
                                                                    whiteSpace: 'normal',
                                                                    wordWrap: 'break-word',
                                                                    lineHeight: '1.4',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    // justifyContent: 'start',
                                                                    paddingTop: '8px',
                                                                    paddingBottom: '8px',
                                                                },
                                                            }}
                                                            columns={[
                                                                // { field: 'itemFullCode', headerName: 'ID', headerAlign: 'left', width: 80 },
                                                                {
                                                                    field: 'itemFullCode',
                                                                    type: 'actions',
                                                                    headerName: 'ID',
                                                                    headerAlign: 'left',
                                                                    width: 80,
                                                                    renderCell: (params) => {
                                                                        return (
                                                                            <Button
                                                                                onClick={() => {
                                                                                    console.log("🆔 Cell Value:", params.value);
                                                                                    setEstimatedLaborOfferViewId(params.row._id as string);
                                                                                    setEstimatedLaborOfferViewChangableItemName(params.row.itemChangableName as string);
                                                                                }}
                                                                            >
                                                                                {params.value}
                                                                            </Button>
                                                                        );
                                                                    },
                                                                    disableColumnMenu: true
                                                                },
                                                                { field: 'itemChangableName', headerName: t('Labor'), headerAlign: 'left', flex: 0.7, disableColumnMenu: true, cellClassName: 'multilineCell', },
                                                                { field: 'itemMeasurementUnit', headerName: t('Unit'), headerAlign: 'left', flex: 0.15, disableColumnMenu: true },
                                                                // { field: 'quantity', headerName: 'Quantity', headerAlign: 'left', width: 120, editable: true, cellClassName: 'editableCell', },
                                                                { field: 'quantity', headerName: t('Quantity'), headerAlign: 'left', flex: 0.2, editable: (session?.user && permissionsSet?.has?.('EST_EDT_LBR_QTY') && props.viewOnly), cellClassName: (session?.user && permissionsSet?.has?.('EST_EDT_LBR_QTY') && !props.viewOnly) ? 'editableCell' : '', disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                                                // { field: 'itemChangableAveragePrice', headerName: 'Price', headerAlign: 'left', width: 120, editable: true, cellClassName: 'editableCell', },
                                                                { field: 'itemChangableAveragePrice', headerName: t('Price'), headerAlign: 'left', flex: 0.25, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                                                { field: 'itemWithoutMaterial', headerName: t('Without material'), headerAlign: 'center', align: 'center', flex: 0.3, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                                                { field: 'materialTotalCost', headerName: t('Material Cost'), headerAlign: 'center', align: 'center', flex: 0.3, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },
                                                                {
                                                                    field: 'priceWithMaterial',
                                                                    headerName: t('Price with material'),
                                                                    headerAlign: 'center',
                                                                    align: 'center',
                                                                    flex: 0.3,
                                                                    disableColumnMenu: true,
                                                                    valueFormatter: (value) => formatCurrency(value)
                                                                },
                                                                { field: 'unitPrice', headerName: t('Unit Price'), headerAlign: 'center', align: 'center', width: 160, disableColumnMenu: true, valueFormatter: (value) => formatCurrency(value) },

                                                                //🔴 TODO: this will need us in version 2 🔴

                                                                // {
                                                                //     field: 'presentItemOfferAveragePrice',
                                                                //     headerName: 'Average Price',
                                                                //     width: 120,
                                                                //     renderCell: (cell) => {
                                                                //         if (cell.value) {
                                                                //             if (cell.row.itemAveragePrice) {
                                                                //                 if (cell.row.itemAveragePrice - cell.value < 0) {
                                                                //                     return (
                                                                //                         <Box sx={{ display: 'flex' }}>
                                                                //                             <IconButton>
                                                                //                                 <NorthEastIcon sx={{ color: 'red' }} />
                                                                //                             </IconButton>
                                                                //                             {cell.value}
                                                                //                         </Box>
                                                                //                     );
                                                                //                 } else if (cell.row.itemAveragePrice - cell.value > 0) {
                                                                //                     return (
                                                                //                         <Box sx={{ display: 'flex' }}>
                                                                //                             <IconButton>
                                                                //                                 <SouthWestIcon sx={{ color: 'green' }} />
                                                                //                             </IconButton>
                                                                //                             {cell.value}
                                                                //                         </Box>
                                                                //                     );
                                                                //                 } else {
                                                                //                     return (
                                                                //                         <Box sx={{ display: 'flex' }}>
                                                                //                             <IconButton>
                                                                //                                 <VerticalAlignCenterIcon sx={{ color: 'yellow' }} />
                                                                //                             </IconButton>
                                                                //                             {cell.value}
                                                                //                         </Box>
                                                                //                     );
                                                                //                 }
                                                                //             }
                                                                //             return <>{cell.value}</>;
                                                                //         } else {
                                                                //             return <></>;
                                                                //         }
                                                                //     },
                                                                // }, // width: 600 },

                                                                {
                                                                    field: 'info',
                                                                    type: 'actions',
                                                                    headerName: t('Materials'),
                                                                    width: 80,
                                                                    renderCell: (cell) => {
                                                                        return (
                                                                            <>
                                                                                <IconButton
                                                                                    sx={{ color: mainIconColor }}
                                                                                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                                        setEstimatedLaborItemName(cell.row.itemChangableName as string);
                                                                                        // setEstimatedLaborItemDetailsId(cell.id as string);
                                                                                        // handleClick(event);
                                                                                        setEditMaterialsEstimateLaborItemId(cell.row._id as string);
                                                                                    }}
                                                                                >
                                                                                    {/* <ScienceIcon /> */}
                                                                                    <ImgElement src="/images/icons/material.svg" sx={{ height: materialIconHeight }} />
                                                                                </IconButton>
                                                                            </>
                                                                        );
                                                                    },
                                                                    disableColumnMenu: true
                                                                }, // width: 600 },
                                                            ]}
                                                            rows={child.children}
                                                            getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                                            processRowUpdate={handleUpdateRow} // Handle updates
                                                            onProcessRowUpdateError={(error) => console.error('Error updating row:', error)} // ✅ Handle errors
                                                            getRowHeight={({ model }) =>
                                                                makeMultilineTableCell(model.itemChangableName as string)
                                                            }
                                                        />
                                                        {/* 
                                                        <Button
                                                            variant='contained'
                                                            sx={{ m: 1 }}
                                                            onClick={() => {
                                                                setOpenAddOfferDialogType('labor'), setSelectedChildId(child.id);
                                                            }}
                                                        >
                                                            add labor
                                                        </Button> */}
                                                        {estimatedLaborItemDetailsId && (
                                                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                                                                <MenuItem
                                                                    onClick={() => {
                                                                        handleEditLabor(estimatedLaborItemDetailsId);
                                                                    }}
                                                                >
                                                                    {t('Edit Labor')}
                                                                </MenuItem>
                                                                <MenuItem
                                                                    onClick={() => {
                                                                        handleEditMaterials(estimatedLaborItemDetailsId);
                                                                    }}
                                                                >
                                                                    {t('Edit Materials')}
                                                                </MenuItem>
                                                                <MenuItem
                                                                    onClick={() => {
                                                                        handleRemoveLabor(estimatedLaborItemDetailsId);
                                                                    }}
                                                                >
                                                                    {t('Remove')}
                                                                </MenuItem>
                                                            </Menu>
                                                        )}

                                                        {/* {(editLaborEstimateLaborItemIdEditId && estimatedLaborItemName) && <EstimateLaborEditDialog estimatedLaborName={estimatedLaborItemName} estimatedLaborId={editLaborEstimateLaborItemIdEditId} onClose={() => { setEditLaborEstimateLaborItemId(null) }} />}
                                                        {(editMaterialsEstimateLaborItemId && estimatedLaborItemName) && <EstimateMaterialsListDialog estimatedLaborName={estimatedLaborItemName} estimatedLaborId={editMaterialsEstimateLaborItemId} onClose={() => { setEditMaterialsEstimateLaborItemId(null) }} />}
                                                        {(removeLaborEstimateLaborItemId && estimatedLaborItemName) && <EstimateMaterialDeleteDialog title={estimatedLaborItemName} message='Are you sure you want to remove this?' onConfirm={onRemoveLaborConfirm} onClose={() => { setRemoveLaborEstimateLaborItemId(null), setEstimatedLaborItemName(null) }} />} */}
                                                    </>
                                                )}

                                                {/* {openAddOfferDialogType && selectedChildId === child._id && (
                                                    <UserPageAddEstimateItemDialog
                                                        offerType={openAddOfferDialogType}
                                                        isEstimation={true}
                                                        estimateSubsectionId={child._id}
                                                        estimatedLaborId={estimatedLaborItemId}
                                                        onConfirm={() => {
                                                            refreshEverything(false);
                                                        }}
                                                        onClose={() => {
                                                            setOpenAddOfferDialogType(null);
                                                            setSelectedChildId(null);
                                                        }}
                                                    />
                                                )} */}
                                            </AccordionDetails>
                                        </Accordion>
                                    ) : null
                                )
                            )
                        ) : (
                            <>
                                {/* <Typography>No data available</Typography> */}


                                {/* <Button
                                    fullWidth
                                    onClick={() => {
                                        setOpenAddSubsectionDialog(true);
                                        setOpenAddSubsectionDialogCurrentSectionId(item.id);
                                    }}
                                    sx={{
                                        width: 200,
                                        border: '1px dashed rgba(151, 71, 255)',
                                        color: ' rgba(151, 71, 255)',
                                        background: 'rgba(151, 71, 255, 0.04)',
                                    }}
                                >
                                    Add Subsection
                                </Button>
                                <Button variant='contained' sx={{ m: 1 }} onClick={() => setOpenAddOfferDialogTypeWithouSubsection('labor')}>
                                    add labor
                                </Button> */}
                                {/* {openAddOfferDialogTypeWithouSubsection && (
                                    <UserPageAddEstimateItemDialog
                                        offerType={openAddOfferDialogTypeWithouSubsection}
                                        isEstimation={true}
                                        // estimateSubsectionId={}
                                        estimateSectionId={item._id}
                                        estimatedLaborId={estimatedLaborItemId}
                                        onConfirm={() => {
                                            refreshEverything(false);
                                        }}
                                        onClose={() => {
                                            setOpenAddOfferDialogTypeWithouSubsection(null);
                                        }}
                                    />
                                )} */}
                                {/* {openAddSubsectionDialog && <EstimateSubsectionButtonDialog onConfirm={() => { refreshEverything(); setOpenAddSubsectionDialog(false); }} estimateSectionId={item.id} onClose={() => {
                                setOpenAddSubsectionDialog(false);
                            }} />} */}
                            </>
                        )}
                        {/* {item.children?.[0] && item.children[0].label !== '' && (
                            <Button
                                fullWidth
                                onClick={() => {
                                    setOpenAddSubsectionDialog(true);
                                    setOpenAddSubsectionDialogCurrentSectionId(item.id);
                                }}
                                sx={{
                                    width: 200,
                                    border: '1px dashed rgba(151, 71, 255)',
                                    color: 'rgba(151, 71, 255)',
                                    background: 'rgba(151, 71, 255, 0.04)',
                                }}
                            >
                                Add Subsection
                            </Button>
                        )} */}
                        {/* {(openAddSubsectionDialog && !openAddSubsectionDialogCurrentSectionId) && <EstimateSubsectionButtonDialog onConfirm={() => { refreshEverything(); setOpenAddSubsectionDialog(false); }} estimateSectionId={item.id} onClose={() => {
                            setOpenAddSubsectionDialog(false);
                        }} />} */}
                    </AccordionDetails>
                </Accordion>
            ))}

            {openAddSubsectionDialog && openAddSubsectionDialogCurrentSectionId && (
                <EstimateSubsectionButtonDialog
                    onConfirm={() => {
                        refreshEverything();
                        setOpenAddSubsectionDialog(false);
                    }}
                    estimateSectionId={openAddSubsectionDialogCurrentSectionId}
                    onClose={() => {
                        setOpenAddSubsectionDialog(false);
                    }}
                />
            )}

            {editLaborEstimateLaborItemIdEditId && estimatedLaborItemName && (
                <EstimateLaborEditDialog
                    onConfirm={() => {
                        refreshEverything();
                        setEditLaborEstimateLaborItemId(null);
                    }}
                    estimatedLaborName={estimatedLaborItemName}
                    estimatedLaborId={editLaborEstimateLaborItemIdEditId}
                    onClose={() => {
                        setEditLaborEstimateLaborItemId(null);
                    }}
                />
            )}
            {editMaterialsEstimateLaborItemId && estimatedLaborItemName && (
                <EstimateMaterialsListOnlyForViewDialog
                    onConfirm={() => {
                        refreshEverything(false);
                        // setEditMaterialsEstimateLaborItemId(null);
                        // setEstimatedLaborItemName(null);
                    }}
                    estimatedLaborName={estimatedLaborItemName}
                    estimatedLaborId={editMaterialsEstimateLaborItemId}
                    onClose={() => {
                        setEditMaterialsEstimateLaborItemId(null);
                    }}
                />
            )}
            {/* {removeLaborEstimateLaborItemId && estimatedLaborItemName && (
                <EstimateLaborDeleteDialog
                    laborItemMongoId={removeLaborEstimateLaborItemId}
                    title={estimatedLaborItemName}
                    message='Are you sure you want to remove this?'
                    onConfirm={() => {
                        refreshEverything();
                        setRemoveLaborEstimateLaborItemId(null);
                        setEstimatedLaborItemName(null);
                    }}
                    onClose={() => {
                        setRemoveLaborEstimateLaborItemId(null), setEstimatedLaborItemName(null);
                    }}
                />
            )} */}

            {openAddSectionDialog && (
                <EstimateSectionButtonDialog
                    estimateId={props.estimateId}
                    onConfirm={() => {
                        setDataRequested(false);
                        setOpenAddSectionDialog(false);
                    }}
                    onClose={() => {
                        setOpenAddSectionDialog(false);
                    }}
                />
            )}


            {(estimateRenameId && estimateRenameDialogLabel && estimateRenameDialogType) && (
                <EstimateRenameDialog
                    title='Rename'
                    label={estimateRenameDialogLabel}
                    dialogRenameType={estimateRenameDialogType}
                    labelId={estimateRenameId}
                    onConfirm={() => {
                        refreshEverything(false);
                        setEstimateRenameId(null), setEstimateRenameDialogLabel(null);
                    }}
                    onClose={() => {
                        setEstimateRenameId(null), setEstimateRenameDialogLabel(null);
                    }}
                />
            )}





            {(estimatedLaborOfferViewId && estimatedLaborOfferViewChangableItemName)
                &&
                <EstimatedItemPresentViewDialog
                    itemType='labor'
                    changableItemCurrentName={estimatedLaborOfferViewChangableItemName}
                    itemId={estimatedLaborOfferViewId}
                    onClose={() => { setEstimatedLaborOfferViewId(null); setEstimatedLaborOfferViewChangableItemName(null) }}
                />
            }
        </>
    );
}

// ✅ Main Component (Starts NestedAccordion)
interface AccardionProps {
    data: {
        id: string;
        label: string;
        content: React.ReactNode;
        totalCost: number;
        // children: ChildData[];
        isLoading?: boolean;
    }[];
}

