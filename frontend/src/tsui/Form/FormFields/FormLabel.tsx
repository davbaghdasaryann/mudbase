'use client';

import * as FT from '../FormTypes/FormBasicTypes';

import FormFieldContainer from '../FormBody/FormFieldContainer';
import { Typography } from '@mui/material';
import { useFormContext } from '../FormContext/FormContextProvider';
import { useSafeTranslation } from '@/tsui/I18n/SafeTranslation';


interface FormLabelProps extends FT.FieldProps {
}


export function Label(props: FormLabelProps) {

    if (props.show !== undefined && props.show === false) {
        return <></>;
    }

    if (props.ngHidden) {
        return (<></>);
    }

    return <FormLabelBody {...props}/>

}

function FormLabelBody(props: FormLabelProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    const {t} = useSafeTranslation();

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            <Typography sx={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
            }}>{t(props.label ?? '')}</Typography>
        </FormFieldContainer>
    );
}
