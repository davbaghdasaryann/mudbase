'use client';

import React from 'react';

import { IconButton, SelectChangeEvent, TextField, Toolbar, Menu } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import * as Api from '../../../api';
import UserDetailsActions from '@mui/icons-material/Details';
import { useApiFetchMany } from '../../../components/ApiDataFetch';
import SearchComponent from '@/components/SearchComponent';
import DevUserDetailsDialog from './DevUserDetailsDialog';
import DataTableComponent from '@/components/DataTableComponent';
import Delete from '@mui/icons-material/Delete';

import EditIcon from '@mui/icons-material/Edit';
import { PageButton } from '../../../tsui/Buttons/PageButton';
import { confirmDialog } from '../../../components/ConfirmationDialog';
import { useTranslation } from 'react-i18next';
import DevEmailManuallyVerify from '@/app/dev/users/DevEmailManuallyVerify';


export default function UsersPageTab() {
    const { t } = useTranslation();

    const apiData = useApiFetchMany<Api.ApiUser>({
        api: {
            command: 'users/fetch',
        },
    });


    const onSearch = React.useCallback((value) => {
        apiData.setApi({
            command: 'users/fetch',
            args: {
                search: value,
            },
        });
    }, []);





    const [selectType, setSelectType] = React.useState('');
    const handleChange = (event: SelectChangeEvent) => {
        setSelectType(event.target.value as string);
    };

    const [editedUser, setEditUser] = React.useState<Api.ApiUser | null>(null);
    const [openManullyEmailVerifyDialog, setOpenManullyEmailVerifyDialog] = React.useState(false);

    let [userDetailsId, setUserDetailsId] = React.useState<Api.ApiUser | null>(null);


    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = (currentUserEditId: string) => {

        setAnchorEl(null);
    };

    const onEdit = React.useCallback((user: Api.ApiUser) => {
        setEditUser(user);
    }, []);

    const onManuallyEmailVerify = React.useCallback(async () => {
        setOpenManullyEmailVerifyDialog(true);
    }, []);


    const updateAllUsersPermissions = React.useCallback(() => {
        Api.requestSession({
            command: 'dev/all_users_permissions_update',
        }).finally(() => {
            alert('updated')
        });
    }, []);

    const moveFromPendingsToUsers = React.useCallback(async (email: string) => {
        Api.requestSession({
            command: 'dev/move_from_pednings_to_users',
            args: { pendingNotVerifiedUserEmail: email }
        }).finally(() => {
            alert('moved')
        });
    }, []);


    const onRemoveUser = React.useCallback((userId: string) => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {

                Api.requestSession<any>({
                    command: 'dev/delete_user',
                    args: { userId: userId }
                })
                    .then(() => {
                    })
                    .finally(() => {
                    });
            }
        });


    }, [])


    return (<>
        <Toolbar sx={{ backgroundColor: 'inherit' }}>
            <SearchComponent onSearch={onSearch} />
            <PageButton variant='contained' label='All users permissions update' size='large' onClick={updateAllUsersPermissions} />
            <PageButton variant='contained' label='Manually email verify' size='large' onClick={onManuallyEmailVerify} />
            {/* <PageButton variant='contained' label='Move from pendings to users' size='large' onClick={moveFromPendingsToUsers} sx={{ ml: 2 }} /> */}
        </Toolbar>

        <DataTableComponent
            loading={apiData.loading}
            sx={{
                width: '100%',

            }}
            rows={apiData.data}
            autoPageSize={true}
            getRowId={(row) => row._id!}
            disableRowSelectionOnClick
            onRowDoubleClick={(params) => { setEditUser(params.row); }}
            onCellClick={(params, event) => event.stopPropagation()}
            columns={[
                { field: 'email', headerName: 'Email', headerAlign: 'center', minWidth: 240, disableColumnMenu: true },

                { field: 'accountId', headerName: 'Account', headerAlign: 'center', flex: 1, disableColumnMenu: true },
                {
                    field: 'Delete Account',
                    type: 'actions',
                    headerName: 'Delete Account',
                    flex: 1,
                    minWidth: 200,

                    renderCell: (cell) => {
                        return (
                            <>
                                <IconButton onClick={() => { onRemoveUser(cell.row._id) }} color='primary'>
                                    <Delete />
                                </IconButton>
                            </>
                        );
                    },
                },
                {
                    field: 'actions',
                    type: 'actions',
                    headerName: 'Actions',
                    flex: 1,

                    renderCell: (cell) => {

                        return (
                            <>
                                <IconButton onClick={() => onEdit(cell.row)} color='primary'>
                                    <EditIcon />
                                </IconButton>
                            </>
                        );
                    },
                },
            ]}
        />


        <DevUserDetailsDialog
            user={editedUser}
            onClose={(changed) => {
                setEditUser(null);
                if (changed) apiData.invalidate();
            }}
        />



        {userDetailsId && (
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>

            </Menu>
        )}

        {openManullyEmailVerifyDialog && <DevEmailManuallyVerify onClose={() => (setOpenManullyEmailVerifyDialog(false))} />}
    </>
    );
}
