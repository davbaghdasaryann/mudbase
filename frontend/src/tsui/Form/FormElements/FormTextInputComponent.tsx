import React, { useCallback, useEffect, useRef, useState } from 'react';

import {IconButton, InputAdornment, Link, SxProps, TextField, TextFieldProps, Theme, useTheme} from '@mui/material';

import * as CSS from 'csstype';

import {InputTextProps} from '../FormFields/FormInputText';
import {InputFormField} from './FormFieldContext';
import FormFieldEditContainer from './FormFieldEditContainer';
import {formatDate} from '../../UiUtil/DateFormat';

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {parseThousandsSeparator} from '../../../tslib/parse';
import {FormHookInstance} from '../FormContext/FormHookInstance';
import {FormProps} from '../FormTypes';
import FormFieldAlert from '../FormBody/FormFieldAlert';
import {FormValue} from '../FormBody/FormValue';
import {combineSx, combineSxFlat} from '@/tsui/Mui/SxPropsUtil';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface InputTextElementProps {
    form: FormHookInstance;
    formProps: FormProps;
    field: InputFormField;
    fieldProps: InputTextProps;
    value?: FormValue | null;
}

export default function InputTextElement(props: InputTextElementProps) {
    const form = props.form;
    const field = props.field;
    const fieldProps = props.fieldProps;

    const theme = useTheme();

    const [value, setValue] = useState<string | undefined | null>(makeParamValue(props));
    const [cst, setCst] = useState(updateTextFieldState(theme, props));
    const [passwordSecond, setPasswordSecond] = useState(false);

    // TODO: work better with value dependency and value param.
    // make universal value class and get string value from it.

    React.useEffect(() => {
        const field = props.field;

        field.updateLabel(fieldProps);

        let v = makeParamValue(props);

        if (fieldProps.isThousandsSeparator && v) {
            v = parseThousandsSeparator(Number(v));
        }

        if (field.suffix && v) {
            v = stripSuffix(v, field.suffix);
        }

        field.setValue(v);
        setValue(v);

        setCst(updateTextFieldState(theme, props));
    }, []);


    useEffect(() => {
        let v = makePropValue(props, fieldProps.value);

        if (fieldProps.isThousandsSeparator && v) {
            v = parseThousandsSeparator(Number(v));
        }

        if (field.suffix && v) {
            v = stripSuffix(v, field.suffix);
        }

        field.setValue(v);
        setValue(v);


        if (field.value !== field.origValue)
            props.field.valueChanged = true;

    }, [props.fieldProps.value]);

    const onValueChange = useCallback((evt) => {
        let v = evt.target.value;

        if (props.fieldProps.suffix) {
            v = v.replace(/@/g, '');
        }

        const field = props.field;

        if (!field.passValidation(v)) return;

        if (props.form.isDisable) {
            props.form.clearDisable();
        }

        //This transforms Armenian . this to this .
        if (field.validate === 'positive-double-number' || field.validate === 'double-number') {
            v = v
                .split('')
                .map((ch) => (ch.charCodeAt(0) === 8228 ? String.fromCharCode(46) : ch))
                .join('');

            // for (let i = 0; i < v.length; i++) {
            //     console.log(`Character: '${v[i]}', Code: ${v.charCodeAt(i)}`);
            // }

            if (!field.passValidation(v)) return;

            if (props.form.isDisable) {
                props.form.clearDisable();
            }
        }

        if (fieldProps.isThousandsSeparator && v) {
            v = parseThousandsSeparator(v);
        }

        field.setValue(v);
        setValue(v);

        props.fieldProps.onChange?.(v);

        props.field.valueChanged = true;
        setCst(updateTextFieldState(theme, props));
    }, []);

    if (cst.readonly) {
        if (fieldProps.type === 'link') {
            if (!value) {
                return <TextField {...cst.textFieldProps} value='' />;
            }

            const linkHref = /^https?:\/\//.test(value) ? value : `https://${value}`;

            return (
                <TextField
                    {...cst.textFieldProps}
                    value=''
                    slotProps={{
                        input: {
                            readOnly: true,
                            sx: {pointerEvents: 'none'},
                            startAdornment: (
                                <InputAdornment position='start' sx={{pointerEvents: 'auto'}}>
                                    <Link href={linkHref} target='_blank' rel='noopener noreferrer' underline='hover' sx={{pointerEvents: 'auto'}}>
                                        {value}
                                    </Link>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            );
        }

        return <TextField {...cst.textFieldProps} value={value} />;
    }

    if (form.formType === 'update-fields') {
        return (
            <FormFieldEditContainer form={form} field={field} value={value ?? undefined} onValueChange={(v) => setValue(v)}>
                <TextField {...cst.textFieldProps} value={value} slotProps={{input: {autoComplete: fieldProps.autocomplete}}} />
            </FormFieldEditContainer>
        );
    }

    if (fieldProps.type === 'password') {
        return (
            <>
                <TextField
                    {...cst.textFieldProps}
                    value={value}
                    onChange={onValueChange}
                    type={passwordSecond ? 'text' : 'password'}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton onClick={() => setPasswordSecond(!passwordSecond)}>
                                        {passwordSecond ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <FormFieldAlert form={form} field={field} error={field.error} />
            </>
        );
    }

    return (
        <>
            <TextField {...cst.textFieldProps} value={value} onChange={onValueChange} />
            <FormFieldAlert form={form} field={field} error={field.error} />
        </>
    );
}

type InputColorType = 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
type InputSize = 'medium' | 'small';

interface TextComponentState {
    inputType: string;
    readonly: boolean;

    textFieldProps: TextFieldProps;
}

function updateTextFieldState(theme: Theme, props: InputTextElementProps): TextComponentState {
    const form = props.form;
    const formProps = props.formProps;
    const field = props.field;
    const fieldProps = props.fieldProps;

    const displayonly = form.formType === 'displayonly' || fieldProps.displayonly === true;
    const readonly = displayonly || fieldProps.readonly === true || form.formType === 'readonly';

    const inputReadonly = readonly || form.formType === 'update-fields';

    let changed = readonly ? false : props.field.valueChanged; //props.field.value !== props.field.origValue

    let borderColor: InputColorType | undefined = undefined;
    //let textColor = 'text.primary'
    let textColor: string | undefined;

    if (inputReadonly) {
        borderColor = 'secondary';
        textColor = 'text.secondary'; // 'text.disabled'
    } else {
        if (changed) {
            borderColor = 'success';
        }
    }

    if (fieldProps.attention === true) {
        borderColor = 'error';
    }

    let htmlInputType = 'text';

    switch (fieldProps.type) {
        case 'checkbox':
            htmlInputType = 'checkbox';
            break;
        case 'password':
            htmlInputType = 'password';
            break;
        case 'date':
            htmlInputType = 'date';
            break;
        case 'time':
            htmlInputType = 'time';
            break;
        case 'datetime':
            htmlInputType = 'datetime-local';
            break;
        default:
            break;
    }

    let size: InputSize = fieldProps.size === 'sm' ? 'small' : 'medium';

    let label = props.field.tlabel;
    if (label === undefined) {
        label = '';
    }

    if (!inputReadonly && props.field.required) label += ' *';

    let border: CSS.Property.Border | number | undefined = undefined;
    if (displayonly && theme?.tsui?.form?.textFieldDisplayBorder) {
        border = theme?.tsui?.form?.textFieldDisplayBorder;
    }

    let sx: SxProps = {
        '& label': {paddingLeft: theme?.tsui?.form?.textFieldPaddingLeft},

        '& input': {
            //paddingLeft: 3,
        },

        '& fieldset': {paddingLeft: theme?.tsui?.form?.textFieldPaddingLeft, borderRadius: theme?.tsui?.form?.textFieldBorderRadius, border: border},

        // '& -webkit-autofill': {
        //     //'-webkit-box-shadow': '0 0 0 100px #000 inset',
        //     //'-webkit-box-shadow': `0 0 0 100px #222 inset`,
        //     // WebkitBoxShadow: `0 0 0 100px #222 inset`,
        //     // //'-webkit-text-fill-color': '#fff',
        //     // WebKitTextFillColor: '#eee',

        //     WebkitBoxShadow: '0 0 0 1000px white inset',
        //     WebkitTextFillColor: 'red',
        //     //WebKitTextFillColor: 'red',

        //     // backgroundColor: 'red',
        //     // color: 'yellow',

        //     borderRadius: theme?.tsui?.form?.textFieldBorderRadius,
        //     borderWidth: 0,
        //     // borderStyle: 'solid',
        //     // borderColor: 'darkorange',
        //     borderStyle: 'none',
        //     borderColor: 'none',
        //     // borderColor: 'red',
        // },

        // '& input:-webkit-autofill:focus': {
        //     backgroundColor: 'white',
        // },
    };

    // if (props.fieldProps.sx) {
    //     sx = combineSxFlat(sx, props.fieldProps.sx);
    //     //sx = { ...sx, ...props.fieldProps.sx };
    // }

    let combinedSx = combineSx(formProps.slotProps?.textField?.sx, props.fieldProps?.sx, sx);

    // if (displayonly) {
    //     sx['& fieldset'].border =
    // }

    let tp: TextFieldProps = {
        id: field.id,
        name: field.id,
        label: label,

        type: htmlInputType,
        variant: 'outlined',

        fullWidth: true,

        size: size,

        autoComplete: fieldProps.autocomplete ?? 'off',

        error: fieldProps.attention,
        sx: combinedSx,

        inputProps: {
            readOnly: inputReadonly,
            maxLength: fieldProps.maxLength,

            // sx: {
            //     '& input:-webkit-autofill': {
            //         //'-webkit-box-shadow': '0 0 0 100px #000 inset',
            //         //'-webkit-box-shadow': `0 0 0 100px #222 inset`,
            //         // WebkitBoxShadow: `0 0 0 100px #222 inset`,
            //         // //'-webkit-text-fill-color': '#fff',
            //         // WebKitTextFillColor: '#eee',

            //         WebkitBoxShadow: '0 0 0 1000px white inset',
            //         WebkitTextFillColor: 'black',
            //         //WebKitTextFillColor: 'red',

            //         // backgroundColor: 'red',
            //         // color: 'yellow',

            //         borderRadius: 4, //theme?.tsui?.form?.textFieldBorderRadius,
            //         borderWidth: 2,
            //         // borderStyle: 'solid',
            //         // borderColor: 'darkorange',
            //         borderStyle: 'none',
            //         borderColor: 'none',
            //         // borderColor: 'red',
            //     },
            // },
        },

        InputLabelProps: {shrink: true},
    };

    if (fieldProps.suffix) {
        tp.InputProps = {
            ...(tp.InputProps ?? {}),
            endAdornment: (
                <InputAdornment position='end' sx={{pointerEvents: 'none'}}>
                    {fieldProps.suffix}
                </InputAdornment>
            ),
        };
    }

    if (borderColor) tp.color = borderColor;

    if (fieldProps.multiline !== undefined) {
        //console.debug(props.multiline)
        const defaultRows = 5;

        switch (typeof fieldProps.multiline) {
            case 'number':
                if (fieldProps.multiline > 0) {
                    tp.multiline = true;
                    tp.minRows = fieldProps.multiline;
                }
                break;
            case 'boolean':
                if (fieldProps.multiline === true) {
                    tp.multiline = true;
                    tp.minRows = defaultRows;
                }
                break;
            case 'object':
                tp.multiline = true;
                tp.minRows = fieldProps.multiline.minRows ?? defaultRows;
                tp.maxRows = fieldProps.multiline.maxRows;
                break;
            default:
                break;
        }
    }

    if (readonly) {
        tp.sx!['& .MuiInputBase-input'] = {color: textColor};

        //tp.inputProps!.readOnly = true
    } else {
        // if (inputReadonly) {
        //     //if (!tp.inputProps) tp.inputProps = {}
        //     tp.inputProps!.readOnly = true
        // }

        if (!inputReadonly) {
            if (fieldProps.autofocus === true) {
                tp.autoFocus = true;
            }
        }

        tp.placeholder = makePlaceholder(props);
        tp.focused = changed || fieldProps.autofocus;
    }

    if (tp.id) {
        // let fieldError = props.form.fieldErrors.get(tp.id);
        // if (fieldError)
        //     tp.error = true;
        // if (props.form.inputFieldId) {
        //     for (let i of props.form.inputFieldId) {
        //         if (tp.id === i) {
        //             tp.error = true;
        //         }
        //     }
        // }
        // if (props.form.inputFieldId === fieldProps.id) {
        //     tp.error = true;
        // }
    }

    return {
        inputType: htmlInputType,
        readonly: readonly,

        textFieldProps: tp,
    };
}

function makeParamValue(props: InputTextElementProps): string | undefined | null {
    const field = props.field;
    const fieldProps = props.fieldProps;
    if (field.value === undefined || field.value === null) return '';

    if (typeof field.value === 'string') return field.value;
    if (typeof field.value === 'boolean') return field.value ? 'Yes' : 'No';

    return formatDate(field.value, {type: fieldProps.type});
}

function makePropValue(props: InputTextElementProps, value: FormValue | undefined | null) {
    const field = props.field;
    const fieldProps = props.fieldProps;
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'function') return value(field.id);
    if (Array.isArray(value)) return value.join(',');

    return formatDate(value, {type: fieldProps.type});
}

function makePlaceholder(props: InputTextElementProps): string | undefined {
    const field = props.field;
    const fieldProps = props.fieldProps;
    if (fieldProps.placeholder === false) return undefined;

    if (fieldProps.tplaceholder !== undefined) return fieldProps.tplaceholder;

    if (fieldProps.placeholder === undefined) return undefined;

    if (fieldProps.placeholder === true) {
        let field = props.field;
        let label = field.tlabel;

        return i18nt('Enter') + ' ' + label;
    }

    return i18nt(fieldProps.placeholder);
}

function stripSuffix(str: string, suffix: string): string {
    if (!suffix) return str;
    return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
}
