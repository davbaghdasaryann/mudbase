'use client';

import React, { use } from 'react';
import PageContents from '@/components/PageContents';
import { Box, Button, IconButton, MenuItem, SelectChangeEvent, Stack, Typography, Menu, Toolbar, Select } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import * as Api from '@/api';
import { useRouter } from 'next/navigation';
import { useApiFetchMany } from '../../../components/ApiDataFetch';
import AccountSelectionDialog from '../../../components/AccountSelectionDialog';
import { PageButton } from '../../../tsui/Buttons/PageButton';
import { accountActivities } from '../../../tsmudbase/company_activities';
import DataTableComponent from '@/components/DataTableComponent';

export default function DevPageUsers() {
    const { data, error, loading } = useApiFetchMany<Api.ApiUser>({
        api: {
            command: 'pending_users/fetch',
        }
    });

    const mounted = React.useRef(false);
    const [selectAccountType, setSelectAccountType] = React.useState('');
    const [userEditId, setUserEditId] = React.useState<string | null>(null);
    const [userDetailsId, setUserDetailsId] = React.useState<string | null>(null);``
    const [dataRequested, setDataRequested] = React.useState(false);
    const [addUserDialog, setOpenAddUserDialog] = React.useState(false);
    const [openConnectAccountDialog, setOpenConnectAccountDialog] = React.useState(false);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const router = useRouter();
    // const form = F.useForm({type: 'input'});


    const handleChange = (event: SelectChangeEvent) => {
        setSelectAccountType(event.target.value as string);
        
    };
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = (currentCompanyEditId: string) => {
        setUserEditId(currentCompanyEditId);
        setAnchorEl(null);
    };

    const handleRemove = (_id: string) => {
        setAnchorEl(null); // Close the menu
        Api.requestSession<any>({
            //TODO change any to interface
            command: 'dev/delete_user',
            args: { userId: _id },
        })
            .then((devUsers) => {
                console.log(devUsers);
            })
            
        //  setDataRequested(!dataRequested);
    };

    if (!data) {
        return <></>
    }


    return (
        console.log('data', data),
        <PageContents>
            <Toolbar>
                <Button
                    variant='outlined'
                   
                    onClick={() => {
                        router.replace('/dev');
                    }}
                >
                    Return to Developer Mode Main Page
                </Button>
             
            </Toolbar>
 
            <DataTableComponent
                rows={data}
                disableRowSelectionOnClick
                getRowId={(row) => row._id!}
                loading={loading}
                autoPageSize
                sx={{
                    width: '100%',
                    height: 1,
                    flex: 1,
                    flexGrow: 1,
                }}
                columns={[
                    // { field: '_id', headerName: 'User ID', headerAlign: 'left', width: 120 },
                    { field: '_id', headerName: 'UserId', headerAlign: 'left', minWidth: 300, disableColumnMenu:true },
                    { field: 'email', headerName: 'Email', headerAlign: 'left', minWidth: 200, disableColumnMenu:true },
                    { field: 'accountId', headerName: 'Account ID', headerAlign: 'left', minWidth: 200, disableColumnMenu:true },
                    { field: 'firstName', headerName: 'First Name', headerAlign: 'left', minWidth: 200, disableColumnMenu:true },
                    { field: 'lastName', headerName: 'Last Name', headerAlign: 'left', minWidth: 200, disableColumnMenu:true },
                    {
                        field: 'insert_account',
                        headerName: 'Insert Account',
                        headerAlign: 'left',
                        minWidth: 150,
                        renderCell: (cell) => {
                            console.log('cell', cell)
                            return (
                                <PageButton label='Insert Account' onClick={() => { setUserDetailsId(cell.row._id as string) }} />
                            );
                        },
                    },
                    {
                        field: 'select_role',
                        headerName: 'Select Role',
                        headerAlign: 'left',
                        minWidth: 300,
                        renderCell: (cell) => {
                            return (
                                <Select
                                value={ cell.row.role ?? '0'}
                                onChange={handleChange}
                            >
                                        <MenuItem key={'0'} value={'0'}>
                                        Select Role
                                        </MenuItem>

                                {accountActivities.map((type) => {
                                    let accountTypeName = type.name;

                                    for (let key in type) {
                                        if (key === "name") {
                                            accountTypeName = type[key];
                                        }
                                    }

                                    return (
                                        <MenuItem key={type.id} value={type.name}>
                                            {accountTypeName}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            );
                        },
                    },

                    {
                        field: 'info',
                        type: 'actions',
                        headerName: '',
                        width: 80,
                        renderCell: (cell) => {
                            return (
                                <>
                                    <IconButton
                                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                                            // setAccountDetailsId(cell.id as string);
                                            handleClick(event);
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </>
                            );
                        },
                    },
                ]}
            />
          

            {/* <AccountSelectionDialog show={accountDetailsId} onCloseFalse={() => { setOpenConnectAccountDialog(false); }} pendingUserId={} 
            } /> */}
            {userDetailsId && <AccountSelectionDialog onClose={() => { setUserDetailsId(null); }} onConfirm={() => { setDataRequested(false) }}
            />}
        </PageContents>
    );
}
