import React, { useEffect, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { EstimateRootAccordionSummary, EstimateSubChildAccordion, EstimateSubChildAccordionDetails } from '@/components/AccordionComponent';
import { AccordionItem, CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';
import { Box, Button, CircularProgress, Stack, Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { formatQuantityParens } from '@/components/pages/CatalogAccordion';
import { catalogConvertToFixedString, useCatalogData } from '@/components/catalog/CatalogAccordionDataContext';
import { useTranslation } from 'react-i18next';
import CatalogAccordionItems from '@/components/catalog/CatalogAccordionItems';
import { formatCurrencyRoundedSymbol } from '@/lib/format_currency';
import AddOrEditEntityDialog from '@/components/EditAddCategoryDialog';
import { confirmDialog } from '@/components/ConfirmationDialog';
import * as Api from 'api';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { usePermissions } from '@/api/auth';
import UserPageAddOfferDetailsDialog from '@/app/offers/UserPageAddOfferDetailsDIalog';
import { UserPageOfferEditDialog } from '@/app/offers/UserPageOfferEditDIalog';

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
    const { session } = usePermissions();
    const mounted = React.useRef(false);

    const [actionType, setActionType] = React.useState<'add' | 'update' | 'archive' | null>(null);
    const [entityType, setEntityType] = React.useState<'category' | 'subcategory' | 'item' | null>(null);
    const [entityName, setEntityName] = React.useState<string | null>(null);
    const [entityCode, setEntityCode] = React.useState<string | null>(null);
    const [entityMongoId, setEntityMongoId] = React.useState<string | null>(null);
    const entityParentMongoId = React.useRef<string | null>(null);

    const [items, setItems] = useState<AccordionItem[] | null>(null);

    // Info dialog state
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    // Offer dialog state (for both add and edit)
    const [showOfferDialog, setShowOfferDialog] = useState(false);

    // Move item dialog state
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);

    const item = props.item;

    useEffect(() => {
        mounted.current = true;
        ctx.mounted(item.fullCode!);

        // Fetch offers on mount to determine if user has an offer (for button color)
        if (ctx.permCanCrtOffr && session?.user.accountId) {
            ctx.fetchData(item._id, 4, props.catalogType, props.searchVal, props.filter)
                .then((fetchedData) => {
                    if (!mounted.current) return;

                    const normalized = (fetchedData as AccordionItem[]).map(i => ({
                        ...i,
                        label: i.name,
                        averagePrice: i.averagePrice != null
                            ? catalogConvertToFixedString(i.averagePrice)
                            : undefined,
                        isLoading: false,
                        children: [],
                    }));

                    setItems(normalized);
                });
        }

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

    const handleOpenInfoDialog = React.useCallback(async (event: React.MouseEvent) => {
        event.stopPropagation();

        // Fetch items if not already loaded
        if (!items) {
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
        }

        setShowInfoDialog(true);
    }, [items, ctx, item._id, props.catalogType, props.searchVal, props.filter]);

    const handleOpenOfferDialog = React.useCallback(async (event: React.MouseEvent) => {
        event.stopPropagation();

        // Fetch items if not already loaded to check if user has an offer
        if (!items) {
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
        }

        setShowOfferDialog(true);
    }, [items, ctx, item._id, props.catalogType, props.searchVal, props.filter]);

    // Check if user has an existing offer
    const userOffer = React.useMemo(() => {
        if (!items || !session?.user.accountId) return null;
        return items.find(c => c.accountId === session.user.accountId) || null;
    }, [items, session?.user.accountId]);

    // Show offer button if user can create offers
    const showOfferButton = ctx.permCanCrtOffr;

    const handleDeleteItem = React.useCallback(async (event: React.MouseEvent) => {
        event.stopPropagation();

        const result = await confirmDialog(
            t('catalog.delete_item_message', { label: item.label, code: item.code }),
            t('catalog.delete_item_title')
        );

        if (result.isConfirmed) {
            try {
                await Api.requestSession({
                    command: `${props.catalogType}/delete_item`,
                    args: { entityMongoId: item._id }
                });

                // Refresh the catalog data after successful deletion
                await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter);
                await props.onSubChildsChange();
            } catch (error) {
                console.error('Error deleting item:', error);
            }
        }
    }, [ctx, item, props]);

    const handleOpenMoveDialog = React.useCallback(async (event: React.MouseEvent) => {
        event.stopPropagation();

        // Fetch categories
        const cats = await Api.requestSession<any[]>({
            command: `${props.catalogType}/fetch_categories`
        });
        setCategories(cats);
        setShowMoveDialog(true);
    }, [props.catalogType]);

    const handleCategoryChange = React.useCallback(async (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setSelectedSubcategoryId('');

        if (categoryId) {
            // Fetch subcategories for selected category
            const subcats = await Api.requestSession<any[]>({
                command: `${props.catalogType}/fetch_subcategories`,
                args: { categoryMongoId: categoryId }
            });
            setSubcategories(subcats);
        } else {
            setSubcategories([]);
        }
    }, [props.catalogType]);

    const handleMoveItem = React.useCallback(async () => {
        if (!selectedSubcategoryId) {
            return;
        }

        // Check if trying to move to the same subcategory
        if (selectedSubcategoryId === props.subChildParentId) {
            await confirmDialog(
                t('catalog.move_already_in_subcategory_message'),
                t('catalog.move_cannot_title')
            );
            return;
        }

        try {
            await Api.requestSession({
                command: `${props.catalogType}/move_item`,
                args: {
                    itemMongoId: item._id,
                    newSubcategoryMongoId: selectedSubcategoryId
                }
            });

            // Close dialog and reset
            setShowMoveDialog(false);
            setSelectedCategoryId('');
            setSelectedSubcategoryId('');
            setCategories([]);
            setSubcategories([]);

            // Refresh the catalog data
            await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter);
            await props.onSubChildsChange();
        } catch (error: any) {
            console.error('Error moving item:', error);
            // Show error message to user
            await confirmDialog(
                error.message || t('catalog.move_failed_message'),
                t('catalog.move_failed_title')
            );
        }
    }, [ctx, item, props, selectedSubcategoryId]);

    return (
        <>
            <Box
                sx={{
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        backgroundColor: (theme) => theme.palette.action.hover,
                    },
                }}
            >
                <Stack
                    direction='row'
                    alignItems='flex-start'
                    width='100%'
                    spacing={{ xs: 0.5, sm: 1 }}
                    sx={{ py: 1, px: { xs: 1, sm: 2 } }}
                >
                    <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>{item.code}</Typography>
                    <Typography
                        sx={{
                            minWidth: 0, // <— the magic: lets it go narrower than its “min-content” width
                            overflowWrap: 'break-word',
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                    >
                        {item.label}
                    </Typography>

                    <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>{formatQuantityParens(item.childrenQuantity)}</Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Tooltip title={t('Average market price')} arrow placement='top'>
                        <Typography sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            {formatCurrencyRoundedSymbol(item.averagePrice)}
                        </Typography>
                    </Tooltip>

                    <Typography sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}>({item.measurementUnitRepresentationSymbol})</Typography>

                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>&nbsp;</Box>

                    {ctx.permCatEdit && (
                        <>
                            <Button
                                component='div'
                                onClick={handleOpenMoveDialog}
                                sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                            >
                                <ImgElement src='/images/icons/move.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                            </Button>

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
                                sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                            >
                                <ImgElement src='/images/icons/edit.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                            </Button>

                            <Button
                                component='div'
                                color='error'
                                onClick={handleDeleteItem}
                                sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                            >
                                <ImgElement src='/images/icons/delete.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                            </Button>
                        </>
                    )}

                    {ctx.isSignedIn && (
                        <Button
                            component='div'
                            color='info'
                            onClick={handleOpenInfoDialog}
                            sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 } }}
                        >
                            <ImgElement src='/images/icons/info.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                        </Button>
                    )}

                    {showOfferButton && (
                        <Button
                            component='div'
                            onClick={handleOpenOfferDialog}
                            sx={{
                                minWidth: 'auto',
                                px: { xs: 0.5, sm: 1 },
                                '& img': {
                                    filter: userOffer ? 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' : 'none'
                                }
                            }}
                        >
                            <ImgElement src='/images/icons/edit.svg' sx={{ height: { xs: 16, sm: 20 } }} />
                        </Button>
                    )}
                </Stack>
            </Box>


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

            {showInfoDialog && (
                <Dialog
                    open={showInfoDialog}
                    onClose={() => setShowInfoDialog(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        {item.code} - {item.label} - {t('Company Offers')}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <CatalogAccordionItems
                                item={item}
                                catalogType={props.catalogType}
                                searchVal={props.searchVal}
                                filter={props.filter}
                                items={items}
                                onItemsChange={refreshItems}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowInfoDialog(false)}>
                            {t('Close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {showMoveDialog && (
                <Dialog
                    open={showMoveDialog}
                    onClose={() => setShowMoveDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>{t('Move Item')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('Category')}</InputLabel>
                                <Select
                                    value={selectedCategoryId}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    label={t('Category')}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat._id} value={cat._id}>
                                            {cat.code} - {cat.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth disabled={!selectedCategoryId}>
                                <InputLabel>{t('Subcategory')}</InputLabel>
                                <Select
                                    value={selectedSubcategoryId}
                                    onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                                    label={t('Subcategory')}
                                >
                                    {subcategories.map((subcat) => (
                                        <MenuItem key={subcat._id} value={subcat._id}>
                                            {subcat.code} - {subcat.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowMoveDialog(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button
                            onClick={handleMoveItem}
                            variant="contained"
                            disabled={!selectedSubcategoryId}
                        >
                            {t('Move')}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {showOfferDialog && !userOffer && (
                <UserPageAddOfferDetailsDialog
                    catalogType={props.catalogType}
                    offerItemMongoId={item._id}
                    onClose={() => setShowOfferDialog(false)}
                    onConfirm={async () => {
                        await refreshItems();
                        await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter);
                        setShowOfferDialog(false);
                    }}
                />
            )}

            {showOfferDialog && userOffer && (
                <UserPageOfferEditDialog
                    offerMongoId={userOffer._id}
                    offerType={props.catalogType}
                    offerItemName={item.label}
                    onClose={() => setShowOfferDialog(false)}
                    onConfirm={async () => {
                        await refreshItems();
                        await ctx.refreshOpenNodes(props.catalogType, props.searchVal, props.filter);
                        setShowOfferDialog(false);
                    }}
                />
            )}
        </>
    );
}
