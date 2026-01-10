'use client';

import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

import { SxProps, Theme } from '@mui/material';

import { DataSelectParam } from './Form';
import { translateLabel } from './I18n/TranslateLabel';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

export interface PageSelectItem {
    id: string;
    name?: string;
    label?: string;
}

interface PageSelectProps {
    show?: boolean;
    label: string;
    items: PageSelectItem[];
    type?: string;
    value?: string;
    readonly?: boolean;

    onSelected?: (selected: DataSelectParam | null) => void;
    withAll?: boolean;

    sx?: SxProps<Theme>; // optional styling prop
}

export function PageSelect(props: PageSelectProps) {
    if (props.show === false) return null;

    return <PageSelectBody {...props} />;
}

function findValueItem(items: DataSelectParam[], value: string | null | undefined): DataSelectParam | null {
    if (!value) return null;
    for (let item of items) {
        if (item.id === value) {
            return {
                id: item.id,
                label: item.label,
            };
        }
    }
    return null;
}

// function PageSelectBody(props: PageSelectProps) {
function PageSelectBody({
    withAll = false,
    ...props
}: PageSelectProps) {
    const [computedItems, setComputedItems] = React.useState<DataSelectParam[]>([]);
    const [value, setValue] = React.useState<DataSelectParam | null>(null);
    const [label, setLabel] = React.useState('');
    const [placeholder, setPlaceholder] = React.useState('');

    React.useEffect(() => {
        let items: DataSelectParam[] = [];

        if (withAll) {
            items.push({
                id: 'all',
                label: i18nt('All')!, //TODO: translate
            });
        }
        for (let item of props.items) {
            items.push({
                id: item.id,
                label: item.label ? i18nt(item.label)! : item.name ? i18nt(item.name)! : '',
            });
        }

        let tl = translateLabel(props);
        let l = tl;
        // if (props.required) l += ' *';
        setLabel(l);

        let p = i18nt('Select')!;
        p += ' ' + tl + ' ...';
        setPlaceholder(p);

        setComputedItems(items);
    }, [props.items, withAll]);

    React.useEffect(() => {
        setValue(findValueItem(computedItems, props.value));
    }, [props.value, computedItems]);

    const onValueSelected = React.useCallback((selected: any) => {
        setValue(selected);
        if (props.onSelected) {
            props.onSelected(selected);
        }
    }, []);

    return (
        <Autocomplete
            sx={props.sx}
            options={computedItems}
            value={value}
            disabled={props.readonly}
            readOnly={props.readonly}
            onChange={(event: any, newValue: PageSelectItem | null) => onValueSelected(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    variant='outlined'
                    slotProps={{
                        inputLabel: { shrink: true },
                    }}
                />
            )}
            clearIcon={null}
        />
    );
}
