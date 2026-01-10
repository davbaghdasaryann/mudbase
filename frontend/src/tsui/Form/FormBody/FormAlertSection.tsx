import React from 'react';

import {Alert} from '@mui/material';

import {ErrorPropType, FormProps} from '../FormTypes';
import {useFormContext} from '../FormContext/FormContextProvider';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface FormAlertSectionProps {
    formProps: FormProps;
    formError: Error | undefined | null;
}

export default function FormAlertSection(props: FormAlertSectionProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    const error = props.formError ?? props.formProps.error ?? form.error;

    if (!error) return null;

    return <FormAlertSectionBody formProps={props.formProps} error={error} />;
}

function FormAlertSectionBody({formProps, error}: {formProps: FormProps; error: ErrorPropType}) {
    const text = React.useMemo(() => makeFormAlertMessageText(error), [error]);

    if (!text) return null;

    return (
        <Alert
            severity='error'
            sx={{
                mb: 1,
                backgroundColor: 'transparent',
            }}
        >
            {text}
        </Alert>
    );
}

function makeFormAlertMessageText(error: ErrorPropType) {
    if (!error) return null;

    if (typeof error === 'string') return i18nt(error);

    if (error instanceof Error) {
        return i18nt(error.message);
        // return error.name ?? i18nt(error.message);
        // return formProps.error.message;
    }

    return i18nt(error.message);
}
