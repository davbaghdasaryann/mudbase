"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Checkbox,
    Box,
    Typography,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { confirmDialog } from '../ConfirmationDialog';
import ImgElement from '../../tsui/DomElements/ImgElement';
import DataTableComponent from '../DataTableComponent';
import { formatCurrency } from '@/lib/format_currency';
import FavoriteMaterialsDialog from './FavoriteMaterialsDialog';

interface FavoriteGroup {
    _id: string;
    name: string;
    createdAt: Date;
}

interface FavoriteLaborItem {
    _id: string;
    laborOfferItemName: string;
    quantity: number;
    changableAveragePrice: number;
    laborHours?: number;
    measurementUnitData?: Array<{ representationSymbol: string }>;
    materials: any[];
}

interface EstimateImportFromFavoritesDialogProps {
    estimateId: string;
    estimateSectionId?: string;
    estimateSubsectionId?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function EstimateImportFromFavoritesDialog(props: EstimateImportFromFavoritesDialogProps) {
    const [t] = useTranslation();
    const [groups, setGroups] = useState<FavoriteGroup[]>([]);
    const [laborItemsByGroupId, setLaborItemsByGroupId] = useState<Record<string, FavoriteLaborItem[]>>({});
    const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [materialsEditTarget, setMaterialsEditTarget] = useState<{
        groupId: string;
        itemId: string;
    } | null>(null);

    useEffect(() => {
        Api.requestSession<FavoriteGroup[]>({
            command: 'favorites/fetch_groups',
        })
            .then((fetchedGroups) => {
                setGroups(fetchedGroups);
            })
            .catch((error) => {
                console.error('Failed to fetch favorite groups:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const fetchGroupItems = (groupId: string) => {
        if (laborItemsByGroupId[groupId] != null) return;
        setLoadingGroupId(groupId);
        Api.requestSession<FavoriteLaborItem[]>({
            command: 'favorites/fetch_labor_items',
            args: { favoriteGroupId: groupId },
        })
            .then((items) => {
                setLaborItemsByGroupId((prev) => ({ ...prev, [groupId]: items }));
            })
            .catch((error) => {
                console.error('Failed to fetch labor items:', error);
            })
            .finally(() => {
                setLoadingGroupId(null);
            });
    };

    const handleAccordionChange = (groupId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedGroupId(isExpanded ? groupId : null);
        if (isExpanded) fetchGroupItems(groupId);
    };

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const updateItemLocally = (groupId: string, itemId: string, patch: Partial<FavoriteLaborItem>) => {
        setLaborItemsByGroupId((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || []).map((it) =>
                it._id === itemId ? { ...it, ...patch } : it
            ),
        }));
    };

    const handleInlineFieldBlur = (
        groupId: string,
        itemId: string,
        field: 'laborOfferItemName' | 'quantity' | 'changableAveragePrice',
        value: string
    ) => {
        const payload: any = {};
        if (field === 'laborOfferItemName') {
            payload.laborOfferItemName = value;
        } else if (field === 'quantity') {
            const num = Number(value.replace(',', '.'));
            if (Number.isNaN(num)) return;
            payload.quantity = num;
        } else if (field === 'changableAveragePrice') {
            const num = Number(value.replace(',', '.'));
            if (Number.isNaN(num)) return;
            payload.changableAveragePrice = num;
        }

        if (Object.keys(payload).length === 0) return;

        Api.requestSession({
            command: 'favorites/update_labor_item',
            args: { favoriteLaborItemId: itemId },
            json: payload,
        })
            .then(() => {
                updateItemLocally(groupId, itemId, payload);
            })
            .catch((error) => {
                console.error('Failed to update favorite labor item:', error);
            });
    };

    const openMaterialsDialog = (groupId: string, item: FavoriteLaborItem) => {
        setMaterialsEditTarget({ groupId, itemId: item._id });
    };

    const handleRemoveFromFavorites = (groupId: string, itemId: string) => {
        confirmDialog(t('favoritesModal.removeConfirm')).then((result) => {
            if (!result.isConfirmed) return;
            setDeletingItemId(itemId);
            Api.requestSession({
                command: 'favorites/remove_labor_item',
                args: { favoriteGroupId: groupId, favoriteLaborItemId: itemId },
            })
                .then(() => {
                    setLaborItemsByGroupId((prev) => ({
                        ...prev,
                        [groupId]: (prev[groupId] || []).filter((item) => item._id !== itemId),
                    }));
                    setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
                })
                .catch((error) => {
                    console.error('Failed to remove from favorites:', error);
                })
                .finally(() => {
                    setDeletingItemId(null);
                });
        });
    };

    const handleImport = async () => {
        if (selectedItemIds.length === 0) return;

        setSubmitting(true);

        try {
            const requestBody: any = {
                favoriteLaborItemIds: selectedItemIds,
            };

            if (props.estimateSubsectionId) {
                requestBody.estimateSubsectionId = props.estimateSubsectionId;
            } else if (props.estimateSectionId) {
                requestBody.estimateSectionId = props.estimateSectionId;
            } else {
                requestBody.estimateId = props.estimateId;
            }

            await Api.requestSession({
                command: 'favorites/import_to_estimate',
                json: requestBody,
            });

            props.onConfirm();
        } catch (error) {
            console.error('Failed to import from favorites:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onClose={props.onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('Import from Favorites')}</DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : groups.length === 0 ? (
                    <Box p={3}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            {t('favoritesModal.noGroups')}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ pt: 0 }}>
                        {selectedItemIds.length > 0 && (
                            <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                                {selectedItemIds.length} {t('selected')}
                            </Typography>
                        )}
                        {groups.map((group) => (
                            <Accordion
                                key={group._id}
                                expanded={expandedGroupId === group._id}
                                onChange={handleAccordionChange(group._id)}
                                disableGutters
                                sx={{
                                    '&:before': { display: 'none' },
                                    boxShadow: 'none',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography fontWeight={500}>{group.name}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 1, px: 0 }}>
                                    {loadingGroupId === group._id ? (
                                        <Box display="flex" justifyContent="center" py={2}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : !laborItemsByGroupId[group._id] ? null : laborItemsByGroupId[group._id]
                                          .length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                                            {t('favoritesModal.noWorksInGroup')}
                                        </Typography>
                                    ) : (
                                        <Box sx={{ mt: 1 }}>
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
                                                        field: 'select',
                                                        headerName: '',
                                                        width: 40,
                                                        sortable: false,
                                                        filterable: false,
                                                        renderCell: (cell) => (
                                                            <Checkbox
                                                                size="small"
                                                                checked={selectedItemIds.includes(cell.row._id)}
                                                                onChange={() => handleToggleItem(cell.row._id)}
                                                            />
                                                        ),
                                                    },
                                                    {
                                                        field: 'laborOfferItemName',
                                                        headerName: t('Labor'),
                                                        flex: 1,
                                                        editable: true,
                                                        cellClassName: 'editableCell',
                                                    },
                                                    {
                                                        field: 'unit',
                                                        headerName: t('Unit'),
                                                        width: 80,
                                                        valueGetter: (params: any) =>
                                                            params?.row?.measurementUnitData?.[0]?.representationSymbol ??
                                                            '',
                                                    },
                                                    {
                                                        field: 'quantity',
                                                        headerName: t('Quantity'),
                                                        width: 110,
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
                                                        field: 'materials',
                                                        type: 'actions',
                                                        headerName: t('Materials'),
                                                        width: 90,
                                                        renderCell: (cell) => (
                                                            <Tooltip title={t('Edit materials')}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => openMaterialsDialog(group._id, cell.row)}
                                                                >
                                                                    <ImgElement
                                                                        src="/images/icons/material.svg"
                                                                        sx={{ height: 18 }}
                                                                    />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ),
                                                    },
                                                    {
                                                        field: 'remove',
                                                        type: 'actions',
                                                        headerName: '',
                                                        width: 60,
                                                        renderCell: (cell) => (
                                                            <Tooltip title={t('Remove from favorites')}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleRemoveFromFavorites(group._id, cell.row._id)
                                                                    }
                                                                    disabled={deletingItemId === cell.row._id}
                                                                >
                                                                    {deletingItemId === cell.row._id ? (
                                                                        <CircularProgress size={20} />
                                                                    ) : (
                                                                        <DeleteOutlineIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        ),
                                                    },
                                                ]}
                                                rows={laborItemsByGroupId[group._id]}
                                                getRowId={(row) => row._id}
                                                disableRowSelectionOnClick
                                                processRowUpdate={(newRow, oldRow) => {
                                                    // mimic estimation: commit changes via API and return updated row
                                                    if (
                                                        JSON.stringify({
                                                            name: newRow.laborOfferItemName,
                                                            q: newRow.quantity,
                                                            p: newRow.changableAveragePrice,
                                                        }) ===
                                                        JSON.stringify({
                                                            name: oldRow.laborOfferItemName,
                                                            q: oldRow.quantity,
                                                            p: oldRow.changableAveragePrice,
                                                        })
                                                    ) {
                                                        return oldRow;
                                                    }
                                                    const payload: any = {};
                                                    if (newRow.laborOfferItemName !== oldRow.laborOfferItemName) {
                                                        payload.laborOfferItemName = newRow.laborOfferItemName;
                                                    }
                                                    if (newRow.quantity !== oldRow.quantity) {
                                                        payload.quantity = newRow.quantity;
                                                    }
                                                    if (newRow.changableAveragePrice !== oldRow.changableAveragePrice) {
                                                        payload.changableAveragePrice = newRow.changableAveragePrice;
                                                    }
                                                    if (Object.keys(payload).length === 0) {
                                                        return oldRow;
                                                    }
                                                    return Api.requestSession({
                                                        command: 'favorites/update_labor_item',
                                                        args: { favoriteLaborItemId: newRow._id },
                                                        json: payload,
                                                    })
                                                        .then(() => {
                                                            updateItemLocally(group._id, newRow._id, payload);
                                                            return { ...newRow };
                                                        })
                                                        .catch((error) => {
                                                            console.error('Failed to update favorite labor item:', error);
                                                            return oldRow;
                                                        });
                                                }}
                                                onProcessRowUpdateError={(error) =>
                                                    console.error('Error updating favorite row:', error)
                                                }
                                            />
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={props.onClose} disabled={submitting}>
                    {t('Cancel')}
                </Button>
                <Button
                    onClick={handleImport}
                    variant="contained"
                    disabled={selectedItemIds.length === 0 || submitting || loading}
                >
                    {submitting ? <CircularProgress size={24} /> : t('Add to Estimation')}
                </Button>
            </DialogActions>
            {materialsEditTarget && (
                <FavoriteMaterialsDialog
                    open={true}
                    onClose={() => setMaterialsEditTarget(null)}
                    initialMaterials={
                        (() => {
                            const group = laborItemsByGroupId[materialsEditTarget.groupId];
                            const item = group?.find((it) => it._id === materialsEditTarget.itemId);
                            const mats = item?.materials ?? [];
                            return mats.map((m: any) => ({
                                materialItemId: m.materialItemId,
                                materialOfferId: m.materialOfferId,
                                materialOfferItemName: m.materialOfferItemName ?? '',
                                measurementUnitMongoId: m.measurementUnitMongoId,
                                quantity: m.quantity ?? 0,
                                materialConsumptionNorm: m.materialConsumptionNorm ?? 0,
                                changableAveragePrice: m.changableAveragePrice ?? 0,
                            }));
                        })()
                    }
                    onSave={(materials) => {
                        Api.requestSession({
                            command: 'favorites/update_labor_item',
                            args: { favoriteLaborItemId: materialsEditTarget.itemId },
                            json: { materials },
                        })
                            .then(() => {
                                updateItemLocally(materialsEditTarget.groupId, materialsEditTarget.itemId, {
                                    materials,
                                } as any);
                                setMaterialsEditTarget(null);
                            })
                            .catch((error) => console.error('Failed to update favorite materials:', error));
                    }}
                />
            )}
        </Dialog>
    );
}
