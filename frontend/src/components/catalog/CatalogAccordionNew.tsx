import React, {useState, useRef, useEffect, useCallback} from 'react';
import * as Api from 'api';

import {Stack, Toolbar} from '@mui/material';
import CatalogRootAccordion from '@/components/catalog/CatalogAccordionRoot';
import {CatalogDataProvider, useCatalogData} from '@/components/catalog/CatalogAccordionDataContext';

import {CatalogSelectedFiltersDataProps, CatalogType} from '@/components/catalog/CatalogAccordionTypes';
import SearchComponent from '@/components/SearchComponent';
import SpacerComponent from '@/components/SpacerComponent';
import {PageSelect} from '@/tsui/PageSelect';
import {filtersSelecteWidth} from '@/theme';
import {useApiFetchMany} from '@/components/ApiDataFetch';

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
    const {items, refreshOpenNodes} = useCatalogData();
    const ctx = useCatalogData();

    const categorySelectList = useApiFetchMany<Api.ApiLaborCategory | Api.ApiMaterialCategory>({
        api: {
            command: catalogType === 'labor' ? `labor/fetch_categories` : `material/fetch_categories`,
        },
    });

    const subcategorySelectList = useApiFetchMany<Api.ApiLaborSubcategory | Api.ApiMaterialSubcategory>({
        defer: true,
        api: {
            command: catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
        },
    });

    const accountsSelectList = useApiFetchMany<Api.ApiAccount>({
        api: {
            command: catalogType === 'labor' ? 'accounts/has_labor_offer' : 'accounts/has_material_offer',
        },
    });

    useEffect(() => {
        if (filter.categoryId) {
            subcategorySelectList.setApi({
                command: catalogType === 'labor' ? 'labor/fetch_subcategories' : 'material/fetch_subcategories',
                args: {categoryMongoId: filter.categoryId, searchVal},
            });

            accountsSelectList.invalidate();
        }
    }, [catalogType, filter.categoryId, searchVal]);

    useEffect(() => {
        refreshOpenNodes(catalogType, searchVal, filter);
    }, [
        catalogType,
        searchVal,
        filter.categoryId,
        filter.subcategoryId,
        filter.accountId,
        // refreshOpenNodes,
    ]);

    useEffect(() => {
        // collapse every opened root accordion
        items.forEach((i) => ctx.setExpanded(i.code, false));
    }, [searchVal, filter.categoryId, filter.subcategoryId, filter.accountId]);

    // When category changes:
    const handleCategorySelect = useCallback(
        (sel: {id: string} | null) => {
            onFiltersChange({
                categoryId: sel?.id === 'all' ? null : sel?.id,
                subcategoryId: null, // clear child when parent changes
            });
        },
        [onFiltersChange]
    );

    const handleSubcategorySelect = useCallback(
        (sel: {id: string} | null) => {
            onFiltersChange({subcategoryId: sel?.id === 'all' ? null : sel?.id});
        },
        [onFiltersChange]
    );

    const handleAccountSelect = useCallback(
        (sel: {id: string} | null) => {
            onFiltersChange({accountId: sel?.id === 'all' ? null : sel?.id});
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
                        withAll={true}
                        sx={{minWidth: filtersSelecteWidth}}
                        label='Category'
                        value={filter.categoryId ?? 'all'}
                        items={
                            categorySelectList.data
                                ? categorySelectList.data
                                      .filter((unit, index, self) => index === self.findIndex((u) => u.name === unit.name))
                                      .map((unit) => ({
                                          key: unit._id,
                                          id: unit._id,
                                          name: unit.name,
                                          label: unit.name,
                                      }))
                                : []
                        }
                        onSelected={handleCategorySelect}
                    />

                    <PageSelect
                        withAll={true}
                        sx={{minWidth: filtersSelecteWidth}}
                        label='Subcategory'
                        value={filter.subcategoryId ?? 'all'}
                        readonly={!filter.categoryId}
                        items={
                            subcategorySelectList.data
                                ? subcategorySelectList.data
                                      .filter((unit, index, self) => index === self.findIndex((u) => u.name === unit.name))
                                      .map((unit) => ({
                                          key: unit._id,
                                          id: unit._id,
                                          name: unit.name,
                                          label: unit.name,
                                      }))
                                : []
                        }
                        onSelected={handleSubcategorySelect}
                    />

                    <PageSelect
                        withAll={true}
                        sx={{minWidth: filtersSelecteWidth}}
                        label='Company'
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
            <Stack spacing={0} direction='column' sx={{overflowY: 'auto'}}>
                {items.map((item) => (
                    <CatalogRootAccordion key={item._id} item={item} catalogType={catalogType} searchVal={searchVal} filter={filter} />
                ))}
            </Stack>
        </>
    );
}
