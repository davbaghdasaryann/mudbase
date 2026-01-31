import React, {useState, useRef, useEffect, useCallback} from 'react';
import * as Api from 'api';
import {useTranslation} from 'react-i18next';

import {Stack, Toolbar, Button, Box} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CatalogRootAccordion from '@/components/catalog/CatalogAccordionRoot';
import {CatalogDataProvider, useCatalogData} from '@/components/catalog/CatalogAccordionDataContext';

import {CatalogSelectedFiltersDataProps, CatalogType} from '@/components/catalog/CatalogAccordionTypes';
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import {PageSelect} from '@/tsui/PageSelect';
import {filtersSelecteWidth} from '@/theme';
import {useApiFetchMany} from '@/components/ApiDataFetch';
import AddOrEditEntityDialog from '@/components/EditAddCategoryDialog';

interface Props {
    catalogType: CatalogType;
}

export default function CatalogAccordionNew({catalogType}: Props) {
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
        timePeriod: '1year',
    });

    // patch-style updater:
    const handleFiltersChange = useCallback((patch: Partial<CatalogSelectedFiltersDataProps>) => {
        setFilters((f) => ({...f, ...patch}));
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
}: {
    catalogType: CatalogType;
    searchVal: string;
    onSearchChange: (s: string) => void;
    filter: CatalogSelectedFiltersDataProps;
    onFiltersChange: (patch: Partial<CatalogSelectedFiltersDataProps>) => void;
}) {
    const {items, refreshOpenNodes, dataVersion} = useCatalogData();
    const ctx = useCatalogData();
    const {t} = useTranslation();

    const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

    const accountsSelectList = useApiFetchMany<Api.ApiAccount>({
        api: {
            command: catalogType === 'labor' ? 'accounts/has_labor_offer' : 'accounts/has_material_offer',
        },
    });

    useEffect(() => {
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

    const handleAccountSelect = useCallback(
        (sel: {id: string} | null) => {
            onFiltersChange({accountId: sel?.id === 'all' ? null : sel?.id});
        },
        [onFiltersChange]
    );

    const handleTimePeriodSelect = useCallback(
        (sel: {id: string} | null) => {
            if (sel && (sel.id === '6months' || sel.id === '1year' || sel.id === '3years')) {
                onFiltersChange({timePeriod: sel.id});
            }
        },
        [onFiltersChange]
    );

    return (
        <>
            <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                <SearchComponent onSearch={(v) => onSearchChange(v)} />
                <SpacerComponent />

                <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} alignItems='center'>
                    <PageSelect
                        withAll={false}
                        sx={{minWidth: filtersSelecteWidth}}
                        label={t('Time Period')}
                        value={filter.timePeriod}
                        items={[
                            {key: '6months', id: '6months', name: t('6 Months'), label: t('6 Months')},
                            {key: '1year', id: '1year', name: t('1 Year'), label: t('1 Year')},
                            {key: '3years', id: '3years', name: t('3 Years'), label: t('3 Years')},
                        ]}
                        onSelected={handleTimePeriodSelect}
                    />

                    <PageSelect
                        withAll={true}
                        sx={{minWidth: filtersSelecteWidth}}
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
            </Toolbar>

            {ctx.permCatEdit && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddCategoryDialog(true)}
                    >
                        {t('Add Category')}
                    </Button>
                </Box>
            )}

            <Stack spacing={0} direction='column' sx={{overflowY: 'auto'}}>
                {items.map((item) => (
                    <CatalogRootAccordion
                        key={`${item._id}-${filter.timePeriod}-${filter.accountId || 'all'}`}
                        item={item}
                        catalogType={catalogType}
                        searchVal={searchVal}
                        filter={filter}
                        dataVersion={dataVersion}
                    />
                ))}
            </Stack>

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
