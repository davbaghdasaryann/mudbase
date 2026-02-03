"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    useTheme,
    Button,
    Typography,
    CircularProgress,
    Stack,
} from '@mui/material';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useTranslation } from 'react-i18next';
import * as Api from 'api';
import DataTableComponent from '../DataTableComponent';
import { formatCurrency } from '@/lib/format_currency';
import * as MaterialsApi from 'api/material';
import {
    MaterialCategoryDisplayData,
    MaterialItemDisplayData,
    MaterialSubcategoryDisplayData,
} from '@/data/material_display_data';
import SearchComponent from '../SearchComponent';
import { EstimateRootAccordion, EstimateChildAccordion } from '../AccordionComponent';
import { accordionBorderColor, mainBackgroundColor } from '@/theme';

interface FavoriteMaterial {
    materialItemId?: string;
    materialOfferId?: string;
    materialOfferItemName: string;
    measurementUnitMongoId?: string;
    quantity: number;
    materialConsumptionNorm: number;
    changableAveragePrice: number;
    /** Stable unique id for DataGrid row key; not persisted to backend */
    _rowId?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    initialMaterials: FavoriteMaterial[];
    onSave: (materials: FavoriteMaterial[]) => void;
}

interface CatalogAccordionItem {
    _id: string;
    label: string;
    code: string;
    fullCode?: string;
    categoryFullCode?: string;
    childrenQuantity?: number;
    children?: CatalogAccordionItem[];
    isLoading?: boolean;
    measurementUnitRepresentationSymbol?: string;
    measurementUnitMongoId?: string;
    averagePrice?: string | number;
}

function updateNestedChildren(
    items: CatalogAccordionItem[],
    parentId: string,
    newChildren: CatalogAccordionItem[] | undefined,
    isLoading: boolean
): CatalogAccordionItem[] {
    return items.map((item) => {
        if (item._id === parentId) {
            return {
                ...item,
                children: newChildren !== undefined ? newChildren : item.children,
                isLoading,
            };
        }
        if (item.children) {
            return {
                ...item,
                children: updateNestedChildren(item.children, parentId, newChildren, isLoading),
            };
        }
        return item;
    });
}

export default function FavoriteMaterialsDialog(props: Props) {
    const theme = useTheme();
    const { t } = useTranslation();

    const [searchVal, setSearchVal] = useState('');
    const [catalogItems, setCatalogItems] = useState<CatalogAccordionItem[]>([]);
    const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const fallbackRowIdRef = useRef(0);
    const [materialsDraft, setMaterialsDraft] = useState<FavoriteMaterial[]>(() =>
        (props.initialMaterials ?? []).map((m, i) => ({
            ...m,
            _rowId: (m as FavoriteMaterial)._rowId ?? `mat-${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        }))
    );

    useEffect(() => {
        const initial = props.initialMaterials ?? [];
        setMaterialsDraft(
            initial.map((m, i) => ({
                ...m,
                _rowId: (m as FavoriteMaterial)._rowId ?? `mat-${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            }))
        );
    }, [props.initialMaterials]);

    const fetchCategories = useCallback((search: string) => {
        setCatalogLoading(true);
        Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
            command: 'material/fetch_categories',
            args: { searchVal: search === '' ? '' : search },
        })
            .then((data) => {
                const categories = (Array.isArray(data) ? data : []).map(
                    (c) => new MaterialCategoryDisplayData(c)
                );
                const accordionData: CatalogAccordionItem[] = categories.map((cat) => ({
                    _id: cat._id,
                    label: cat.name,
                    code: cat.code,
                    childrenQuantity: cat.childrenQuantity,
                    children: [],
                }));
                setCatalogItems(accordionData);
                setExpandedAccordions([]);
            })
            .catch((err) => {
                console.error('Failed to fetch material categories:', err);
                setCatalogItems([]);
            })
            .finally(() => setCatalogLoading(false));
    }, []);

    useEffect(() => {
        fetchCategories(searchVal);
    }, [fetchCategories, searchVal]);

    const handleAccordionChange =
        (id: string, expandKey: string, level: number) =>
        async (_event: React.SyntheticEvent, isExpanded: boolean) => {
            if (isExpanded) {
                if (level === 2) {
                    setCatalogItems((prev) => updateNestedChildren(prev, id, undefined, true));
                    Api.requestSession<MaterialsApi.ApiMaterialSubcategory[]>({
                        command: 'material/fetch_subcategories',
                        args: { categoryMongoId: id, searchVal: searchVal || '' },
                    })
                        .then((data) => {
                            const subcats = (Array.isArray(data) ? data : []).map(
                                (s) => new MaterialSubcategoryDisplayData(s)
                            );
                            const newChildren: CatalogAccordionItem[] = subcats.map((s) => ({
                                _id: s._id,
                                label: s.name,
                                code: s.code,
                                categoryFullCode: s.categoryFullCode,
                                fullCode: s.categoryFullCode,
                                childrenQuantity: s.childrenQuantity,
                                children: [],
                            }));
                            setCatalogItems((prev) => updateNestedChildren(prev, id, newChildren, false));
                        })
                        .catch(() => {
                            setCatalogItems((prev) => updateNestedChildren(prev, id, [], false));
                        });
                    setExpandedAccordions((prev) => [...prev, expandKey]);
                } else if (level === 3) {
                    setCatalogItems((prev) => updateNestedChildren(prev, id, undefined, true));
                    Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
                        command: 'material/fetch_items_with_average_price',
                        args: {
                            subcategoryMongoId: id,
                            searchVal: searchVal === '' ? 'empty' : searchVal,
                            isSorting: true,
                            calledFromPage: 'estCatAccordion',
                        },
                    })
                        .then((data) => {
                            const items = (Array.isArray(data) ? data : []).map(
                                (m) => new MaterialItemDisplayData(m)
                            );
                            const newChildren: CatalogAccordionItem[] = items.map((m) => ({
                                _id: m._id,
                                label: m.name,
                                code: m.code,
                                fullCode: m.fullCode,
                                measurementUnitRepresentationSymbol: m.measurementUnitRepresentationSymbol,
                                measurementUnitMongoId: m.measurementUnitMongoId,
                                averagePrice: m.averagePrice,
                            }));
                            setCatalogItems((prev) => updateNestedChildren(prev, id, newChildren, false));
                        })
                        .catch(() => {
                            setCatalogItems((prev) => updateNestedChildren(prev, id, [], false));
                        });
                    setExpandedAccordions((prev) => [...prev, expandKey]);
                }
            } else {
                setExpandedAccordions((prev) => prev.filter((k) => k !== expandKey && !k.startsWith(expandKey)));
                if (level === 2) {
                    setCatalogItems((prev) =>
                        prev.map((item) => (item._id === id ? { ...item, children: [] } : item))
                    );
                } else if (level === 3) {
                    setCatalogItems((prev) =>
                        prev.map((cat) => ({
                            ...cat,
                            children: cat.children?.map((sub) =>
                                sub._id === id ? { ...sub, children: [] } : sub
                            ),
                        }))
                    );
                }
            }
        };

    const handleAddMaterialFromCatalog = (row: CatalogAccordionItem) => {
        const newRow: FavoriteMaterial = {
            materialItemId: row._id,
            materialOfferId: undefined,
            materialOfferItemName: row.label,
            measurementUnitMongoId: row.measurementUnitMongoId,
            quantity: 1,
            materialConsumptionNorm: 1,
            changableAveragePrice: typeof row.averagePrice === 'number' ? row.averagePrice : Number(row.averagePrice) || 0,
            _rowId: `mat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
        setMaterialsDraft((prev) => [...prev, newRow]);
    };

    const handleSave = () => {
        props.onSave(
            materialsDraft.map(({ _rowId, ...m }) => m)
        );
    };

    return (
        <Dialog
            fullScreen
            open={props.open}
            onClose={props.onClose}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 5,
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                {t('Add / Edit Materials')}
                <IconButton
                    aria-label="close"
                    onClick={props.onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        height: '100%',
                        '& > .pane': {
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        },
                    }}
                >
                    <Box
                        className="pane"
                        sx={{
                            borderRight: `1px solid ${theme.palette.divider}`,
                            p: 2,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            {t('Materials catalog')}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                            <SearchComponent onSearch={(value) => setSearchVal(value)} />
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
                            {catalogLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Stack sx={{ mt: 1 }}>
                                    {catalogItems.map((item) => (
                                        <EstimateRootAccordion
                                            key={item._id}
                                            expanded={expandedAccordions.includes(item.code)}
                                            onChange={handleAccordionChange(item._id, item.code, 2)}
                                        >
                                            <AccordionSummary
                                                expandIcon={<ExpandMoreIcon />}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row-reverse',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    paddingLeft: '10px',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography>{item.code}</Typography>
                                                    <Typography sx={{ wordBreak: 'break-word' }}>
                                                        {item.label}&nbsp;
                                                        <Typography component="span" sx={{ fontWeight: 'inherit' }}>
                                                            {typeof item.childrenQuantity === 'number' &&
                                                            !isNaN(item.childrenQuantity) &&
                                                            item.childrenQuantity > 0
                                                                ? `(${item.childrenQuantity})`
                                                                : '(0)'}
                                                        </Typography>
                                                    </Typography>
                                                </Stack>
                                            </AccordionSummary>
                                            <AccordionDetails
                                                sx={{
                                                    position: 'relative',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        left: 20,
                                                        top: 0,
                                                        width: '2px',
                                                        height: '100%',
                                                        backgroundColor: accordionBorderColor,
                                                    },
                                                    backgroundColor: mainBackgroundColor,
                                                }}
                                            >
                                                {item.isLoading ? (
                                                    <CircularProgress size={24} sx={{ ml: 4 }} />
                                                ) : item.children && item.children.length > 0 ? (
                                                    <Stack spacing={2} sx={{ ml: 4 }}>
                                                        {item.children.map((child) =>
                                                            child.children ? (
                                                                <EstimateChildAccordion
                                                                    key={child._id}
                                                                    expanded={expandedAccordions.includes(
                                                                        child.categoryFullCode ?? child._id
                                                                    )}
                                                                    onChange={handleAccordionChange(
                                                                        child._id,
                                                                        child.categoryFullCode ?? child._id,
                                                                        3
                                                                    )}
                                                                >
                                                                    <AccordionSummary
                                                                        expandIcon={<ExpandMoreIcon />}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexDirection: 'row-reverse',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            paddingLeft: '10px',
                                                                        }}
                                                                    >
                                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                                            <Typography>{child.code}</Typography>
                                                                            <Typography sx={{ wordBreak: 'break-word' }}>
                                                                                {child.label}&nbsp;
                                                                                <Typography
                                                                                    component="span"
                                                                                    sx={{ fontWeight: 'inherit' }}
                                                                                >
                                                                                    {typeof child.childrenQuantity ===
                                                                                        'number' &&
                                                                                    !isNaN(child.childrenQuantity) &&
                                                                                    child.childrenQuantity > 0
                                                                                        ? `(${child.childrenQuantity})`
                                                                                        : '(0)'}
                                                                                </Typography>
                                                                            </Typography>
                                                                        </Stack>
                                                                    </AccordionSummary>
                                                                    <AccordionDetails
                                                                        sx={{
                                                                            position: 'relative',
                                                                            '&::before': {
                                                                                content: '""',
                                                                                position: 'absolute',
                                                                                left: 20,
                                                                                top: 0,
                                                                                width: '2px',
                                                                                height: '100%',
                                                                                backgroundColor: accordionBorderColor,
                                                                            },
                                                                            backgroundColor: mainBackgroundColor,
                                                                        }}
                                                                    >
                                                                        {child.isLoading ? (
                                                                            <CircularProgress size={24} sx={{ ml: 4 }} />
                                                                        ) : child.children &&
                                                                          child.children.length > 0 ? (
                                                                            <Stack spacing={2} sx={{ ml: 4 }}>
                                                                                <DataTableComponent
                                                                                    sx={{ width: '100%' }}
                                                                                    columns={[
                                                                                        {
                                                                                            field: 'fullCode',
                                                                                            headerName: t('ID'),
                                                                                            flex: 0.2,
                                                                                        },
                                                                                        {
                                                                                            field: 'label',
                                                                                            headerName: t('Materials'),
                                                                                            flex: 0.5,
                                                                                        },
                                                                                        {
                                                                                            field: 'measurementUnitRepresentationSymbol',
                                                                                            headerName: t('Unit'),
                                                                                            width: 80,
                                                                                        },
                                                                                        {
                                                                                            field: 'averagePrice',
                                                                                            headerName: t('Price'),
                                                                                            width: 120,
                                                                                            valueFormatter: (value: any) =>
                                                                                                formatCurrency(value),
                                                                                        },
                                                                                        {
                                                                                            field: 'add',
                                                                                            type: 'actions',
                                                                                            headerName: '',
                                                                                            width: 60,
                                                                                            renderCell: (cell) => (
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    onClick={() =>
                                                                                                        handleAddMaterialFromCatalog(
                                                                                                            cell.row as CatalogAccordionItem
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    <AddToPhotosIcon />
                                                                                                </IconButton>
                                                                                            ),
                                                                                        },
                                                                                    ]}
                                                                                    rows={child.children ?? []}
                                                                                    getRowId={(row) => row._id}
                                                                                    disableRowSelectionOnClick
                                                                                />
                                                                            </Stack>
                                                                        ) : (
                                                                            <Typography sx={{ ml: 4 }}>
                                                                                {t('No more data')}
                                                                            </Typography>
                                                                        )}
                                                                    </AccordionDetails>
                                                                </EstimateChildAccordion>
                                                            ) : null
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    <Typography sx={{ ml: 4 }}>{t('No more data')}</Typography>
                                                )}
                                            </AccordionDetails>
                                        </EstimateRootAccordion>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    <Box
                        className="pane"
                        sx={{
                            p: 2,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            {t('Attached materials')}
                        </Typography>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <DataTableComponent
                                sx={{
                                    width: '100%',
                                    '& .editableCell': {
                                        border: '1px solid #00BFFF',
                                        borderRadius: '5px',
                                    },
                                }}
                                columns={[
                                    {
                                        field: 'materialOfferItemName',
                                        headerName: t('Material'),
                                        flex: 0.5,
                                        editable: true,
                                        cellClassName: 'editableCell',
                                    },
                                    {
                                        field: 'quantity',
                                        headerName: t('Quantity'),
                                        width: 110,
                                        editable: true,
                                        cellClassName: 'editableCell',
                                    },
                                    {
                                        field: 'materialConsumptionNorm',
                                        headerName: t('Material consumption norm'),
                                        width: 160,
                                        editable: true,
                                        cellClassName: 'editableCell',
                                    },
                                    {
                                        field: 'changableAveragePrice',
                                        headerName: t('Price'),
                                        width: 140,
                                        editable: true,
                                        cellClassName: 'editableCell',
                                        valueFormatter: (value: any) => formatCurrency(value),
                                    },
                                    {
                                        field: 'remove',
                                        type: 'actions',
                                        headerName: t('Remove'),
                                        width: 80,
                                        renderCell: (cell) => {
                                            const rowId = cell.id as string;
                                            return (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        setMaterialsDraft((prev) =>
                                                            prev.filter((m) => (m as FavoriteMaterial)._rowId !== rowId)
                                                        )
                                                    }
                                                >
                                                    <DeleteForeverIcon />
                                                </IconButton>
                                            );
                                        },
                                    },
                                ]}
                                rows={materialsDraft}
                                getRowId={(params) => {
                                    const row = params?.row as FavoriteMaterial | undefined;
                                    if (!row) return `mat-fallback-${fallbackRowIdRef.current++}`;
                                    if (row._rowId) return row._rowId;
                                    return `mat-${row.materialOfferItemName ?? 'row'}-${row.quantity ?? 0}-${fallbackRowIdRef.current++}`;
                                }}
                                disableRowSelectionOnClick
                                processRowUpdate={(newRow, oldRow) => {
                                    if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
                                    const oldId = (oldRow as FavoriteMaterial)._rowId;
                                    if (!oldId) return oldRow;
                                    const updated: FavoriteMaterial = {
                                        ...(newRow as FavoriteMaterial),
                                        _rowId: oldId,
                                    };
                                    setMaterialsDraft((prev) =>
                                        prev.map((m) => ((m as FavoriteMaterial)._rowId === oldId ? updated : m))
                                    );
                                    return updated;
                                }}
                                onProcessRowUpdateError={(error) =>
                                    console.error('Error updating favorite material row:', error)
                                }
                            />
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button onClick={props.onClose}>{t('Cancel')}</Button>
                            <Button variant="contained" onClick={handleSave}>
                                {t('Save')}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
