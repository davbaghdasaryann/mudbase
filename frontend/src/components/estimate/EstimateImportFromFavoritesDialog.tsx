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
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
        <Dialog open={true} onClose={props.onClose} maxWidth="sm" fullWidth>
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
                                        <List dense disablePadding sx={{ width: '100%' }}>
                                            {laborItemsByGroupId[group._id].map((item) => {
                                                const unit =
                                                    item.measurementUnitData?.[0]?.representationSymbol || '';
                                                const materialCount = item.materials?.length || 0;

                                                return (
                                                    <React.Fragment key={item._id}>
                                                        <ListItem disablePadding>
                                                            <ListItemButton
                                                                onClick={() => handleToggleItem(item._id)}
                                                                dense
                                                            >
                                                                <Checkbox
                                                                    checked={selectedItemIds.includes(item._id)}
                                                                    tabIndex={-1}
                                                                    disableRipple
                                                                    size="small"
                                                                />
                                                                <ListItemText
                                                                    primary={item.laborOfferItemName || t('Unnamed Work')}
                                                                    secondary={
                                                                        <Stack spacing={0.5}>
                                                                            <Typography
                                                                                variant="caption"
                                                                                component="span"
                                                                            >
                                                                                {t('Quantity')}: {item.quantity}{' '}
                                                                                {unit} | {t('Price')}:{' '}
                                                                                {item.changableAveragePrice}
                                                                            </Typography>
                                                                            {materialCount > 0 && (
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    component="span"
                                                                                    color="primary"
                                                                                >
                                                                                    {materialCount}{' '}
                                                                                    {t('material(s) attached')}
                                                                                </Typography>
                                                                            )}
                                                                        </Stack>
                                                                    }
                                                                    secondaryTypographyProps={{ component: 'div' }}
                                                                />
                                                            </ListItemButton>
                                                        </ListItem>
                                                        <Divider component="li" />
                                                    </React.Fragment>
                                                );
                                            })}
                                        </List>
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
        </Dialog>
    );
}
