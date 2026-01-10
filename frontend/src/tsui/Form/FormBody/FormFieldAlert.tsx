'use client';

import React from 'react';
import { Alert } from '@mui/material';

import { FormHookInstance, FormMessage } from '../FormContext/FormHookInstance';
import { InputFormField } from '../FormElements/FormFieldContext';
import { FormError } from '../FormTypes';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface FormFieldAlertProps {
    form: FormHookInstance;
    field: InputFormField;
    error?: Error;
}

export default function FormFieldAlert(props: FormFieldAlertProps) {
    const form = props.form;
    const field = props.field;
    if (!field.id) return null;
    if (!props.error) return null;

    // const error = form.fieldErrors.get(field.id);
    // if (!error) return null;


    // if (!form.inputFieldId || form.inputFieldId[0] !== field.id)
    //     return null;

    return <FormFieldAlertBody {...props} />;
}

function FormFieldAlertBody(props: FormFieldAlertProps) {
    // const form = props.form;
    const message = React.useMemo(() => makeAlertMessage(props), [props.error]);

    if (!message) return null;

        return <Alert
            severity='error'
            sx={{
                mb: 1,
                backgroundColor: 'transparent',
            }}
        >
            {message.text}
        </Alert>
}


function makeAlertMessage(props: FormFieldAlertProps): FormMessage | undefined{
    // if (props.error) {
        return {
            text: props.error!.name ?? i18nt(props.error!.message),
            severity: 'error',
        }
    // }

    // return props.form.message;
}
