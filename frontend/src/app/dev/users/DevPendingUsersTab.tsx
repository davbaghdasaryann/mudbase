'use client';

import React from 'react';

import {IconButton, SelectChangeEvent, TextField, Toolbar, Menu, Button} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import EditIcon from '@mui/icons-material/Edit';

import {useApiFetchMany} from '@/components/ApiDataFetch';
import SearchComponent from '@/components/SearchComponent';
import * as Api from '@/api';
import DevPendingUserDetailsDialog from './DevPendingUserDetailsDialog';
import DataTableComponent from '@/components/DataTableComponent';

export default function PendingUsersPageTab() {
    const apiData = useApiFetchMany<Api.ApiUser>({
        api: {
            command: 'signup/pending_users',
        },
    });

    const onSearch = React.useCallback((value) => {
        apiData.setApi({
            command: 'signup/pending_users',
            args: {
                search: value,
            },
        });
    }, []);

    const [editedUser, setEditUser] = React.useState<Api.ApiUser | null>(null);

    const onEdit = React.useCallback((user: Api.ApiUser) => {
        setEditUser(user);
    }, []);

    return (
        <>
            <Toolbar sx={{backgroundColor: 'inherit'}}>
                <SearchComponent onSearch={onSearch} />
            </Toolbar>

            <DataTableComponent
                loading={apiData.loading}
                sx={{
                    width: '100%',
                    // flexGrow: 1,
                }}
                rows={apiData.data}
                autoPageSize={true}
                getRowId={(row) => row._id!}
                disableRowSelectionOnClick
                onRowDoubleClick={(params) => {
                    setEditUser(params.row);
                }}
                onCellClick={(params, event) => event.stopPropagation()}
                columns={[
                    // {field: '_id', headerName: 'User Id', headerAlign: 'left', width: 80},
                    {field: 'email', headerName: 'Email', headerAlign: 'center', minWidth: 240, disableColumnMenu:true},
                    {field: 'firstName', headerName: 'First Name', headerAlign: 'center', flex: 1, disableColumnMenu:true},
                    // {field: 'middleName', headerName: 'Middle Name', headerAlign: 'left', width: 150},
                    {field: 'lastName', headerName: 'Last Name', headerAlign: 'center', flex: 1, disableColumnMenu:true},
                    {field: 'phoneNumber', headerName: 'Phone', headerAlign: 'center', flex: 1, disableColumnMenu:true},
                    // {field: 'accountId', headerName: 'Account', headerAlign: 'center', flex: 1},
                    {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        flex: 1,
                        // width: 300,
                        renderCell: (cell) => {
                            // console.log(cell);
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

            <DevPendingUserDetailsDialog
                user={editedUser}
                onClose={(changed) => {
                    setEditUser(null);
                    if (changed) apiData.invalidate();
                }}
            />
        </>
    );
}
