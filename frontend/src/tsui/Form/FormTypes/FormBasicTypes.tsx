'use client';

import React from 'react';
import {GridProps, SxProps, Theme} from '@mui/material';

import {FormHookInstance} from '../FormContext/FormHookInstance';
import {FormValue} from '../FormBody/FormValue';
import {InputFormField} from '../FormElements/FormFieldContext';
import { GridSize, ResponsiveStyleValue } from '@mui/system';

export type FormSizeType = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type FormAlignType = 'left' | 'center' | 'right';

export type AutoCompleteType =
    | 'off'
    | 'username'
    | 'email'
    | 'new-password'
    | 'current-password'
    | 'name'
    | 'honorific-prefix'
    | 'given-name'
    | 'additional-name'
    | 'family-name'
    | 'honorific-suffix'
    | 'nickname'
    | 'tel'
    | 'street-address'
    | 'address-line1'
    | 'address-line2'
    | 'address-line3'
    | 'address-level1'
    | 'address-level2'
    | 'address-level3'
    | 'address-level4'
    | 'country'
    | 'country-name'
    | 'postal-code'
    | 'cc-name'
    | 'cc-given-name';

// TODO: needs to remove
export interface FormPropsBase {
    form: FormHookInstance;
    size?: FormSizeType;
    align?: FormAlignType;
}

export interface FormInputGridProps {
    // xs?: number | 'auto' | true; // Grid xs parameter
    xs?: ResponsiveStyleValue<GridSize>;

    xsMax?: boolean;
    xsHalf?: boolean;
    xsThird?: boolean;
    xsThird2?: boolean;
    xsQuarter?: boolean;

    // md?: number;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
}

export interface FieldProps extends FormInputGridProps, InputSxProps, DataFieldsProps {
    show?: boolean;
    id?: string;

    /**
     * @deprecated `form` prop is ignored.
     */
    form?: FormHookInstance;
    
    size?: FormSizeType;
    align?: FormAlignType;

    label?: string;
    tlabel?: string;
    suffix?: string;

    fieldType?: InputFieldType;
    autofocus?: boolean;
    attention?: boolean;
}

export interface FieldParams {
    fieldType: InputFieldType;
    value?: FormValue;
}

export function getFormGridAtts(props: FormInputGridProps, defaultProps?: FormInputGridProps): GridProps {
    let xs = defaultProps?.xs;

    if (props.xs) xs = props.xs;
    else if (props.xsMax) xs = 12;
    else if (props.xsHalf) xs = 6;
    else if (props.xsThird) xs = 4;
    else if (props.xsThird2) xs = 8;
    else if (props.xsQuarter) xs = 3;

    return {
        size: xs,
    };
}

// xs parameters
export interface InputSxProps {
    m?: number; // margin
    mt?: number; // margin top
    ml?: number; // margin left
    mr?: number;
    mb?: number;
    //xs?: number | 'auto' | true;  // Grid xs parameter

    width?: number;
    height?: number;
}

export function getFormSxParams(props: InputSxProps, defaultProps?: InputSxProps) {
    return {
        m: props.m ?? defaultProps?.m,
        mt: props.mt ?? defaultProps?.mt,
        ml: props.ml ?? defaultProps?.ml,
        mr: props.mr ?? defaultProps?.mr,
        mb: props.mb ?? defaultProps?.mb,
        height: props.height ?? defaultProps?.height,
    };
}

export interface DataFieldsProps {
    // initValue?: FormValue | null;
    value?: FormValue | null;  // Initial value
    // updateValue?: FormValue | null;

    required?: boolean;
    validate?: InputValidateType;
    data?: boolean;
    readonly?: boolean;
    displayonly?: boolean;
    ngHidden?: boolean;
}

// export type InputFormDataItem = Record<string, string | number | boolean | Date | string[]>;
export type InputFormDataItem = Record<string, string>;

export class InputFormEvent {
    data: InputFormDataItem = {};
    notData: InputFormDataItem = {};
    fields: Record<string, InputFormField> = {};
    isData() {
        if (!this.data) return false;
        if (Object.keys(this.data).length === 0) return false;
        return true;
    }
}

export type InputFieldType = 'text' | 'select' | 'checkbox' | 'password' | 'date' | 'time' | 'datetime' | 'link';

export type InputValidateType =
    | 'off'
    | 'not-empty'
    | 'integer'
    | 'positive-integer'
    | 'positive-double-number'
    | 'double-number'
    | 'positive-number'
    | 'email'
    | 'password'
    | 'new-password'
    | 'tel';

export type FormTypeT = 'input' | 'update' | 'update-fields' | 'displayonly' | 'readonly';
export type FormContainerType = 'frame' | 'none';
export type FormElementType = 'form' | 'none';
export type FormLayoutType = 'grid' | 'stack' | 'box' | 'none';


