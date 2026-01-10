'use client';

import React from 'react';
import { Button, IconButton, SelectChangeEvent, SxProps, Theme, Toolbar, useTheme } from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';

import * as Api from '@/api';
import SearchComponent from '../../components/SearchComponent';
import { useApiFetchMany } from '../../components/ApiDataFetch';
import { AccountsPageAccountDetails } from './AccountsPageAccountDetails';
import SpacerComponent from '../../components/SpacerComponent';
import { PageButton } from '../../tsui/Buttons/PageButton';
import CreateAccountDialog from '../../components/AccountCreateDialog';
import DataTableComponent from '../../components/DataTableComponent';
import { useTranslation } from 'react-i18next';
import { confirmDialog } from '@/components/ConfirmationDialog';
import { accountActivities } from '@/tsmudbase/company_activities';
import { PageSelect } from '../../tsui/PageSelect';

export default function ActiveAccountsTab() {
    const [editedAccount, setEditedAccount] = React.useState<Api.ApiAccount | null>(null);
    const [createAccount, setCreateAccount] = React.useState(false);
    const [selectedValueId, setSelectedValueId] = React.useState<string | null>('all');
    const [searchValue, setSearchValue] = React.useState('');
    const [t] = useTranslation();
    const [shouldSearch, setShouldSearch] = React.useState(false);
    // const form = F.useForm({ type: 'input' });
    const [selectedAccountFilter, setSelectedAccountFilter] = React.useState<string | null>('All')




    const apiData = useApiFetchMany<Api.ApiAccount>({
        // api: {
        //     command: 'accounts/fetch_active',
        // },
    });


    const handleSelect = React.useCallback((value) => {
        if (value) {
            setSelectedValueId(value.id);

            setSelectedAccountFilter(value.label);
        } else {
            setSelectedValueId('all');
            setSelectedAccountFilter('All');
        }


        setShouldSearch(true);
    }, []);

    const onSearch = React.useCallback((value) => {
        setSearchValue(value);
        setShouldSearch(true);
    }, []);

    const performSearch = React.useCallback(() => {
        if (searchValue !== undefined || selectedValueId !== undefined) {
            console.log('searchValue', searchValue);
            console.log('selectedValue', selectedValueId);

            apiData.setApi({
                command: 'accounts/fetch_active',
                args: {
                    search: searchValue,
                    select: selectedValueId,
                },
            });
        }
        setShouldSearch(false);
    }, [searchValue, selectedValueId, apiData]);

    React.useEffect(() => {
        if (shouldSearch) {
            performSearch();
        }
    }, [shouldSearch, performSearch]);


    const onIsActiveStatusChange = React.useCallback(async (accountId: string) => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                Api.requestSession<any>({
                    command: 'account/activate_status_change',
                    args: {
                        accountId: accountId,
                        activeStatus: false,
                    },
                }).then((d) => {
                    apiData.setApi({
                        command: 'accounts/fetch_active',
                    });
                });
                // .finally(() => {

                // });
            }
        });
    }, []);






    // if (progIndic) {
    //     return <ProgressIndicator show={progIndic} background='backdrop' />;
    // }


    return (
        <>
            <Toolbar disableGutters sx={{ backgroundColor: 'inherit' }}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />

                <PageSelect
                    sx={{ minWidth: 250 }}
                    value={selectedValueId ?? "All"}
                    label={'Company'}
                    items={accountActivities}
                    onSelected={handleSelect}
                    withAll={true}
                />

                {/* <PageButton label='Add Account' size='large' onClickTrue={setCreateAccount} /> */}
            </Toolbar>

            {/* <ProgressIndicator show={apiData.loading} background='backdrop' /> */}

            <DataTableComponent
                rows={apiData.data}
                autoPageSize={true}
                disableRowSelectionOnClick
                getRowId={(row) => row._id!}
                loading={apiData.loading}
                columns={[
                    // {field: '_id', headerName: 'Account ID', headerAlign: 'left', width: 120},
                    // {field: 'country', headerName: 'Country', headerAlign: 'left', width: 150},
                    // {field: 'region', headerName: 'Region', headerAlign: 'left', width: 150},
                    { field: 'companyName', headerName: t('Company Name'), minWidth: 200, flex: 1 },
                    // {field: 'lawAddress', headerName: 'Legal Address', headerAlign: 'left', minWidth: 250},
                    // {field: 'address', headerName: 'Address', headerAlign: 'left', minWidth: 250},
                    { field: 'companyTin', headerName: t('TIN'), flex: 1 },
                    { field: 'phoneNumber', headerName: t('Phone'), flex: 1 },
                    { field: 'email', headerName: t('Email'), minWidth: 200, flex: 1 },
                    // {field: 'name', headerName: 'First Name', headerAlign: 'left', width: 150},
                    // {field: 'surname', headerName: 'Surname', headerAlign: 'left', width: 150},
                    // {field: 'login', headerName: 'Login', headerAlign: 'left', width: 150},
                    // {field: 'establishDate', headerName: 'Establish Date', headerAlign: 'left', width: 150},
                    // {field: 'website', headerName: 'Website', headerAlign: 'left', minWidth: 200},
                    // {field: 'director', headerName: 'Director', headerAlign: 'left', width: 200},
                    // {field: 'companyInfo', headerName: 'Company Info', headerAlign: 'left', minWidth: 300, flex: 1},
                    {
                        field: 'actions',
                        type: 'actions',
                        headerName: '',
                        // width: 80,
                        renderCell: (cell) => {
                            return (
                                <>
                                    <IconButton onClick={() => setEditedAccount(cell.row)} color='primary'>
                                        <EditIcon />
                                    </IconButton>
                                </>
                            );
                        },
                    }, // width: 600 },
                    {
                        field: 'activate',
                        type: 'actions',
                        headerName: '',
                        flex: 0.5,
                        // width: 80,
                        renderCell: (cell) => {
                            return (
                                <>
                                    <Button onClick={() => onIsActiveStatusChange(cell.row._id)} color='primary'>
                                        {t('DEACTIVATE')}
                                    </Button>
                                </>
                            );
                        },
                    }, // width: 600 },
                ]}
            />

            <AccountsPageAccountDetails
                account={editedAccount}
                onClose={(changed) => {
                    setEditedAccount(null);
                    if (changed) {
                        apiData.loading = true;
                        apiData.invalidate();
                    }
                }}
            />

            <CreateAccountDialog
                show={createAccount}
                onClose={(changed) => {
                    setCreateAccount(false);
                    if (changed) {
                        apiData.loading = true;
                        apiData.invalidate();
                    }
                }}
            />
        </>
    );
}
