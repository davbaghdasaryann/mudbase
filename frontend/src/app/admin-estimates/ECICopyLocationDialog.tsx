'use client';

import React, {useCallback, useEffect, useState} from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent} from '@mui/material';
import {useTranslation} from 'react-i18next';

import * as Api from 'api';
import ProgressIndicator from '@/tsui/ProgressIndicator';

interface Props {
    estimateId: string;
    estimateTitle: string;
    onClose: () => void;
    onConfirm: () => void;
}

interface Category {
    _id: string;
    code: string;
    name: string;
}

interface Subcategory {
    _id: string;
    code: string;
    name: string;
    categoryId: string;
    categoryFullCode: string;
}

const buildingTypes = [
    {id: 'currentRenovation', label: 'Current Renovation'},
    {id: 'renovation', label: 'Renovation'},
    {id: 'majorRepairs', label: 'Major repairs'},
    {id: 'reconstruction', label: 'Reconstruction'},
    {id: 'reinforcement', label: 'Reinforcement'},
    {id: 'restorationWork', label: 'Restoration Work'},
    {id: 'construction', label: 'Construction'},
];

export default function ECICopyLocationDialog(props: Props) {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(false);
    const [progIndic, setProgIndic] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
    const [selectedBuildingType, setSelectedBuildingType] = useState('');

    // Fetch categories on mount
    useEffect(() => {
        setLoading(true);

        Api.requestSession<Category[]>({
            command: 'eci/fetch_categories',
            args: {searchVal: ''},
        })
            .then((categoriesData) => {
                setCategories(categoriesData);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Fetch subcategories when category is selected
    useEffect(() => {
        if (!selectedCategoryId) {
            setFilteredSubcategories([]);
            return;
        }

        setLoading(true);
        Api.requestSession<Subcategory[]>({
            command: 'eci/fetch_subcategories',
            args: {
                categoryMongoId: selectedCategoryId,
                searchVal: '',
            },
        })
            .then((subcategoriesData) => {
                setFilteredSubcategories(subcategoriesData);
            })
            .finally(() => {
                setLoading(false);
            });

        setSelectedSubcategoryId(''); // Reset subcategory selection
    }, [selectedCategoryId]);

    const handleCategoryChange = useCallback((event: SelectChangeEvent) => {
        setSelectedCategoryId(event.target.value);
    }, []);

    const handleSubcategoryChange = useCallback((event: SelectChangeEvent) => {
        setSelectedSubcategoryId(event.target.value);
    }, []);

    const handleBuildingTypeChange = useCallback((event: SelectChangeEvent) => {
        setSelectedBuildingType(event.target.value);
    }, []);

    const handleSave = useCallback(() => {
        if (!selectedCategoryId || !selectedSubcategoryId || !selectedBuildingType) {
            return;
        }

        setProgIndic(true);

        Api.requestSession({
            command: 'eci/copy_estimate_to_eci',
            args: {
                estimateId: props.estimateId,
                subcategoryId: selectedSubcategoryId,
                buildingType: selectedBuildingType,
            },
        })
            .then(() => {
                props.onConfirm();
            })
            .finally(() => {
                setProgIndic(false);
            });
    }, [props, selectedCategoryId, selectedSubcategoryId, selectedBuildingType]);

    const canSave = selectedCategoryId && selectedSubcategoryId && selectedBuildingType;

    return (
        <>
            <Dialog open={true} onClose={props.onClose} maxWidth='sm' fullWidth>
                <DialogTitle>{t('Copy to Aggregated')}</DialogTitle>

                <DialogContent>
                    <Stack spacing={3} sx={{mt: 2}}>
                        <FormControl fullWidth>
                            <InputLabel>{t('Section')}</InputLabel>
                            <Select value={selectedCategoryId} onChange={handleCategoryChange} label={t('Section')} disabled={loading}>
                                <MenuItem value=''>
                                    <em>{t('Choose section')}</em>
                                </MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat._id} value={cat._id}>
                                        {cat.code} - {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>{t('Subsection')}</InputLabel>
                            <Select value={selectedSubcategoryId} onChange={handleSubcategoryChange} label={t('Subsection')} disabled={loading || !selectedCategoryId}>
                                <MenuItem value=''>
                                    <em>{t('Choose subsection')}</em>
                                </MenuItem>
                                {filteredSubcategories.map((sub) => (
                                    <MenuItem key={sub._id} value={sub._id}>
                                        {sub.categoryFullCode} - {sub.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>{t('Building Type')}</InputLabel>
                            <Select value={selectedBuildingType} onChange={handleBuildingTypeChange} label={t('Building Type')} disabled={loading}>
                                <MenuItem value=''>
                                    <em>{t('Choose building')}</em>
                                </MenuItem>
                                {buildingTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {t(type.label)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={props.onClose}>{t('Cancel')}</Button>
                    <Button onClick={handleSave} variant='contained' disabled={!canSave || progIndic}>
                        {t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ProgressIndicator show={progIndic} background='backdrop' />
        </>
    );
}
