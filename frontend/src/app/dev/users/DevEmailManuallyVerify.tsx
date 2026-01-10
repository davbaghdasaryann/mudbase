import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as Api from '@/api';
import * as F from '@/tsui/Form';
import AccountSelectionDialog from '@/components/AccountSelectionDialog';
import { InputFormField } from '../../../tsui/Form/FormElements/FormFieldContext';
import { accountActivities } from '../../../tsmudbase/company_activities';
import { PageSelect } from '../../../tsui/PageSelect';


interface Props {
    onClose: () => void;
}

export default function DevEmailManuallyVerify(props: Props) {
    const form = F.useForm({
        type: 'input',
    });

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return;
        if (!evt.data || Object.keys(evt.data).length === 0) {
            props.onClose()
            return;
        }

        if (evt.data.email) {
            Api.requestSession({
                command: 'dev/move_from_pednings_to_users',
                args: { pendingNotVerifiedUserEmail: evt.data.email }
            }).finally(() => {
                alert('moved')
            });

        }
    }, [])

    return (
        <F.PageFormDialog title='Manually Email Verify' form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>
            <F.InputText xsMax id='email' label={'Enter not email verification passed pending user email'} placeholder={'Enter not email verification passed pending user email'} />
        </F.PageFormDialog>
    );
}
