import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';


import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';


import { EstimateRootAccordion, EstimateRootAccordionDetails, EstimateRootAccordionSummary } from '@/components/AccordionComponent';
import { AccordionItem, CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { formatQuantityParens } from '@/components/pages/CatalogAccordion';
import { catalogConvertToFixedString, useCatalogData } from '@/components/catalog/CatalogAccordionDataContext';
import CatalogSubAccordion from '@/components/catalog/CatalogAccordionSub';
import AddOrEditEntityDialog from '@/components/EditAddCategoryDialog';
import { confirmDialog } from '@/components/ConfirmationDialog';
import * as Api from 'api';
import ImgElement from '@/tsui/DomElements/ImgElement';

interface CatalogRootAccordionProps {
    catalogType: CatalogType;
    item: AccordionItem;
    searchVal: string;
    filter: CatalogSelectedFiltersDataProps;
}

export default function CatalogRootAccordion(props: CatalogRootAccordionProps) {
    const ctx = useCatalogData();
    const { t } = useTranslation();
    const mounted = useRef(false);

    const [items, setItems] = useState<AccordionItem[]>([]);

    const [actionType, setActionType] = useState<'add' | 'update' | 'archive' | null>(null);
    const [entityType, setEntityType] = useState<'category' | 'subcategory' | 'item' | null>(null);
    const [entityName, setEntityName] = useState<string | null>(null);
    const [entityCode, setEntityCode] = useState<string | null>(null);
    const [entityMongoId, setEntityMongoId] = useState<string | null>(null);
    const entityParentMongoId = useRef<string | null>(null);
    const [addChild, setAddChild] = useState(false);


    const item = props.item;

    useEffect(() => {
        mounted.current = true;
        ctx.mounted(item.code);

        return () => {
            mounted.current = false;
            ctx.unmounted(item.code);
        };
    }, []);

    const refreshSubcategories = useCallback(async () => {
        const data = await ctx.fetchData(
            props.item._id,
            2,
            props.catalogType,
            props.searchVal,
            props.filter
        ) as AccordionItem[];

        const normalized = data.map(i => ({
            ...i,
            label: i.name,
            averagePrice: i.averagePrice != null
                ? catalogConvertToFixedString(i.averagePrice)
                : undefined,
            isLoading: false,
            children: [],
        }));

        setItems(normalized);
    }, [ctx, props.item._id, props.catalogType, props.searchVal, props.filter]);


    const handleAccordionChange = useCallback(async (isExpanded: boolean) => {
        ctx.setExpanded(item.code, isExpanded);

        if (isExpanded) {
            let fetchedData = (await ctx.fetchData(item._id, 2, props.catalogType, props.searchVal, props.filter)) as AccordionItem[];
            console.log('fetchedData', fetchedData)
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
    }, [ctx, item, props.catalogType, props.searchVal, props.filter]);

    const handleDeleteCategory = useCallback(async (event: React.MouseEvent) => {
        event.stopPropagation();

        const result = await confirmDialog(
            t('catalog.delete_category_message', { label: item.label, code: item.code }),
            t('catalog.delete_category_title')
        );

        if (result.isConfirmed) {
            try {
                const apiPrefix = props.catalogType === 'aggregated' ? 'eci' : props.catalogType;
                await Api.requestSession({
                    command: `${apiPrefix}/delete_category`,
                    args: { entityMongoId: item._id }
                });

                // Refresh the catalog data after successful deletion
                await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter);
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    }, [ctx, item, props.catalogType, props.searchVal, props.filter]);

    return (
        <EstimateRootAccordion
            expanded={ctx.isExpanded(item.code)}
            onChange={(event, isExpanded) => handleAccordionChange(isExpanded)}
        >
            <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction='row' spacing={{ xs: 0.5, sm: 1 }} justifyContent='space-between' alignItems='center' width='100%'>
                    <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>{item.code}</Typography>
                    <Typography>{item.label}</Typography>
                    <Typography sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap' }}>{formatQuantityParens(item.childrenQuantity)}</Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    {ctx.permCatEdit && (
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
                                sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                            >
                                <ImgElement src='/images/icons/edit.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                            </Button>

                            <Button
                                component='div'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setActionType('add');
                                    setEntityType('subcategory');
                                    setEntityMongoId(item._id);
                                    entityParentMongoId.current = item._id;
                                }}
                                sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                            >
                                <AddIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </Button>

                            <Button
                                component='div'
                                color='error'
                                onClick={handleDeleteCategory}
                                sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                            >
                                <ImgElement src='/images/icons/delete.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                            </Button>
                        </>
                    )}
                </Stack>
            </EstimateRootAccordionSummary>

            <EstimateRootAccordionDetails>
                <Stack spacing={0} sx={{ ml: { xs: 1, sm: 2, md: 4 } }}>
                    {/* {items.map(child => (
                        <CatalogSubAccordion
                            key={child._id}
                            item={child}
                            catalogType={props.catalogType}
                            searchVal={props.searchVal}
                            filter={props.filter}
                            subParentId={props.item._id}
                            onSubcategoryChange={refreshSubcategories}
                        />
                    ))} */}

                    {items.length === 1 && (items[0] as any).isLoading ? (
                        <CircularProgress size={24} sx={{ ml: 4 }} />
                    ) : items.length > 0 ? (
                        items.map(child => (
                            <CatalogSubAccordion
                                key={child._id}
                                item={child}
                                catalogType={props.catalogType}
                                searchVal={props.searchVal}
                                filter={props.filter}
                                subParentId={props.item._id}
                                onSubcategoryChange={refreshSubcategories}
                            />
                        ))
                    ) : (
                        ctx.isExpanded(item.code) ?
                            <>
                                <Typography sx={{ ml: 4 }}>{t('No more data')}</Typography>
                                {ctx.permCatEdit && (
                                    <Button
                                        component='div'
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setActionType('add');
                                            setEntityType('subcategory');
                                            setEntityMongoId(item._id);
                                            entityParentMongoId.current = item._id;
                                            setAddChild(true);
                                        }}
                                        sx={{ ml: 0, width: 250 }}
                                    >
                                        {t('Add Subcategory')}
                                    </Button>
                                )}
                            </>
                            :
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
                        await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter)
                        if (addChild) {
                            refreshSubcategories()
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
        </EstimateRootAccordion>
    );
}
