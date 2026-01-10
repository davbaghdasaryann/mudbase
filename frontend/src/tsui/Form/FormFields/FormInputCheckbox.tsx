'use client';

import React from 'react';

import {Checkbox, FormControlLabel} from '@mui/material';

import * as FT from '../FormTypes/FormBasicTypes';

import FormFieldContainer from '../FormBody/FormFieldContainer';
import {useFormField} from '../FormElements/FormFieldHook';
import {getFormBoolValue} from '../FormBody/FormValue';
import { useFormContext } from '../FormContext/FormContextProvider';

interface FormCheckboxProps extends FT.FieldProps {
    size?: 'sm' | 'md' | 'lg';
    onChange?: (checked: boolean) => void; 
}

export function InputCheckbox(props: FormCheckboxProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    const field = useFormField(props, {
        fieldType: 'checkbox',
    });

    const [checked, setChecked] = React.useState(getFormBoolValue(props.value));

    React.useEffect(() => {
        form.registerField(field);
        return () => {
            form.unregisterField(field);
        };
    }, []);

    const onChange = React.useCallback( async (evt: React.ChangeEvent<HTMLInputElement>) => {
        let value = evt.target.checked;
        field.setValue(value);
        setChecked(value);

        // console.log(field);

        let accepted = await form.processValueEdit(field, value ? '1' : '0');
        field.valueChanged = true;
        // props.onValueChange(value);

        if (props.onChange) {
            props.onChange(value);
        }

    }, []);

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            <FormControlLabel
                label={field.tlabel}
                control={<Checkbox id={props.id} checked={checked} onChange={onChange} />}
            />
        </FormFieldContainer>
    );
}
