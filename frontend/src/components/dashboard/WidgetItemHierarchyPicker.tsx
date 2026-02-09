'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Typography,
    CircularProgress,
    InputBase,
    Radio,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import * as Api from 'api';
import * as LaborsApi from 'api/labor';
import * as MaterialsApi from 'api/material';
import { LaborCategoryDisplayData, LaborSubcategoryDisplayData, LaborItemDisplayData } from '@/data/labor_display_data';
import { MaterialCategoryDisplayData, MaterialSubcategoryDisplayData, MaterialItemDisplayData } from '@/data/material_display_data';
import { useTranslation } from 'react-i18next';

const TEAL = '#00ABBE';
const TEAL_LIGHT = 'rgba(0, 171, 190, 0.08)';

export interface HierarchyLaborItem {
    _id: string;
    name: string;
    fullCode: string;
    averagePrice?: number | null;
    measurementUnitRepresentationSymbol?: string;
}

export interface HierarchyMaterialItem {
    _id: string;
    name: string;
    fullCode: string;
    averagePrice?: number | null;
    measurementUnitRepresentationSymbol?: string;
}

interface Props {
    catalogType: 'labor' | 'material';
    selectedId: string | null;
    onSelect: (item: { _id: string; name: string; [k: string]: any }) => void;
}

interface CategoryNode {
    _id: string;
    name: string;
    children: SubcategoryNode[];
    loading?: boolean;
}

interface SubcategoryNode {
    _id: string;
    name: string;
    items: ItemNode[];
    loading?: boolean;
}

interface ItemNode {
    _id: string;
    name: string;
    fullCode: string;
    averagePrice?: number | null;
    measurementUnitRepresentationSymbol?: string;
    laborHours?: number | null;
}

export default function WidgetItemHierarchyPicker({ catalogType, selectedId, onSelect }: Props) {
    const { t } = useTranslation();
    const [searchVal, setSearchVal] = useState('');
    const [searchSubmitted, setSearchSubmitted] = useState('');
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const command = catalogType === 'labor' ? 'labor/fetch_categories' : 'material/fetch_categories';
            const data = await Api.requestSession<any[]>({
                command,
                ...(searchSubmitted.trim() ? { args: { searchVal: searchSubmitted } } : {}),
            });
            const mapped: CategoryNode[] = (data || []).map((c: any) => {
                const id = typeof c._id === 'string' ? c._id : (c._id?.$oid ?? String(c._id));
                const D = catalogType === 'labor' ? new LaborCategoryDisplayData(c) : new MaterialCategoryDisplayData(c);
                return { _id: id, name: D.name || c.name || '', children: [] };
            });
            setCategories(mapped);
        } catch (e) {
            console.error('Failed to fetch categories', e);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    }, [catalogType, searchSubmitted]);

    React.useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const loadSubcategories = useCallback(async (categoryId: string) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat._id === categoryId ? { ...cat, loading: true, children: cat.children.length ? cat.children : [] } : cat
            )
        );
        try {
            const command = catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories';
            const data = await Api.requestSession<any[]>({
                command,
                args: {
                    categoryMongoId: categoryId,
                    ...(searchSubmitted.trim() ? { searchVal: searchSubmitted } : {}),
                },
            });
            const mapped: SubcategoryNode[] = (data || []).map((s: any) => {
                const id = typeof s._id === 'string' ? s._id : (s._id?.$oid ?? String(s._id));
                const D = catalogType === 'labor' ? new LaborSubcategoryDisplayData(s) : new MaterialSubcategoryDisplayData(s);
                return { _id: id, name: D.name || s.name || '', items: [] };
            });
            setCategories((prev) =>
                prev.map((cat) =>
                    cat._id === categoryId ? { ...cat, children: mapped, loading: false } : cat
                )
            );
        } catch (e) {
            console.error('Failed to fetch subcategories', e);
            setCategories((prev) =>
                prev.map((cat) => (cat._id === categoryId ? { ...cat, loading: false } : cat))
            );
        }
    }, [catalogType, searchSubmitted]);

    const loadItems = useCallback(async (categoryId: string, subcategoryId: string) => {
        setCategories((prev) =>
            prev.map((cat) => {
                if (cat._id !== categoryId) return cat;
                return {
                    ...cat,
                    children: cat.children.map((sub) =>
                        sub._id === subcategoryId ? { ...sub, loading: true, items: [] } : sub
                    ),
                };
            })
        );
        try {
            const command = catalogType === 'labor' ? 'labor/fetch_items_with_average_price' : 'material/fetch_items_with_average_price';
            const data = await Api.requestSession<any[]>({
                command,
                args: {
                    subcategoryMongoId: subcategoryId,
                    isSorting: true,
                    calledFromPage: 'estCatAccordion',
                    ...(searchSubmitted.trim() ? { searchVal: searchSubmitted } : {}),
                },
            });
            const mapped: ItemNode[] = (data || []).map((item: any) => {
                const D = catalogType === 'labor' ? new LaborItemDisplayData(item) : new MaterialItemDisplayData(item);
                const id = typeof D._id === 'string' ? D._id : (item._id?.$oid ?? String(item._id ?? D._id));
                return {
                    _id: id,
                    name: D.name,
                    fullCode: D.fullCode,
                    averagePrice: D.averagePrice,
                    measurementUnitRepresentationSymbol: D.measurementUnitRepresentationSymbol,
                    laborHours: catalogType === 'labor' ? (D as LaborItemDisplayData).laborHours : undefined,
                };
            });
            setCategories((prev) =>
                prev.map((cat) => {
                    if (cat._id !== categoryId) return cat;
                    return {
                        ...cat,
                        children: cat.children.map((sub) =>
                            sub._id === subcategoryId ? { ...sub, items: mapped, loading: false } : sub
                        ),
                    };
                })
            );
        } catch (e) {
            console.error('Failed to fetch items', e);
            setCategories((prev) =>
                prev.map((cat) => {
                    if (cat._id !== categoryId) return cat;
                    return {
                        ...cat,
                        children: cat.children.map((sub) =>
                            sub._id === subcategoryId ? { ...sub, loading: false } : sub
                        ),
                    };
                })
            );
        }
    }, [catalogType, searchSubmitted]);

    const handleCategoryExpand = (categoryId: string, expanded: boolean) => {
        setExpandedCategory(expanded ? categoryId : null);
        if (expanded) {
            const cat = categories.find((c) => c._id === categoryId);
            if (cat && cat.children.length === 0 && !cat.loading) loadSubcategories(categoryId);
        }
    };

    const handleSubcategoryExpand = (categoryId: string, subcategoryId: string, expanded: boolean) => {
        setExpandedSubcategory(expanded ? subcategoryId : null);
        if (expanded) {
            const cat = categories.find((c) => c._id === categoryId);
            const sub = cat?.children.find((s) => s._id === subcategoryId);
            if (sub && sub.items.length === 0 && !sub.loading) loadItems(categoryId, subcategoryId);
        }
    };

    const formatPrice = (v: number | null | undefined) =>
        v != null ? Math.round(v).toLocaleString() : '—';

    return (
        <Box>
            <Box
                sx={{
                    mb: 2,
                    borderRadius: 3,
                    border: `1px solid ${TEAL}`,
                    px: 1.5,
                    py: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                }}
            >
                <SearchIcon sx={{ color: TEAL, fontSize: 20 }} />
                <InputBase
                    placeholder={t('Search')}
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setSearchSubmitted(searchVal)}
                    sx={{ flex: 1, fontSize: 14 }}
                />
            </Box>

            {categoriesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: TEAL }} />
                </Box>
            ) : (
                <Box sx={{ '& .MuiAccordion-root': { boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 1, mb: 0.5 } }}>
                    {categories.map((category) => (
                        <Accordion
                            key={category._id}
                            expanded={expandedCategory === category._id}
                            onChange={(_, exp) => handleCategoryExpand(category._id, exp)}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {category.name}
                                </Typography>
                                {category.loading && <CircularProgress size={16} sx={{ ml: 1, color: TEAL }} />}
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                {category.children.map((sub) => (
                                    <Accordion
                                        key={sub._id}
                                        sx={{ boxShadow: 'none', '&:before': { display: 'none' }, border: '1px solid #eee', borderRadius: 1, mb: 0.5 }}
                                        expanded={expandedSubcategory === sub._id}
                                        onChange={(_, exp) => handleSubcategoryExpand(category._id, sub._id, exp)}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="body2">{sub.name}</Typography>
                                            {sub.loading && <CircularProgress size={14} sx={{ ml: 1, color: TEAL }} />}
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ pt: 0, px: 0 }}>
                                            {sub.items.length === 0 && !sub.loading ? (
                                                <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                                                    {t('No items')}
                                                </Typography>
                                            ) : (
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>{t('ID')}</TableCell>
                                                            <TableCell>{catalogType === 'labor' ? t('Works') : t('Materials')}</TableCell>
                                                            {catalogType === 'labor' && (
                                                                <TableCell>{t('Man-Hours')}</TableCell>
                                                            )}
                                                            <TableCell>{t('Unit')}</TableCell>
                                                            <TableCell>{t('Price')}</TableCell>
                                                            <TableCell padding="checkbox" />
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {sub.items.map((item) => (
                                                            <TableRow
                                                                key={item._id}
                                                                hover
                                                                selected={selectedId === item._id}
                                                                sx={{
                                                                    '&.Mui-selected': { backgroundColor: TEAL_LIGHT },
                                                                }}
                                                            >
                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ color: TEAL }}>
                                                                        {item.fullCode}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>{item.name}</TableCell>
                                                                {catalogType === 'labor' && (
                                                                    <TableCell>{item.laborHours ?? '—'}</TableCell>
                                                                )}
                                                                <TableCell>{item.measurementUnitRepresentationSymbol ?? '—'}</TableCell>
                                                                <TableCell>{formatPrice(item.averagePrice)}</TableCell>
                                                                <TableCell padding="checkbox">
                                                                    <Radio
                                                                        checked={selectedId === item._id}
                                                                        onChange={() => onSelect(item)}
                                                                        sx={{ color: TEAL, '&.Mui-checked': { color: TEAL } }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}
        </Box>
    );
}
