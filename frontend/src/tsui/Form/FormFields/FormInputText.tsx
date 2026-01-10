'use client';

import React from 'react';
import {SxProps, Theme} from '@mui/material';

import * as FT from '../FormTypes/FormBasicTypes';

import FormFieldContainer from '../FormBody/FormFieldContainer';
import InputTextElement from '../FormElements/FormTextInputComponent';
import {useFormField} from '../FormElements/FormFieldHook';
import InputElement from '../../DomElements/InputElement';
import {useFormContext} from '../FormContext/FormContextProvider';

//
// Linear input fields
//

export interface InputTextMultilineProps {
    minRows?: number;
    maxRows?: number;
}

export interface InputTextProps extends FT.FieldProps {
    type?: FT.InputFieldType;

    placeholder?: string | boolean;
    tplaceholder?: string;
    autocomplete?: FT.AutoCompleteType;
    maxLength?: number;

    onEditButton?: (id: string) => string;
    onChange?: (value: string) => boolean | void;

    multiline?: InputTextMultilineProps | number | boolean;

    isThousandsSeparator?: boolean;

    sx?: SxProps<Theme>;

    // obsolete
    // form?: InputFormContext;
}

export function InputText(props: InputTextProps) {
    if (props.show === false) return null;

    if (props.ngHidden) {
        return (
            <InputElement
                type='text'
                autoComplete='off'
                sx={{
                    visibility: 'hidden',
                    m: 0,
                    p: 0,
                    height: 0,
                    borderWidth: 0,
                    border: 'none',
                }}
            />
        );
    }

    return <InputTextBody {...props} />;
}

function InputTextBody(props: InputTextProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    const field = useFormField(props, {
        fieldType: props.type ?? 'text',
    });

    React.useEffect(() => {
        form.registerField(field);
        return () => {
            form.unregisterField(field);
        };
    }, []);

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            <InputTextElement form={form} formProps={formContext.formProps} field={field} fieldProps={props} value={props.value} />
        </FormFieldContainer>
    );
}
