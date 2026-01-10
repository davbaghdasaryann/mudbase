'use client';

import * as FT from '../FormTypes/FormBasicTypes';

import FormFieldContainer from '../FormBody/FormFieldContainer';
import {useFormContext} from '../FormContext/FormContextProvider';

interface SpacerProps extends FT.FieldProps, FT.FormInputGridProps, FT.InputSxProps, FT.DataFieldsProps {}

export function Spacer(props: SpacerProps) {
    if (props.show !== undefined && props.show === false) return null;
    if (props.ngHidden) return null;

    return <FormSpacerBody {...props} />;
}

function FormSpacerBody(props: SpacerProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            &nbsp;
        </FormFieldContainer>
    );
}
