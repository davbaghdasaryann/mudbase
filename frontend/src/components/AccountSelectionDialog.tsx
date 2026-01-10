'use client';

import React from 'react';

import {IconButton, Stack, Toolbar} from '@mui/material';

import AddBusinessIcon from '@mui/icons-material/AddBusiness';

import * as Api from '@/api';
import * as F from '@/tsui/Form';
import {InputFormField} from '@/tsui/Form/FormElements/FormFieldContext';
import {useApiFetchOne} from '@/components/ApiDataFetch';

import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import SearchComponent from './SearchComponent';
import SpacerComponent from './SpacerComponent';
import {PageButton} from '../tsui/Buttons/PageButton';
import CreateAccountDialog from './AccountCreateDialog';
import { useTranslation } from 'react-i18next';
import DataTableComponent from './DataTableComponent';

interface AccountSelectionDialogProps {
    show?: boolean;
    onClose?: () => void;
    onCloseFalse?: (state: boolean) => void;
    onConfirm: (account: Api.ApiAccount) => void;
}

export default function AccountSelectionDialog(props: AccountSelectionDialogProps) {
    if (props.show === false) return <></>;

    return <AccountSelectionDialogBody {...props} />;
}

function AccountSelectionDialogBody(props: AccountSelectionDialogProps) {
    const form = F.useForm({type: 'update'});

    const [openConfirmationDialog, setOpenConfirmationDialog] = React.useState(false);
    const accountIdRef = React.useRef<string | null>(null);
    const [t] = useTranslation()

    const apiData = useApiFetchOne<Api.ApiAccount>({
        api: {
            command: 'accounts/fetch_active',
        },
    });

    const onSearch = React.useCallback((value: string) => {
        apiData.setApi({
            command: 'accounts/fetch_active',
            args: {
                search: value,
            },
        });
    }, []);

    const [addAccountActive, setAddAccountActive] = React.useState(false);

    // const onSubmit = React.useCallback(() => {
    //     // console.log('props.pendingUserId', props.pendingUserId)
    //     // Api.requestSession<Api.ApiPendingUser>({
    //     //     command: 'pending_user/set_account',
    //     //     args: {
    //     //         pendingUserId: props.pendingUserId,
    //     //         accountId: accountIdRef.current
    //     //     }
    //     // })
    //     //     .then(response => {

    //     //         props.onConfirm();
    //     //         props.onClose();

    //     //     }).catch();

    // }, [])

    return (
        <F.PageFormDialog
            type='panel'
            title='Select Account'
            form={form}
            formContainer='none'
            size='md'
            onClose={props.onClose}
            onCloseFalse={props.onCloseFalse}
        >
            <Stack direction='column' sx={{width: 1}}>
                <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                    <SearchComponent onSearch={onSearch} />
                    <SpacerComponent />
                    <PageButton label='Add Account' size='large' startIcon={<AddBusinessIcon />} onClickTrue={setAddAccountActive} />
                </Toolbar>

                <DataTableComponent
                    rows={Array.isArray(apiData.data) ? apiData.data : []}
                    loading={apiData.loading}
                    // autoPageSize={true}
                    disableRowSelectionOnClick
                    getRowId={(row) => row?._id ?? crypto.randomUUID()}
                    sx={
                        {
                            // width: '100%',
                            // color: "red"
                        }
                    }
                    columns={[
                        {field: 'companyName', headerName: t('Company'), headerAlign: 'center', flex: 0.6, disableColumnMenu:true},
                        {
                            field: 'actions',
                            type: 'actions',
                            headerName: t('Select'),
                            flex: 0.2,
                            renderCell: (cell) => {
                                return (
                                    <>
                                        <IconButton
                                            onClick={() => {
                                                // setOpenConfirmationDialog(true)
                                                accountIdRef.current = cell.row._id as string;
                                                props.onConfirm(cell.row);
                                            }}
                                        >
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    </>
                                );
                            },
                        }, // width: 600 },
                    ]}
                    // onRowDoubleClick={(row) => { setOfferItemEditId(row.id as string); setOfferItemName(row.row.itemName) }}
                />

                {/* {openConfirmationDialog && <ConfirmationDialog
            title='Connect'
            message={`Are you sure you want to connect ${`UserName`} user to this account?`}
            onClose={() => { setOpenConfirmationDialog(false); accountIdRef.current = null }}
            onConfirm={onSubmit} />
        } */}
            </Stack>

            <CreateAccountDialog show={addAccountActive} onClose={() => setAddAccountActive(false)} />
        </F.PageFormDialog>
    );
}
