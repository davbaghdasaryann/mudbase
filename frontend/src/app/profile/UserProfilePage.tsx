'use client';

import React from 'react';

import PageContents from '@/components/PageContents';
import * as Api from '@/api';
import * as F from '@/tsui/Form';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';
import { useApiFetchOne } from '@/components/ApiDataFetch';
import UserProfileChangePasswordDialog from './UserProfileChangePasswordDialog';
import { Box } from '@mui/material';

export default function UserProfilePageContents() {
    const form = F.useForm({ type: 'update-fields' });
    const [changePasswordDialog, setChangePasswordDialog] = React.useState(false);

    const apiData = useApiFetchOne<Api.ApiUser>({
        api: {
            command: 'profile/get',
        },
    });

    const user = apiData.data;

    const onFieldUpdate = React.useCallback(
        async (field: InputFormField) => {

            // let key = field.id!;
            // let value = field.value;
            // console.log(key, value, user);

            // if (key === 'firstName') {
            //     // if (user) {
            //     //     user.firstName = value;
            //     GD.pubsub_.dispatch(GD.profileNameUpdateListenerId, {
            //         firstName: value,
            //     });
            //     // }
            // }

            // if (key === 'lastName') {
            //     if (user) {
            //         user.lastName = value;
            //         GD.pubsub_.dispatch(GD.profileNameUpdateListenerId, user);
            //     }
            // }

            await Api.requestSession<any>({
                command: 'profile/update',
                values: {
                    [field.id!]: field.value,
                },
            });

            // apiData.invalidate();
        },
        [user]
    );

    return (
        <>
            <F.PageForm form={form} size='lg' onFieldUpdate={onFieldUpdate} loading={apiData.loading}>
                <F.InputText id='email' label='Email' value={user?.email} xs={6} readonly />
                <F.Spacer xs={3} />
                <F.FormButton label='Change Password' xs={3} onClickTrue={setChangePasswordDialog} />

                <F.InputText id='firstName' autocomplete='name' label='First Name' value={user?.firstName} xsThird />
                <F.InputText id='middleName' autocomplete='given-name' label='Middle Name' value={user?.middleName} xsThird />
                <F.InputText id='lastName' autocomplete='family-name' label='Last Name' value={user?.lastName} xsThird />

                <F.InputText id='phoneNumber' autocomplete='tel' label='Phone Number' value={user?.phoneNumber} xs={5} />
            </F.PageForm>

            <Box flex={2} sx={{flexGrow: 1}}/>

            <UserProfileChangePasswordDialog show={changePasswordDialog} onCloseFalse={setChangePasswordDialog} />
        </>
    );
}
