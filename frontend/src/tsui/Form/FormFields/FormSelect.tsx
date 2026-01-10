'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Autocomplete, Checkbox, TextField} from '@mui/material';
import {SxProps, Theme} from '@mui/material';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import * as FT from '../FormTypes/FormBasicTypes';
import FormFieldContainer from '../FormBody/FormFieldContainer';
import {useFormField} from '../FormElements/FormFieldHook';
import {translateLabel} from '../../I18n/TranslateLabel';
import {useFormContext} from '../FormContext/FormContextProvider';
import FormFieldAlert from '../FormBody/FormFieldAlert';
import {computeFormValue, FormValue} from '@/tsui/Form/FormBody/FormValue';
import {i18nt} from '@/tsui/I18n/SafeTranslation';

export interface MSelectItem {
    id: string;
    name?: string;
    label?: string;
}

export interface DataSelectParam {
    id: string;
    label: string;
}

export interface SelectProps extends FT.FieldProps {
    id: string;
    label: string;

    items: MSelectItem[];
    withAll?: boolean;

    multiple?: boolean;

    disabled?: boolean;

    type?: string;
    placeholder?: string | boolean;
    onSelected?: (selected: DataSelectParam | DataSelectParam[] | null) => void;

    sx?: SxProps<Theme>; // optional styling prop
}

export function SelectField(props: SelectProps) {
    if (props.show === false) return null;
    return <SelectFieldBody {...props} />;
}

function findValueItem(items: DataSelectParam[], value: FormValue | null | undefined, multiple: boolean | undefined): DataSelectParam | DataSelectParam[] | null {
    if (!value) return multiple ? [] : null;

    if (Array.isArray(value)) {
        let values: DataSelectParam[] = [];

        for (let id of value) {
            for (let item of items) {
                if (item.id === id) {
                    values.push({id: item.id, label: item.label});
                }
            }
        }
        return values;
    }

    for (let item of items) {
        if (item.id === value) {
            return {id: item.id, label: item.label};
        }
    }
    return multiple ? [] : null;
}

function computeSelectItems(props: SelectProps) {
    let items: DataSelectParam[] = [];

    if (props.withAll === true) {
        items.push({
            id: 'all',
            label: i18nt('All')!, //TODO: translate
        });
    }
    for (let item of props.items) {
        items.push({id: item.id, label: item.label ? i18nt(item.label)! : item.name ? i18nt(item.name)! : ''});
    }

    return items;
}

function SelectFieldBody(props: SelectProps) {
    const formContext = useFormContext();
    const form = formContext.formInstance;

    const field = useFormField(props, {fieldType: 'select'});
    const computedItems = useMemo<DataSelectParam[]>(() => computeSelectItems(props), [props.items, props.withAll]);

    // const [computedItems, setComputedItems] = useState<DataSelectParam[]>([]);
    const [value, setValue] = useState<DataSelectParam | DataSelectParam[] | null>(props.multiple ? [] : null);
    const [label, setLabel] = useState('');
    const [placeholder, setPlaceholder] = useState('');

    useEffect(() => {
        form.registerField(field);

        field.setValue(props.value);

        return () => {
            form.unregisterField(field);
        };
    }, []);

    useEffect(() => {
        if (computedItems.length === 0) return;

        // field.setValue(v);
        // console.log(props.value, field.origValue);
        let v = findValueItem(computedItems, props.value, props.multiple);
        setValue(v);

        // console.log(v);
    }, [computedItems]);

    useEffect(() => {
        if (computedItems.length === 0) return;

        if (computeFormValue(props.value) !== field.origValue) {
            let v = findValueItem(computedItems, props.value, props.multiple);
            setValue(v);

            // console.log(v);

            field.setValue(props.value);
        }
    }, [props.value, props.multiple]);

    useEffect(() => {
        let items: DataSelectParam[] = [];

        if (props.withAll === true) {
            items.push({
                id: 'all',
                label: i18nt('All')!, //TODO: translate
            });
        }
        for (let item of props.items) {
            items.push({id: item.id, label: item.label ? i18nt(item.label)! : item.name ? i18nt(item.name)! : ''});
        }

        let tl = translateLabel(props);
        let l = tl;
        if (props.required) l += ' *';
        setLabel(l);

        let p = i18nt('Select')!;
        p += ' ' + tl + ' ...';
        setPlaceholder(p);

        // setComputedItems(items);
    }, [props.items, props.withAll]);

    // useEffect(() => {
    //     setValue(findValueItem(computedItems, props.value, props.multiple));
    // }, [computedItems, props.multiple]);

    const onValuesSelected = useCallback(
        (event: React.SyntheticEvent<Element, Event>, selected: DataSelectParam | DataSelectParam[] | null) => {
            setValue(selected);

            let fieldValue: string | null = null;
            if (Array.isArray(selected)) {
                fieldValue = selected.map((item) => item.id).join(',');
            } else {
                fieldValue = selected ? selected.id : null;
            }

            field.setValue(fieldValue);

            if (form.formType === 'update-fields') {
                form.processValueEdit(field, fieldValue ?? '');
            } else {
                field.valueChanged = true;
            }

            props.onSelected?.(selected);
        },
        [props]
    );

    return (
        <FormFieldContainer form={form} formProps={formContext.formProps} fieldProps={props}>
            <Autocomplete
                sx={props.sx}
                options={computedItems}
                value={value}
                disabled={props.readonly || props.disabled}
                readOnly={props.readonly}
                onChange={onValuesSelected}
                renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} variant='outlined' slotProps={{inputLabel: {shrink: true}}} />}
                clearIcon={null}
                multiple={props.multiple}
                disableCloseOnSelect={props.multiple === true}
                isOptionEqualToValue={(option, value) => {
                    if (Array.isArray(value) || Array.isArray(option)) return false;
                    return option.id === value.id;
                }}
                renderOption={
                    props.multiple
                        ? (props, option, {selected}) => {
                              const {key, ...optionProps} = props;
                              return (
                                  <li key={key} {...optionProps}>
                                      <Checkbox icon={icon} checkedIcon={checkedIcon} style={{marginRight: 8}} checked={selected} />
                                      {Array.isArray(option) ? '' : option.label}
                                  </li>
                              );
                          }
                        : undefined
                }
            />
            <FormFieldAlert form={form} field={field} error={field.error} />
        </FormFieldContainer>
    );
}

const icon = <CheckBoxOutlineBlankIcon fontSize='small' />;
const checkedIcon = <CheckBoxIcon fontSize='small' />;
