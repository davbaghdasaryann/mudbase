'use client';

import React from 'react';
import { Toolbar } from '@mui/material';
import PageContents from '@/components/PageContents';
import SearchComponent from '@/components/SearchComponent';
import DataTableComponent from '@/components/DataTableComponent';
import { useTranslation } from 'react-i18next';

export default function PaymentsPage() {
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');

    const columns = [
        { field: 'no',               headerName: t('No.'),               width: 70 },
        { field: 'companyName',      headerName: t('Company Name'),       flex: 1, minWidth: 230 },
        { field: 'paymentDate',      headerName: t('Payment Date'),       flex: 1, minWidth: 130 },
        { field: 'packageName',      headerName: t('Package Name'),       flex: 1, minWidth: 140 },
        { field: 'packageDuration',  headerName: t('Package Duration'),   flex: 1, minWidth: 150 },
        { field: 'expirationDate',   headerName: t('Expiration Date'),    flex: 1, minWidth: 140 },
        { field: 'price',            headerName: t('Price'),              flex: 1, minWidth: 100 },
    ];

    return (
        <PageContents title='Payments'>
            <Toolbar disableGutters sx={{ px: 2, backgroundColor: 'inherit' }}>
                <SearchComponent onSearch={setSearch} />
            </Toolbar>

            <DataTableComponent
                rows={[]}
                columns={columns}
                getRowId={(row: any) => row.no}
                disableRowSelectionOnClick
                localeText={{ noRowsLabel: '-' }}
            />
        </PageContents>
    );
}
