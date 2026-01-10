'use client';

import React from 'react';

import { Button, IconButton, Toolbar } from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

import { useTranslation } from 'react-i18next';

import * as Api from '@/api';
import { useApiFetchMany } from '../../components/ApiDataFetch';
import SearchComponent from '../../components/SearchComponent';
import { UsersPageUserDetails } from './UsersPageUserDetails';
import { PageButton } from '@/tsui/Buttons/PageButton';
import SpacerComponent from '@/components/SpacerComponent';
import UserInviteDialog from '../../components/UserInviteDialog';
import DataTableComponent from '@/components/DataTableComponent';
import { useSession } from 'next-auth/react';
import { confirmDialog } from '../../components/ConfirmationDialog';

export default function UsersPageTab() {

    const [editedUser, setEditedUser] = React.useState<Api.ApiUser | null>(null);
    const [inviteActive, setInviteActive] = React.useState(false);

    const [userActivity, setUserActivity] = React.useState<any[]>([]);
    const { t } = useTranslation();
    const apiData = useApiFetchMany<Api.ApiUser>({
        api: {
            command: 'users/fetch',
        },
    });

    const onSearch = React.useCallback((value: string) => {
        apiData.setApi({
            command: 'users/fetch',
            args: {
                search: value,
            },
        });
    }, []);




    // const activityData = React.useCallback(async (userId: string) => {
    //     try {
    //         const response = await Api.requestSession<any>({
    //             command: 'user/account_activity_show',
    //             args: { userId },
    //         });

    //         console.log('User Activity Response:', response);
    //         setUserActivity(response);
    //     } catch (error) {
    //         console.error('Error fetching user activity:', error);
    //     }
    // }, []);


    const onIsActiveStatusChange = React.useCallback(async (userId: string, activeStatus: boolean) => {
        const result = await confirmDialog(t('Are you sure?'));

        if (result.isConfirmed) {
            await Api.requestSession<any>({
                command: 'user/active_status_change',
                args: { userId, activeStatus },
            });

            apiData.setApi({ command: 'users/fetch' });
        }
    }, []);

    

    const handleEditUser = (user: Api.ApiUser) => {
        setEditedUser(user);
        // activityData(user._id!);
    };

    console.log(apiData.data)

    return (
        <>
            <Toolbar disableGutters sx={{ backgroundColor: 'inherit' }}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />
                <PageButton variant='contained' label='Invite' size='large' startIcon={<PersonAddAlt1Icon />} onClickTrue={setInviteActive} />
            </Toolbar>

            <DataTableComponent
                loading={apiData.loading}
                rows={apiData.data}
                // autoPageSize={true}
                getRowId={(row) => row._id!}
                // onRowDoubleClick={(params) => {
                //     setEditedUser(params.row);
                // }}
                columns={[
                    // {field: '_id', headerName: 'User Id', headerAlign: 'left', width: 80},
                    { field: 'companyName', headerName: t('Account'), width: 150, flex: 1 },
                    { field: 'firstName', headerName: t('First Name'), width: 150, flex: 1 },
                    // { field: 'middleName', headerName: t('Middle Name'), width: 150, flex: 1 },
                    { field: 'lastName', headerName: t('Last Name'), width: 150, flex: 1 },
                    { field: 'email', headerName: t('Email'), headerAlign: 'center', minWidth: 240 },
                    { field: 'phoneNumber', headerName: t('Phone'), headerAlign: 'center', width: 150, flex: 1 },
                    {
                        field: 'actions',
                        type: 'actions',
                        // headerName: '',
                        flex: 0.1,
                        // width: 80,
                        renderCell: (cell) => {
                            return (
                                <>
                                    <IconButton onClick={() => handleEditUser(cell.row)} color='primary'>
                                        <EditIcon />
                                    </IconButton>
                                </>
                            );
                        },
                    }, // width: 600 },

                    {
                        field: 'isActive',
                        type: 'actions',
                        // headerName: '',
                        // width: 80,
                        flex: 0.7,
                        renderCell: (cell) => {

                            return (
                                <>
                                    <Button
                                        onClick={() => onIsActiveStatusChange(cell.row._id, !cell.row.isActive)}
                                        color='primary'
                                    >
                                        {cell.row.isActive === true ? t('DEACTIVATE') : t('ACTIVATE')}
                                    </Button>
                                </>
                            );
                        },
                    }, // width: 600 },

                    // {
                    //     field: 'actions',
                    //     type: 'actions',
                    //     headerName: t('Actions'),
                    //     flex: 1,
                    //     // width: 300,
                    //     renderCell: (cell) => {
                    //         // console.log(cell);
                    //         return (
                    //             <>
                    //                 <IconButton onClick={() => setEditedUser(cell.row)} color='primary'>
                    //                     <EditIcon />
                    //                 </IconButton>
                    //             </>
                    //         );
                    //     },
                    // },

                ]}
            />
            {/* </Stack> */}

            {/* {addUserDialog && <AddCompanyDialog comapniesData={users} onClick={handleChange} onClose={() => { setOpenAddUserDialog(false); setDataRequested(false) }} onSelected={key => setUsers(key)} />}


            {/* {userEditId && <AdminPageUserDetails user={userEditId} onClick={handleChange} onClose={() => { setUserEditId(null); setDataRequested(false) }} onSelected={key => setUsers(key)}  />} */}

            {/* {userDetailsId && (
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                    <MenuItem onClick={() => { handleEdit(userDetailsId) }}>Edit</MenuItem>
                    <MenuItem onClick={() => { handleRemove(userDetailsId) }}>Remove</MenuItem>
                </Menu>
            )} */}

            {/* <UsersPageUserDetails
                user={editedUser}
                onClose={(changed) => {
                    setEditedUser(null);
                    if (changed) apiData.invalidate();
                }}
            /> */}
            <UsersPageUserDetails
                user={editedUser}
                userActivity={userActivity}
                onClose={(changed) => {
                    setEditedUser(null);
                    if (changed) apiData.invalidate();
                }}
            />
            <UserInviteDialog show={inviteActive} onClose={(changed) => setInviteActive(false)} />
        </>
    );
}
