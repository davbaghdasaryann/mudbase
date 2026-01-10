'use client';

import * as FT from '../FormTypes/FormBasicTypes';

import FormFieldContainer from '../FormBody/FormFieldContainer';
import {useFormContext} from '../FormContext/FormContextProvider';
import { Divider } from '@mui/material';


interface FormDividerProps extends FT.FieldProps, FT.FormInputGridProps, FT.InputSxProps, FT.DataFieldsProps {

}

export function FormDivider(props: FormDividerProps) {
    if (props.show !== undefined && props.show === false) return null;
    if (props.ngHidden) return null;

    return <FormDividerBody {...props} />;
}

function FormDividerBody(props: FormDividerProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            <Divider/>
        </FormFieldContainer>
    );
}
