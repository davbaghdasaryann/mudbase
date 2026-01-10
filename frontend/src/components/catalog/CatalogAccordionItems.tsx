import React, { useEffect, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { EstimateRootAccordionSummary, EstimateSubChildAccordion, EstimateSubChildAccordionDetails } from '@/components/AccordionComponent';
import { AccordionItem, CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';
import { Box, Button, Stack, Typography } from '@mui/material';
import { formatQuantityParens } from '@/components/pages/CatalogAccordion';
import { catalogConvertToFixedString, useCatalogData } from '@/components/catalog/CatalogAccordionDataContext';
import { useTranslation } from 'react-i18next';
import DataTableComponent from '@/components/DataTableComponent';
import Link from 'next/link';
import { GridActionsColDef } from '@mui/x-data-grid-pro';
import { formatDate } from '@/lib/format_date';
import { usePermissions } from '@/api/auth';
import UserPageAddOfferDetailsDialog from '@/app/offers/UserPageAddOfferDetailsDIalog';

interface CatalogAccordionItemsProps {
    catalogType: CatalogType;
    item: AccordionItem;
    searchVal: string;
    filter: CatalogSelectedFiltersDataProps;
    items: AccordionItem[] | null;

    onItemsChange: () => Promise<void>;
}

export default function CatalogAccordionItems(props: CatalogAccordionItemsProps) {
    const ctx = useCatalogData();
    const { t } = useTranslation();
    const { session } = usePermissions();
    const [offerItemIdDialog, setOfferItemIdDialog] = React.useState<string | null>(null);

    // const mounted = React.useRef(false);

    // const parent = props.item;

    // useEffect(() => {
    //     mounted.current = true;
    //     // ctx.mounted(item.fullCode);


    //     return () => {
    //         mounted.current = false;
    //         // ctx.unmounted(item.fullCode);
    //     };
    // }, []);

    if (!props.items) return null;

    console.log('props.items', props.items)

    return (
        <>
            <DataTableComponent
                sx={{ width: '100%' }}
                columns={[
                    {
                        field: 'accountName',
                        headerName: t('Company'),
                        flex: 0.5,
                        disableColumnMenu: true,
                        renderCell: (params) => (
                            <Link href={`/account_view?accountId=${params.row.accountId}`} style={{ textDecoration: 'none' }}>
                                {params.value}
                            </Link>
                        ),
                    },
                    ...(props.catalogType === 'labor'
                        ? [
                            {
                                field: 'laborHours',
                                headerName: t('Labor Hours'),
                                align: 'center',
                                flex: 0.2,
                            } as GridActionsColDef,
                        ]
                        : []),

                    {
                        field: 'measurementUnitRepresentationSymbol',
                        headerName: t('Unit'),
                        align: 'center',
                        flex: 0.15,
                    },
                    {
                        field: 'price',
                        headerName: t('Price'),
                        align: 'center',
                        flex: 0.3,
                    },
                    {
                        field: 'createdAt',
                        type: 'dateTime',
                        headerName: t('Uploaded'),
                        align: 'center',
                        flex: 0.25,
                        valueFormatter: (value) => formatDate(value),
                    },
                    {
                        field: 'updatedAt',
                        type: 'dateTime',
                        headerName: t('Updated'),
                        align: 'center',
                        flex: 0.25,
                        valueFormatter: (value) => formatDate(value),
                    },
                ]}
                rows={props.items ?? []}
                disableRowSelectionOnClick
                getRowId={(row) => row?._id ?? crypto.randomUUID()}
            />


            {ctx.permCanCrtOffr &&
                !props.items?.some(c => c.accountId === session?.user.accountId) && (
                    <Button
                        fullWidth
                        sx={{
                            border: '1px dashed rgba(151, 71, 255)',
                            color: 'rgba(151, 71, 255)',
                            background: 'rgba(151, 71, 255, 0.04)',
                        }}
                        onClick={() => setOfferItemIdDialog(props.item._id)}
                    >
                        {t('Add Offer')}
                    </Button>
                )}


            {offerItemIdDialog && (
                <UserPageAddOfferDetailsDialog
                    catalogType={props.catalogType}
                    offerItemMongoId={offerItemIdDialog}
                    onClose={() => setOfferItemIdDialog(null)}
                    // onConfirm={refreshOffersData}
                    onConfirm={async () => {
                        await props.onItemsChange();
                    }}
                />
            )}
        </>
    );
}
