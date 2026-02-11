import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';

import { Stack, Toolbar, Button, Box, Fade, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CatalogRootAccordion from '@/components/catalog/CatalogAccordionRoot';
import { CatalogDataProvider, useCatalogData } from '@/components/catalog/CatalogAccordionDataContext';

import { CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import { PageSelect } from '@/tsui/PageSelect';
import { filtersSelecteWidth } from '@/theme';
import { useApiFetchMany } from '@/components/ApiDataFetch';
import AddOrEditEntityDialog from '@/components/EditAddCategoryDialog';

interface Props {
    catalogType: CatalogType;
    onDataLoaded?: () => void;
}

export default function CatalogAccordionNew({ catalogType, onDataLoaded }: Props) {
    const [searchVal, setSearchVal] = useState('');

    // const selectedFiltersDataRef = useRef<CatalogSelectedFiltersDataProps>({
    //     categoryId: null,
    //     subcategoryId: null,
    //     accountId: null,
    // });
    const [filters, setFilters] = useState<CatalogSelectedFiltersDataProps>({
        categoryId: null,
        subcategoryId: null,
        accountId: null,
        timePeriod: 'all',
    });

    // patch-style updater:
    const handleFiltersChange = useCallback((patch: Partial<CatalogSelectedFiltersDataProps>) => {
        setFilters((f) => ({ ...f, ...patch }));
    }, []);

    return (
        <CatalogDataProvider catalogType={catalogType}>
            <CatalogAccordionBody
                catalogType={catalogType}
                searchVal={searchVal}
                onSearchChange={setSearchVal}
                filter={filters}
                // onFiltersChange={(update) =>
                //     setFilters(current => ({ ...current, ...update }))
                // }
                // onFiltersChange={update => setFilters(current => ({ ...current, ...update }))}
                onFiltersChange={handleFiltersChange}
                onDataLoaded={onDataLoaded}
            />
        </CatalogDataProvider>
    );
}

function CatalogAccordionBody({
    catalogType,
    searchVal,
    filter,
    onFiltersChange,
    onSearchChange,
    onDataLoaded,
}: {
    catalogType: CatalogType;
    searchVal: string;
    onSearchChange: (s: string) => void;
    filter: CatalogSelectedFiltersDataProps;
    onFiltersChange: (patch: Partial<CatalogSelectedFiltersDataProps>) => void;
    onDataLoaded?: () => void;
}) {
    const { items, refreshOpenNodes, dataVersion } = useCatalogData();
    const ctx = useCatalogData();
    const { t } = useTranslation();

    const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const accountsSelectList = useApiFetchMany<Api.ApiAccount>({
        api: catalogType !== 'aggregated' ? {
            command: catalogType === 'labor' ? 'accounts/has_labor_offer' : 'accounts/has_material_offer',
        } : undefined as any,
    });

    useEffect(() => {
        setIsDataLoading(true);
        refreshOpenNodes(catalogType, searchVal, filter);
    }, [
        catalogType,
        searchVal,
        filter.accountId,
        filter.timePeriod,
        refreshOpenNodes,
    ]);

    useEffect(() => {
        // collapse every opened root accordion
        items.forEach((i) => ctx.setExpanded(i.code, false));
    }, [searchVal, filter.accountId, filter.timePeriod]);

    useEffect(() => {
        // Notify parent when data is loaded
        if (items.length > 0) {
            setIsDataLoading(false);
            if (onDataLoaded) {
                onDataLoaded();
            }
        }
    }, [items, onDataLoaded]);

    const handleAccountSelect = useCallback(
        (sel: { id: string } | null) => {
            onFiltersChange({ accountId: sel?.id === 'all' ? null : sel?.id });
        },
        [onFiltersChange]
    );

    const handleTimePeriodSelect = useCallback(
        (sel: { id: string } | null) => {
            if (sel && (sel.id === '6months' || sel.id === '1year' || sel.id === '3years' || sel.id === 'all')) {
                onFiltersChange({ timePeriod: sel.id });
            }
        },
        [onFiltersChange]
    );

    return (
        <>
            <Stack 
                direction={{ xs: 'column', md: 'row' }} 
                spacing={{ xs: 2, md: 0 }}
                sx={{ 
                    mb: 2,
                    width: '100%',
                }}
            >
                <Box sx={{ width: { xs: '100%', md: 'auto' }, flexGrow: { md: 1 } }}>
                    <SearchComponent onSearch={(v) => onSearchChange(v)} />
                </Box>

                {catalogType !== 'aggregated' && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <PageSelect
                            withAll={true}
                            sx={{ minWidth: { xs: '100%', sm: 180, md: filtersSelecteWidth } }}
                            label={t('Company')}
                            value={filter.accountId ?? 'all'}
                            items={
                                accountsSelectList.data
                                    ? accountsSelectList.data
                                        .filter((unit, index, self) => index === self.findIndex((u) => u.companyName === unit.companyName))
                                        .map((unit) => ({
                                            key: unit._id,
                                            id: unit._id,
                                            name: unit.companyName,
                                            label: unit.companyName,
                                        }))
                                    : []
                            }
                            onSelected={handleAccountSelect}
                        />
                    </Stack>
                )}
            </Stack>

            {ctx.permCatEdit && (
                <Box sx={{ py: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddCategoryDialog(true)}
                        size="small"
                    >
                        {t('Add Category')}
                    </Button>
                </Box>
            )}

            {isDataLoading ? (
                <Fade in={isDataLoading} timeout={300}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 400,
                            py: 8,
                        }}
                    >
                        <Stack spacing={3} alignItems="center">
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <CircularProgress
                                    size={80}
                                    thickness={3}
                                    sx={{
                                        color: 'primary.main',
                                        opacity: 0.3,
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        '@keyframes pulse': {
                                            '0%, 100%': {
                                                transform: 'scale(1)',
                                                opacity: 1,
                                            },
                                            '50%': {
                                                transform: 'scale(1.1)',
                                                opacity: 0.8,
                                            },
                                        },
                                    }}
                                >
                                    {catalogType === 'labor' ? (
                                        <EngineeringIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                    ) : catalogType === 'aggregated' ? (
                                        <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                    ) : (
                                        <CategoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                    )}
                                </Box>
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                {t('Loading')} {catalogType === 'labor' ? t('Labor') : catalogType === 'aggregated' ? t('Aggregated') : t('Materials')}...
                            </Typography>
                        </Stack>
                    </Box>
                </Fade>
            ) : (
                <Fade in={!isDataLoading} timeout={400}>
                    <Stack spacing={0} direction='column' sx={{ overflowY: 'auto', pb: 8 }}>
                        {items.map((item) => (
                            <CatalogRootAccordion
                                key={`${item._id}-${filter.timePeriod}-${filter.accountId || 'all'}`}
                                item={item}
                                catalogType={catalogType}
                                searchVal={searchVal}
                                filter={filter}
                            />
                        ))}
                    </Stack>
                </Fade>
            )}

            {showAddCategoryDialog && (
                <AddOrEditEntityDialog
                    entityMongoId={null}
                    entityName={null}
                    entityCode={null}
                    catalogType={catalogType}
                    actionType="add"
                    entityType="category"
                    onClose={() => setShowAddCategoryDialog(false)}
                    onConfirm={async () => {
                        await refreshOpenNodes(catalogType, searchVal, filter);
                        setShowAddCategoryDialog(false);
                    }}
                />
            )}
        </>
    );
}
