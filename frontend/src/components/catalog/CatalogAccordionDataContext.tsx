import React, { useCallback, useEffect, useRef, useState } from 'react';

import { usePermissions } from '@/api/auth';

import { AccordionItem, CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';

import * as Api from 'api';
import * as LaborsApi from 'api/labor';
import * as OffersApi from 'api/offer';
import * as MaterialsApi from 'api/material';
import { LaborCategoryDisplayData, LaborItemDisplayData, LaborSubcategoryDisplayData } from '@/data/labor_display_data';
import { MaterialCategoryDisplayData, MaterialItemDisplayData, MaterialSubcategoryDisplayData } from '@/data/material_display_data';
import { LaborOfferDisplayData, MaterialOfferDisplayData } from '@/data/offer_display_data';

interface GlobalCatalogAccordionData {
    permCatEdit: boolean;
    permCanCrtOffr: boolean;
    isSignedIn: boolean;
}

export interface CatalogContextValue extends GlobalCatalogAccordionData {
    // loaded: boolean;
    // loading: boolean;
    // load: () => Promise<void>;
    mounted: (id: string) => void;
    unmounted: (id: string) => void;
    isExpanded: (id: string) => boolean;
    setExpanded: (id: string, expanded: boolean) => void;
    items: AccordionItem[];
    dataVersion: number;

    fetchData: (
        parentId: string,
        level: number,
        catalogType: CatalogType,
        searchVal: string,
        selectedFiltersData: CatalogSelectedFiltersDataProps
    ) => Promise<any>;

    refreshOpenNodes: (
        catalogType: CatalogType,
        searchVal: string,
        filters: CatalogSelectedFiltersDataProps
    ) => Promise<void>

    expandNode: (
        parentId: string,
        level: number,
        catalogType: CatalogType,
        searchVal: string,
        filters: CatalogSelectedFiltersDataProps
    ) => Promise<void>;
}

const CatalogDataContext = React.createContext<CatalogContextValue | undefined>(undefined);

interface CatalogDataProviderProps {
    catalogType: CatalogType;
}

// export function CatalogDataProvider({ children }: { children: React.ReactNode }) {
export function CatalogDataProvider({
    catalogType,
    children,
}: React.PropsWithChildren<CatalogDataProviderProps>) {
    const { session, status, permissionsSet } = usePermissions();
    const [items, setItems] = useState<AccordionItem[]>([]);
    const [dataVersion, setDataVersion] = useState(0);

    const expandedIdsRef = useRef(new Set<string>());


    useEffect(() => {
        let mounted = true;
        (async () => {
            if (catalogType === 'labor') {
                const cats = await Api.requestSession<LaborsApi.ApiLaborCategory[]>({
                    command: 'labor/fetch_categories',
                });
                if (!mounted) return;

                const mapped: AccordionItem[] = cats.map(cat => {
                    const D = new LaborCategoryDisplayData(cat);
                    return {
                        _id: D._id,
                        code: D.code,
                        name: D.name,
                        label: D.name,
                        childrenQuantity: D.childrenQuantity,
                        children: [] as AccordionItem[],
                    };
                });

                setItems(mapped);
            } else {
                const cats = await Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
                    command: 'material/fetch_categories',
                });
                if (!mounted) return;

                const mapped: AccordionItem[] = cats.map((cat) => {
                    const D = new MaterialCategoryDisplayData(cat);
                    return {
                        _id: D._id,
                        code: D.code,
                        label: D.name,
                        name: D.name,
                        childrenQuantity: D.childrenQuantity,
                        children: [],
                    };
                });
                setItems(mapped);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [catalogType]);
    function isExpanded(id: string) {
        return expandedIdsRef.current.has(id);
    }


    const setExpanded = (id: string, expanded: boolean) => {
        if (expanded) {
            expandedIdsRef.current.add(id);

            return;
        }

        for (let currentId of expandedIdsRef.current) {
            if (currentId.startsWith(id)) {
                expandedIdsRef.current.delete(currentId);
            }
        }

        expandedIdsRef.current.delete(id);

    };



    const refreshOpenNodes = useCallback(
        async (
            catalogType: CatalogType,
            searchVal: string,
            filters: CatalogSelectedFiltersDataProps
        ) => {
            let rootCats: AccordionItem[];
            if (catalogType === 'labor') {
                const cats = await Api.requestSession<LaborsApi.ApiLaborCategory[]>({
                    command: 'labor/fetch_categories',
                    args: { searchVal },
                    json: filters,
                });
                rootCats = cats.map(cat => {
                    const D = new LaborCategoryDisplayData(cat);
                    return {
                        _id: D._id,
                        code: D.code,
                        name: D.name,
                        label: D.name,
                        childrenQuantity: D.childrenQuantity,
                        children: [],
                    };
                });
            } else {
                const cats = await Api.requestSession<MaterialsApi.ApiMaterialCategory[]>({
                    command: 'material/fetch_categories',
                    args: { searchVal },
                    json: filters,
                });
                rootCats = cats.map(cat => {
                    const D = new MaterialCategoryDisplayData(cat);
                    return {
                        _id: D._id,
                        code: D.code,
                        name: D.name,
                        label: D.name,
                        childrenQuantity: D.childrenQuantity,
                        children: [],
                    };
                });
            }

            let newTree = rootCats;

            function findNode(tree: AccordionItem[], code: string): AccordionItem | undefined {
                for (let n of tree) {
                    if (n.code === code) return n;
                    if (n.children) {
                        const found = findNode(n.children, code);
                        if (found) return found;
                    }
                }
                return undefined
            }

            for (let code of expandedIdsRef.current) {
                const node = findNode(newTree, code);
                if (!node) continue;
                const level = code.split('.').length;

                const kids = await catalogFetchData(
                    node._id,
                    level + 1,
                    catalogType,
                    searchVal,
                    filters
                );
                node.children = kids as AccordionItem[];
            }

            console.log('newTree', newTree)

            setItems([...newTree]);
            setDataVersion(v => v + 1);
        },
        []
    );

    function updateNestedChildren(
        tree: AccordionItem[],
        parentId: string,
        newChildren: AccordionItem[]
    ): AccordionItem[] {
        return tree.map(node => {
            if (node._id === parentId) {
                return { ...node, children: newChildren };
            }
            if (node.children) {
                return { ...node, children: updateNestedChildren(node.children, parentId, newChildren) };
            }
            return node;
        });
    }

    const expandNode = useCallback(
        async (
            parentId: string,
            level: number,
            catalogType: CatalogType,
            searchVal: string,
            filters: CatalogSelectedFiltersDataProps
        ) => {
            const kids = await catalogFetchData(parentId, level, catalogType, searchVal, filters) as AccordionItem[];
            setItems(old => updateNestedChildren(old, parentId, kids));
        },
        []
    );


    const canCreateOffer =
        !!session?.user &&
        (catalogType === 'labor'
            ? permissionsSet.has('OFF_CRT_LBR')
            : permissionsSet.has('OFF_CRT_MTRL'));

    const value: CatalogContextValue = {
        permCatEdit: !!session?.user && permissionsSet.has('CAT_EDT'),
        permCanCrtOffr: canCreateOffer,
        isSignedIn: !!session?.user,
        mounted: (id: string) => { },
        unmounted: (id: string) => { },
        isExpanded: isExpanded,
        setExpanded: setExpanded,
        fetchData: catalogFetchData,

        expandNode: expandNode,

        refreshOpenNodes: refreshOpenNodes,

        items,
        dataVersion
    };

    return <CatalogDataContext.Provider value={value}>{children}</CatalogDataContext.Provider>;
}

export function useCatalogData(): CatalogContextValue {
    const ctx = React.useContext(CatalogDataContext);
    if (!ctx) throw new Error('useGlobalData must be inside DataProvider');
    return ctx;
}

export const catalogFetchData = async (
    parentId: string,
    level: number,
    catalogType: 'labor' | 'material',
    searchVal: string,
    selectedFiltersData: CatalogSelectedFiltersDataProps
) => {
    return new Promise<any[]>((resolve) => {
        if (level === 2) {
            if (catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborSubcategory[]>({
                    command: `labor/fetch_subcategories`,
                    args: { categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((laborSubcategoriesResData) => {
                    let laborSubcategoriesData: LaborSubcategoryDisplayData[] = [];

                    for (let laborSubcat of laborSubcategoriesResData) {
                        laborSubcategoriesData.push(new LaborSubcategoryDisplayData(laborSubcat));
                    }

                    resolve(laborSubcategoriesData);
                });
            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialSubcategory[]>({
                    command: `material/fetch_subcategories`,
                    args: { categoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((materialSubcategoriesResData) => {
                    let materialSubcategoriesData: MaterialSubcategoryDisplayData[] = [];

                    for (let materialSubcat of materialSubcategoriesResData) {
                        materialSubcategoriesData.push(new MaterialSubcategoryDisplayData(materialSubcat));
                    }
                    resolve(materialSubcategoriesData);
                });
            }
        } else if (level === 3) {
            if (catalogType === 'labor') {
                Api.requestSession<LaborsApi.ApiLaborItems[]>({
                    command: 'labor/fetch_items_with_average_price',
                    args: { subcategoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((laborItemsResData) => {
                    let laborItemsData: LaborItemDisplayData[] = [];

                    for (let laborItem of laborItemsResData) {
                        laborItemsData.push(new LaborItemDisplayData(laborItem));
                    }
                    console.log('laborItemsData', laborItemsData);
                    resolve(laborItemsData);
                });
            } else if (catalogType === 'material') {
                Api.requestSession<MaterialsApi.ApiMaterialItems[]>({
                    command: 'material/fetch_items_with_average_price',
                    args: { subcategoryMongoId: parentId, searchVal: searchVal },
                    json: selectedFiltersData,
                }).then((materialItemsResData) => {
                    let materialItemsData: MaterialItemDisplayData[] = [];

                    for (let materialItem of materialItemsResData) {
                        materialItemsData.push(new MaterialItemDisplayData(materialItem));
                    }

                    resolve(materialItemsData);
                });
            }
        } else if (level === 4) {
            if (catalogType === 'labor') {
                Api.requestSession<OffersApi.ApiLaborOffer[]>({
                    command: `labor/fetch_offers`,
                    args: { searchVal: 'empty', laborItemId: parentId },
                }).then((laborOffersResData) => {
                    let laborOffersData: LaborOfferDisplayData[] = [];

                    for (let laborOffer of laborOffersResData) {
                        laborOffersData.push(new LaborOfferDisplayData(laborOffer));
                    }

                    resolve(laborOffersData);
                });
            } else if (catalogType === 'material') {
                Api.requestSession<OffersApi.ApiMaterialOffer[]>({
                    command: `material/fetch_offers`,
                    args: { searchVal: 'empty', materialItemId: parentId },
                }).then((materialOffersResData) => {
                    let materialOffersData: MaterialOfferDisplayData[] = [];

                    for (let materialOffer of materialOffersResData) {
                        materialOffersData.push(new MaterialOfferDisplayData(materialOffer));
                    }

                    resolve(materialOffersData);
                });
            }
        }
    });
};

export function catalogConvertToTruncatedString(input: string | number): string {
    return String(Math.trunc(Number(input)));
}

export function catalogConvertToFixedString(input: string | number): string {
    return Number(input).toFixed(0);
}

export function findNodeByFullCode(
    tree: AccordionItem[],
    fullCode: string
): AccordionItem | undefined {
    console.log('tree', tree)
    for (const node of tree) {
        // every AccordionItem has a fullCode field:
        if (node.fullCode === fullCode) return node;

        if (node.children) {
            const found = findNodeByFullCode(node.children, fullCode);
            if (found) return found;
        }
    }
    return undefined;
}


export function findByKey(
    tree: AccordionItem[],
    key: string
): AccordionItem | undefined {
    for (const node of tree) {
        // match a category by code,
        // a subcategory by categoryFullCode,
        // or an item by fullCode:
        if (
            node.code === key ||
            node.categoryFullCode === key ||
            node.fullCode === key
        ) {
            return node;
        }
        if (node.children) {
            const found = findByKey(node.children, key);
            if (found) return found;
        }
    }
    return undefined;
}
