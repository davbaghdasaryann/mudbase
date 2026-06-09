'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TextField,
    Typography,
    IconButton,
    Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import ProgressIndicator from '@/tsui/ProgressIndicator';

interface MaterialInstance {
    estimatedMaterialId: string;
    estimatedLaborId: string;
}

const MARKET_PRICE_EPS = 0.01; /* allow small rounding differences */

interface MaterialItem {
    materialItemId: string;
    itemName: string;
    itemFullCode: string;
    itemMeasurementUnit: string;
    categoryName: string;
    subcategoryName: string;
    quantity: number;
    itemChangableAveragePrice: number;
    /** Catalog market/average price (from refresh prices). Used to highlight market-price cells. */
    itemMarketPrice?: number | null;
    instances: MaterialInstance[];
}

interface CatalogCategory {
    categoryId: string;
    categoryName: string;
    subcategories: CatalogSubcategory[];
}

interface CatalogSubcategory {
    subcategoryId: string;
    subcategoryName: string;
    materials: MaterialItem[];
}

interface EstimateMaterialsListDialogProps {
    estimateId: string;
    onClose: () => void;
    onSave: () => void;
}

function toIdString(id: unknown): string {
    if (id == null) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id !== null && 'oid' in id && typeof (id as { oid: string }).oid === 'string')
        return (id as { oid: string }).oid;
    return String(id);
}

export default function EstimateMaterialsListDialog(props: EstimateMaterialsListDialogProps) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<CatalogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editedPrices, setEditedPrices] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        fetchMaterialsData();
    }, [props.estimateId]);

    const fetchMaterialsData = async () => {
        setLoading(true);
        try {
            const allMaterialItems = await Api.requestSession<any[]>({
                command: 'estimate/fetch_materials_list',
                args: { estimateId: props.estimateId },
            });

            const materialsMap = new Map<string, MaterialItem>();

            for (const item of allMaterialItems) {
                const materialItemId = toIdString(item.materialItemId);
                const materialData = item.estimateMaterialItemData?.[0];
                if (!materialData || !materialItemId) continue;

                const estimatedMaterialIdStr = toIdString(item._id);
                const estimatedLaborIdStr = toIdString(item.estimatedLaborId);
                if (!estimatedMaterialIdStr || !estimatedLaborIdStr) continue;

                if (materialsMap.has(materialItemId)) {
                    const existing = materialsMap.get(materialItemId)!;
                    existing.quantity += item.quantity ?? 0;
                    existing.instances.push({ estimatedMaterialId: estimatedMaterialIdStr, estimatedLaborId: estimatedLaborIdStr });
                } else {
                    materialsMap.set(materialItemId, {
                        materialItemId,
                        itemName: materialData.name || '',
                        itemFullCode: materialData.fullCode || '',
                        itemMeasurementUnit: item.estimateMeasurementUnitData?.[0]?.representationSymbol || '',
                        categoryName: materialData.categoryName || '',
                        subcategoryName: materialData.subcategoryName || '',
                        quantity: item.quantity ?? 0,
                        itemChangableAveragePrice: item.changableAveragePrice ?? 0,
                        itemMarketPrice: materialData.averagePrice != null ? Number(materialData.averagePrice) : null,
                        instances: [{ estimatedMaterialId: estimatedMaterialIdStr, estimatedLaborId: estimatedLaborIdStr }],
                    });
                }
            }

            const categoriesMap = new Map<string, CatalogCategory>();
            for (const material of materialsMap.values()) {
                const catKey = material.categoryName || '(Uncategorized)';
                if (!categoriesMap.has(catKey)) {
                    categoriesMap.set(catKey, { categoryId: catKey, categoryName: catKey, subcategories: [] });
                }
                const category = categoriesMap.get(catKey)!;
                const subKey = material.subcategoryName || '(Uncategorized)';
                let subcategory = category.subcategories.find((s) => s.subcategoryName === subKey);
                if (!subcategory) {
                    subcategory = { subcategoryId: subKey, subcategoryName: subKey, materials: [] };
                    category.subcategories.push(subcategory);
                }
                subcategory.materials.push(material);
            }

            const sortedCategories = Array.from(categoriesMap.values()).sort((a, b) =>
                a.categoryName.localeCompare(b.categoryName)
            );
            sortedCategories.forEach((cat) => {
                cat.subcategories.sort((a, b) => a.subcategoryName.localeCompare(b.subcategoryName));
                cat.subcategories.forEach((sub) => {
                    sub.materials.sort((a, b) => a.itemFullCode.localeCompare(b.itemFullCode));
                });
            });

            setCategories(sortedCategories);
        } catch (error) {
            console.error('Error fetching materials data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (materialItemId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setEditedPrices(new Map(editedPrices.set(materialItemId, numValue)));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            for (const [materialItemId, price] of editedPrices.entries()) {
                if (price < 0) continue;
                let instances: MaterialInstance[] = [];
                for (const cat of categories) {
                    for (const sub of cat.subcategories) {
                        const mat = sub.materials.find((m) => m.materialItemId === materialItemId);
                        if (mat) {
                            instances = mat.instances;
                            break;
                        }
                    }
                    if (instances.length) break;
                }
                for (const inst of instances) {
                    await Api.requestSession({
                        command: 'estimate/update_material_item',
                        args: { estimatedMaterialId: inst.estimatedMaterialId, estimatedLaborId: inst.estimatedLaborId },
                        json: { changableAveragePrice: price },
                    });
                }
            }
            props.onSave();
            await fetchMaterialsData();
            setEditedPrices(new Map());
        } catch (error) {
            console.error('Error saving materials:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={true}
            onClose={props.onClose}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh', maxHeight: '85vh', width: '80vw', maxWidth: '1100px', borderRadius: '10px' },
            }}
        >
            <DialogTitle>
                {t('Materials List')}
                <IconButton
                    aria-label="close"
                    onClick={props.onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, backgroundColor: '#F5F9F9', '& .Mui-selected': { backgroundColor: '#E8EFEF !important' }, '& .Mui-focusVisible': { backgroundColor: '#E8EFEF !important' } }}>
                {loading ? (
                    <ProgressIndicator />
                ) : (
                    <Box>
                        {categories.map((category) => (
                            <Accordion key={category.categoryId} defaultExpanded disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, backgroundColor: 'transparent' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexDirection: 'row-reverse', gap: '8px', backgroundColor: '#FFFFFF', minHeight: '40px', '& .MuiAccordionSummary-content': { my: '8px' }, '&:hover': { backgroundColor: '#E8EFEF' } }}>
                                    <Typography sx={{ fontWeight: 500, pl: 1 }}>{category.categoryName}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0, backgroundColor: 'transparent' }}>
                                    {category.subcategories.map((subcategory) => (
                                        <Accordion key={subcategory.subcategoryId} defaultExpanded disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, backgroundColor: 'transparent' }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexDirection: 'row-reverse', gap: '8px', pl: 5, minHeight: '36px', '& .MuiAccordionSummary-content': { my: '6px' }, '&:hover': { backgroundColor: '#E8EFEF' }, backgroundColor: 'transparent' }}>
                                                <Typography sx={{ pl: 1 }}>{subcategory.subcategoryName}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ p: 0, backgroundColor: 'transparent' }}>
                                                <Table size="small" sx={{ backgroundColor: 'transparent', '& .MuiTableRow-root.Mui-selected': { backgroundColor: '#E8EFEF !important' }, '& .MuiTableRow-root.Mui-selected:hover': { backgroundColor: '#E8EFEF !important' } }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600, pl: 4 }}>{t('ID')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Materials')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Unit')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Material consumption')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Price')}</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {subcategory.materials.map((mat) => {
                                                            const editedPrice = editedPrices.get(mat.materialItemId);
                                                            const displayPrice = editedPrice !== undefined ? editedPrice : mat.itemChangableAveragePrice;
                                                            return (
                                                                <TableRow key={mat.materialItemId} sx={{ '&:hover': { backgroundColor: '#E8EFEF' } }}>
                                                                    <TableCell sx={{ pl: 4 }}>
                                                                        <Typography variant="body2" sx={{ color: '#00ABBE' }}>
                                                                            {mat.itemFullCode}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell>{mat.itemName}</TableCell>
                                                                    <TableCell>{mat.itemMeasurementUnit}</TableCell>
                                                                    <TableCell>{mat.quantity}</TableCell>
                                                                    <TableCell>
                                                                        <TextField
                                                                            type="number"
                                                                            size="small"
                                                                            value={displayPrice}
                                                                            onChange={(e) => handlePriceChange(mat.materialItemId, e.target.value)}
                                                                            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '4px', backgroundColor: mat.itemMarketPrice != null && Math.abs(displayPrice - mat.itemMarketPrice) < MARKET_PRICE_EPS ? '#FFFDE7' : '#e3f2fd', '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' }, '&.Mui-focused fieldset': { borderColor: '#00ABBE' } } }}
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    {t('Cancel')}
                </Button>
                <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
                    {t('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Named export for compatibility with existing imports
export { EstimateMaterialsListDialog };
