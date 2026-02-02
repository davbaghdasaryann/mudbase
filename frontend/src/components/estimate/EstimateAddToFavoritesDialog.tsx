"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Box,
    Stack,
    Typography,
    CircularProgress,
} from '@mui/material';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

interface FavoriteGroup {
    _id: string;
    name: string;
    createdAt: Date;
}

interface EstimateAddToFavoritesDialogProps {
    selectedLaborIds: string[];
    onClose: () => void;
    onConfirm: () => void;
}

export default function EstimateAddToFavoritesDialog(props: EstimateAddToFavoritesDialogProps) {
    const [t] = useTranslation();
    const [groups, setGroups] = useState<FavoriteGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [creatingNewGroup, setCreatingNewGroup] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch existing favorite groups
        Api.requestSession<FavoriteGroup[]>({
            command: 'favorites/fetch_groups',
        })
            .then((fetchedGroups) => {
                setGroups(fetchedGroups);
                // If there are groups, select the first one by default
                if (fetchedGroups.length > 0) {
                    setSelectedGroupId(fetchedGroups[0]._id);
                } else {
                    // If no groups, enable new group creation
                    setCreatingNewGroup(true);
                }
            })
            .catch((error) => {
                console.error('Failed to fetch favorite groups:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true);

        try {
            let groupIdToUse = selectedGroupId;

            // If creating a new group, create it first
            if (creatingNewGroup && newGroupName.trim()) {
                const newGroup = await Api.requestSession<FavoriteGroup>({
                    command: 'favorites/create_group',
                    args: { name: newGroupName.trim() },
                });
                groupIdToUse = newGroup._id;
            }

            // Add selected labor items to the group
            await Api.requestSession({
                command: 'favorites/add_labor_items',
                args: { favoriteGroupId: groupIdToUse },
                json: { estimatedLaborIds: props.selectedLaborIds },
            });

            props.onConfirm();
        } catch (error) {
            console.error('Failed to add to favorites:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (creatingNewGroup) {
            return newGroupName.trim() !== '';
        }
        return selectedGroupId !== '';
    };

    return (
        <Dialog open={true} onClose={props.onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('Add to Favorites')}</DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        <Typography variant="body2" color="text.secondary">
                            {t('Adding')} {props.selectedLaborIds.length} {t('work(s) to favorites')}
                        </Typography>

                        {groups.length > 0 && !creatingNewGroup && (
                            <FormControl component="fieldset">
                                <FormLabel component="legend">{t('Select Group')}</FormLabel>
                                <RadioGroup value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                                    {groups.map((group) => (
                                        <FormControlLabel key={group._id} value={group._id} control={<Radio />} label={group.name} />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        )}

                        {groups.length > 0 && !creatingNewGroup && (
                            <Button variant="outlined" onClick={() => setCreatingNewGroup(true)}>
                                {t('Create New Group')}
                            </Button>
                        )}

                        {creatingNewGroup && (
                            <Box>
                                <TextField
                                    fullWidth
                                    label={t('New Group Name')}
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder={t('Enter group name')}
                                    autoFocus
                                />
                                {groups.length > 0 && (
                                    <Button sx={{ mt: 1 }} variant="text" size="small" onClick={() => setCreatingNewGroup(false)}>
                                        {t('Cancel')}
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={props.onClose} disabled={submitting}>
                    {t('Cancel')}
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit() || submitting || loading}>
                    {submitting ? <CircularProgress size={24} /> : t('Add to Favorites')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
