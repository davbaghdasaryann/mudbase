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

export default function PendingUsersPageTab() {
    const { t } = useTranslation();

    const apiData = useApiFetchMany<Api.ApiPendingUser>({
        api: {
            command: 'signup/pending_users',
        },
    });

    const onSearch = React.useCallback((value: string) => {
        apiData.setApi({
            command: 'signup/pending_users',
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

    const [inviteActive, setInviteActive] = React.useState(false);

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
                    { field: 'displayStatus', headerName: t('Status'), headerAlign: 'center', flex: 0.2, minWidth: 130, align: 'center', disableColumnMenu: true },

                    // {
                    //     field: 'actions',
                    //     type: 'actions',
                    //     headerName: t('Actions'),
                    //     flex: 0.2,
                    //     minWidth: 30,
                    //     renderCell: (cell) => {
                    //         // console.log(cell);
                    //         return (
                    //             <>
                    //                 <IconButton onClick={() => onEdit(cell.row)} color='primary'>
                    //                     <EditIcon />
                    //                 </IconButton>
                    //             </>
                    //         );
                    //     },
                    // },
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
