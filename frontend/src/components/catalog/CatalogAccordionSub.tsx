import React, {useCallback, useEffect, useRef, useState} from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {EstimateChildAccordion, EstimateRootAccordionDetails, EstimateRootAccordionSummary} from '@/components/AccordionComponent';
import {AccordionItem, CatalogSelectedFiltersDataProps, CatalogType} from '@/components/catalog/CatalogAccordionTypes';
import {Box, Button, CircularProgress, Stack, Typography} from '@mui/material';
import {formatQuantityParens} from '@/components/pages/CatalogAccordion';
import {catalogConvertToFixedString, useCatalogData} from '@/components/catalog/CatalogAccordionDataContext';
import {useTranslation} from 'react-i18next';
import CatalogAccordionSubChild from '@/components/catalog/CatalogAccordionSubChild';
import AddOrEditEntityDialog from '@/components/EditAddCategoryDialog';

interface CatalogSubAccordionProps {
    catalogType: CatalogType;
    item: AccordionItem;
    searchVal: string;
    filter: CatalogSelectedFiltersDataProps;

    subParentId: string;

    onSubcategoryChange: () => Promise<void>;
}

export default function CatalogSubAccordion(props: CatalogSubAccordionProps) {
    const ctx = useCatalogData();
    const {t} = useTranslation();

    const mounted = useRef(false);

    const [actionType, setActionType] = useState<'add' | 'update' | 'archive' | null>(null);
    const [entityType, setEntityType] = useState<'category' | 'subcategory' | 'item' | null>(null);
    const [entityName, setEntityName] = useState<string | null>(null);
    const [entityCode, setEntityCode] = useState<string | null>(null);
    const [entityMongoId, setEntityMongoId] = useState<string | null>(null);
    const entityParentMongoId = useRef<string | null>(null);
    const [addChild, setAddChild] = useState(false);

    const [items, setItems] = useState<AccordionItem[]>([]);

    const item = props.item;

    useEffect(() => {
        mounted.current = true;
        ctx.mounted(item.categoryFullCode!);

        return () => {
            mounted.current = false;
            ctx.unmounted(item.categoryFullCode!);
        };
    }, []);

    const refreshSubChilds = useCallback(async () => {
        const data = (await ctx.fetchData(props.item._id, 3, props.catalogType, props.searchVal, props.filter)) as AccordionItem[];

        const normalized = data.map((i) => ({
            ...i,
            label: i.name,
            averagePrice: i.averagePrice != null ? catalogConvertToFixedString(i.averagePrice) : undefined,
            isLoading: false,
            children: [],
        }));

        setItems(normalized);
    }, [ctx, props.item._id, props.catalogType, props.searchVal, props.filter]);

    const handleAccordionChange = useCallback(async (isExpanded: boolean) => {
        ctx.setExpanded(item.categoryFullCode!, isExpanded);

        if (isExpanded) {
            let fetchedData = (await ctx.fetchData(item._id, 3, props.catalogType, props.searchVal, props.filter)) as AccordionItem[];
            for (let i of fetchedData) {
                i.label = i.name;

                if (i.averagePrice) {
                    i.averagePrice = catalogConvertToFixedString(i.averagePrice);
                }

                i.isLoading = false;
                i.children = [];
            }
            setItems(fetchedData);
        } else {
            setItems([]);
        }
    }, []);

    return (
        <EstimateChildAccordion expanded={ctx.isExpanded(item.categoryFullCode!)} onChange={(event, isExpanded) => handleAccordionChange(isExpanded)}>
            <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction='row' spacing={1} justifyContent='space-between' alignItems='center' width='100%'>
                    <Typography>{item.code}</Typography>
                    <Typography>{item.label}</Typography>
                    <Typography>{formatQuantityParens(item.childrenQuantity)}</Typography>

                    <Box flex={2}>&nbsp;</Box>

                    {ctx.permCatEdit && (
                        <>
                            <Button
                                component='div'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setActionType('update');
                                    setEntityType('subcategory');
                                    setEntityName(item.label);
                                    setEntityCode(item.code);
                                    setEntityMongoId(item._id);
                                    entityParentMongoId.current = props.subParentId;
                                }}
                            >
                                {t('Edit Subcategory')}
                            </Button>

                            <Button
                                component='div'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setActionType('add');
                                    setEntityType('subcategory');
                                    setEntityMongoId(props.subParentId);
                                    entityParentMongoId.current = props.subParentId;
                                }}
                            >
                                {t('Add Subcategory')}
                            </Button>
                        </>
                    )}
                </Stack>
            </EstimateRootAccordionSummary>

            <EstimateRootAccordionDetails>
                <Stack spacing={0} sx={{ml: 4}}>
                    {/* {items.map((child) => (
                        <CatalogAccordionSubChild
                            key={child._id}
                            item={child}
                            catalogType={props.catalogType}
                            searchVal={props.searchVal}
                            filter={props.filter}

                            subChildParentId={props.item._id}

                            onSubChildsChange={refreshSubChilds}
                        />
                    ))} */}

                    {ctx.isExpanded(item.categoryFullCode!) && items.length === 1 && (items[0] as any).isLoading ? (
                        <CircularProgress size={24} sx={{ml: 4}} />
                    ) : items.length > 0 ? (
                        items.map((child) => (
                            <CatalogAccordionSubChild
                                key={child._id}
                                item={child}
                                catalogType={props.catalogType}
                                searchVal={props.searchVal}
                                filter={props.filter}
                                subChildParentId={props.item._id}
                                onSubChildsChange={refreshSubChilds}
                            />
                        ))
                    ) : ctx.isExpanded(item.categoryFullCode!) ? (
                        <>
                            <Typography sx={{ml: 4}}>{t('No more data')}</Typography>

                            {ctx.permCatEdit && (
                                <Button
                                    component='div'
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setActionType('add');
                                        setEntityType('item');
                                        setEntityMongoId(item._id);
                                        entityParentMongoId.current = item._id;

                                        setAddChild(true);
                                    }}
                                    sx={{ml: 0, width: 150}}
                                >
                                    {t('Add Item')}
                                </Button>
                            )}
                        </>
                    ) : (
                        <></>
                    )}
                </Stack>
            </EstimateRootAccordionDetails>

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

                        setAddChild(false);
                    }}
                    onConfirm={async () => {
                        await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter);
                        await props.onSubcategoryChange();
                        if (addChild) {
                            refreshSubChilds();
                        }

                        setActionType(null);
                        setEntityType(null);
                        setEntityName(null);
                        setEntityCode(null);
                        setEntityMongoId(null);
                        entityParentMongoId.current = null;
                    }}
                />
            )}
        </EstimateChildAccordion>
    );
}
