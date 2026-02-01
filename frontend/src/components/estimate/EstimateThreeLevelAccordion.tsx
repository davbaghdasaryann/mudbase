import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { CircularProgress, Typography, IconButton, Button, MenuItem, Menu, Box, Stack, Tooltip } from '@mui/material';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

import { useTranslation } from 'react-i18next';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import * as Api from '@/api';
import * as EstimateApi from '@/api/estimate';
import * as EstimateItemsApi from '@/api/estimate_items';
import * as GD from '@/data/global_dispatch';

import { EstimateSubsectionsDisplayData } from '@/data/estimate_subsections_display_data';
import UserPageAddEstimateItemDialog from '@/app/offers/UserPageAddEstimateItemDIalog';
import { EstimateLaborItemDisplayData } from '@/data/estimate_items_data';
import EstimateSubsectionButtonDialog from './EstimateAddSubsectionDialog';
import { EstimateLaborEditDialog } from './EstimateLaborEditDialog';
import { EstimateMaterialsListDialog } from './EstimateMaterialsListDialog';

import * as EstimateSectionsApi from '@/api/estimate';
import { EstimateSectionsDisplayData } from '../../data/estimate_sections_display_data';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import EstimateSectionButtonDialog from './EstimateAddSectionDialog';
import { EstimateRenameDialog } from './EstimateRenameDIalog';
import EstimatedItemPresentViewDialog from './EstimatedItemPresentViewDialog';
import { validateDoubleInteger } from '@/tslib/validate';
import { usePermissions } from '@/api/auth';
import { confirmDialog } from '../ConfirmationDialog';
import DataTableComponent from '../DataTableComponent';
import { mainIconColor, materialIconHeight } from '../../theme';
import ImgElement from '../../tsui/DomElements/ImgElement';

import { normalizeArmenianDecimalPoint, parseThousandsSeparator, roundNumber, roundToThree } from '@/tslib/parse';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { formatCurrency, formatCurrencyRoundedSymbol } from '@/lib/format_currency';
import { EstimateRootAccordion, EstimateRootAccordionDetails, EstimateRootAccordionSummary } from '@/components/AccordionComponent';
import MaterialsTwoPartDialog from '@/app/offers/MaterialsTwoPartDialog';
import { makeMultilineTableCell } from '@/lib/format_date';
import { MSpacer } from '@/tsui';

// ✅ Define Interface
interface AccordionItem {
    _id: string;
    label: string;
    totalCost: number;
    isLoading?: boolean;
    children?: AccordionItem[]; // Holds nested children
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

const MARKET_PRICE_EPS = 0.01; /* allow small rounding differences */
const isMarketPriceRow = (row: AccordionItem) =>
    row.itemAveragePrice != null &&
    row.itemChangableAveragePrice != null &&
    Math.abs(row.itemChangableAveragePrice - row.itemAveragePrice!) < MARKET_PRICE_EPS;

// ✅ Simulated API Call (Replace with real API)
const fetchData = async (parentId: string, level: number) => {
    return new Promise<any[]>((resolve) => {
        if (level === 2) {
            Api.requestSession<EstimateApi.ApiEstimateSubsection[]>({
                command: `estimate/fetch_subsections`,
                args: { estimateSectionId: parentId },
            })
                .then((estimateSubsectionsList) => {
                    let estimateSubsectionsData: EstimateSubsectionsDisplayData[] = [];

                    for (let estimateSubsection of estimateSubsectionsList) {
                        estimateSubsectionsData.push(new EstimateSubsectionsDisplayData(estimateSubsection));
                    }

                    resolve(estimateSubsectionsData);
                    // console.log('laborSubcategoriesData', estimateSubsectionsData);
                })
                .catch();
        } else if (level === 3) {
            Api.requestSession<EstimateItemsApi.ApiEstimateLaborItem[]>({
                command: 'estimate/fetch_labor_items',
                args: { estimateSubsectionId: parentId },
            })
                .then((estimateLaborItemsResData) => {
                    // console.log('estimateLaborItemsResData: ', estimateLaborItemsResData);

                    let estimateLaborItemsData: EstimateLaborItemDisplayData[] = [];

                    for (let estimateLaborItem of estimateLaborItemsResData) {
                        estimateLaborItemsData.push(new EstimateLaborItemDisplayData(estimateLaborItem));
                    }

                    // console.log('estimateLaborItemsData', estimateLaborItemsData);
                    resolve(estimateLaborItemsData);
                })
                .catch();
        }
    });
};

// ✅ Function to Find Parent and Add Children in Correct Position
const updateNestedChildren = (items: AccordionItem[], parentId: string, newChildren: AccordionItem[], isLoading: boolean): AccordionItem[] => {
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

interface EstimateThreeLevelNestedAccordionProps {
    estimateId: string;
    isOnlyEstInfo?: boolean;
    onDataUpdated?: (updated: boolean) => void;
    /** When true, labor rows show checkboxes and selection is tracked for "Import from Library" (market prices for selected only). */
    selectMode?: boolean;
}

export interface EstimateThreeLevelNestedAccordionRef {
    openAddSectionDialog: () => void;
    calcMarketPrices: (estimatedLaborIds?: string[]) => void;
    refreshEverything: (showProgIndic?: boolean) => Promise<void>;
    getSelectedLaborIds: () => string[];
}

const EstimateThreeLevelNestedAccordion = forwardRef<EstimateThreeLevelNestedAccordionRef, EstimateThreeLevelNestedAccordionProps>(function EstimateThreeLevelNestedAccordion(props, ref) {
    const { session, status, permissionsSet } = usePermissions();

    const permAddFields = session?.user && permissionsSet?.has?.('EST_ADD_FLDS');

    const [openAddSubsectionDialog, setOpenAddSubsectionDialog] = useState(false);
    const [openAddSubsectionDialogCurrentSectionId, setOpenAddSubsectionDialogCurrentSectionId] = useState<string | null>(null);
    const [openAddSectionDialog, setOpenAddSectionDialog] = useState(false);

    const [estimateRenameId, setEstimateRenameId] = useState<string | null>(null);
    const [estimateRenameDialogLabel, setEstimateRenameDialogLabel] = useState<string | null>(null);
    const [estimateRenameDialogType, setEstimateRenameDialogType] = useState<'section' | 'subsection' | null>(null);

    const [estimatedLaborItemDetailsId, setEstimatedLaborItemDetailsId] = useState<string | null>(null);
    const [estimatedLaborItemName, setEstimatedLaborItemName] = useState<string | null>(null);

    const [editLaborEstimateLaborItemIdEditId, setEditLaborEstimateLaborItemId] = useState<string | null>(null);
    const [editMaterialsEstimateLaborItemId, setEditMaterialsEstimateLaborItemId] = useState<string | null>(null);
    const [removeLaborEstimateLaborItemId, setRemoveLaborEstimateLaborItemId] = useState<string | null>(null);

    const [openAddOfferDialogType, setOpenAddOfferDialogType] = useState<'labor' | 'material' | null>(null);

    /** Selected labor row ids by grid key (section_empty or subsection id). Used when selectMode is on. */
    const [selectionByGridKey, setSelectionByGridKey] = useState<Record<string, string[]>>({});
    const [openAddOfferDialogTypeWithouSubsection, setOpenAddOfferDialogTypeWithouSubsection] = useState<'labor' | 'material' | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    const [estimatedLaborOfferViewId, setEstimatedLaborOfferViewId] = useState<string | null>(null);
    const [estimatedLaborOfferViewChangableItemName, setEstimatedLaborOfferViewChangableItemName] = useState<string | null>(null);

    const [estimatedLaborItemId, setEstimatedLaborItemId] = useState<string | null>(null);

    const [sections, setSections] = useState<AccordionItem[]>([]);
    const sectionsRef = useRef<AccordionItem[]>([]);

    const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
    const expandedAccordionsRef = useRef<string[]>([]);

    const [anchorEl, setAnchorEl] = useState(null);

    const mounted = useRef(false);
    const [dataRequested, setDataRequested] = useState(false);
    const [progIndic, setProgIndic] = useState(false);
    const [t] = useTranslation();

    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
    const [currentSubsectionId, setCurrentSubsectionId] = useState<string | null>(null);

    // const onCancelDialog = React.useCallback((event, reason) => {
    //     if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
    // }, []);

    useEffect(() => {
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
                        // console.log('estimate sections: ', estimateSectionsList);
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
                        sectionsRef.current = accordionData;
                        setSections(sectionsRef.current);
                    }
                    setProgIndic(false);
                })
                .catch();
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

    const handleClick = useCallback((event) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleEditLabor = useCallback((currentOfferItemEditId: string) => {
        // setOfferItemEditId(currentOfferItemEditId)
        setEditLaborEstimateLaborItemId(currentOfferItemEditId);
        setAnchorEl(null);
    }, []);

    const handleRemoveLabor = (currentOfferItemEditId: string) => {
        setAnchorEl(null);

        confirmDialog(`Are you sure you want to remove ${estimatedLaborItemName}?`).then((result) => {
            if (result.isConfirmed) {
                Api.requestSession<any>({
                    command: 'estimate/remove_labor_item',
                    args: {
                        estimateLaborItemId: currentOfferItemEditId,
                    },
                })
                    .then(() => {
                        refreshEverything(true);
                    })
                    .finally(() => {
                        setRemoveLaborEstimateLaborItemId(null);
                        setEstimatedLaborItemName(null);
                    });
            }
        });
    };

    const onRemove = (type: 'section' | 'subsection', id: string) => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                if (type === 'section') {
                    Api.requestSession<any>({
                        command: 'estimate/remove_section',
                        args: { estimateSectionId: id },
                    }).then(() => {
                        refreshEverythingAfterRemovingSecOrSubsec(true);
                    });
                } else if (type === 'subsection') {
                    Api.requestSession<any>({
                        command: 'estimate/remove_subsection',
                        args: { estimateSubsectionId: id },
                    }).then(() => {
                        refreshEverythingAfterRemovingSecOrSubsec(true);
                    });
                }
            }
        });
    };

    const handleUpdateRow = async (newRow, oldRow) => {
        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
            console.log('No changes detected, skipping update');
            return oldRow; // Return the old row without sending an update
        }

        if (!newRow || !newRow._id || !oldRow || !oldRow._id) {
            console.error('Invalid row data:', { newRow, oldRow });
            return oldRow; // Revert to oldRow if newRow is invalid
        }

        const isPositiveInteger: boolean = validateDoubleInteger(newRow.quantity);
        // const isPositiveIntegerPrice: boolean = validatePositiveDoubleInteger(newRow.itemChangableAveragePrice);
        const isPositiveIntegerPrice: boolean = validateDoubleInteger(newRow.itemChangableAveragePrice);
        const isPositiveIntegerLaborHours: boolean = validateDoubleInteger(newRow.itemLaborHours);
        if (
            (newRow.quantity && !isPositiveInteger) ||
            (newRow.itemChangableAveragePrice && !isPositiveIntegerPrice) ||
            (newRow.itemLaborHours && !isPositiveIntegerLaborHours)
        ) {
            return oldRow;
        }
        newRow.quantity = normalizeArmenianDecimalPoint(newRow.quantity);
        newRow.itemChangableAveragePrice = normalizeArmenianDecimalPoint(newRow.itemChangableAveragePrice);
        newRow.itemLaborHours = normalizeArmenianDecimalPoint(newRow.itemLaborHours);

        const response = await Api.requestSession<Api.ApiEstimateLaborItem>({
            command: `estimate/update_labor_item`,
            args: { estimatedLaborId: oldRow._id },
            json: newRow,
        });

        // console.log(' Successfully updated row:', response);
        refreshEverything(true);

        return { ...newRow }; //  Ensure a new object is returned
    };

    // Recursively gather descendant IDs for an accordion item.
    const getDescendantIds = (item: AccordionItem): string[] => {
        let ids: string[] = [];
        if (item.children) {
            item.children.forEach((child) => {
                ids.push(child._id);
                ids = ids.concat(getDescendantIds(child));
            });
        }
        return ids;
    };

    const syncExpanded = () => setExpandedAccordions([...expandedAccordionsRef.current]);

    const handleAccordionChange = (id: string, level: number) => async (_event: React.SyntheticEvent, isExpanded: boolean) => {
        if (isExpanded) {
            await fetchChildren(id, level);
            expandedAccordionsRef.current = [...expandedAccordionsRef.current, id];
        } else {
            if (level === 2) {
                const sectionItem = sectionsRef.current.find((item) => item._id === id);
                if (sectionItem) {
                    const descendantIds = getDescendantIds(sectionItem);
                    expandedAccordionsRef.current = expandedAccordionsRef.current.filter((accId) => accId !== id && !descendantIds.includes(accId));
                } else {
                    expandedAccordionsRef.current = expandedAccordionsRef.current.filter((accId) => accId !== id);
                }
            } else {
                expandedAccordionsRef.current = expandedAccordionsRef.current.filter((accId) => accId !== id);
            }
        }

        syncExpanded();

        console.log(expandedAccordionsRef.current);
    };

    // Helper to map fetched data to your AccardionItem structure (exactly your old code)
    const mapLevelItem = (item: any): AccordionItem => {
        let itemArr = {} as AccordionItem;
        itemArr._id = item._id;
        itemArr.label = item.name;
        itemArr.totalCost = roundNumber(item.totalCost); // from backend
        itemArr.children = [];
        itemArr.isLoading = false;
        itemArr.fullCode = item.fullCode;
        itemArr.itemName = item.itemName;
        itemArr.itemChangableName = item.itemChangableName;
        itemArr.itemFullCode = item.itemFullCode;
        itemArr.companyNameMadeOffer = item.accountName;
        itemArr.quantity = roundToThree(item.quantity);
        itemArr.itemChangableAveragePrice = roundToThree(item.itemChangableAveragePrice);
        itemArr.itemAveragePrice = roundToThree(Number(item.estimateLaborItemData?.[0]?.averagePrice ?? item.itemAveragePrice ?? 0));
        itemArr.itemMeasurementUnit = item.itemMeasurementUnit;
        itemArr.itemLaborHours = item.itemLaborHours; //🔴 TODO: this will need us in version 2 🔴
        itemArr.presentItemOfferAveragePrice = roundToThree(item.presentItemOfferAveragePrice);
        if (item.itemUnitPrice) {
            console.log('item.itemUnitPrice: ', item.itemUnitPrice, 'item.quantity: ', item.quantity);
            itemArr.itemUnitPrice = roundToThree(item.itemUnitPrice);
            itemArr.itemTotalCost = roundNumber(item.quantity * item.itemUnitPrice);
        }
        if (item.quantity && item.itemChangableAveragePrice) {
            itemArr.itemWithoutMaterial = roundNumber(item.quantity * item.itemChangableAveragePrice);
        }

        // if (item.materialTotalCost) {
        itemArr.materialTotalCost = roundNumber(item.materialTotalCost ?? 0);
        if (itemArr.itemWithoutMaterial) {
            itemArr.priceWithMaterial = roundNumber((itemArr.itemWithoutMaterial ?? 0) + (item.materialTotalCost ?? 0));
            if (itemArr.itemLaborHours) {
                if (itemArr.itemLaborHours === 0) {
                    itemArr.unitPrice = 0;
                } else {
                    itemArr.unitPrice = roundNumber(itemArr.priceWithMaterial / item.quantity);
                }
            }
        }
        // }

        return itemArr;
    };

    const fetchChildren = async (parentId: string, level: number): Promise<void> => {
        // console.log('Fetching children for parentId:', parentId, 'at level:', level);

        // Set loading state for the current parent item
        // setSections((prevItems) => prevItems.map((item) => (item._id === parentId ? {...item, isLoading: true} : item)));
        sectionsRef.current = sectionsRef.current.map((item) => (item._id === parentId ? { ...item, isLoading: true } : item));
        setSections(sectionsRef.current);

        const fetchedData = await fetchData(parentId, level);
        // console.log('Fetched Data:', fetchedData);

        if (level === 2 && fetchedData.length > 0) {
            const hasNamedSubsection = fetchedData.some((sub) => sub.name.trim() !== '');

            if (!hasNamedSubsection) {
                console.log('No named subsections found, fetching items directly...');

                const emptySubsectionId = fetchedData[0]._id; // Get the empty subsection ID
                const fetchedItems = await fetchData(emptySubsectionId, 3);

                console.log('Fetched Items:', fetchedItems);

                // Create an "empty subsection" to store the items inside
                const emptySubsection: AccordionItem = {
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
                            itemAveragePrice: roundToThree(Number(item.estimateLaborItemData?.[0]?.averagePrice ?? item.itemAveragePrice ?? 0)),
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
                        newItem.priceWithMaterial = roundNumber((newItem.itemWithoutMaterial ?? 0) + (item.materialTotalCost ?? 0));
                        if (newItem.itemLaborHours) {
                            if (newItem.itemLaborHours === 0) {
                                newItem.unitPrice = 0;
                            } else {
                                newItem.unitPrice = roundNumber(newItem.priceWithMaterial / item.quantity);
                            }
                        }
                        // }

                        return newItem;
                    }),
                    isLoading: false,
                };

                // console.log('Empty Subsection with Items:', emptySubsection);

                // Update state by replacing section's children with this new subsection
                // setSections((prevItems) => updateNestedChildren(prevItems, parentId, [emptySubsection], false));

                sectionsRef.current = updateNestedChildren(sectionsRef.current, parentId, [emptySubsection], false);
                setSections(sectionsRef.current);

                return;
            }
        }

        const newData: AccordionItem[] = [] as AccordionItem[];

        fetchedData.forEach((item) => {
            console.log('item', item);
            let itemArr: AccordionItem = {} as AccordionItem;
            itemArr._id = item._id;
            itemArr.label = item.name;
            itemArr.totalCost = roundNumber(item.totalCost);
            itemArr.children = [];
            itemArr.isLoading = false;
            itemArr.fullCode = item.fullCode;
            itemArr.itemName = item.itemName;
            itemArr.itemChangableName = item.itemChangableName;
            itemArr.itemFullCode = item.itemFullCode;
            itemArr.companyNameMadeOffer = item.accountName;
            itemArr.quantity = roundToThree(item.quantity);
            itemArr.itemChangableAveragePrice = roundToThree(item.itemChangableAveragePrice);
            itemArr.itemAveragePrice = roundToThree(Number(item.estimateLaborItemData?.[0]?.averagePrice ?? item.itemAveragePrice ?? 0));
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
                itemArr.priceWithMaterial = roundNumber((itemArr.itemWithoutMaterial ?? 0) + (item.materialTotalCost ?? 0));
                if (itemArr.itemLaborHours) {
                    if (itemArr.itemLaborHours === 0) {
                        itemArr.unitPrice = 0;
                    } else {
                        itemArr.unitPrice = roundNumber(itemArr.priceWithMaterial / item.quantity);
                    }
                }
            }
            // }

            newData.push(itemArr);
        });

        // setSections((prevItems) => updateNestedChildren(prevItems, parentId, newData, false));
        sectionsRef.current = updateNestedChildren(sectionsRef.current, parentId, newData, false);
        setSections(sectionsRef.current);
    };

    const refreshAllAccordions = async () => {
        // console.log(expandedAccordionsRef.current);
        // console.log(sections);

        // Step 1: Refresh level‑3 (items) for expanded subsections
        const itemsWithUpdatedLevel3 = await Promise.all(
            sectionsRef.current.map(async (item) => {
                if (expandedAccordionsRef.current.includes(item._id) && item.children) {
                    const updatedLevel2Children = await Promise.all(
                        item.children.map(async (subItem) => {
                            if (expandedAccordionsRef.current.includes(subItem._id)) {
                                const fetchedLevel3Data = await fetchData(subItem._id, 3);
                                const level3Items: AccordionItem[] = [];
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
                if (expandedAccordionsRef.current.includes(item._id)) {
                    const fetchedLevel2Data = await fetchData(item._id, 2);
                    const newLevel2Items: AccordionItem[] = [];
                    fetchedLevel2Data.forEach((level2Item) => {
                        newLevel2Items.push(mapLevelItem(level2Item));
                    });
                    // For the "empty subsection" case:
                    if (newLevel2Items.length > 0 && newLevel2Items[0].label.trim() === '') {
                        const emptySubsectionId = newLevel2Items[0]._id;
                        const fetchedLevel3Data = await fetchData(emptySubsectionId, 3);
                        const level3Items: AccordionItem[] = [];
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
        sectionsRef.current = itemsWithUpdatedLevel2;
        setSections(sectionsRef.current);
    };

    // Step 3: Refresh top-level sections (simulate your useEffect)
    const refreshSections = async () => {
        // Fetch new sections data from the backend.
        const fetchedSections = await Api.requestSession<EstimateSectionsApi.ApiEstimateSecttion[]>({
            command: 'estimate/fetch_sections',
            args: { estimateId: props.estimateId },
        });

        // Merge new sections with existing ones to preserve children.
        // setSections((prevItems) =>
        //     fetchedSections.map((section) => {
        //         // Look for the section in the previous state.
        //         const existingSection = prevItems.find((s) => s._id === section._id);
        //         return {
        //             _id: section._id,
        //             label: section.name,
        //             totalCost: section.totalCost ? roundNumber(section.totalCost) : 0,
        //             // If an existing section is found, keep its children; otherwise default to empty.
        //             children: existingSection ? existingSection.children : [],
        //         };
        //     })
        // );

        const prevById = new Map(sectionsRef.current.map((s) => [s._id, s]));

        sectionsRef.current = fetchedSections.map((section) => {
            const existing = prevById.get(section._id);
            return {
                _id: section._id,
                label: section.name,
                totalCost: section.totalCost ? roundNumber(section.totalCost) : 0,
                children: existing?.children ?? [],
            };
        });

        setSections(sectionsRef.current);
    };

    // Combined refresh: first refresh children, then sections.
    const refreshEverything = async (showProgIndic: boolean = true) => {
        if (showProgIndic) {
            setProgIndic(true);
        }

        console.log('refreshing everything');
        console.log(expandedAccordionsRef.current);

        await refreshAllAccordions();
        await refreshSections();

        props.onDataUpdated?.(true);

        GD.pubsub_.dispatch(GD.estimateCostChangedId);

        if (showProgIndic) {
            setProgIndic(false);
        }
    };

    const refreshEverythingAfterRemovingSecOrSubsec = async (showProgIndic: boolean = true) => {
        if (showProgIndic) {
            setProgIndic(true);
        }

        // 1. Re-fetch the top-level sections.
        const fetchedSections = await Api.requestSession<EstimateSectionsApi.ApiEstimateSecttion[]>({
            command: 'estimate/fetch_sections',
            args: { estimateId: props.estimateId },
        });

        // 2. Build a fresh array of sections with empty children.
        const newItems: AccordionItem[] = fetchedSections.map((section) => ({
            _id: section._id,
            label: section.name,
            totalCost: section.totalCost ? roundNumber(section.totalCost) : 0,
            children: [], // Clear previous children to rebuild fresh
        }));

        // 3. For every section that is currently open, fetch its subsections (level 2)
        // and then, for each fetched subsection, unconditionally fetch its labor items (level 3).
        await Promise.all(
            newItems.map(async (section) => {
                if (expandedAccordionsRef.current.includes(section._id)) {
                    // Fetch level‑2 data (subsections) for this section.
                    const subsData = await fetchData(section._id, 2);
                    const mappedSubs: AccordionItem[] = subsData.map((sub) => mapLevelItem(sub));

                    // For every fetched subsection, always fetch its level‑3 data.
                    await Promise.all(
                        mappedSubs.map(async (sub) => {
                            const laborData = await fetchData(sub._id, 3);
                            const mappedLabor = laborData.map((laborItem) => mapLevelItem(laborItem));
                            sub.children = mappedLabor;
                        })
                    );
                    // Save the freshly built subsections (with their level‑3 children) into this section.
                    section.children = mappedSubs;
                }
            })
        );

        // 4. Update the state with the new items.
        sectionsRef.current = newItems;
        setSections(sectionsRef.current);

        props.onDataUpdated?.(true);
        GD.pubsub_.dispatch(GD.estimateCostChangedId);

        setProgIndic(false);
    };

    const handleCalcMarketPrices = (estimatedLaborIds?: string[]) => {
        setAnchorEl(null);

        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                setProgIndic(true);
                const body = estimatedLaborIds?.length ? { estimatedLaborIds } : undefined;
                Api.requestSession<any>({
                    command: 'estimate/calc_market_prices',
                    args: { estimateId: props.estimateId },
                    json: body,
                }).then(() => {
                    refreshEverything(true);
                });
                // .finally(() => {
                //     setRemoveLaborEstimateLaborItemId(null);
                //     setEstimatedLaborItemName(null);
                // });

                // }).finally(() => {
                //     // refreshEverythingAfterRemovingSecOrSubsec(true);
                //     refreshEverything(true);
                //     forceUpdate({});
                // });
            }
        });
    };

    const getSelectedLaborIds = useCallback(() => Object.values(selectionByGridKey).flat(), [selectionByGridKey]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        openAddSectionDialog: () => setOpenAddSectionDialog(true),
        calcMarketPrices: handleCalcMarketPrices,
        refreshEverything,
        getSelectedLaborIds,
    }), [handleCalcMarketPrices, refreshEverything, getSelectedLaborIds]);

    if (!sections) {
        return null;
    }

    return (
        <>
            <Stack direction='column' spacing={0} sx={{ mt: 1 }}>
                {sections.map((item) => (
                    <EstimateRootAccordion key={item._id} expanded={expandedAccordions.includes(item._id)} onChange={handleAccordionChange(item._id, 2)}>
                        <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction='row' width='100%' alignItems='center'>
                                <Typography>{item.label}</Typography>

                                <Box flex={2}>&nbsp;</Box>

                                <Tooltip title={t('Total Cost')} arrow placement='top'>
                                    <Typography sx={{ whiteSpace: 'nowrap' }}>{formatCurrencyRoundedSymbol(item.totalCost)}</Typography>
                                </Tooltip>

                                {session?.user && permissionsSet?.has?.('EST_EDT_INFO') && (
                                    <>
                                        <IconButton
                                            component='div'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEstimateRenameId(item._id);
                                                setEstimateRenameDialogLabel(item.label);
                                                setEstimateRenameDialogType('section');
                                            }}
                                        >
                                            <EditOutlinedIcon />
                                        </IconButton>
                                        <IconButton
                                            component='div'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove('section', item._id);
                                            }}
                                        >
                                            <DeleteForeverIcon />
                                        </IconButton>
                                    </>
                                )}
                            </Stack>
                        </EstimateRootAccordionSummary>

                        <EstimateRootAccordionDetails>
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
                                                '& .marketPriceCell': {
                                                    backgroundColor: '#e3f2fd !important', /* visible on both white and grey alternating rows */
                                                },
                                            }}
                                            columns={[
                                                // { field: 'itemFullCode', headerName: 'ID', headerAlign: 'left', width: 80, },
                                                {
                                                    field: 'itemFullCode',
                                                    type: 'actions',
                                                    headerName: 'ID',
                                                    align: 'center',
                                                    width: 90,
                                                    renderCell: (params) => {
                                                        return (
                                                            <Button
                                                                onClick={() => {
                                                                    setEstimatedLaborOfferViewId(params.row._id as string);
                                                                    setEstimatedLaborOfferViewChangableItemName(params.row.itemName as string);
                                                                }}
                                                            >
                                                                {params.value}
                                                            </Button>
                                                        );
                                                    },
                                                },
                                                {
                                                    field: 'itemChangableName',
                                                    headerName: t('Labor'),
                                                    headerAlign: 'center',
                                                    flex: 1,
                                                    editable: true,
                                                    cellClassName: 'multilineCell',
                                                },
                                                // { field: 'companyNameMadeOffer', headerName: 'Company Name', headerAlign: 'left', flex: 1 },
                                                {
                                                    field: 'itemLaborHours',
                                                    headerName: t('Work per hour'),
                                                    align: 'center',
                                                    width: 120,
                                                    editable: true,
                                                }, //🔴 TODO: this will need us in version 2 🔴
                                                {
                                                    field: 'itemMeasurementUnit',
                                                    headerName: t('Unit'),
                                                    align: 'center',
                                                    width: 80,
                                                },
                                                {
                                                    field: 'quantity',
                                                    headerName: t('Quantity'),
                                                    align: 'center',
                                                    width: 120,
                                                    editable: true,
                                                    cellClassName: 'editableCell',
                                                    valueFormatter: (value) => formatCurrency(value),
                                                },
                                                {
                                                    field: 'itemChangableAveragePrice',
                                                    headerName: t('Price'),
                                                    align: 'center',
                                                    width: 120,
                                                    editable: true,
                                                    cellClassName: (params) =>
                                                        params.row && isMarketPriceRow(params.row as AccordionItem)
                                                            ? 'editableCell marketPriceCell'
                                                            : 'editableCell',
                                                    valueFormatter: (value) => formatCurrency(value),
                                                },
                                                {
                                                    field: 'itemWithoutMaterial',
                                                    headerName: t('Without material'),
                                                    align: 'center',
                                                    width: 160,
                                                    valueFormatter: (value) => formatCurrency(value),
                                                },
                                                {
                                                    field: 'materialTotalCost',
                                                    headerName: t('Material Cost'),
                                                    align: 'center',
                                                    width: 160,
                                                    valueFormatter: (value) => formatCurrency(value),
                                                },
                                                {
                                                    field: 'priceWithMaterial',
                                                    headerName: t('Price with material'),
                                                    align: 'center',
                                                    width: 160,
                                                    valueFormatter: (value) => formatCurrency(value),
                                                },
                                                {
                                                    field: 'unitPrice',
                                                    headerName: t('Unit Price'),
                                                    align: 'center',
                                                    width: 160,
                                                    valueFormatter: (value) => formatCurrency(value),
                                                },

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
                                                    field: 'addMaterial',
                                                    type: 'actions',
                                                    headerName: t('Materials'),
                                                    width: 140,
                                                    renderCell: (cell) => {
                                                        return (
                                                            <>
                                                                <IconButton
                                                                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                        setEstimatedLaborItemId(cell.row._id);
                                                                        setOpenAddOfferDialogTypeWithouSubsection('material');
                                                                        setEstimatedLaborItemName(cell.row.itemChangableName);
                                                                    }}
                                                                >
                                                                    {/* <ScienceIcon sx={{ color: mainIconColor }} /> */}
                                                                    <ImgElement src='/images/icons/material.svg' sx={{ height: materialIconHeight }} />
                                                                </IconButton>
                                                            </>
                                                        );
                                                    },
                                                }, // width: 600 },
                                                {
                                                    field: 'info',
                                                    type: 'actions',
                                                    // headerName: t('Details'),
                                                    width: 40,
                                                    renderCell: (cell) => {
                                                        return (
                                                            <>
                                                                {/* <IconButton onClick={() => setCompanyDetailsId(cell.id as string)}> */}
                                                                <IconButton
                                                                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                        // setAccountDetailsId(cell.id as string)

                                                                        console.log('esitmate cell', cell);
                                                                        setEstimatedLaborItemName(cell.row.itemChangableName as string);
                                                                        setEstimatedLaborItemDetailsId(cell.row._id as string);
                                                                        handleClick(event);
                                                                    }}
                                                                >
                                                                    <MoreVertIcon />
                                                                </IconButton>
                                                            </>
                                                        );
                                                    },
                                                }, // width: 600 },
                                            ]}
                                            rows={item.children[0].children} // ✅ Show items from the empty subsection
                                            getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                            checkboxSelection={props.selectMode === true}
                                            rowSelectionModel={{
                                                type: 'include',
                                                ids: new Set(selectionByGridKey[`${item._id}_empty`] ?? []),
                                            }}
                                            onRowSelectionModelChange={(newModel) =>
                                                setSelectionByGridKey((prev) => ({
                                                    ...prev,
                                                    [`${item._id}_empty`]: Array.from((newModel as { ids?: Set<string> })?.ids ?? []),
                                                }))
                                            }
                                            processRowUpdate={handleUpdateRow} // Handle updates
                                            onProcessRowUpdateError={(error) => console.error('Error updating row:', error)} // ✅ Handle errors
                                            getRowHeight={({ model }) => makeMultilineTableCell(model.itemChangableName as string)}
                                        />

                                        {(permAddFields || !props.isOnlyEstInfo) && (
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant='contained'
                                                    sx={{ ml: 1, mt: 2 }}
                                                    onClick={() => {
                                                        setOpenAddOfferDialogTypeWithouSubsection('labor');
                                                        setCurrentSectionId(item._id);
                                                    }}
                                                >
                                                    {t('add labor')}
                                                </Button>
                                            </Box>
                                        )}

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
                                                        handleRemoveLabor(estimatedLaborItemDetailsId);
                                                    }}
                                                >
                                                    {t('Remove')}
                                                </MenuItem>
                                            </Menu>
                                        )}
                                    </>
                                ) : (
                                    item.children.map((child) =>
                                        child.children ? (
                                            <Accordion
                                                key={child._id}
                                                expanded={expandedAccordionsRef.current.includes(child._id)}
                                                onChange={handleAccordionChange(child._id, 3)}
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
                                                                {t('Total Cost: ') + `${parseThousandsSeparator(child.totalCost) ?? 0}`}
                                                            </Typography>
                                                            <ExpandMoreIcon />
                                                        </Box>
                                                    }
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography>{child.label}</Typography>
                                                        {session?.user && permissionsSet?.has?.('EST_EDT_INFO') && (
                                                            <>
                                                                <IconButton
                                                                    component='div'
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEstimateRenameId(child._id);
                                                                        setEstimateRenameDialogLabel(child.label);
                                                                        setEstimateRenameDialogType('subsection');
                                                                    }}
                                                                >
                                                                    <EditOutlinedIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    component='div'
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onRemove('subsection', child._id);
                                                                    }}
                                                                >
                                                                    <DeleteForeverIcon />
                                                                </IconButton>
                                                            </>
                                                        )}
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

                                                                    // '& .MuiDataGrid-cell': {
                                                                    //     whiteSpace: 'nowrap',
                                                                    //     overflow: 'hidden',
                                                                    //     textOverflow: 'ellipsis',
                                                                    // },

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
                                                                    '& .marketPriceCell': {
                                                                        backgroundColor: '#e3f2fd !important', /* visible on both white and grey alternating rows */
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
                                                                                        console.log('Cell Value:', params.value);
                                                                                        setEstimatedLaborOfferViewId(params.row._id as string);
                                                                                        setEstimatedLaborOfferViewChangableItemName(
                                                                                            params.row.itemChangableName as string
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {params.value}
                                                                                </Button>
                                                                            );
                                                                        },
                                                                        disableColumnMenu: true,
                                                                    },
                                                                    {
                                                                        field: 'itemChangableName',
                                                                        headerName: t('Labor'),
                                                                        headerAlign: 'left',
                                                                        flex: 1,
                                                                        editable: true,
                                                                        disableColumnMenu: true,
                                                                        cellClassName: 'multilineCell',
                                                                    },
                                                                    // { field: 'companyNameMadeOffer', headerName: 'Company Name', headerAlign: 'left', flex: 1 },
                                                                    {
                                                                        field: 'itemLaborHours',
                                                                        headerName: t('Work per hour'),
                                                                        headerAlign: 'left',
                                                                        width: 120,
                                                                        editable: true,
                                                                        disableColumnMenu: true,
                                                                    }, //🔴 TODO: this will need us in version 2 🔴
                                                                    {
                                                                        field: 'itemMeasurementUnit',
                                                                        headerName: t('Unit'),
                                                                        headerAlign: 'left',
                                                                        width: 80,
                                                                        disableColumnMenu: true,
                                                                    },
                                                                    {
                                                                        field: 'quantity',
                                                                        headerName: t('Quantity'),
                                                                        headerAlign: 'left',
                                                                        width: 120,
                                                                        editable: true,
                                                                        cellClassName: 'editableCell',
                                                                        disableColumnMenu: true,
                                                                        valueFormatter: (value) => formatCurrency(value),
                                                                    },
                                                                    {
                                                                        field: 'itemChangableAveragePrice',
                                                                        headerName: t('Price'),
                                                                        headerAlign: 'left',
                                                                        width: 120,
                                                                        editable: true,
                                                                        cellClassName: (params) =>
                                                                            params.row && isMarketPriceRow(params.row as AccordionItem)
                                                                                ? 'editableCell marketPriceCell'
                                                                                : 'editableCell',
                                                                        disableColumnMenu: true,
                                                                        valueFormatter: (value) => formatCurrency(value),
                                                                    },
                                                                    {
                                                                        field: 'itemWithoutMaterial',
                                                                        headerName: t('Without material'),
                                                                        headerAlign: 'center',
                                                                        align: 'center',
                                                                        width: 160,
                                                                        disableColumnMenu: true,
                                                                        valueFormatter: (value) => formatCurrency(value),
                                                                    },
                                                                    {
                                                                        field: 'materialTotalCost',
                                                                        headerName: t('Material Cost'),
                                                                        headerAlign: 'center',
                                                                        align: 'center',
                                                                        width: 160,
                                                                        disableColumnMenu: true,
                                                                        valueFormatter: (value) => formatCurrency(value),
                                                                    },
                                                                    {
                                                                        field: 'priceWithMaterial',
                                                                        headerName: t('Price with material'),
                                                                        headerAlign: 'center',
                                                                        align: 'center',
                                                                        width: 160,
                                                                        disableColumnMenu: true,
                                                                        valueFormatter: (value) => formatCurrency(value),
                                                                    },
                                                                    {
                                                                        field: 'unitPrice',
                                                                        headerName: t('Unit Price'),
                                                                        headerAlign: 'center',
                                                                        align: 'center',
                                                                        width: 160,
                                                                        disableColumnMenu: true,
                                                                        valueFormatter: (value) => formatCurrency(value),
                                                                    },

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
                                                                        field: 'addMaterial',
                                                                        type: 'actions',
                                                                        headerName: t('Materials'),
                                                                        width: 140,
                                                                        renderCell: (cell) => {
                                                                            return (
                                                                                <>
                                                                                    <IconButton
                                                                                        onClick={() => {
                                                                                            setSelectedChildId(child._id);
                                                                                            setEstimatedLaborItemId(cell.row._id as string);
                                                                                            setOpenAddOfferDialogType('material');
                                                                                            setEstimatedLaborItemName(cell.row.itemChangableName as string);
                                                                                        }}
                                                                                    >
                                                                                        {/* <ScienceIcon sx={{ color: mainIconColor }} /> */}
                                                                                        <ImgElement
                                                                                            src='/images/icons/material.svg'
                                                                                            sx={{ height: materialIconHeight }}
                                                                                        />
                                                                                    </IconButton>
                                                                                </>
                                                                            );
                                                                        },
                                                                    }, // width: 600 },
                                                                    {
                                                                        field: 'info',
                                                                        type: 'actions',
                                                                        // headerName: t('Details'),
                                                                        width: 40,
                                                                        renderCell: (cell) => {
                                                                            return (
                                                                                <>
                                                                                    <IconButton
                                                                                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                                                            setEstimatedLaborItemName(cell.row.itemChangableName as string);
                                                                                            setEstimatedLaborItemDetailsId(cell.row._id as string);
                                                                                            handleClick(event);
                                                                                        }}
                                                                                    >
                                                                                        <MoreVertIcon />
                                                                                    </IconButton>
                                                                                </>
                                                                            );
                                                                        },
                                                                    }, // width: 600 },
                                                                ]}
                                                                rows={child.children}
                                                                getRowId={(row) => row?._id ?? crypto.randomUUID()}
                                                                checkboxSelection={props.selectMode === true}
                                                                rowSelectionModel={{
                                                                    type: 'include',
                                                                    ids: new Set(selectionByGridKey[child._id] ?? []),
                                                                }}
                                                                onRowSelectionModelChange={(newModel) =>
                                                                    setSelectionByGridKey((prev) => ({
                                                                        ...prev,
                                                                        [child._id]: Array.from((newModel as { ids?: Set<string> })?.ids ?? []),
                                                                    }))
                                                                }
                                                                processRowUpdate={handleUpdateRow} // Handle updates
                                                                onProcessRowUpdateError={(error) => console.error('Error updating row:', error)} // ✅ Handle errors
                                                                getRowHeight={({ model }) => makeMultilineTableCell(model.itemChangableName as string)}
                                                            />
                                                            {(permAddFields || !props.isOnlyEstInfo) && (
                                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                    <Button
                                                                        variant='contained'
                                                                        sx={{ ml: 1, mt: 2 }}
                                                                        onClick={() => {
                                                                            setOpenAddOfferDialogType('labor');
                                                                            setSelectedChildId(child._id);
                                                                            setCurrentSubsectionId(child._id);
                                                                        }}
                                                                    >
                                                                        {t('add labor')}
                                                                    </Button>
                                                                </Box>
                                                            )}

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
                                                                            handleRemoveLabor(estimatedLaborItemDetailsId);
                                                                        }}
                                                                    >
                                                                        {t('Remove')}
                                                                    </MenuItem>
                                                                </Menu>
                                                            )}
                                                        </>
                                                    )}
                                                </AccordionDetails>
                                            </Accordion>
                                        ) : null
                                    )
                                )
                            ) : (
                                <>
                                    {(permAddFields || !props.isOnlyEstInfo) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <Button
                                                fullWidth
                                                onClick={() => {
                                                    setOpenAddSubsectionDialog(true);
                                                    setOpenAddSubsectionDialogCurrentSectionId(item._id);
                                                }}
                                                sx={{
                                                    mt: 2,
                                                    width: 250,
                                                    height: 40,
                                                    border: `1px dashed ${mainIconColor}`,
                                                    color: mainIconColor,
                                                    // border: '1px dashed rgba(151, 71, 255)',
                                                    // color: 'rgba(151, 71, 255)',
                                                    // background: 'rgba(151, 71, 255, 0.04)',
                                                }}
                                            >
                                                {t('Add Subsection')}
                                            </Button>
                                            <Button
                                                variant='contained'
                                                sx={{ ml: 1, mt: 2, height: 40 }}
                                                onClick={() => {
                                                    setOpenAddOfferDialogTypeWithouSubsection('labor');
                                                    setCurrentSectionId(item._id);
                                                }}
                                            >
                                                {t('add labor')}
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            )}

                            {(permAddFields || !props.isOnlyEstInfo) && item.children?.[0] && item.children[0].label !== '' && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        fullWidth
                                        onClick={() => {
                                            setOpenAddSubsectionDialog(true);
                                            setOpenAddSubsectionDialogCurrentSectionId(item._id);
                                        }}
                                        sx={{
                                            mt: 2,
                                            width: 250,
                                            border: `1px dashed ${mainIconColor}`,
                                            color: mainIconColor,
                                            // border: '1px dashed rgba(151, 71, 255)',
                                            // color: 'rgba(151, 71, 255)',
                                            // background: 'rgba(151, 71, 255, 0.04)',
                                        }}
                                    >
                                        {t('Add Subsection')}
                                    </Button>
                                </Box>
                            )}
                        </EstimateRootAccordionDetails>
                    </EstimateRootAccordion>
                ))}

                <ProgressIndicator show={progIndic} background='backdrop' />
            </Stack>

            {openAddOfferDialogType && (
                <>
                    {openAddOfferDialogType === 'material' ? (
                        <MaterialsTwoPartDialog
                            offerType={openAddOfferDialogType}
                            isEstimation={true}
                            estimatedLaborName={estimatedLaborItemName}
                            estimateSubsectionId={currentSubsectionId}
                            estimatedLaborId={estimatedLaborItemId}
                            onConfirm={() => {
                                refreshEverything(false);
                            }}
                            onClose={() => {
                                setOpenAddOfferDialogType(null);
                                setSelectedChildId(null);
                                setCurrentSubsectionId(null);
                                setCurrentSectionId(null);
                            }}
                        />
                    ) : (
                        <UserPageAddEstimateItemDialog
                            offerType={openAddOfferDialogType}
                            isEstimation={true}
                            estimateSubsectionId={currentSubsectionId}
                            estimatedLaborId={estimatedLaborItemId}
                            onConfirm={() => {
                                refreshEverything(false);
                            }}
                            onClose={() => {
                                setOpenAddOfferDialogType(null);
                                setSelectedChildId(null);
                                setCurrentSubsectionId(null);
                                setCurrentSectionId(null);
                            }}
                        />
                    )}
                </>
            )}

            {openAddOfferDialogTypeWithouSubsection && (
                <>
                    {openAddOfferDialogTypeWithouSubsection === 'material' ? (
                        <MaterialsTwoPartDialog
                            offerType={openAddOfferDialogTypeWithouSubsection}
                            isEstimation={true}
                            // estimateSectionId={item._id}
                            estimateSectionId={currentSectionId}
                            estimatedLaborId={estimatedLaborItemId}
                            estimatedLaborName={estimatedLaborItemName}
                            onConfirm={() => {
                                refreshEverything(false);
                            }}
                            onClose={() => {
                                setOpenAddOfferDialogTypeWithouSubsection(null);
                                setCurrentSectionId(null);
                                setCurrentSubsectionId(null);
                            }}
                        />
                    ) : (
                        <UserPageAddEstimateItemDialog
                            offerType={openAddOfferDialogTypeWithouSubsection}
                            isEstimation={true}
                            // estimateSectionId={item._id}
                            estimateSectionId={currentSectionId}
                            estimatedLaborId={estimatedLaborItemId}
                            onConfirm={() => {
                                refreshEverything(false);
                            }}
                            onClose={() => {
                                setOpenAddOfferDialogTypeWithouSubsection(null);
                                setCurrentSectionId(null);
                                setCurrentSubsectionId(null);
                            }}
                        />
                    )}
                </>
            )}

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
                <EstimateMaterialsListDialog
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

            {openAddSectionDialog && (
                <EstimateSectionButtonDialog
                    estimateId={props.estimateId}
                    onConfirm={() => {
                        // setDataRequested(false);
                        refreshEverything(true);
                        setOpenAddSectionDialog(false);
                    }}
                    onClose={() => {
                        setOpenAddSectionDialog(false);
                    }}
                />
            )}

            {estimateRenameId && estimateRenameDialogLabel && estimateRenameDialogType && (
                <EstimateRenameDialog
                    title='Rename'
                    label={estimateRenameDialogLabel}
                    dialogRenameType={estimateRenameDialogType}
                    labelId={estimateRenameId}
                    onConfirm={() => {
                        refreshEverything(false);
                        setEstimateRenameId(null);
                        setEstimateRenameDialogLabel(null);
                    }}
                    onClose={() => {
                        setEstimateRenameId(null);
                        setEstimateRenameDialogLabel(null);
                    }}
                />
            )}

            {estimatedLaborOfferViewId && estimatedLaborOfferViewChangableItemName && (
                <EstimatedItemPresentViewDialog
                    itemType='labor'
                    changableItemCurrentName={estimatedLaborOfferViewChangableItemName}
                    itemId={estimatedLaborOfferViewId}
                    onClose={() => {
                        setEstimatedLaborOfferViewId(null);
                        setEstimatedLaborOfferViewChangableItemName(null);
                    }}
                />
            )}
        </>
    );
});

export default EstimateThreeLevelNestedAccordion;
