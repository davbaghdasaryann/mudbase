import React, { useEffect, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { EstimateRootAccordionSummary, EstimateSubChildAccordion, EstimateSubChildAccordionDetails } from '@/components/AccordionComponent';
import { AccordionItem, CatalogSelectedFiltersDataProps, CatalogType } from '@/components/catalog/CatalogAccordionTypes';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { formatQuantityParens } from '@/components/pages/CatalogAccordion';
import { catalogConvertToFixedString, useCatalogData } from '@/components/catalog/CatalogAccordionDataContext';
import { useTranslation } from 'react-i18next';
import DataTableComponent from '@/components/DataTableComponent';
import Link from 'next/link';
import { GridActionsColDef } from '@mui/x-data-grid-pro';
import { formatDate } from '@/lib/format_date';
import { usePermissions } from '@/api/auth';
import * as Api from '@/api';
import { confirmDialog } from '@/components/ConfirmationDialog';

interface CatalogAccordionItemsProps {
    catalogType: CatalogType;
    item: AccordionItem;
    searchVal: string;
    filter: CatalogSelectedFiltersDataProps;
    items: AccordionItem[] | null;

    onItemsChange: () => Promise<void>;
}

export default function CatalogAccordionItems(props: CatalogAccordionItemsProps) {
    const { t } = useTranslation();
    const { permissionsSet } = usePermissions();
    const isAdmin = permissionsSet == null ? true : permissionsSet.has('CAT_EDT');

    const handleDeleteOffer = async (offerId: string) => {
        const confirmed = await confirmDialog(t('Are you sure you want to delete this offer?'), t('Delete Offer'));
        if (!confirmed) return;
        const command = props.catalogType === 'labor' ? 'labor/delete_offer' : 'material/delete_offer';
        await Api.requestSession({ command, args: { offerId } });
        await props.onItemsChange();
    };

    if (!props.items) return null;

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
                    ...(isAdmin ? [{
                        field: 'deleteOffer',
                        type: 'actions' as const,
                        headerName: '',
                        width: 48,
                        renderCell: (cell: any) => (
                            <IconButton size="small" onClick={() => handleDeleteOffer(cell.row._id)} sx={{ color: '#e57373' }}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        ),
                    }] : []),
                ]}
                rows={props.items ?? []}
                disableRowSelectionOnClick
                getRowId={(row) => row?._id ?? crypto.randomUUID()}
            />
        </>
    );
}
