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
import FormulaTextField from '@/components/FormulaTextField';

const MARKET_PRICE_EPS = 0.01; /* allow small rounding differences */

interface WorkItem {
    laborItemId: string;
    itemName: string;
    itemFullCode: string;
    itemMeasurementUnit: string;
    categoryName: string;
    subcategoryName: string;
    totalQuantity: number;
    itemLaborHours: number;
    itemChangableAveragePrice: number;
    /** Catalog market/average price (from refresh prices). Used to highlight market-price cells. */
    itemMarketPrice?: number | null;
    instanceIds: string[];
}

interface CatalogCategory {
    categoryId: string;
    categoryName: string;
    subcategories: CatalogSubcategory[];
}

interface CatalogSubcategory {
    subcategoryId: string;
    subcategoryName: string;
    works: WorkItem[];
}

interface EstimateWorksListDialogProps {
    estimateId: string;
    onClose: () => void;
    onSave: () => void;
}

/** Normalize API _id (string or { $oid: string }) to string for query params. */
function toIdString(id: unknown): string {
    if (id == null) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id !== null && 'oid' in id && typeof (id as { oid: string }).oid === 'string')
        return (id as { oid: string }).oid;
    return String(id);
}

export default function EstimateWorksListDialog(props: EstimateWorksListDialogProps) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<CatalogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editedWorks, setEditedWorks] = useState<Map<string, { price: number; laborHours: number }>>(new Map());

    useEffect(() => {
        fetchWorksData();
    }, [props.estimateId]);

    const fetchWorksData = async () => {
        setLoading(true);
        try {
            // Single API call: all labor items for the estimate (fast even for large estimates)
            const allLaborItems = await Api.requestSession<any[]>({
                command: 'estimate/fetch_works_list',
                args: { estimateId: props.estimateId },
            });

            // Group all labor items by laborItemId across entire estimate
            const worksMap = new Map<string, WorkItem>();

            for (const item of allLaborItems) {
                const laborItemId = toIdString(item.laborItemId);
                const laborItemData = item.estimateLaborItemData?.[0];
                
                if (!laborItemData || !laborItemId) {
                    continue;
                }

                const estimatedLaborIdStr = toIdString(item._id);
                if (!estimatedLaborIdStr) continue;

                if (worksMap.has(laborItemId)) {
                    const existingWork = worksMap.get(laborItemId)!;
                    existingWork.totalQuantity += item.quantity || 0;
                    existingWork.instanceIds.push(estimatedLaborIdStr);
                } else {
                    // Use categoryName and subcategoryName from backend (catalog hierarchy)
                    const categoryName = laborItemData.categoryName || '';
                    const subcategoryName = laborItemData.subcategoryName || '';

                    worksMap.set(laborItemId, {
                        laborItemId,
                        itemName: laborItemData.name || '',
                        itemFullCode: laborItemData.fullCode || '',
                        itemMeasurementUnit: item.estimateMeasurementUnitData?.[0]?.representationSymbol || '',
                        categoryName,
                        subcategoryName,
                        totalQuantity: item.quantity || 0,
                        itemLaborHours: item.laborHours || 0,
                        itemChangableAveragePrice: item.changableAveragePrice || 0,
                        itemMarketPrice: laborItemData.averagePrice != null ? Number(laborItemData.averagePrice) : null,
                        instanceIds: [estimatedLaborIdStr],
                    });
                }
            }

            // Step 3: Organize by catalog hierarchy (Category -> Subcategory -> Works)
            const categoriesMap = new Map<string, CatalogCategory>();

            for (const work of worksMap.values()) {
                const catKey = work.categoryName || '(Uncategorized)';
                
                if (!categoriesMap.has(catKey)) {
                    categoriesMap.set(catKey, {
                        categoryId: catKey,
                        categoryName: catKey,
                        subcategories: [],
                    });
                }

                const category = categoriesMap.get(catKey)!;
                const subKey = work.subcategoryName || '(Uncategorized)';
                let subcategory = category.subcategories.find(s => s.subcategoryName === subKey);
                
                if (!subcategory) {
                    subcategory = {
                        subcategoryId: subKey,
                        subcategoryName: subKey,
                        works: [],
                    };
                    category.subcategories.push(subcategory);
                }

                subcategory.works.push(work);
            }

            const sortedCategories = Array.from(categoriesMap.values()).sort((a, b) => 
                a.categoryName.localeCompare(b.categoryName)
            );

            sortedCategories.forEach(cat => {
                cat.subcategories.sort((a, b) => a.subcategoryName.localeCompare(b.subcategoryName));
                cat.subcategories.forEach(sub => {
                    sub.works.sort((a, b) => a.itemFullCode.localeCompare(b.itemFullCode));
                });
            });

            setCategories(sortedCategories);
        } catch (error) {
            console.error('Error fetching works data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (laborItemId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const current = editedWorks.get(laborItemId) || { price: 0, laborHours: 0 };
        setEditedWorks(new Map(editedWorks.set(laborItemId, { ...current, price: numValue })));
    };

    const handleLaborHoursChange = (laborItemId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const current = editedWorks.get(laborItemId) || { price: 0, laborHours: 0 };
        setEditedWorks(new Map(editedWorks.set(laborItemId, { ...current, laborHours: numValue })));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            for (const [laborItemId, changes] of editedWorks.entries()) {
                let allInstances: string[] = [];
                categories.forEach(category => {
                    category.subcategories.forEach(subcategory => {
                        subcategory.works.forEach(work => {
                            if (work.laborItemId === laborItemId) {
                                allInstances = work.instanceIds;
                            }
                        });
                    });
                });

                for (const instanceId of allInstances) {
                    const idStr = toIdString(instanceId);
                    if (!idStr) continue;

                    const updateData: any = {};
                    if (changes.price > 0) updateData.changableAveragePrice = changes.price;
                    if (changes.laborHours > 0) updateData.laborHours = changes.laborHours;

                    if (Object.keys(updateData).length > 0) {
                        await Api.requestSession({
                            command: 'estimate/update_labor_item',
                            args: { estimatedLaborId: idStr },
                            json: updateData,
                        });
                    }
                }
            }

            props.onSave();
            // Refresh table from server so it shows saved values
            await fetchWorksData();
            setEditedWorks(new Map());
        } catch (error) {
            console.error('Error saving works:', error);
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
                {t('Works List')}
                <IconButton
                    aria-label="close"
                    onClick={props.onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, backgroundColor: '#F5F9F9', '& .Mui-selected': { backgroundColor: '#E8EFEF !important' }, '& .Mui-focusVisible': { backgroundColor: '#E8EFEF !important' }, '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 }, '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }, '& input[type=number]': { MozAppearance: 'textfield' } }}>
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
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexDirection: 'row-reverse', gap: '8px', pl: '30px', pr: '16px', minHeight: '36px', '& .MuiAccordionSummary-content': { my: '6px', ml: 0 }, '&:hover': { backgroundColor: '#E8EFEF' }, backgroundColor: 'transparent', '& .MuiAccordionSummary-expandIconWrapper': { mr: 0 } }}>
                                                <Typography sx={{ pl: 1, fontWeight: 500 }}>{subcategory.subcategoryName}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ p: 0, pl: '13px', backgroundColor: 'transparent' }}>
                                                <Table size="small" sx={{ backgroundColor: 'transparent', tableLayout: 'fixed', width: '100%', '& .MuiTableRow-root.Mui-selected': { backgroundColor: '#E8EFEF !important' }, '& .MuiTableRow-root.Mui-selected:hover': { backgroundColor: '#E8EFEF !important' } }}>
                                                    <colgroup>
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '40%' }} />
                                                        <col style={{ width: '13%' }} />
                                                        <col style={{ width: '10%' }} />
                                                        <col style={{ width: '28%' }} />
                                                    </colgroup>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600, paddingLeft: '23px' }}>{t('ID')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Works')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Man-Hours')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Unit')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>{t('Price')}</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {subcategory.works.map((work) => {
                                                            const edited = editedWorks.get(work.laborItemId);
                                                            const displayPrice = edited?.price ?? work.itemChangableAveragePrice;
                                                            return (
                                                                <TableRow key={work.laborItemId} sx={{ '&:hover': { backgroundColor: '#E8EFEF' } }}>
                                                                    <TableCell sx={{ paddingLeft: '23px' }}>
                                                                        <Typography variant="body2" sx={{ color: '#00ABBE' }}>
                                                                            {work.itemFullCode}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell>{work.itemName}</TableCell>
                                                                    <TableCell>
                                                                        <FormulaTextField
                                                                            value={edited?.laborHours ?? work.itemLaborHours}
                                                                            onChange={(val) => handleLaborHoursChange(work.laborItemId, String(val))}
                                                                            width={100}
                                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px', backgroundColor: '#e3f2fd', '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' }, '&.Mui-focused fieldset': { borderColor: '#00ABBE' } } }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>{work.itemMeasurementUnit}</TableCell>
                                                                    <TableCell>
                                                                        <FormulaTextField
                                                                            value={displayPrice}
                                                                            onChange={(val) => handlePriceChange(work.laborItemId, String(val))}
                                                                            width={100}
                                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px', backgroundColor: work.itemMarketPrice != null && Math.abs(displayPrice - work.itemMarketPrice) < MARKET_PRICE_EPS ? '#FFFDE7' : '#e3f2fd', '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' }, '&.Mui-focused fieldset': { borderColor: '#00ABBE' } } }}
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
