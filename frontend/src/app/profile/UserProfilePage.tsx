'use client';

import React from 'react';
import { Avatar, Box } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

import * as Api from '@/api';
import * as F from '@/tsui/Form';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';
import { useApiFetchOne } from '@/components/ApiDataFetch';
import UserProfileChangePasswordDialog from './UserProfileChangePasswordDialog';

const BRAND = '#00abbe';

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: '#fff',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,171,190,0.35)' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND, borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
};

export default function UserProfilePageContents() {
    const form = F.useForm({ type: 'update-fields' });
    const [changePasswordDialog, setChangePasswordDialog] = React.useState(false);

    const apiData = useApiFetchOne<Api.ApiUser>({
        api: { command: 'profile/get' },
    });

    const user = apiData.data;

    const onFieldUpdate = React.useCallback(
        async (field: InputFormField) => {
            await Api.requestSession<any>({
                command: 'profile/update',
                values: { [field.id!]: field.value },
            });
        },
        [user]
    );

    const initials = user
        ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
        : '';

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', py: 4 }}>
                {/* Avatar / logo */}
                <Avatar
                    sx={{
                        width: 88, height: 88,
                        bgcolor: BRAND,
                        fontSize: 32, fontWeight: 700,
                        mb: 3,
                        boxShadow: '0 4px 20px rgba(0,171,190,0.28)',
                    }}
                >
                    {initials || <PersonOutlineIcon sx={{ fontSize: 44 }} />}
                </Avatar>

                {/* Portrait card */}
                <Box sx={{
                    width: '100%',
                    maxWidth: 420,
                    backgroundColor: '#fff',
                    borderRadius: '14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    p: { xs: 2, sm: 3 },
                }}>
                    <F.PageForm
                        form={form}
                        formContainer='none'
                        onFieldUpdate={onFieldUpdate}
                        loading={apiData.loading}
                        slotProps={{ textField: { sx: fieldSx } }}
                    >
                        <F.InputText id='email' label='Email' value={user?.email} xs={12} readonly />
                        <F.InputText id='firstName' autocomplete='name' label='First Name' value={user?.firstName} xs={12} />
                        <F.InputText id='middleName' autocomplete='given-name' label='Middle Name' value={user?.middleName} xs={12} />
                        <F.InputText id='lastName' autocomplete='family-name' label='Last Name' value={user?.lastName} xs={12} />
                        <F.InputText id='phoneNumber' autocomplete='tel' label='Phone Number' value={user?.phoneNumber} xs={12} />
                        <F.FormButton
                            label='Change Password'
                            xs={12}
                            onClickTrue={setChangePasswordDialog}
                            variant='outlined'
                            buttonSx={{
                                borderRadius: '8px',
                                borderColor: BRAND,
                                color: BRAND,
                                width: '100%',
                                '&:hover': { borderColor: BRAND, backgroundColor: 'rgba(0,171,190,0.06)' },
                            }}
                        />
                    </F.PageForm>
                </Box>
            </Box>

            <UserProfileChangePasswordDialog show={changePasswordDialog} onCloseFalse={setChangePasswordDialog} />
        </>
    );
}
