'use client';

import React from 'react';

import { IconButton, Toolbar } from '@mui/material';

import { useTranslation, getI18n } from 'react-i18next';

import EditIcon from '@mui/icons-material/Edit';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

import { useApiFetchMany } from '@/components/ApiDataFetch';
import SearchComponent from '@/components/SearchComponent';
import * as Api from '@/api';
import DataTableComponent from '@/components/DataTableComponent';
import SpacerComponent from '@/components/SpacerComponent';
import { PageButton } from '@/tsui/Buttons/PageButton';
import UserInviteDialog from '../../components/UserInviteDialog';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { mainIconColor } from '../../theme';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { confirmDialog } from '../../components/ConfirmationDialog';


export default function PendingUsersPageTab() {
    const { t } = useTranslation();
    const [inviteActive, setInviteActive] = React.useState(false);

    const apiData = useApiFetchMany<Api.ApiPendingUser>({
        api: {
            command: 'pending_users/fetch_invited',
        },
    });

    const onSearch = React.useCallback((value: string) => {
        apiData.setApi({
            command: 'pending_users/fetch_invited',
            args: {
                search: value,
            },
        });
    }, []);

    // Post processing
    React.useEffect(() => {
        if (apiData.loading || !apiData.data)
            return;
        let i18n = getI18n();
        for (let user of apiData.data) {
            user.displayStatus = "Pending";
            if (user.approved) user.displayStatus = "Approved";
            if (user.invited) user.displayStatus = "Invited";

            user.displayStatus = i18n.t(user.displayStatus);

        }
    }, [apiData.loading, apiData.data, t]);

    const [editedUser, setEditedUser] = React.useState<Api.ApiPendingUser | null>(null);

    const onEdit = React.useCallback((user: Api.ApiPendingUser) => {
        setEditedUser(user);
    }, []);



    const onRemove = React.useCallback((invitedPendingUserId: string) => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {

                Api.requestSession<any>({ //TODO change any to interface
                    command: 'signup/cancel_sent_invitation',
                    args: { invitedPendingUserId: invitedPendingUserId }
                })
                    .then(() => {
                        apiData.invalidate();
                    })
                    .finally(() => {
                    });
            }
        });


    }, [])

    return (
        <>
            <Toolbar disableGutters sx={{ backgroundColor: 'inherit' }}>
                <SearchComponent onSearch={onSearch} />
                <SpacerComponent />
                <PageButton variant='contained' label={t('Invite')} size='large' startIcon={<PersonAddAlt1Icon />} onClickTrue={setInviteActive} />
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
                // onRowDoubleClick={(params) => {
                //     setEditedUser(params.row);
                // }}
                onCellClick={(params, event) => event.stopPropagation()}
                columns={[
                    // {field: '_id', headerName: 'User Id', headerAlign: 'left', width: 80},
                    { field: 'email', headerName: t('Email'), headerAlign: 'center', flex: 0.4, minWidth: 260, disableColumnMenu: true },
                    { field: 'firstName', headerName: t('First Name'), headerAlign: 'center', flex: 0.3, disableColumnMenu: true },
                    // {field: 'middleName', headerName: 'Middle Name', headerAlign: 'left', width: 150},
                    { field: 'lastName', headerName: t('Last Name'), headerAlign: 'center', flex: 0.3, disableColumnMenu: true },
                    { field: 'phoneNumber', headerName: t('Phone'), headerAlign: 'center', flex: 0.3, disableColumnMenu: true },
                    // { field: 'displayStatus', headerName: t('Status'), headerAlign: 'center', flex: 0.2, minWidth: 130, align: 'center', disableColumnMenu: true },

                    // {
                    //     field: 'actions',
                    //     type: 'actions',
                    //     headerName: t('Email Verification Status'),
                    //     flex: 0.2,
                    //     minWidth: 30,
                    //     renderCell: (cell) => {

                    //         return (
                    //             <>
                    //                 {cell.row.emailVerified
                    //                     ?
                    //                     <CheckBoxIcon sx={{ color: mainIconColor }} />
                    //                     :
                    //                     <CheckBoxOutlineBlankIcon sx={{ color: 'red' }} />
                    //                 }

                    //             </>
                    //         );
                    //     },
                    // },

                    {
                        field: 'cancelInvitation',
                        type: 'actions',
                        headerName: t('Cancel invitation'),
                        flex: 0.2,
                        minWidth: 30,
                        renderCell: (cell) => {

                            return (
                                <>
                                    {/* {cell.row.emailVerified
                                        ?
                                        <></>
                                        : */}
                                    <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                        onRemove(cell.row._id);
                                    }
                                    }
                                    >
                                        <DeleteForeverIcon />
                                    </IconButton>
                                    {/* } */}

                                </>
                            );
                        },
                    },
                ]}
            />

            {/* <PendingUserDetailsDialog
                user={editedUser}
                onClose={(changed) => {
                    setEditedUser(null);
                    if (changed) apiData.invalidate();
                }}
            /> */}

            <UserInviteDialog
                show={inviteActive}
                onClose={(changed) => {
                    setInviteActive(false);
                    if (changed) apiData.invalidate();
                }}
            />
        </>
    );
}
