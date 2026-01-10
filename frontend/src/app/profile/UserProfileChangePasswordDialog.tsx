import React from 'react';

import * as F from 'tsui/Form';
import * as Api from 'api';
import { raiseError } from '@/lib/app_errors';

interface Props {
    show: boolean;
    onCloseFalse: (b: boolean) => void;
}

export default function UserProfileChangePasswordDialog(props: Props) {
    const form = F.useForm({type: 'input'});

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;
        if (!evt.data || Object.keys(evt.data).length === 0) {
            //TODO everywhere by this way
            return;
        }

        console.log('Submit', evt.data);
        if (evt.data) {
            if (evt.data.newPassword !== evt.data.confirmPassword) {
                raiseError('Passwords do not match');
            } else {
                await Api.requestSession<any>({
                    command: 'profile/change_password',
                    // args: {
                    //     currentPassword: 'currentPassword',
                    //     newPassword: 'newPassword',
                    // },
                    json: evt.data,
                });
                props.onCloseFalse(false);
            }
        }
    }, []);

    return (
        <F.PageFormDialog ignoreDataChecking show={props.show} title='Change Password' form={form} size='xs' onSubmit={onSubmit} onCloseFalse={props.onCloseFalse}>
            <F.InputText label='Current Password' id='currentPassword' type='password' xsMax />
            <F.InputText label='Change Password' id='newPassword' type='password' xsMax />
            <F.InputText label='Confirm Password' id='confirmPassword' type='password' xsMax />
        </F.PageFormDialog>
    );
}
