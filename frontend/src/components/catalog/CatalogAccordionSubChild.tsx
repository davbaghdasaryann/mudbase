import React, { useEffect, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { EstimateRootAccordionSummary, EstimateSubChildAccordion, EstimateSubChildAccordionDetails } from '@/components/AccordionComponent';
import { AccordionItem, CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';
import { Box, Button, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
import { formatQuantityParens } from '@/components/pages/CatalogAccordion';
import { catalogConvertToFixedString, useCatalogData } from '@/components/catalog/CatalogAccordionDataContext';
import { useTranslation } from 'react-i18next';
import CatalogAccordionItems from '@/components/catalog/CatalogAccordionItems';
import { formatCurrencyRoundedSymbol } from '@/lib/format_currency';
import AddOrEditEntityDialog from '@/components/EditAddCategoryDialog';

interface CatalogSubAccordionProps {
    catalogType: CatalogType;
    item: AccordionItem;
    searchVal: string;
    filter: CatalogSelectedFiltersDataProps;

    subChildParentId: string;

    onSubChildsChange: () => Promise<void>;

}

export default function CatalogAccordionSubChild(props: CatalogSubAccordionProps) {
    const ctx = useCatalogData();
    const { t } = useTranslation();
    const mounted = React.useRef(false);

    const [actionType, setActionType] = React.useState<'add' | 'update' | 'archive' | null>(null);
    const [entityType, setEntityType] = React.useState<'category' | 'subcategory' | 'item' | null>(null);
    const [entityName, setEntityName] = React.useState<string | null>(null);
    const [entityCode, setEntityCode] = React.useState<string | null>(null);
    const [entityMongoId, setEntityMongoId] = React.useState<string | null>(null);
    const entityParentMongoId = React.useRef<string | null>(null);

    const [items, setItems] = useState<AccordionItem[] | null>(null);

    const item = props.item;

    useEffect(() => {
        mounted.current = true;
        ctx.mounted(item.fullCode!);

        return () => {
            mounted.current = false;
            ctx.unmounted(item.fullCode!);
        };
    }, []);

    const refreshItems = React.useCallback(async () => {
        const data = await ctx.fetchData(
            props.item._id,
            4,
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

    const handleAccordionChange = React.useCallback(async (isExpanded: boolean) => {
        ctx.setExpanded(item.fullCode!, isExpanded);

        if (isExpanded) {
            let fetchedData = (await ctx.fetchData(item._id, 4, props.catalogType, props.searchVal, props.filter)) as AccordionItem[];
            for (let item of fetchedData) {
                item.label = item.name;

                if (item.averagePrice) {
                    item.averagePrice = catalogConvertToFixedString(item.averagePrice);
                }

                item.isLoading = false;
                item.children = [];
            }
            setItems(fetchedData);
        } else {
            setItems(null);
        }
    }, []);

    return (
        <EstimateSubChildAccordion
            // key={props.key}
            expanded={ctx.isExpanded(item.fullCode!)}
            // onChange={handleAccordionChange(item._id, item.fullCode, 2)}
            onChange={(event, isExpanded) => handleAccordionChange(isExpanded)}
        >
            <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                    direction='row'
                    alignItems='flex-start'
                    width='100%'
                    spacing={1}
                >
                    <Typography>{item.code}</Typography>
                    <Typography
                        sx={{
                            flexGrow: 1,
                            flexShrink: 1,
                            flexBasis: 'auto',
                            minWidth: 0, // <— the magic: lets it go narrower than its “min-content” width
                            overflowWrap: 'break-word',
                        }}
                    >
                        {item.label}
                    </Typography>

                    <Box flex={20}>&nbsp;</Box>
                    <Typography>{formatQuantityParens(item.childrenQuantity)}</Typography>

                    <Tooltip title={t('Average market price')} arrow placement='top'>
                        <Typography sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            {formatCurrencyRoundedSymbol(item.averagePrice)}
                        </Typography>
                    </Tooltip>

                    <Typography>({item.measurementUnitRepresentationSymbol})</Typography>

                    <Box>&nbsp;</Box>

                    {ctx.permCatEdit && (
                        <>
                            <Button
                                component='div'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setActionType('update');
                                    setEntityType('item');
                                    setEntityName(item.label);
                                    setEntityCode(item.code);
                                    setEntityMongoId(item._id);
                                    entityParentMongoId.current = props.subChildParentId;
                                }}
                            >
                                {t('Edit Item')}
                            </Button>

                            <Button
                                component='div'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setActionType('add');
                                    setEntityType('item');
                                    setEntityMongoId(props.subChildParentId);
                                    entityParentMongoId.current = props.subChildParentId;
                                }}
                            >
                                {t('Add Item')}
                            </Button>
                        </>
                    )}
                </Stack>
            </EstimateRootAccordionSummary>

            <EstimateSubChildAccordionDetails>
                <CatalogAccordionItems
                    item={item}
                    catalogType={props.catalogType}
                    searchVal={props.searchVal}
                    filter={props.filter}
                    items={items}
                    onItemsChange={refreshItems}
                />
                {/* {items === null ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <CatalogAccordionItems
                        item={item}
                        catalogType={props.catalogType}
                        searchVal={props.searchVal}
                        filter={props.filter}
                        items={items}
                        onItemsChange={refreshItems}
                    />
                )} */}
            </EstimateSubChildAccordionDetails>


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
                        await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter)
                        await props.onSubChildsChange();

                        setActionType(null);
                        setEntityType(null);
                        setEntityName(null);
                        setEntityCode(null);
                        setEntityMongoId(null);
                        entityParentMongoId.current = null;
                    }}
                />
            )}
        </EstimateSubChildAccordion>
    );
}
