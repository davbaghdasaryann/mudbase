import React from 'react';

import * as FT from '../FormTypes/FormBasicTypes';
import { InputFormField } from './FormFieldContext';

// function initFormField(props: FT.FieldProps, params: FT.FieldParams) {
//     return props.form.registerField(props, params);
// }

export function useFormField(props: FT.FieldProps, params: FT.FieldParams) {
    // const fieldRef = React.useRef(initFormField(props, params));
    const fieldRef = React.useRef(new InputFormField(props, params));

    return fieldRef.current;
}
