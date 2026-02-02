"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Checkbox,
    Box,
    Stack,
    Typography,
    CircularProgress,
    Divider,
} from '@mui/material';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

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
    onClose: () => void;
    onConfirm: () => void;
}

export default function EstimateImportFromFavoritesDialog(props: EstimateImportFromFavoritesDialogProps) {
    const [t] = useTranslation();
    const [groups, setGroups] = useState<FavoriteGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [laborItems, setLaborItems] = useState<FavoriteLaborItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch favorite groups
        Api.requestSession<FavoriteGroup[]>({
            command: 'favorites/fetch_groups',
        })
            .then((fetchedGroups) => {
                setGroups(fetchedGroups);
                // Auto-select first group if available
                if (fetchedGroups.length > 0) {
                    handleGroupClick(fetchedGroups[0]._id);
                }
            })
            .catch((error) => {
                console.error('Failed to fetch favorite groups:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleGroupClick = (groupId: string) => {
        setSelectedGroupId(groupId);
        setLoadingItems(true);
        setSelectedItemIds([]);

        // Fetch labor items for this group
        Api.requestSession<FavoriteLaborItem[]>({
            command: 'favorites/fetch_labor_items',
            args: { favoriteGroupId: groupId },
        })
            .then((items) => {
                setLaborItems(items);
            })
            .catch((error) => {
                console.error('Failed to fetch labor items:', error);
            })
            .finally(() => {
                setLoadingItems(false);
            });
    };

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const handleImport = async () => {
        if (selectedItemIds.length === 0) return;

        setSubmitting(true);

        try {
            await Api.requestSession({
                command: 'favorites/import_to_estimate',
                json: {
                    favoriteLaborItemIds: selectedItemIds,
                    estimateId: props.estimateId,
                },
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
                            {t('No favorite groups found. Create a group by adding items to favorites first.')}
                        </Typography>
                    </Box>
                ) : (
                    <Box display="flex" gap={2} minHeight={400}>
                        {/* Groups List */}
                        <Box flex={1} sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                                {t('Groups')}
                            </Typography>
                            <List sx={{ pt: 0 }}>
                                {groups.map((group) => (
                                    <ListItemButton
                                        key={group._id}
                                        selected={selectedGroupId === group._id}
                                        onClick={() => handleGroupClick(group._id)}
                                    >
                                        <ListItemText primary={group.name} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Box>

                        {/* Labor Items List */}
                        <Box flex={2}>
                            <Typography variant="subtitle2" gutterBottom sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                                {t('Works')}
                                {selectedItemIds.length > 0 && ` (${selectedItemIds.length} ${t('selected')})`}
                            </Typography>
                            {loadingItems ? (
                                <Box display="flex" justifyContent="center" p={3}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : laborItems.length === 0 ? (
                                <Box p={3}>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        {t('No works in this group')}
                                    </Typography>
                                </Box>
                            ) : (
                                <List sx={{ pt: 0 }}>
                                    {laborItems.map((item) => {
                                        const unit = item.measurementUnitData?.[0]?.representationSymbol || '';
                                        const materialCount = item.materials?.length || 0;

                                        return (
                                            <React.Fragment key={item._id}>
                                                <ListItem disablePadding>
                                                    <ListItemButton onClick={() => handleToggleItem(item._id)} dense>
                                                        <Checkbox
                                                            checked={selectedItemIds.includes(item._id)}
                                                            tabIndex={-1}
                                                            disableRipple
                                                        />
                                                        <ListItemText
                                                            primary={item.laborOfferItemName || t('Unnamed Work')}
                                                            secondary={
                                                                <Stack spacing={0.5}>
                                                                    <Typography variant="caption" component="span">
                                                                        {t('Quantity')}: {item.quantity} {unit} | {t('Price')}: {item.changableAveragePrice}
                                                                    </Typography>
                                                                    {materialCount > 0 && (
                                                                        <Typography variant="caption" component="span" color="primary">
                                                                            {materialCount} {t('material(s) attached')}
                                                                        </Typography>
                                                                    )}
                                                                </Stack>
                                                            }
                                                            secondaryTypographyProps={{ component: 'div' }}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                                <Divider />
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            )}
                        </Box>
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
        </Dialog>
    );
}
